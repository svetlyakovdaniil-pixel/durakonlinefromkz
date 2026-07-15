"""
Fetch the latest App Store review rejection reason via App Store Connect API.
Prints all available rejection info including resolution center notes.
"""
import base64
import os
import sys
import time
import json
import jwt
import requests

KEY_ID      = os.environ["APP_STORE_CONNECT_API_KEY_ID"].strip()
ISSUER_ID   = os.environ["APP_STORE_CONNECT_ISSUER_ID"].strip()
KEY_CONTENT = os.environ["APP_STORE_CONNECT_API_KEY_CONTENT"].strip()
BUNDLE_ID   = os.environ.get("IOS_BUNDLE_ID", "com.durakonlinefromkz.app").strip()
APP_ID_ENV  = os.environ.get("IOS_APP_APPLE_ID", "").strip()

if "BEGIN" not in KEY_CONTENT:
    try:
        KEY_CONTENT = base64.b64decode(KEY_CONTENT).decode("utf-8")
    except Exception:
        pass

BASE_URL = "https://api.appstoreconnect.apple.com/v1"


def make_token():
    now = int(time.time())
    payload = {"iss": ISSUER_ID, "iat": now, "exp": now + 1200, "aud": "appstoreconnect-v1"}
    t = jwt.encode(payload, KEY_CONTENT, algorithm="ES256", headers={"kid": KEY_ID})
    return t if isinstance(t, str) else t.decode("utf-8")


def hdrs():
    return {"Authorization": f"Bearer {make_token()}", "Content-Type": "application/json"}


def get(path, params=None):
    url = f"{BASE_URL}{path}" if path.startswith("/") else path
    r = requests.get(url, headers=hdrs(), params=params, timeout=30)
    if not r.ok:
        print(f"  GET {path} → {r.status_code}: {r.text[:800]}")
        r.raise_for_status()
    return r.json()


print("=" * 60)
print("APP STORE REJECTION REASON CHECKER")
print("=" * 60)

# 1. Get app ID
if APP_ID_ENV:
    app_id = APP_ID_ENV
    print(f"App ID (from env): {app_id}")
else:
    data = get(f"/apps?filter[bundleId]={BUNDLE_ID}")
    app_id = data["data"][0]["id"]
    print(f"App ID: {app_id}")

# 2. Get all iOS app store versions
versions_data = get(f"/apps/{app_id}/appStoreVersions", params={
    "filter[platform]": "IOS",
    "sort": "-createdDate",
    "limit": 10,
})
versions = versions_data.get("data", [])
print(f"\n--- App Store Versions ({len(versions)}) ---")
for v in versions:
    a = v["attributes"]
    print(f"  {v['id']}: v{a['versionString']} | {a['appStoreState']} | {a.get('createdDate','')[:10]}")

# 3. Find the most recently rejected/active version
target_version = None
priority_states = ["REJECTED", "DEVELOPER_REJECTED", "METADATA_REJECTED", "WAITING_FOR_REVIEW", "IN_REVIEW", "PREPARE_FOR_SUBMISSION"]
for state in priority_states:
    for v in versions:
        if v["attributes"]["appStoreState"] == state:
            target_version = v
            break
    if target_version:
        break

if not target_version:
    target_version = versions[0] if versions else None

if not target_version:
    print("No versions found!")
    sys.exit(1)

version_id = target_version["id"]
version_str = target_version["attributes"]["versionString"]
version_state = target_version["attributes"]["appStoreState"]
print(f"\n--- Target Version: v{version_str} (state: {version_state}) ---")
print(f"    ID: {version_id}")

# 4. Get review detail
print("\n--- Review Detail ---")
try:
    rd = get(f"/appStoreVersions/{version_id}/appStoreReviewDetail")
    d = rd.get("data", {}).get("attributes", {})
    for k, v in d.items():
        print(f"  {k}: {v}")
except Exception as e:
    print(f"  Error: {e}")

# 5. Get all review submissions and their items
print("\n--- Review Submissions ---")
try:
    subs_data = get(f"/apps/{app_id}/reviewSubmissions", params={"limit": 20})
    submissions = subs_data.get("data", [])
    for s in submissions:
        sa = s["attributes"]
        state = sa.get("state", "")
        submitted = sa.get("submittedDate", "")[:10] if sa.get("submittedDate") else "N/A"
        print(f"\n  Submission {s['id']}: state={state} | submitted={submitted}")
        
        # Get items
        try:
            items_data = get(f"/reviewSubmissions/{s['id']}/items", params={
                "include": "appStoreVersion",
                "limit": 10,
            })
            items = items_data.get("data", [])
            included_map = {r["id"]: r for r in items_data.get("included", [])}
            for item in items:
                ia = item.get("attributes", {})
                rels = item.get("relationships", {})
                asv_id = rels.get("appStoreVersion", {}).get("data", {}).get("id", "")
                asv = included_map.get(asv_id, {})
                asv_attrs = asv.get("attributes", {})
                print(f"    Item {item['id'][:20]}...")
                print(f"      state={ia.get('state')} | resolved={ia.get('resolved')} | removed={ia.get('removed')}")
                print(f"      version: v{asv_attrs.get('versionString')} | {asv_attrs.get('appStoreState')}")
        except Exception as e:
            print(f"    Error getting items: {e}")
except Exception as e:
    print(f"  Error: {e}")

# 6. Check for customer reviews / resolution center messages
# These are not directly accessible via API, but we can check appStoreVersionLocalizations
print("\n--- App Store Version Localizations (for rejection notes) ---")
try:
    loc_data = get(f"/appStoreVersions/{version_id}/appStoreVersionLocalizations", params={
        "limit": 5,
        "fields[appStoreVersionLocalizations]": "locale,description,keywords,whatsNew",
    })
    locs = loc_data.get("data", [])
    for loc in locs[:2]:
        la = loc.get("attributes", {})
        print(f"  Locale: {la.get('locale')}")
        print(f"  What's New: {la.get('whatsNew', '')[:200]}")
except Exception as e:
    print(f"  Error: {e}")

# 7. Check the build attached to the version
print("\n--- Build attached to version ---")
try:
    build_data = get(f"/appStoreVersions/{version_id}/build")
    bd = build_data.get("data", {})
    if bd:
        ba = bd.get("attributes", {})
        print(f"  Build ID: {bd['id']}")
        print(f"  Version: {ba.get('version')}")
        print(f"  Processing State: {ba.get('processingState')}")
        print(f"  Uploaded: {ba.get('uploadedDate', '')[:10]}")
        print(f"  Expired: {ba.get('expired')}")
        print(f"  Min OS Version: {ba.get('minOsVersion')}")
    else:
        print("  No build attached!")
except Exception as e:
    print(f"  Error: {e}")

# 8. Check IAP products and their states
print("\n--- IAP Products ---")
try:
    iap_data = get(f"/apps/{app_id}/inAppPurchasesV2", params={
        "limit": 20,
        "fields[inAppPurchasesV2]": "productId,name,state,inAppPurchaseType",
    })
    iaps = iap_data.get("data", [])
    for iap in iaps:
        ia = iap.get("attributes", {})
        print(f"  {ia.get('productId')}: {ia.get('name')} | state={ia.get('state')} | type={ia.get('inAppPurchaseType')}")
except Exception as e:
    print(f"  Error: {e}")

print("\n" + "=" * 60)
print("NOTE: Detailed rejection text is only in the Resolution Center")
print("(App Store Connect web UI → My Apps → App → Resolution Center)")
print("=" * 60)
