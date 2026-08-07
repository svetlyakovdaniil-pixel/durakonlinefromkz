#!/usr/bin/env python3
"""List all iOS builds and App Store versions in App Store Connect."""
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
        print(f"GET {path} → {resp.status_code}: {resp.text[:600]}")
        resp.raise_for_status()
    return resp.json()


token = generate_token()
data = api_get(f"/apps?filter[bundleId]={BUNDLE_ID}", token)
app_id = data["data"][0]["id"]
print(f"App ID: {app_id}\n")

# Builds
token = generate_token()
builds = api_get(f"/builds?filter[app]={app_id}&limit=15&sort=-uploadedDate", token)
print(f"\n--- Latest 15 builds ---")
for b in builds.get("data", []):
    a = b["attributes"]
    print(f"  build {a.get('version')} | {a.get('processingState')} | exp={a.get('expired')} | uploaded {a.get('uploadedDate', '')[:10]} | id={b['id']}")

# Beta details for the two newest builds
print(f"\n--- BuildBetaDetail for newest builds ---")
for b in builds.get("data", [])[:4]:
    bid = b["id"]
    token = generate_token()
    try:
        detail = api_get(f"/builds/{bid}/buildBetaDetail", token)
        da = detail.get("data", {}).get("attributes", {})
        print(f"  build {b['attributes'].get('version')}: state={da.get('state')} extState={da.get('externalTestingState')} autoNotify={da.get('autoNotifyEnabled')}")
    except Exception as e:
        print(f"  build {b['attributes'].get('version')}: error={e}")

# Beta groups and which builds they contain
print(f"\n--- Beta groups ---")
token = generate_token()
groups = api_get(f"/apps/{app_id}/betaGroups?limit=20", token)
for g in groups.get("data", []):
    ga = g["attributes"]
    print(f"  group {ga.get('name')}: state={ga.get('state')} isInternal={ga.get('isInternalGroup')} public={ga.get('publicLinkEnabled')}")
    gid = g["id"]
    token = generate_token()
    try:
        gb = api_get(f"/betaGroups/{gid}/builds?limit=10", token)
        for bd in gb.get("data", []):
            print(f"      -> build {bd['attributes'].get('version')} ({bd['attributes'].get('processingState')})")
    except Exception as e:
        print(f"      error: {e}")

# Versions
token = generate_token()
vers = api_get(f"/apps/{app_id}/appStoreVersions?filter[platform]=IOS&limit=20", token)
print(f"\n--- App Store versions ({len(vers.get('data', []))}) ---")
for v in vers.get("data", []):
    a = v["attributes"]
    print(f"  v{a['versionString']} | {a['appStoreState']} | id={v['id']}")

# Pre-release versions (TestFlight groups) with their builds
print(f"\n--- Pre-release versions (TestFlight groups) ---")
token = generate_token()
pre = api_get(f"/apps/{app_id}/preReleaseVersions?limit=20", token)
for p in pre.get("data", []):
    pa = p["attributes"]
    print(f"  v{pa.get('version')} | platform={pa.get('platform')} | id={p['id']}")
    pid = p["id"]
    token = generate_token()
    try:
        pbuilds = api_get(f"/preReleaseVersions/{pid}/builds?limit=10", token)
        for bd in pbuilds.get("data", []):
            print(f"      -> build {bd['attributes'].get('version')} ({bd['attributes'].get('processingState')})")
    except Exception as e:
        print(f"      error: {e}")
