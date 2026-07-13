#!/usr/bin/env python3
"""
Upload IAP review screenshots via App Store Connect API.
For each IAP product, uploads a screenshot to the Review Information section.
"""

import os
import sys
import json
import time
import base64
import hashlib
import requests
import tempfile
import urllib.request
from pathlib import Path

import jwt
from cryptography.hazmat.primitives.serialization import load_pem_private_key
from cryptography.hazmat.backends import default_backend


# ── credentials ──────────────────────────────────────────────────────────────
KEY_ID     = os.environ["APP_STORE_CONNECT_API_KEY_ID"]
ISSUER_ID  = os.environ["APP_STORE_CONNECT_ISSUER_ID"]
KEY_CONTENT = os.environ["APP_STORE_CONNECT_API_KEY_CONTENT"]
APP_ID     = os.environ["IOS_APP_APPLE_ID"]

BASE_URL = "https://api.appstoreconnect.apple.com/v1"


def make_jwt() -> str:
    key_data = base64.b64decode(KEY_CONTENT)
    payload = {
        "iss": ISSUER_ID,
        "iat": int(time.time()),
        "exp": int(time.time()) + 1200,
        "aud": "appstoreconnect-v1",
    }
    token = jwt.encode(payload, key_data, algorithm="ES256", headers={"kid": KEY_ID})
    return token if isinstance(token, str) else token.decode()


def headers() -> dict:
    return {
        "Authorization": f"Bearer {make_jwt()}",
        "Content-Type": "application/json",
    }


def api_get(path: str, params: dict = None) -> dict:
    url = f"{BASE_URL}{path}"
    r = requests.get(url, headers=headers(), params=params)
    if not r.ok:
        print(f"GET {path} → {r.status_code}: {r.text[:500]}")
        r.raise_for_status()
    return r.json()


def api_post(path: str, body: dict) -> dict:
    url = f"{BASE_URL}{path}"
    r = requests.post(url, headers=headers(), json=body)
    if not r.ok:
        print(f"POST {path} → {r.status_code}: {r.text[:1000]}")
        r.raise_for_status()
    return r.json()


def api_patch(path: str, body: dict) -> dict:
    url = f"{BASE_URL}{path}"
    r = requests.patch(url, headers=headers(), json=body)
    if not r.ok:
        print(f"PATCH {path} → {r.status_code}: {r.text[:1000]}")
        r.raise_for_status()
    return r.json()


# ── screenshot download URLs (GitHub raw) ────────────────────────────────────
# We'll embed the screenshots as base64 in the script itself or download from
# a public URL. Since we can't embed large images, we'll use the GitHub repo
# to store them and download during CI.

SCREENSHOT_URLS = {
    # product_id -> GitHub raw URL of screenshot
    # We'll use the images committed to the repo
}


def get_iap_products() -> list:
    """Get all IAP products for the app."""
    result = api_get(f"/apps/{APP_ID}/inAppPurchasesV2", params={"limit": 50})
    products = result.get("data", [])
    print(f"Found {len(products)} IAP products")
    for p in products:
        attrs = p.get("attributes", {})
        print(f"  - {p['id']}: {attrs.get('productId')} | {attrs.get('name')} | state={attrs.get('state')}")
    return products


def get_iap_localizations(iap_id: str) -> list:
    """Get localizations for an IAP product."""
    result = api_get(f"/inAppPurchasesV2/{iap_id}/iapPriceSchedule", params={"limit": 5})
    return result.get("data", [])


def get_iap_review_screenshot(iap_id: str) -> dict | None:
    """Get existing review screenshot for IAP."""
    try:
        result = api_get(f"/inAppPurchasesV2/{iap_id}/iapReviewScreenshot")
        return result.get("data")
    except Exception as e:
        print(f"  No existing screenshot: {e}")
        return None


def reserve_screenshot_upload(iap_id: str, file_size: int, file_name: str) -> dict:
    """Reserve an upload slot for IAP review screenshot."""
    body = {
        "data": {
            "type": "iapReviewScreenshots",
            "attributes": {
                "fileSize": file_size,
                "fileName": file_name,
            },
            "relationships": {
                "inAppPurchaseV2": {
                    "data": {"type": "inAppPurchasesV2", "id": iap_id}
                }
            }
        }
    }
    return api_post("/iapReviewScreenshots", body)


def upload_screenshot_part(upload_operation: dict, image_data: bytes) -> None:
    """Upload image data to the reserved upload slot."""
    url = upload_operation["url"]
    method = upload_operation["method"]
    request_headers = {h["name"]: h["value"] for h in upload_operation.get("requestHeaders", [])}
    
    offset = upload_operation.get("offset", 0)
    length = upload_operation.get("length", len(image_data))
    chunk = image_data[offset:offset + length]
    
    r = requests.request(method, url, headers=request_headers, data=chunk)
    if not r.ok:
        print(f"  Upload part failed: {r.status_code}: {r.text[:200]}")
        r.raise_for_status()
    print(f"  Uploaded chunk: offset={offset}, length={length}")


def commit_screenshot(screenshot_id: str, checksum: str) -> dict:
    """Commit the uploaded screenshot."""
    body = {
        "data": {
            "type": "iapReviewScreenshots",
            "id": screenshot_id,
            "attributes": {
                "uploaded": True,
                "sourceFileChecksum": checksum,
            }
        }
    }
    return api_patch(f"/iapReviewScreenshots/{screenshot_id}", body)


def delete_screenshot(screenshot_id: str) -> None:
    """Delete an existing screenshot."""
    url = f"{BASE_URL}/iapReviewScreenshots/{screenshot_id}"
    r = requests.delete(url, headers=headers())
    if r.ok or r.status_code == 404:
        print(f"  Deleted screenshot {screenshot_id}")
    else:
        print(f"  Delete failed: {r.status_code}: {r.text[:200]}")


def upload_iap_screenshot(iap_id: str, product_id: str, image_path: str) -> bool:
    """Upload a screenshot for an IAP product."""
    print(f"\nUploading screenshot for {product_id} (IAP ID: {iap_id})")
    
    # Read image
    with open(image_path, "rb") as f:
        image_data = f.read()
    
    file_size = len(image_data)
    file_name = f"{product_id}_screenshot.jpg"
    checksum = hashlib.md5(image_data).hexdigest()
    
    print(f"  File: {file_name}, size: {file_size} bytes, md5: {checksum}")
    
    # Check for existing screenshot and delete it
    existing = get_iap_review_screenshot(iap_id)
    if existing:
        print(f"  Found existing screenshot: {existing['id']}, deleting...")
        delete_screenshot(existing["id"])
        time.sleep(2)
    
    # Reserve upload slot
    print("  Reserving upload slot...")
    reserve_result = reserve_screenshot_upload(iap_id, file_size, file_name)
    screenshot_id = reserve_result["data"]["id"]
    upload_operations = reserve_result["data"]["attributes"].get("uploadOperations", [])
    
    print(f"  Screenshot ID: {screenshot_id}")
    print(f"  Upload operations: {len(upload_operations)}")
    
    # Upload each part
    for op in upload_operations:
        upload_screenshot_part(op, image_data)
    
    # Commit
    print("  Committing screenshot...")
    commit_result = commit_screenshot(screenshot_id, checksum)
    state = commit_result["data"]["attributes"].get("assetDeliveryState", {})
    print(f"  Committed! State: {state}")
    
    return True


def submit_iap_for_review(iap_id: str, product_id: str) -> bool:
    """Submit IAP product for review."""
    print(f"\nSubmitting {product_id} for review...")
    try:
        body = {
            "data": {
                "type": "inAppPurchaseSubmissions",
                "relationships": {
                    "inAppPurchaseV2": {
                        "data": {"type": "inAppPurchasesV2", "id": iap_id}
                    }
                }
            }
        }
        result = api_post("/inAppPurchaseSubmissions", body)
        print(f"  Submitted! Result: {result}")
        return True
    except Exception as e:
        print(f"  Submit failed: {e}")
        return False


def main():
    print("=" * 60)
    print("IAP Screenshot Upload Script")
    print("=" * 60)
    
    # Screenshot mapping: product_id -> local screenshot path
    # These images are committed to the repo under .github/iap-screenshots/
    script_dir = Path(__file__).parent
    screenshots_dir = script_dir / "iap-screenshots"
    
    screenshot_map = {
        "durak_tenge_100": str(screenshots_dir / "tenge_100.jpg"),
        "durak_tenge_500": str(screenshots_dir / "tenge_500.jpg"),
        "durak_tenge_1000": str(screenshots_dir / "tenge_1000.jpg"),
        "durak_tenge_5000": str(screenshots_dir / "tenge_5000.jpg"),
        "premium_monthly": str(screenshots_dir / "premium.jpg"),
    }
    
    # Check screenshots exist
    for product_id, path in screenshot_map.items():
        if not os.path.exists(path):
            print(f"ERROR: Screenshot not found: {path}")
            sys.exit(1)
        print(f"  ✓ {product_id}: {path}")
    
    # Get all IAP products
    products = get_iap_products()
    
    if not products:
        print("ERROR: No IAP products found!")
        sys.exit(1)
    
    # Upload screenshots for each product
    success_count = 0
    for product in products:
        product_id = product["attributes"].get("productId", "")
        iap_id = product["id"]
        state = product["attributes"].get("state", "")
        
        if product_id not in screenshot_map:
            print(f"\nSkipping {product_id} (no screenshot mapped)")
            continue
        
        print(f"\nProcessing: {product_id} (state: {state})")
        
        screenshot_path = screenshot_map[product_id]
        
        try:
            success = upload_iap_screenshot(iap_id, product_id, screenshot_path)
            if success:
                success_count += 1
                time.sleep(2)
        except Exception as e:
            print(f"  ERROR uploading screenshot: {e}")
            import traceback
            traceback.print_exc()
    
    print(f"\n{'='*60}")
    print(f"Uploaded {success_count}/{len(screenshot_map)} screenshots")
    
    # Now submit all products for review
    print("\nSubmitting IAP products for review...")
    for product in products:
        product_id = product["attributes"].get("productId", "")
        iap_id = product["id"]
        state = product["attributes"].get("state", "")
        
        if product_id not in screenshot_map:
            continue
        
        # Only submit if in a submittable state
        if state in ("DEVELOPER_ACTION_NEEDED", "REJECTED", "PREPARE_FOR_SUBMISSION"):
            submit_iap_for_review(iap_id, product_id)
            time.sleep(1)
        else:
            print(f"  Skipping {product_id} (state: {state} - not submittable)")
    
    print("\nDone!")


if __name__ == "__main__":
    main()
