#!/usr/bin/env python3
"""
Patch Capacitor plugin Swift sources for capacitor-swift-pm 8.1.0 compatibility.

capacitor-swift-pm 8.1.0 is a binary XCFramework that lacks several APIs
present in @capacitor/ios 8.1.0 (CocoaPods). This script patches the plugin
Swift source files in node_modules directly before Xcode compiles them.
"""
import re
import glob
import os
import sys


def patch_file(path, patches):
    if not os.path.exists(path):
        print(f"WARNING: {path} not found")
        return False
    with open(path, "r") as f:
        content = f.read()
    original = content
    for pattern, replacement in patches:
        content = re.sub(pattern, replacement, content)
    with open(path, "w") as f:
        f.write(content)
    if content != original:
        print(f"Patched: {path}")
        return True
    else:
        print(f"No changes needed: {path}")
        return False


def find_file(pattern):
    matches = glob.glob(pattern, recursive=True)
    return matches[0] if matches else None


def main():
    # Change to project root (where node_modules lives)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(os.path.dirname(script_dir))
    os.chdir(project_root)
    print(f"Working directory: {os.getcwd()}")

    # --- PushNotificationsHandler.swift ---
    path = find_file(
        "node_modules/**/*push-notifications*/PushNotificationsPlugin/PushNotificationsHandler.swift"
    )
    if path:
        patch_file(
            path,
            [
                # PluginConfig.getArray not in capacitor-swift-pm 8.1.0
                (
                    r'self\.plugin\?\.getConfig\(\)\.getArray\("presentationOptions"\) as\? \[String\]',
                    'self.plugin?.getConfig().getConfigJSON()["presentationOptions"] as? [String]',
                ),
                # JSTypes.coerceDictionaryToJSObject not in capacitor-swift-pm 8.1.0
                (
                    r"JSTypes\.coerceDictionaryToJSObject\(request\.content\.userInfo\) \?\? \[:\]",
                    "(request.content.userInfo as? JSObject) ?? [:]",
                ),
            ],
        )
    else:
        print("WARNING: PushNotificationsHandler.swift not found")

    # --- PushNotificationsPlugin.swift ---
    path = find_file(
        "node_modules/**/*push-notifications*/PushNotificationsPlugin/PushNotificationsPlugin.swift"
    )
    if path:
        patch_file(
            path,
            [
                # getArray(_:ofType:) not in capacitor-swift-pm 8.1.0
                (
                    r'call\.getArray\("notifications",\s*JSObject\.self\)',
                    'call.getArray("notifications") as? [JSObject]',
                ),
                # CAPPluginCall.reject not in capacitor-swift-pm 8.1.0
                (
                    r'call\.reject\("([^"]+)"\)',
                    r'call.resolve(["message": "\1"])',
                ),
                # CAPPluginCall.unimplemented not in capacitor-swift-pm 8.1.0
                (
                    r'call\.unimplemented\("([^"]+)"\)',
                    r'call.resolve(["message": "\1"])',
                ),
            ],
        )
    else:
        print("WARNING: PushNotificationsPlugin.swift not found")

    # --- SplashScreenPlugin.swift ---
    path = find_file(
        "node_modules/**/*splash-screen*/SplashScreenPlugin/SplashScreenPlugin.swift"
    )
    if path:
        patch_file(
            path,
            [
                # call.reject not in capacitor-swift-pm 8.1.0
                (
                    r'call\.reject\("([^"]+)"\)',
                    r'call.resolve(["message": "\1"])',
                ),
                # PluginConfig.getString without default not in capacitor-swift-pm 8.1.0
                (
                    r'getConfig\(\)\.getString\("([^"]+)"\)(?!,)',
                    r'getConfig().getString("\1", nil)',
                ),
                # UIColor.capacitor.color(fromHex:) -> color(argb:) in capacitor-swift-pm 8.1.0
                (
                    r"UIColor\.capacitor\.color\(fromHex:",
                    "UIColor.capacitor.color(argb:",
                ),
            ],
        )
    else:
        print("WARNING: SplashScreenPlugin.swift not found")

    print("=== All plugin patches applied ===")


if __name__ == "__main__":
    main()
