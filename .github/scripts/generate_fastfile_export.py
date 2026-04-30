#!/usr/bin/env python3
"""Generate Fastfile for exporting IPA using Fastlane."""
import os
import sys

runner_temp = os.environ.get('RUNNER_TEMP', '/tmp')
api_key_path = os.environ.get('API_KEY_PATH', '')
api_key_id = os.environ.get('API_KEY_ID', '')
issuer_id = os.environ.get('APP_STORE_CONNECT_ISSUER_ID', '')
team_id = os.environ.get('IOS_TEAM_ID', '')
bundle_id = os.environ.get('IOS_BUNDLE_ID', '')

if not all([api_key_path, api_key_id, issuer_id, team_id]):
    print("ERROR: Missing required environment variables", file=sys.stderr)
    sys.exit(1)

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
      export_method: "app-store",
      export_team_id: "{team_id}",
      output_directory: "{runner_temp}/ipa",
      output_name: "App.ipa",
      export_options: {{
        method: "app-store-connect",
        teamID: "{team_id}",
        signingStyle: "automatic",
        manageAppVersionAndBuildNumber: false
      }},
      xcargs: "-allowProvisioningUpdates"
    )
  end
end
"""

fastfile_path = 'ios/App/fastlane/Fastfile'
os.makedirs('ios/App/fastlane', exist_ok=True)
with open(fastfile_path, 'w') as f:
    f.write(fastfile)

print(f"Fastfile written to {fastfile_path}")
print(f"Team ID: {team_id}")
print(f"Archive: {runner_temp}/App.xcarchive")
print(f"Output: {runner_temp}/ipa/App.ipa")
