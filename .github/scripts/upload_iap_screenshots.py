#!/usr/bin/env python3
"""
Upload IAP review screenshots via App Store Connect API.
For each IAP product, uploads a screenshot to the Review Information section.

Uses the correct endpoint: POST /v1/inAppPurchaseAppStoreReviewScreenshots
(NOT the deprecated /v1/iapReviewScreenshots)
"""

import os
import sys
import json
import time
import base64
import hashlib
import requests
from pathlib import Path

import jwt
from cryptography.hazmat.primitives.serialization import load_pem_private_key
from cryptography.hazmat.backends import default_backend


# ── credentials ──────────────────────────────────────────────────────────────
KEY_ID      = os.environ["APP_STORE_CONNECT_API_KEY_ID"].strip()
ISSUER_ID   = os.environ["APP_STORE_CONNECT_ISSUER_ID"].strip()
KEY_CONTENT = os.environ["APP_STORE_CONNECT_API_KEY_CONTENT"].strip()
APP_ID      = os.environ["IOS_APP_APPLE_ID"].strip()

# Decode base64-encoded PEM key if needed
if "BEGIN" not in KEY_CONTENT:
    try:
        KEY_CONTENT = base64.b64decode(KEY_CONTENT).decode("utf-8")
        print("Decoded base64 API key")
    except Exception as e:
        print(f"Warning: Could not decode base64 key: {e}")

BASE_URL = "https://api.appstoreconnect.apple.com/v1"


def make_jwt() -> str:
    key_data = KEY_CONTENT.encode("utf-8") if isinstance(KEY_CONTENT, str) else KEY_CONTENT
    payload = {
        "iss": ISSUER_ID,
        "iat": int(time.time()),
        "exp": int(time.time()) + 1200,
        "aud": "appstoreconnect-v1",
    }
    token = jwt.encode(payload, key_data, algorithm="ES256", headers={"kid": KEY_ID})
    return token if isinstance(token, str) else token.decode("utf-8")


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


def api_delete(path: str) -> None:
    url = f"{BASE_URL}{path}"
    r = requests.delete(url, headers=headers())
    if not r.ok and r.status_code != 404:
        print(f"DELETE {path} → {r.status_code}: {r.text[:200]}")


def get_iap_products() -> list:
    """Get all IAP products for the app."""
    result = api_get(f"/apps/{APP_ID}/inAppPurchasesV2", params={"limit": 50})
    products = result.get("data", [])
    print(f"Found {len(products)} IAP products")
    for p in products:
        attrs = p.get("attributes", {})
        print(f"  - {p['id']}: {attrs.get('productId')} | {attrs.get('name')} | state={attrs.get('state')}")
    return products


def get_existing_review_screenshot(iap_id: str) -> dict | None:
    """Get existing review screenshot for IAP using the correct relationship endpoint."""
    try:
        # The correct relationship endpoint for inAppPurchasesV2
        result = api_get(f"/inAppPurchasesV2/{iap_id}/appStoreReviewScreenshot")
        return result.get("data")
    except Exception as e:
        print(f"  No existing screenshot: {e}")
        return None


def reserve_screenshot_upload(iap_id: str, file_size: int, file_name: str) -> dict:
    """
    Reserve an upload slot for IAP review screenshot.
    Uses the CORRECT endpoint: POST /v1/inAppPurchaseAppStoreReviewScreenshots
    """
    body = {
        "data": {
            "type": "inAppPurchaseAppStoreReviewScreenshots",
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
    return api_post("/inAppPurchaseAppStoreReviewScreenshots", body)


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
    """
    Commit the uploaded screenshot.
    Uses the CORRECT endpoint: PATCH /v1/inAppPurchaseAppStoreReviewScreenshots/{id}
    """
    body = {
        "data": {
            "type": "inAppPurchaseAppStoreReviewScreenshots",
            "id": screenshot_id,
            "attributes": {
                "uploaded": True,
                "sourceFileChecksum": checksum,
            }
        }
    }
    return api_patch(f"/inAppPurchaseAppStoreReviewScreenshots/{screenshot_id}", body)


def delete_screenshot(screenshot_id: str) -> None:
    """
    Delete an existing screenshot.
    Uses the CORRECT endpoint: DELETE /v1/inAppPurchaseAppStoreReviewScreenshots/{id}
    """
    print(f"  Deleting screenshot {screenshot_id}...")
    api_delete(f"/inAppPurchaseAppStoreReviewScreenshots/{screenshot_id}")
    print(f"  Deleted screenshot {screenshot_id}")


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
    existing = get_existing_review_screenshot(iap_id)
    if existing:
        print(f"  Found existing screenshot: {existing['id']}, deleting...")
        delete_screenshot(existing["id"])
        time.sleep(2)

    # Reserve upload slot using correct endpoint
    print("  Reserving upload slot (POST /v1/inAppPurchaseAppStoreReviewScreenshots)...")
    reserve_result = reserve_screenshot_upload(iap_id, file_size, file_name)
    screenshot_id = reserve_result["data"]["id"]
    upload_operations = reserve_result["data"]["attributes"].get("uploadOperations", [])

    print(f"  Screenshot ID: {screenshot_id}")
    print(f"  Upload operations: {len(upload_operations)}")

    # Upload each part
    for op in upload_operations:
        upload_screenshot_part(op, image_data)

    # Commit using correct endpoint
    print("  Committing screenshot (PATCH /v1/inAppPurchaseAppStoreReviewScreenshots/{id})...")
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
    print("Using correct endpoint: /v1/inAppPurchaseAppStoreReviewScreenshots")
    print("=" * 60)

    # Screenshot mapping: product_id -> local screenshot path
    script_dir = Path(__file__).parent
    screenshots_dir = script_dir / "iap-screenshots"

    screenshot_map = {
        "durak_tenge_100":  str(screenshots_dir / "tenge_100.jpg"),
        "durak_tenge_500":  str(screenshots_dir / "tenge_500.jpg"),
        "durak_tenge_1000": str(screenshots_dir / "tenge_1000.jpg"),
        "durak_tenge_5000": str(screenshots_dir / "tenge_5000.jpg"),
        "premium_monthly":  str(screenshots_dir / "premium.jpg"),
    }

    # Check screenshots exist
    print("\nChecking screenshots:")
    for product_id, path in screenshot_map.items():
        if not os.path.exists(path):
            print(f"ERROR: Screenshot not found: {path}")
            sys.exit(1)
        size = os.path.getsize(path)
        print(f"  ✓ {product_id}: {path} ({size} bytes)")

    # Get all IAP products
    print("\nFetching IAP products...")
    products = get_iap_products()

    if not products:
        print("ERROR: No IAP products found!")
        sys.exit(1)

    # Upload screenshots for each product
    success_count = 0
    total = 0
    for product in products:
        product_id = product["attributes"].get("productId", "")
        iap_id = product["id"]
        state = product["attributes"].get("state", "")

        if product_id not in screenshot_map:
            print(f"\nSkipping {product_id} (no screenshot mapped)")
            continue

        total += 1
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
    print(f"Uploaded {success_count}/{total} screenshots")

    # Now submit all products for review
    print("\nSubmitting IAP products for review...")
    for product in products:
        product_id = product["attributes"].get("productId", "")
        iap_id = product["id"]
        state = product["attributes"].get("state", "")

        if product_id not in screenshot_map:
            continue

        # Only submit if in a submittable state
        if state in ("DEVELOPER_ACTION_NEEDED", "REJECTED", "PREPARE_FOR_SUBMISSION", "MISSING_METADATA"):
            submit_iap_for_review(iap_id, product_id)
            time.sleep(1)
        else:
            print(f"  Skipping {product_id} (state: {state} - not submittable)")

    print("\nDone!")


if __name__ == "__main__":
    main()
