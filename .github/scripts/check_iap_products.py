#!/usr/bin/env python3
"""List IAP products and subscriptions in App Store Connect."""
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


def api_get(path: str, token: str) -> dict:
    url = f"{BASE_URL}{path}" if path.startswith("/") else path
    resp = requests.get(url, headers={"Authorization": f"Bearer {token}"}, timeout=30)
    if not resp.ok:
        print(f"GET {path} -> {resp.status_code}: {resp.text[:600]}")
        resp.raise_for_status()
    return resp.json()


token = generate_token()
data = api_get(f"/apps?filter[bundleId]={BUNDLE_ID}", token)
app_id = data["data"][0]["id"]
print(f"App ID: {app_id}\n")

# Non-subscription IAPs (consumables) - v2
token = generate_token()
try:
    iap = api_get(f"/apps/{app_id}/inAppPurchasesV2?limit=50", token)
    print(f"--- In-App Purchases v2 ({len(iap.get('data', []))}) ---")
    for i in iap.get("data", []):
        a = i["attributes"]
        print(f"  {a.get('productId')} | {a.get('name')} | state={a.get('state')} | type={a.get('inAppPurchaseType')}")
except Exception as e:
    print(f"v2 error: {e}")

# Subscriptions
token = generate_token()
try:
    subs = api_get(f"/apps/{app_id}/subscriptionGroups?limit=50", token)
    groups = subs.get("data", [])
    print(f"\n--- Subscription groups ({len(groups)}) ---")
    for g in groups:
        ga = g["attributes"]
        print(f"  group {g['id']}: ref={ga.get('referenceName')}")
        gid = g["id"]
        token = generate_token()
        try:
            s2 = api_get(f"/subscriptionGroups/{gid}/subscriptions?limit=50", token)
            for s in s2.get("data", []):
                sa = s["attributes"]
                print(f"    sub {sa.get('productId')} | state={sa.get('state')}")
        except Exception as e:
            print(f"    error: {e}")
except Exception as e:
    print(f"subscriptions error: {e}")
