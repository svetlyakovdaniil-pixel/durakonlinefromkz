#!/usr/bin/env python3
"""
Patch Capacitor plugin Swift sources for capacitor-swift-pm 8.1.0 compatibility.

capacitor-swift-pm 8.1.0 is a binary XCFramework that lacks several APIs
present in @capacitor/ios 8.1.0 (CocoaPods). This script patches the plugin
Swift source files in node_modules directly before Xcode compiles them.
"""
import re
import os
import sys


def patch_file(path, patches):
    """Apply regex patches to a file. Returns True if any changes were made."""
    with open(path, "r") as f:
        content = f.read()
    original = content
    for pattern, replacement in patches:
        content = re.sub(pattern, replacement, content)
    with open(path, "w") as f:
        f.write(content)
    if content != original:
        print(f"  Patched: {path}")
        return True
    else:
        print(f"  No changes needed: {path}")
        return False


def find_file_by_name(root, filename):
    """Walk directory tree to find a file by exact name."""
    for dirpath, dirnames, filenames in os.walk(root):
        if filename in filenames:
            return os.path.join(dirpath, filename)
    return None


def main():
    # Change to project root (where node_modules lives)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(os.path.dirname(script_dir))
    os.chdir(project_root)
    print(f"Working directory: {os.getcwd()}")

    node_modules = os.path.join(project_root, "node_modules")
    if not os.path.isdir(node_modules):
        print(f"ERROR: node_modules not found at {node_modules}")
        sys.exit(1)

    # --- PushNotificationsHandler.swift ---
    print("\n[1] Patching PushNotificationsHandler.swift ...")
    path = find_file_by_name(node_modules, "PushNotificationsHandler.swift")
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
        print("  WARNING: PushNotificationsHandler.swift not found in node_modules")

    # --- PushNotificationsPlugin.swift ---
    print("\n[2] Patching PushNotificationsPlugin.swift ...")
    path = find_file_by_name(node_modules, "PushNotificationsPlugin.swift")
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
        print("  WARNING: PushNotificationsPlugin.swift not found in node_modules")

    # --- SplashScreenPlugin.swift ---
    print("\n[3] Patching SplashScreenPlugin.swift ...")
    path = find_file_by_name(node_modules, "SplashScreenPlugin.swift")
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
                # Match getString("key") but NOT getString("key", something)
                (
                    r'getConfig\(\)\.getString\("([^"]+)"\)(?!\s*,)',
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
        print("  WARNING: SplashScreenPlugin.swift not found in node_modules")

    print("\n=== All plugin patches applied ===")


if __name__ == "__main__":
    main()
