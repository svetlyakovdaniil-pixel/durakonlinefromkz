#!/usr/bin/env python3
"""Generate ExportOptions.plist for xcodebuild -exportArchive."""
import os
import sys

team_id = os.environ.get('IOS_TEAM_ID', '')
bundle_id = os.environ.get('IOS_BUNDLE_ID', '')
runner_temp = os.environ.get('RUNNER_TEMP', '/tmp')

if not team_id:
    print("ERROR: IOS_TEAM_ID environment variable is not set", file=sys.stderr)
    sys.exit(1)

plist_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key>
  <string>app-store-connect</string>
  <key>teamID</key>
  <string>{team_id}</string>
  <key>signingStyle</key>
  <string>automatic</string>
  <key>uploadBitcode</key>
  <false/>
  <key>uploadSymbols</key>
  <true/>
  <key>manageAppVersionAndBuildNumber</key>
  <false/>
</dict>
</plist>
"""

plist_path = f"{runner_temp}/ExportOptions.plist"
with open(plist_path, 'w') as f:
    f.write(plist_content)

print(f"ExportOptions.plist written to {plist_path}")
print(f"Team ID: {team_id}")
print(f"Bundle ID: {bundle_id}")
print("Content:")
print(plist_content)
