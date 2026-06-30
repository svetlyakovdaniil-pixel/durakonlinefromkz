#!/usr/bin/env python3
"""Update Xcode project bundle ID and signing settings."""
import re
import os

pbxproj_path = "App.xcodeproj/project.pbxproj"
bundle_id = os.environ['IOS_BUNDLE_ID']
team_id = os.environ['IOS_TEAM_ID']
profile_uuid = os.environ.get('PROFILE_UUID', '').strip()
profile_name = os.environ.get('PROFILE_NAME', '').strip()

with open(pbxproj_path, "r") as f:
    content = f.read()

content = re.sub(r'PRODUCT_BUNDLE_IDENTIFIER = [^;]+;',
                 f'PRODUCT_BUNDLE_IDENTIFIER = {bundle_id};', content)
content = re.sub(r'DEVELOPMENT_TEAM = [^;]*;',
                 f'DEVELOPMENT_TEAM = {team_id};', content)

# Add CODE_SIGN_ENTITLEMENTS to link AppRelease.entitlements (required for Sign in with Apple)
# Remove any existing CODE_SIGN_ENTITLEMENTS first, then re-add after PRODUCT_BUNDLE_IDENTIFIER
content = re.sub(r'\s*CODE_SIGN_ENTITLEMENTS = [^;]*;', '', content)
content = re.sub(
    r'(PRODUCT_BUNDLE_IDENTIFIER = [^;]+;)',
    r'\1\n\t\t\t\tCODE_SIGN_ENTITLEMENTS = App/AppRelease.entitlements;',
    content
)
print("CODE_SIGN_ENTITLEMENTS set to App/AppRelease.entitlements")

if profile_uuid:
    print(f"Using Manual signing with profile UUID: {profile_uuid}")
    content = re.sub(r'CODE_SIGN_STYLE = [^;]+;', 'CODE_SIGN_STYLE = Manual;', content)
    content = re.sub(r'CODE_SIGN_IDENTITY = [^;]*;', 'CODE_SIGN_IDENTITY = "iPhone Distribution";', content)
    content = re.sub(r'\s*PROVISIONING_PROFILE_SPECIFIER = [^;]*;', '', content)
    content = re.sub(r'\s*PROVISIONING_PROFILE = [^;]*;', '', content)
    specifier = profile_name if profile_name else profile_uuid
    content = re.sub(
        r'(CODE_SIGN_ENTITLEMENTS = App/AppRelease\.entitlements;)',
        f'\\1\n\t\t\t\tPROVISIONING_PROFILE_SPECIFIER = "{specifier}";\n\t\t\t\tPROVISIONING_PROFILE = "{profile_uuid}";',
        content
    )
else:
    print("No PROFILE_UUID found, using Automatic signing")
    content = re.sub(r'CODE_SIGN_STYLE = [^;]+;', 'CODE_SIGN_STYLE = Automatic;', content)
    content = re.sub(r'CODE_SIGN_IDENTITY = [^;]*;', 'CODE_SIGN_IDENTITY = "";', content)
    content = re.sub(r'\s*PROVISIONING_PROFILE_SPECIFIER = [^;]*;', '', content)
    content = re.sub(r'\s*PROVISIONING_PROFILE = [^;]*;', '', content)

with open(pbxproj_path, "w") as f:
    f.write(content)
print("Xcode project updated successfully")
