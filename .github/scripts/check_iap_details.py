#!/usr/bin/env python3
"""Show IAP product details: localizations, price points, screenshots, review info."""
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


def api_get(path: str, token: str, params: dict = None) -> dict:
    url = f"{BASE_URL}{path}" if path.startswith("/") else path
    resp = requests.get(url, headers={"Authorization": f"Bearer {token}"}, params=params, timeout=30)
    if not resp.ok:
        print(f"GET {path} -> {resp.status_code}: {resp.text[:600]}")
        resp.raise_for_status()
    return resp.json()


token = generate_token()
data = api_get("/apps?filter[bundleId]=" + BUNDLE_ID, token)
app_id = data["data"][0]["id"]
print(f"App ID: {app_id}\n")

token = generate_token()
iaps = api_get(f"/apps/{app_id}/inAppPurchasesV2?limit=50", token)
print(f"--- IAP products ({len(iaps.get('data', []))}) ---")
for i in iaps.get("data", []):
    a = i["attributes"]
    iid = i["id"]
    print(f"\n  {a.get('productId')} | id={iid} | state={a.get('state')} | type={a.get('inAppPurchaseType')}")

    # Localizations
    token = generate_token()
    try:
        locs = api_get(f"/inAppPurchases/{iid}/inAppPurchaseLocalizations?limit=50", token)
        print(f"    localizations:")
        for l in locs.get("data", []):
            la = l["attributes"]
            print(f"      {la.get('locale')}: name='{la.get('name')}' desc='{str(la.get('description'))[:50]}'")
    except Exception as e:
        print(f"    loc error: {e}")

    # Price points
    token = generate_token()
    try:
        prices = api_get(f"/inAppPurchases/{iid}/pricePoints?limit=5", token)
        print(f"    price points: {len(prices.get('data', []))}")
        for p in prices.get("data", []):
            pa = p.get("attributes", {})
            rel = p.get("relationships", {}).get("pricePoint", {}).get("data", {})
            print(f"      id={p['id']} attrs={pa}")
    except Exception as e:
        print(f"    price error: {e}")

    # Screenshots
    token = generate_token()
    try:
        shots = api_get(f"/inAppPurchases/{iid}/appStoreReviewScreenshots?limit=5", token)
        print(f"    review screenshots: {len(shots.get('data', []))}")
        for s in shots.get("data", []):
            sa = s.get("attributes", {})
            print(f"      {s['id']}: state={sa.get('assetDeliveryState', {}).get('state')}")
    except Exception as e:
        print(f"    screenshot error: {e}")
