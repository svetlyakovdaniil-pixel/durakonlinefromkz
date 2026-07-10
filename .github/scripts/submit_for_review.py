#!/usr/bin/env python3
"""
Submit an iOS app version for App Store Review using the new App Store Connect API.
Uses the reviewSubmissions + reviewSubmissionItems flow.

Strategy:
- If there's a READY_FOR_REVIEW submission → submit it directly (PATCH state=SUBMITTED)
- If there's a PREPARE_FOR_SUBMISSION submission → add version + submit
- Otherwise create a new submission
"""
import base64
import os
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


def hdrs(token: str) -> dict:
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


def api_get(path: str, token: str) -> dict:
    url = f"{BASE_URL}{path}" if path.startswith("/") else path
    resp = requests.get(url, headers=hdrs(token), timeout=30)
    if not resp.ok:
        print(f"GET {path} → {resp.status_code}: {resp.text[:500]}")
        resp.raise_for_status()
    return resp.json()


def api_post(path: str, token: str, body: dict) -> dict:
    url = f"{BASE_URL}{path}" if path.startswith("/") else path
    resp = requests.post(url, headers=hdrs(token), json=body, timeout=30)
    if not resp.ok:
        print(f"POST {path} → {resp.status_code}: {resp.text[:1000]}")
        resp.raise_for_status()
    return resp.json()


def api_patch(path: str, token: str, body: dict) -> dict:
    url = f"{BASE_URL}{path}" if path.startswith("/") else path
    resp = requests.patch(url, headers=hdrs(token), json=body, timeout=30)
    if not resp.ok:
        print(f"PATCH {path} → {resp.status_code}: {resp.text[:3000]}")
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

    for state in ["PREPARE_FOR_SUBMISSION", "REJECTED", "DEVELOPER_REJECTED", "METADATA_REJECTED"]:
        for v in versions:
            if v["attributes"]["appStoreState"] == state:
                return v
    return None


def set_build_on_version(token: str, version_id: str, build_id: str):
    body = {"data": {"type": "builds", "id": build_id}}
    url = f"{BASE_URL}/appStoreVersions/{version_id}/relationships/build"
    resp = requests.patch(url, headers=hdrs(token), json=body, timeout=30)
    if not resp.ok:
        print(f"PATCH build relationship → {resp.status_code}: {resp.text[:500]}")
        resp.raise_for_status()
    print(f"Build {build_id} associated with version {version_id}")


def list_review_submissions(token: str, app_id: str) -> list:
    data = api_get(f"/apps/{app_id}/reviewSubmissions?limit=20", token)
    submissions = data.get("data", [])
    print(f"Found {len(submissions)} review submissions:")
    for s in submissions:
        print(f"  {s['id']}: state={s['attributes']['state']}")
    return submissions


def get_submission_items(token: str, submission_id: str) -> list:
    data = api_get(f"/reviewSubmissions/{submission_id}/items?include=appStoreVersion", token)
    items = data.get("data", [])
    # Attach included appStoreVersion data to items for easier lookup
    included = {r["id"]: r for r in data.get("included", [])}
    for item in items:
        rels = item.get("relationships", {})
        asv_ref = rels.get("appStoreVersion", {}).get("data", {})
        asv_id = asv_ref.get("id")
        if asv_id and asv_id in included:
            item["_appStoreVersion"] = included[asv_id]
    return items


def add_version_to_submission(token: str, submission_id: str, version_id: str) -> str:
    # Check if already added
    items = get_submission_items(token, submission_id)
    for item in items:
        rels = item.get("relationships", {})
        asv = rels.get("appStoreVersion", {}).get("data", {})
        if asv.get("id") == version_id:
            print(f"Version already in submission as item {item['id']}")
            return item["id"]

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


def submit_review_submission(token: str, submission_id: str):
    """Submit the review submission using submitted=true attribute."""
    body = {
        "data": {
            "type": "reviewSubmissions",
            "id": submission_id,
            "attributes": {"submitted": True},
        }
    }
    api_patch(f"/reviewSubmissions/{submission_id}", token, body)
    print(f"Submission {submission_id} submitted for review!")


def create_review_submission(token: str, app_id: str) -> str:
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
    print(f"Created new review submission: {sub_id}")
    return sub_id


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
        raise RuntimeError("No editable App Store version found.")

    version_id = version_obj["id"]
    version_str = version_obj["attributes"]["versionString"]
    version_state = version_obj["attributes"]["appStoreState"]
    print(f"Using App Store version: {version_str} (state: {version_state}, id: {version_id})")

    # 4. Associate build with version
    token = generate_token()
    set_build_on_version(token, version_id, build_id)

    # 5. Find the best review submission to use
    token = generate_token()
    submissions = list_review_submissions(token, app_id)

    submission_id = None

    # Strategy:
    # 1. Find a submission that already contains our version
    # 2. If none, find a PREPARE_FOR_SUBMISSION submission and add version
    # 3. If none, create a new submission
    
    # First: find which submission already has our version
    for s in submissions:
        sid = s["id"]
        state = s["attributes"]["state"]
        if state in ("COMPLETE", "CANCELING", "CANCELED"):
            continue
        token = generate_token()
        items = get_submission_items(token, sid)
        print(f"  Checking submission {sid} ({state}): {len(items)} items")
        for item in items:
            rels = item.get("relationships", {})
            asv_ref = rels.get("appStoreVersion", {}).get("data", {})
            asv_id = asv_ref.get("id", "")
            # Check by UUID match OR by version string (numeric vs UUID IDs)
            asv_obj = item.get("_appStoreVersion", {})
            asv_version_str = asv_obj.get("attributes", {}).get("versionString", "")
            print(f"    Item asv_id={asv_id}, version_str={asv_version_str}")
            if asv_id == version_id or asv_version_str == VERSION:
                submission_id = sid
                print(f"Found version in existing submission {sid} (state: {state})")
                break
        if submission_id:
            break

    if not submission_id:
        # Find a PREPARE_FOR_SUBMISSION submission to add the version to
        for s in submissions:
            if s["attributes"]["state"] == "PREPARE_FOR_SUBMISSION":
                submission_id = s["id"]
                print(f"Using PREPARE_FOR_SUBMISSION submission {submission_id}")
                break

    if not submission_id:
        print("No usable submission found, creating new one...")
        token = generate_token()
        submission_id = create_review_submission(token, app_id)

    # 6. Add the version to the submission (if not already there)
    token = generate_token()
    sub_data = api_get(f"/reviewSubmissions/{submission_id}", token)
    sub_state = sub_data["data"]["attributes"]["state"]
    print(f"Submission {submission_id} current state: {sub_state}")

    if sub_state in ("PREPARE_FOR_SUBMISSION",):
        token = generate_token()
        add_version_to_submission(token, submission_id, version_id)

    # 7. Submit for review
    token = generate_token()
    submit_review_submission(token, submission_id)

    print(f"\n✅ Successfully submitted v{VERSION} (build {BUILD_NUMBER}) for App Store Review!")
    print("Apple will review the app and notify you by email.")
    print(f"Submission ID: {submission_id}")


if __name__ == "__main__":
    main()
