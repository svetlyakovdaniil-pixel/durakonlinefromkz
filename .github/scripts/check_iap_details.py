#!/usr/bin/env python3
"""Show IAP product details: localizations, price points, screenshots, review info."""
import base64
import json
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
    if "/v2/" in path:
        url = f"https://api.appstoreconnect.apple.com{path}" if path.startswith("/") else f"https://api.appstoreconnect.apple.com/{path}"
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

    # Full object with relationships via v2 include
    token = generate_token()
    try:
        full = api_get(f"/v2/inAppPurchases/{iid}", token, params={"include": "inAppPurchaseLocalizations,pricePoints,appStoreReviewScreenshot"})
        print(f"    v2 attributes: {json.dumps(full['data']['attributes'], indent=2)[:600]}")
        rels = full['data'].get('relationships', {})
        for rname, rval in rels.items():
            rdata = rval.get('data')
            if rdata is None:
                print(f"    rel {rname}: EMPTY")
            elif isinstance(rdata, list):
                print(f"    rel {rname}: {len(rdata)} items")
                for item in rdata:
                    print(f"      {item.get('id')} type={item.get('type')}")
            else:
                print(f"    rel {rname}: {rdata.get('id')}")
        for inc in full.get('included', []):
            t = inc.get('type')
            ia = inc.get('attributes', {})
            print(f"    included {t}: {json.dumps(ia)[:300]}")
    except Exception as e:
        print(f"    v2 include error: {e}")
