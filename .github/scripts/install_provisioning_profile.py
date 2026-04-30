#!/usr/bin/env python3
"""
Installs the provisioning profile from IOS_PROVISIONING_PROFILE env var.
Extracts UUID and Name, installs to standard locations,
and writes PROFILE_UUID and PROFILE_NAME to $GITHUB_ENV.
"""
import os
import sys
import subprocess
import plistlib
import re
import base64

profile_b64 = os.environ.get('IOS_PROVISIONING_PROFILE', '').strip()
runner_temp = os.environ.get('RUNNER_TEMP', '/tmp')
github_env = os.environ.get('GITHUB_ENV', '')
home = os.environ.get('HOME', os.path.expanduser('~'))

if not profile_b64:
    print("IOS_PROVISIONING_PROFILE secret is empty, skipping.")
    sys.exit(0)

# Decode the profile
try:
    profile_data = base64.b64decode(profile_b64)
except Exception as e:
    print(f"Failed to base64 decode profile: {e}, skipping.")
    sys.exit(0)

if len(profile_data) < 100:
    print(f"Profile too small ({len(profile_data)} bytes), skipping.")
    sys.exit(0)

print(f"Decoded profile size: {len(profile_data)} bytes")

profile_path = os.path.join(runner_temp, 'profile.mobileprovision')
with open(profile_path, 'wb') as f:
    f.write(profile_data)

# Extract UUID and Name using security cms
profile_uuid = ''
profile_name = ''

try:
    result = subprocess.run(
        ['security', 'cms', '-D', '-i', profile_path],
        capture_output=True
    )
    if result.returncode == 0:
        plist = plistlib.loads(result.stdout)
        profile_uuid = plist.get('UUID', '')
        profile_name = plist.get('Name', '')
        print(f"Extracted via security cms - UUID: {profile_uuid}, Name: {profile_name}")
except Exception as e:
    print(f"security cms failed: {e}")

# Fallback: extract UUID with strings + regex
if not profile_uuid:
    try:
        result = subprocess.run(['strings', profile_path], capture_output=True, text=True)
        uuid_pattern = re.compile(r'^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$')
        for line in result.stdout.splitlines():
            if uuid_pattern.match(line.strip()):
                profile_uuid = line.strip()
                print(f"Extracted UUID via strings fallback: {profile_uuid}")
                break
    except Exception as e:
        print(f"strings fallback failed: {e}")

if not profile_uuid:
    print("Could not extract UUID from profile, skipping installation.")
    sys.exit(0)

print(f"Profile UUID: {profile_uuid}")
print(f"Profile Name: {profile_name}")

# Install profile in both standard locations
pp_dir1 = os.path.join(home, 'Library', 'MobileDevice', 'Provisioning Profiles')
pp_dir2 = os.path.join(home, 'Library', 'Developer', 'Xcode', 'UserData', 'ProvisioningProfiles')
os.makedirs(pp_dir1, exist_ok=True)
os.makedirs(pp_dir2, exist_ok=True)

dest1 = os.path.join(pp_dir1, f'{profile_uuid}.mobileprovision')
dest2 = os.path.join(pp_dir2, f'{profile_uuid}.mobileprovision')

import shutil
shutil.copy2(profile_path, dest1)
shutil.copy2(profile_path, dest2)

print(f"Profile installed to:")
print(f"  {dest1}")
print(f"  {dest2}")

# Write to GITHUB_ENV
if github_env:
    with open(github_env, 'a') as f:
        f.write(f'PROFILE_UUID={profile_uuid}\n')
        f.write(f'PROFILE_NAME={profile_name}\n')
    print(f"Written PROFILE_UUID and PROFILE_NAME to GITHUB_ENV")
else:
    print(f"GITHUB_ENV not set, printing for debugging:")
    print(f"PROFILE_UUID={profile_uuid}")
    print(f"PROFILE_NAME={profile_name}")
