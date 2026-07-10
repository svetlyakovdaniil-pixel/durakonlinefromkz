#!/usr/bin/env python3
"""
Submit an iOS app version for App Store Review using the new App Store Connect API.
Uses the reviewSubmissions + reviewSubmissionItems flow (replaces deprecated appStoreVersionSubmissions).

Flow:
1. Find the build (wait for VALID state)
2. Find the editable App Store version
3. Create a reviewSubmission for the app
4. Add the appStoreVersion as a reviewSubmissionItem
5. PATCH the reviewSubmission with state=SUBMITTED
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
    now = int(time.time())
    payload = {
        "iss": ISSUER_ID,
        "iat": now,
        "exp": now + 1200,
        "aud": "appstoreconnect-v1",
    }
    token = jwt.encode(payload, KEY_CONTENT, algorithm="ES256", headers={"kid": KEY_ID})
    return token if isinstance(token, str) else token.decode("utf-8")


def headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


def api_get(path: str, token: str) -> dict:
    url = f"{BASE_URL}{path}" if path.startswith("/") else path
    resp = requests.get(url, headers=headers(token), timeout=30)
    if not resp.ok:
        print(f"GET {path} → {resp.status_code}: {resp.text[:500]}")
        resp.raise_for_status()
    return resp.json()


def api_post(path: str, token: str, body: dict) -> dict:
    url = f"{BASE_URL}{path}" if path.startswith("/") else path
    resp = requests.post(url, headers=headers(token), json=body, timeout=30)
    if not resp.ok:
        print(f"POST {path} → {resp.status_code}: {resp.text[:1000]}")
        resp.raise_for_status()
    return resp.json()


def api_patch(path: str, token: str, body: dict) -> dict:
    url = f"{BASE_URL}{path}" if path.startswith("/") else path
    resp = requests.patch(url, headers=headers(token), json=body, timeout=30)
    if not resp.ok:
        print(f"PATCH {path} → {resp.status_code}: {resp.text[:500]}")
        resp.raise_for_status()
    return resp.json()


def get_app_id(token: str) -> str:
    data = api_get(f"/apps?filter[bundleId]={BUNDLE_ID}", token)
    apps = data.get("data", [])
    if not apps:
        raise RuntimeError(f"No app found with bundle ID {BUNDLE_ID}")
    app_id = apps[0]["id"]
    print(f"App ID: {app_id}")
    return app_id


def get_build(token: str, app_id: str, build_number: str) -> dict | None:
    data = api_get(f"/builds?filter[app]={app_id}&filter[version]={build_number}&limit=10", token)
    builds = data.get("data", [])
    return builds[0] if builds else None


def wait_for_build(token: str, app_id: str, build_number: str, max_wait: int = 1800) -> dict:
    print(f"Waiting for build {build_number} to be VALID...")
    start = time.time()
    while time.time() - start < max_wait:
        token = generate_token()
        build = get_build(token, app_id, build_number)
        if build:
            state = build["attributes"].get("processingState", "UNKNOWN")
            print(f"  Build state: {state}")
            if state == "VALID":
                print("Build is VALID and ready!")
                return build
            elif state in ("INVALID", "FAILED"):
                raise RuntimeError(f"Build failed with state: {state}")
        else:
            print("  Build not found yet...")
        time.sleep(30)
    raise RuntimeError(f"Build not ready after {max_wait}s")


def get_editable_app_store_version(token: str, app_id: str) -> dict | None:
    data = api_get(f"/apps/{app_id}/appStoreVersions?filter[platform]=IOS&limit=20", token)
    versions = data.get("data", [])
    print(f"Found {len(versions)} App Store versions:")
    for v in versions:
        print(f"  v{v['attributes']['versionString']} - {v['attributes']['appStoreState']} (id: {v['id']})")

    # Priority order for editable states
    for state in ["PREPARE_FOR_SUBMISSION", "REJECTED", "DEVELOPER_REJECTED", "METADATA_REJECTED"]:
        for v in versions:
            if v["attributes"]["appStoreState"] == state:
                return v
    return None


def set_build_on_version(token: str, version_id: str, build_id: str):
    body = {"data": {"type": "builds", "id": build_id}}
    url = f"{BASE_URL}/appStoreVersions/{version_id}/relationships/build"
    resp = requests.patch(url, headers=headers(token), json=body, timeout=30)
    if not resp.ok:
        print(f"PATCH build relationship → {resp.status_code}: {resp.text[:500]}")
        resp.raise_for_status()
    print(f"Build {build_id} associated with version {version_id}")


def create_review_submission(token: str, app_id: str) -> str:
    """Create a new review submission for the app. Returns submission ID."""
    body = {
        "data": {
            "type": "reviewSubmissions",
            "attributes": {"platform": "IOS"},
            "relationships": {
                "app": {"data": {"type": "apps", "id": app_id}}
            },
        }
    }
    result = api_post("/reviewSubmissions", token, body)
    sub_id = result["data"]["id"]
    print(f"Created review submission: {sub_id}")
    return sub_id


def add_version_to_submission(token: str, submission_id: str, version_id: str) -> str:
    """Add the App Store version as a review submission item. Returns item ID."""
    body = {
        "data": {
            "type": "reviewSubmissionItems",
            "relationships": {
                "reviewSubmission": {"data": {"type": "reviewSubmissions", "id": submission_id}},
                "appStoreVersion": {"data": {"type": "appStoreVersions", "id": version_id}},
            },
        }
    }
    result = api_post("/reviewSubmissionItems", token, body)
    item_id = result["data"]["id"]
    print(f"Added version to submission as item: {item_id}")
    return item_id


def submit_for_review(token: str, submission_id: str):
    """Set the review submission state to SUBMITTED."""
    body = {
        "data": {
            "type": "reviewSubmissions",
            "id": submission_id,
            "attributes": {"state": "SUBMITTED"},
        }
    }
    api_patch(f"/reviewSubmissions/{submission_id}", token, body)
    print("Review submission state set to SUBMITTED!")


def main():
    print(f"=== Submitting v{VERSION} (build {BUILD_NUMBER}) for App Store Review ===")
    print(f"Bundle ID: {BUNDLE_ID}")

    token = generate_token()

    # 1. Get app ID
    app_id = get_app_id(token)

    # 2. Wait for build to be VALID
    token = generate_token()
    build = wait_for_build(token, app_id, BUILD_NUMBER)
    build_id = build["id"]
    print(f"Build ID: {build_id}")

    # 3. Get editable App Store version
    token = generate_token()
    version_obj = get_editable_app_store_version(token, app_id)
    if not version_obj:
        raise RuntimeError("No editable App Store version found (PREPARE_FOR_SUBMISSION / REJECTED). "
                           "Please create one in App Store Connect first.")

    version_id = version_obj["id"]
    version_str = version_obj["attributes"]["versionString"]
    version_state = version_obj["attributes"]["appStoreState"]
    print(f"Using App Store version: {version_str} (state: {version_state}, id: {version_id})")

    # 4. Associate build with version
    token = generate_token()
    set_build_on_version(token, version_id, build_id)

    # 5. Create a review submission
    token = generate_token()
    submission_id = create_review_submission(token, app_id)

    # 6. Add the App Store version to the submission
    token = generate_token()
    add_version_to_submission(token, submission_id, version_id)

    # 7. Submit for review
    token = generate_token()
    submit_for_review(token, submission_id)

    print(f"\n✅ Successfully submitted v{VERSION} (build {BUILD_NUMBER}) for App Store Review!")
    print("Apple will review the app and notify you by email.")
    print(f"Submission ID: {submission_id}")


if __name__ == "__main__":
    main()
