#!/usr/bin/env python3
"""
Prepare release 1.0.73:
1. Cancel the current WAITING_FOR_REVIEW submission (old 1.0.70 build 318)
2. Create a new appStoreVersion 1.0.73
3. Attach build 357
4. Print instructions for attaching IAPs
"""
import base64
import os
import time
import jwt
import requests

KEY_ID = os.environ["APP_STORE_CONNECT_API_KEY_ID"].strip()
ISSUER_ID = os.environ["APP_STORE_CONNECT_ISSUER_ID"].strip()
KEY_CONTENT = os.environ["APP_STORE_CONNECT_API_KEY_CONTENT"].strip()
BUNDLE_ID = os.environ.get("IOS_BUNDLE_ID", "com.durakonlinefromkz.app").strip()
BUILD_NUMBER = os.environ.get("BUILD_NUMBER", "357").strip()
VERSION = os.environ.get("VERSION", "1.0.73").strip()

BASE_URL = "https://api.appstoreconnect.apple.com/v1"

if "BEGIN" not in KEY_CONTENT:
    try:
        KEY_CONTENT = base64.b64decode(KEY_CONTENT).decode("utf-8")
    except Exception:
        pass


def gen_token() -> str:
    now = int(time.time())
    payload = {"iss": ISSUER_ID, "iat": now, "exp": now + 1200, "aud": "appstoreconnect-v1"}
    t = jwt.encode(payload, KEY_CONTENT, algorithm="ES256", headers={"kid": KEY_ID})
    return t if isinstance(t, str) else t.decode("utf-8")


def hdrs(t):
    return {"Authorization": f"Bearer {t}", "Content-Type": "application/json"}


def api_get(path, t, params=None):
    url = f"{BASE_URL}{path}"
    r = requests.get(url, headers=hdrs(t), params=params, timeout=30)
    if not r.ok:
        print(f"GET {path} -> {r.status_code}: {r.text[:600]}")
        r.raise_for_status()
    return r.json()


def api_post(path, t, body):
    url = f"{BASE_URL}{path}"
    r = requests.post(url, headers=hdrs(t), json=body, timeout=30)
    if not r.ok:
        print(f"POST {path} -> {r.status_code}: {r.text[:1000]}")
        r.raise_for_status()
    return r.json()


def api_patch(path, t, body):
    url = f"{BASE_URL}{path}"
    r = requests.patch(url, headers=hdrs(t), json=body, timeout=30)
    if not r.ok:
        print(f"PATCH {path} -> {r.status_code}: {r.text[:1000]}")
        r.raise_for_status()
    return r.json()


t = gen_token()
app_data = api_get(f"/apps?filter[bundleId]={BUNDLE_ID}", t)
app_id = app_data["data"][0]["id"]
print(f"App ID: {app_id}")

# ── 1. Cancel active submissions ──
t = gen_token()
subs = api_get(f"/apps/{app_id}/reviewSubmissions?limit=20", t)
for s in subs.get("data", []):
    sid = s["id"]
    state = s["attributes"].get("state", "")
    if state in ("WAITING_FOR_REVIEW", "IN_REVIEW", "READY_FOR_REVIEW"):
        print(f"Cancelling submission {sid} (state={state})...")
        t = gen_token()
        try:
            api_patch(f"/reviewSubmissions/{sid}", t, {"data": {"type": "reviewSubmissions", "id": sid, "attributes": {"submitted": False}}})
            print(f"  Submission {sid} cancelled.")
        except Exception as e:
            print(f"  Could not cancel {sid}: {e}")

# ── 2. Find build ──
t = gen_token()
builds = api_get(f"/builds?filter[app]={app_id}&filter[version]={BUILD_NUMBER}&limit=5", t)
if not builds.get("data"):
    raise RuntimeError(f"Build {BUILD_NUMBER} not found")
build = builds["data"][0]
build_id = build["id"]
print(f"Build {BUILD_NUMBER} id: {build_id}, state: {build['attributes'].get('processingState')}")

# ── 3. Check if version 1.0.73 already exists ──
t = gen_token()
vers = api_get(f"/apps/{app_id}/appStoreVersions?filter[platform]=IOS&limit=50", t)
existing = [v for v in vers.get("data", []) if v["attributes"].get("versionString") == VERSION]
if existing:
    version_id = existing[0]["id"]
    print(f"Version {VERSION} already exists: {version_id} state={existing[0]['attributes'].get('appStoreState')}")
else:
    # Create new version
    t = gen_token()
    body = {
        "data": {
            "type": "appStoreVersions",
            "attributes": {"platform": "IOS", "versionString": VERSION},
            "relationships": {"app": {"data": {"type": "apps", "id": app_id}}},
        }
    }
    result = api_post("/appStoreVersions", t, body)
    version_id = result["data"]["id"]
    print(f"Created version {VERSION}: {version_id}")

# ── 4. Attach build to version ──
t = gen_token()
try:
    api_patch(f"/appStoreVersions/{version_id}/relationships/build", t, {"data": {"type": "builds", "id": build_id}})
    print(f"Build {BUILD_NUMBER} attached to version {VERSION}")
except Exception as e:
    print(f"Could not attach build: {e}")

print(f"\nVersion {VERSION} ready. IAPs must be attached to it and submitted together.")
print("Next: attach IAPs to this version, then submit for review.")
