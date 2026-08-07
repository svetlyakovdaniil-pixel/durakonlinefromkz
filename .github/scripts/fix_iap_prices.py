#!/usr/bin/env python3
"""
Fix IAP products: create price schedules + availability so products leave
MISSING_METADATA and become available in the store.

For each consumable, sets the target price (from PRICE_MAP) by finding the
matching price point, creating an inAppPurchasePriceSchedule with a manual
price, and creating inAppPurchaseAvailability (all territories).
"""
import base64
import os
import time
import json
import jwt
import requests

KEY_ID = os.environ["APP_STORE_CONNECT_API_KEY_ID"].strip()
ISSUER_ID = os.environ["APP_STORE_CONNECT_ISSUER_ID"].strip()
KEY_CONTENT = os.environ["APP_STORE_CONNECT_API_KEY_CONTENT"].strip()
BUNDLE_ID = os.environ.get("IOS_BUNDLE_ID", "com.durakonlinefromkz.app").strip()

BASE_URL = "https://api.appstoreconnect.apple.com/v1"

# Target prices per product (USD)
PRICE_MAP = {
    "durak_tenge_100": "0.99",
    "durak_tenge_500": "4.99",
    "durak_tenge_1000": "9.99",
    "durak_tenge_5000": "49.99",
}

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


def api_post(path: str, token: str, body: dict) -> dict:
    url = f"{BASE_URL}{path}" if path.startswith("/") else path
    resp = requests.post(url, headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"}, json=body, timeout=30)
    if not resp.ok:
        print(f"POST {path} -> {resp.status_code}: {resp.text[:1000]}")
        resp.raise_for_status()
    return resp.json()


token = generate_token()
data = api_get(f"/apps?filter[bundleId]={BUNDLE_ID}", token)
app_id = data["data"][0]["id"]
print(f"App ID: {app_id}\n")

token = generate_token()
iaps = api_get(f"/apps/{app_id}/inAppPurchasesV2?limit=50", token)
print(f"--- IAP products ({len(iaps.get('data', []))}) ---")
for i in iaps.get("data", []):
    a = i["attributes"]
    iid = i["id"]
    pid = a.get("productId", "")
    print(f"\n  {pid} | id={iid} | state={a.get('state')}")

    if pid not in PRICE_MAP:
        print(f"    Skipping (no price configured)")
        continue
    target_price = PRICE_MAP[pid]

    # 1. Find the price point with the target customerPrice
    token = generate_token()
    try:
        full = api_get(f"/v2/inAppPurchases/{iid}", token, params={"include": "pricePoints"})
    except Exception as e:
        print(f"    ERROR fetching price points: {e}")
        continue

    target_pp_id = None
    for inc in full.get("included", []):
        if inc.get("type") == "inAppPurchasePricePoints":
            cp = inc.get("attributes", {}).get("customerPrice")
            if cp == target_price:
                target_pp_id = inc["id"]
                break
    if not target_pp_id:
        print(f"    ERROR: no price point found for customerPrice={target_price} (got first 10 only)")
        continue
    print(f"    Price point for ${target_price}: {target_pp_id}")

    # 2. Check if a price schedule already exists
    token = generate_token()
    try:
        sched = api_get(f"/inAppPurchases/{iid}/priceSchedule", token)
        if sched.get("data"):
            print(f"    Price schedule already exists: {sched['data']['id']}")
            continue
    except Exception as e:
        print(f"    No schedule yet: {e}")

    # 3. Create inAppPurchasePriceSchedule
    token = generate_token()
    try:
        body = {
            "data": {
                "type": "inAppPurchasePriceSchedules",
                "relationships": {
                    "inAppPurchase": {"data": {"type": "inAppPurchases", "id": iid}},
                    "manualPrices": {
                        "data": [
                            {
                                "type": "inAppPurchasePrices",
                                "relationships": {
                                    "inAppPurchasePricePoint": {"data": {"type": "inAppPurchasePricePoints", "id": target_pp_id}},
                                    "inAppPurchaseV2": {"data": {"type": "inAppPurchases", "id": iid}},
                                },
                            }
                        ]
                    },
                },
            }
        }
        result = api_post("/inAppPurchasePriceSchedules", token, body)
        print(f"    Price schedule created: {result['data']['id']}")
    except Exception as e:
        print(f"    ERROR creating schedule: {e}")
        continue

    # 4. Create availability (all territories via availableInNewTerritories)
    token = generate_token()
    try:
        avail_body = {
            "data": {
                "type": "inAppPurchaseAvailabilities",
                "attributes": {"availableInNewTerritories": True},
                "relationships": {
                    "inAppPurchase": {"data": {"type": "inAppPurchases", "id": iid}},
                    "availableTerritories": {
                        "data": [{"type": "territories", "id": "USA"}]
                    },
                },
            }
        }
        result = api_post("/inAppPurchaseAvailabilities", token, avail_body)
        print(f"    Availability created: {result['data']['id']}")
    except Exception as e:
        print(f"    ERROR creating availability: {e}")

    time.sleep(1)

print("\nDone!")
