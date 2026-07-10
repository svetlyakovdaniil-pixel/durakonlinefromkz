#!/usr/bin/env python3
"""Check the status of a review submission and its items."""
import base64
import os
import time
import jwt
import requests

KEY_ID = os.environ["APP_STORE_CONNECT_API_KEY_ID"].strip()
ISSUER_ID = os.environ["APP_STORE_CONNECT_ISSUER_ID"].strip()
KEY_CONTENT = os.environ["APP_STORE_CONNECT_API_KEY_CONTENT"].strip()
BUNDLE_ID = os.environ.get("IOS_BUNDLE_ID", "com.durakonlinefromkz.app").strip()

BASE_URL = "https://api.appstoreconnect.apple.com/v1"

if "BEGIN" not in KEY_CONTENT:
    try:
        KEY_CONTENT = base64.b64decode(KEY_CONTENT).decode("utf-8")
    except Exception:
        pass


def generate_token() -> str:
    now = int(time.time())
    payload = {"iss": ISSUER_ID, "iat": now, "exp": now + 1200, "aud": "appstoreconnect-v1"}
    token = jwt.encode(payload, KEY_CONTENT, algorithm="ES256", headers={"kid": KEY_ID})
    return token if isinstance(token, str) else token.decode("utf-8")


def hdrs(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


def api_get(path, token):
    url = f"{BASE_URL}{path}" if path.startswith("/") else path
    resp = requests.get(url, headers=hdrs(token), timeout=30)
    if not resp.ok:
        print(f"GET {path} → {resp.status_code}: {resp.text[:500]}")
        resp.raise_for_status()
    return resp.json()


token = generate_token()

# Get app ID
data = api_get(f"/apps?filter[bundleId]={BUNDLE_ID}", token)
app_id = data["data"][0]["id"]
print(f"App ID: {app_id}")

# List all review submissions
token = generate_token()
data = api_get(f"/apps/{app_id}/reviewSubmissions?limit=20", token)
submissions = data.get("data", [])

print(f"\nAll review submissions ({len(submissions)}):")
for s in submissions:
    sid = s["id"]
    state = s["attributes"]["state"]
    print(f"\n  Submission {sid}: state={state}")
    
    # Get items in this submission
    token = generate_token()
    items_data = api_get(f"/reviewSubmissions/{sid}/items", token)
    items = items_data.get("data", [])
    print(f"  Items ({len(items)}):")
    for item in items:
        item_id = item["id"]
        item_state = item["attributes"].get("state", "N/A")
        rels = item.get("relationships", {})
        asv = rels.get("appStoreVersion", {}).get("data", {})
        asv_id = asv.get("id", "N/A")
        print(f"    Item {item_id}: state={item_state}, appStoreVersion={asv_id}")
        
        # Get the appStoreVersion details
        if asv_id != "N/A":
            token = generate_token()
            try:
                asv_data = api_get(f"/appStoreVersions/{asv_id}", token)
                asv_attrs = asv_data["data"]["attributes"]
                print(f"      Version: {asv_attrs.get('versionString')} state={asv_attrs.get('appStoreState')}")
            except Exception as e:
                print(f"      Error getting version: {e}")

# Also check the UNRESOLVED_ISSUES submission specifically
print("\n\nChecking submission 7c5f54ba-ec7e-4f04-a3a4-cbf3e0eeabdd details:")
token = generate_token()
try:
    sub_data = api_get("/reviewSubmissions/7c5f54ba-ec7e-4f04-a3a4-cbf3e0eeabdd", token)
    print(f"  State: {sub_data['data']['attributes']['state']}")
    print(f"  Full attributes: {sub_data['data']['attributes']}")
except Exception as e:
    print(f"  Error: {e}")
