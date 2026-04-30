#!/usr/bin/env python3
"""Generate Fastfile for export_ipa lane (fallback when xcodebuild -exportArchive fails)."""
import os
import sys

runner_temp = os.environ.get('RUNNER_TEMP', '/tmp')
api_key_path = os.environ.get('API_KEY_PATH', '')
api_key_id = os.environ.get('API_KEY_ID', '')
issuer_id = os.environ.get('APP_STORE_CONNECT_ISSUER_ID', '')
team_id = os.environ.get('IOS_TEAM_ID', '')

if not api_key_path or not api_key_id or not issuer_id or not team_id:
    print("ERROR: Missing required environment variables", file=sys.stderr)
    sys.exit(1)

# Use the already-generated ExportOptions.plist file (created by generate_export_options.py)
export_options_plist = os.path.join(runner_temp, 'ExportOptions.plist')

# Note: when using export_options (plist file), do NOT also set export_method
# as they conflict. The plist already contains the method.
fastfile = f"""default_platform(:ios)

platform :ios do
  desc "Export IPA from existing archive"
  lane :export_ipa do
    api_key = app_store_connect_api_key(
      key_id: "{api_key_id}",
      issuer_id: "{issuer_id}",
      key_filepath: "{api_key_path}",
      duration: 1200,
      in_house: false
    )

    build_app(
      skip_build_archive: true,
      archive_path: "{runner_temp}/App.xcarchive",
      export_team_id: "{team_id}",
      output_directory: "{runner_temp}/ipa",
      output_name: "App.ipa",
      export_options: "{export_options_plist}"
    )
  end
end
"""

os.makedirs('ios/App/fastlane', exist_ok=True)
with open('ios/App/fastlane/Fastfile', 'w') as f:
    f.write(fastfile)
print("Fastfile written to ios/App/fastlane/Fastfile")
print(f"Using ExportOptions.plist: {export_options_plist}")
