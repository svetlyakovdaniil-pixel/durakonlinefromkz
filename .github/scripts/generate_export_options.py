#!/usr/bin/env python3
"""Generate ExportOptions.plist for xcodebuild -exportArchive."""
import os
import sys

team_id = os.environ.get('IOS_TEAM_ID', '').strip()
bundle_id = os.environ.get('IOS_BUNDLE_ID', '').strip()
profile_name = os.environ.get('PROFILE_NAME', '').strip()
profile_uuid = os.environ.get('PROFILE_UUID', '').strip()
runner_temp = os.environ.get('RUNNER_TEMP', '/tmp')

if not team_id:
    print("ERROR: IOS_TEAM_ID environment variable is not set", file=sys.stderr)
    sys.exit(1)

# Build provisioningProfiles dict if we have a profile name and bundle ID
provisioning_profiles_xml = ""
has_profile = bundle_id and (profile_name or profile_uuid)
if has_profile:
    profile_ref = profile_name if profile_name else profile_uuid
    provisioning_profiles_xml = f"""
  <key>provisioningProfiles</key>
  <dict>
    <key>{bundle_id}</key>
    <string>{profile_ref}</string>
  </dict>"""
    signing_style = "manual"
    print(f"Using MANUAL signing with profile: '{profile_ref}' for bundle ID: '{bundle_id}'")
else:
    signing_style = "automatic"
    print("No profile name/UUID found - using automatic signing (may fail with cloud signing error).")

# Use app-store-connect (Xcode 15+), not deprecated app-store
plist_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key>
  <string>app-store-connect</string>
  <key>teamID</key>
  <string>{team_id}</string>
  <key>signingStyle</key>
  <string>{signing_style}</string>
  <key>uploadSymbols</key>
  <true/>
  <key>manageAppVersionAndBuildNumber</key>
  <false/>
  <key>uploadToAppStore</key>
  <false/>{provisioning_profiles_xml}
</dict>
</plist>"""

plist_path = f"{runner_temp}/ExportOptions.plist"
with open(plist_path, 'w') as f:
    f.write(plist_content)

print(f"ExportOptions.plist written to {plist_path}")
print(f"Team ID: {team_id}")
print(f"Bundle ID: {bundle_id or '(not set)'}")
print("Content:")
print(plist_content)
