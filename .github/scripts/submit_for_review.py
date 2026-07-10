#!/usr/bin/env python3
"""
Submit an iOS app version for App Store Review using App Store Connect API.
Waits for the build to finish processing in TestFlight, then submits for review.
"""
import base64
import json
import os
import sys
import time
import jwt
import requests

# ── Config from environment ──────────────────────────────────────────────────
KEY_ID = os.environ["APP_STORE_CONNECT_API_KEY_ID"].strip()
ISSUER_ID = os.environ["APP_STORE_CONNECT_ISSUER_ID"].strip()
KEY_CONTENT = os.environ["APP_STORE_CONNECT_API_KEY_CONTENT"].strip()
BUNDLE_ID = os.environ.get("IOS_BUNDLE_ID", "com.durakonlinefromkz.app").strip()
APP_APPLE_ID = os.environ.get("IOS_APP_APPLE_ID", "").strip()
VERSION = os.environ.get("VERSION", "1.0.70").strip()
BUILD_NUMBER = os.environ.get("BUILD_NUMBER", "92").strip()

BASE_URL = "https://api.appstoreconnect.apple.com/v1"

# ── Decode private key if base64 ─────────────────────────────────────────────
if "BEGIN" not in KEY_CONTENT:
    try:
        KEY_CONTENT = base64.b64decode(KEY_CONTENT).decode("utf-8")
        print("Decoded base64 API key")
    except Exception as e:
        print(f"Warning: Could not decode base64 key: {e}")

def generate_token() -> str:
    """Generate a short-lived JWT for App Store Connect API."""
    now = int(time.time())
    payload = {
        "iss": ISSUER_ID,
        "iat": now,
        "exp": now + 1200,  # 20 minutes
        "aud": "appstoreconnect-v1",
    }
    token = jwt.encode(
        payload,
        KEY_CONTENT,
        algorithm="ES256",
        headers={"kid": KEY_ID},
    )
    return token if isinstance(token, str) else token.decode("utf-8")


def api_get(path: str, token: str) -> dict:
    url = f"{BASE_URL}{path}"
    resp = requests.get(url, headers={"Authorization": f"Bearer {token}"}, timeout=30)
    resp.raise_for_status()
    return resp.json()


def api_post(path: str, token: str, body: dict) -> dict:
    url = f"{BASE_URL}{path}"
    resp = requests.post(
        url,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json=body,
        timeout=30,
    )
    if not resp.ok:
        print(f"POST {path} failed: {resp.status_code} {resp.text}")
        resp.raise_for_status()
    return resp.json()


def get_app_id(token: str) -> str:
    """Get the internal App Store Connect app ID by bundle ID."""
    data = api_get(f"/apps?filter[bundleId]={BUNDLE_ID}", token)
    apps = data.get("data", [])
    if not apps:
        raise RuntimeError(f"No app found with bundle ID {BUNDLE_ID}")
    app_id = apps[0]["id"]
    print(f"App ID: {app_id} (bundle: {BUNDLE_ID})")
    return app_id


def get_app_store_version(token: str, app_id: str) -> dict | None:
    """Get the current editable App Store version."""
    data = api_get(
        f"/apps/{app_id}/appStoreVersions?filter[appStoreState]=PREPARE_FOR_SUBMISSION,WAITING_FOR_REVIEW,IN_REVIEW,REJECTED,DEVELOPER_REJECTED,METADATA_REJECTED&filter[platform]=IOS",
        token,
    )
    versions = data.get("data", [])
    if not versions:
        return None
    # Prefer PREPARE_FOR_SUBMISSION
    for v in versions:
        if v["attributes"]["appStoreState"] == "PREPARE_FOR_SUBMISSION":
            return v
    return versions[0]


def get_build(token: str, app_id: str, version: str, build_number: str) -> dict | None:
    """Find the build by version string and build number."""
    data = api_get(
        f"/builds?filter[app]={app_id}&filter[version]={build_number}&filter[preReleaseVersion.version]={version}&limit=10",
        token,
    )
    builds = data.get("data", [])
    if builds:
        return builds[0]
    # Try without version filter
    data2 = api_get(
        f"/builds?filter[app]={app_id}&filter[version]={build_number}&limit=10",
        token,
    )
    builds2 = data2.get("data", [])
    return builds2[0] if builds2 else None


def wait_for_build_processing(token: str, app_id: str, version: str, build_number: str, max_wait: int = 1800) -> dict:
    """Wait until the build finishes processing in App Store Connect."""
    print(f"Waiting for build v{version} ({build_number}) to finish processing...")
    start = time.time()
    while time.time() - start < max_wait:
        token = generate_token()  # refresh token periodically
        build = get_build(token, app_id, version, build_number)
        if build:
            state = build["attributes"].get("processingState", "UNKNOWN")
            print(f"  Build state: {state}")
            if state == "VALID":
                print("Build is ready!")
                return build
            elif state in ("INVALID", "FAILED"):
                raise RuntimeError(f"Build processing failed with state: {state}")
        else:
            print("  Build not found yet, waiting...")
        time.sleep(30)
    raise RuntimeError(f"Build did not finish processing within {max_wait}s")


def set_build_on_version(token: str, version_id: str, build_id: str):
    """Associate a build with an App Store version."""
    body = {
        "data": {
            "type": "builds",
            "id": build_id,
        }
    }
    url = f"{BASE_URL}/appStoreVersions/{version_id}/relationships/build"
    resp = requests.patch(
        url,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json=body,
        timeout=30,
    )
    if not resp.ok:
        print(f"PATCH build relationship failed: {resp.status_code} {resp.text}")
        resp.raise_for_status()
    print(f"Build {build_id} associated with version {version_id}")


def submit_for_review(token: str, version_id: str) -> dict:
    """Submit the App Store version for review."""
    body = {
        "data": {
            "type": "appStoreVersionSubmissions",
            "relationships": {
                "appStoreVersion": {
                    "data": {
                        "type": "appStoreVersions",
                        "id": version_id,
                    }
                }
            },
        }
    }
    result = api_post("/appStoreVersionSubmissions", token, body)
    print("Submitted for review successfully!")
    return result


def main():
    print(f"=== Submitting v{VERSION} (build {BUILD_NUMBER}) for App Store Review ===")
    print(f"Bundle ID: {BUNDLE_ID}")
    print(f"Key ID: {KEY_ID}")
    print(f"Issuer ID: {ISSUER_ID}")

    token = generate_token()

    # 1. Get app ID
    app_id = get_app_id(token)

    # 2. Wait for build to finish processing
    token = generate_token()
    build = wait_for_build_processing(token, app_id, VERSION, BUILD_NUMBER, max_wait=1800)
    build_id = build["id"]
    print(f"Build ID: {build_id}")

    # 3. Get the current App Store version
    token = generate_token()
    version_obj = get_app_store_version(token, app_id)
    if not version_obj:
        raise RuntimeError("No editable App Store version found. Create one in App Store Connect first.")

    version_id = version_obj["id"]
    version_state = version_obj["attributes"]["appStoreState"]
    version_str = version_obj["attributes"]["versionString"]
    print(f"App Store version: {version_str} (state: {version_state}, id: {version_id})")

    # 4. Associate build with version
    token = generate_token()
    set_build_on_version(token, version_id, build_id)

    # 5. Submit for review
    token = generate_token()
    submit_for_review(token, version_id)

    print(f"\n✅ Successfully submitted v{VERSION} (build {BUILD_NUMBER}) for App Store Review!")
    print("Apple will review the app and notify you by email.")


if __name__ == "__main__":
    main()
