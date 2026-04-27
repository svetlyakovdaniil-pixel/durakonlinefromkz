#!/usr/bin/env python3
"""
Patch Capacitor plugin Swift sources for capacitor-swift-pm 8.1.0 compatibility.

capacitor-swift-pm 8.1.0 is a binary XCFramework that lacks several APIs
present in @capacitor/ios 8.0.x (CocoaPods). This script patches the plugin
Swift source files in node_modules directly before Xcode compiles them.

Key differences in capacitor-swift-pm 8.1.0 vs @capacitor/ios 8.0.x:
- CAPBridgeProtocol has no .viewController property (use webView?.window?.rootViewController)
- CAPPluginCall.getInt/getBool/getString require a default value (no optional overloads)
- CAPPluginCall.reject() does not exist (use resolve with message)
- CAPPluginCall.unimplemented() does not exist (use resolve with message)
- CAPPluginCall.getArray() requires a default value (no optional overload)
- PluginConfig.getString() requires a default value (no optional overload)
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
                # call.getArray("notifications") without default -> needs default value
                # getArray(_ key: String) -> JSArray? is NOT available in 8.1.0
                # Must use getArray(_ key: String, _ defaultValue: JSArray) -> JSArray
                (
                    r'call\.getArray\("notifications"\)(?!\s*,)',
                    'call.getArray("notifications", [])',
                ),
                # CAPPluginCall.reject with variable argument (e.g. err.localizedDescription)
                (
                    r'call\.reject\(([^")\n][^)\n]*)\)',
                    r'call.resolve(["message": String(describing: \1)])',
                ),
                # CAPPluginCall.reject with string literal
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
                # bridge?.viewController not in capacitor-swift-pm 8.1.0
                # CAPBridgeProtocol does not have .viewController in 8.1.0
                (
                    r"bridge\?\.viewController\?\.view",
                    "bridge?.webView?.window?.rootViewController?.view",
                ),
                # call.getInt without default -> needs default value in 8.1.0
                # Only call.getInt(_ key: String, _ defaultValue: Int) -> Int exists
                (
                    r'call\.getInt\("([^"]+)"\)(?!\s*,)',
                    r'call.getInt("\1", 0)',
                ),
                # call.getBool without default -> needs default value in 8.1.0
                (
                    r'call\.getBool\("([^"]+)"\)(?!\s*,)',
                    r'call.getBool("\1", false)',
                ),
                # getConfig().getString("key", nil) -> nil is not valid as String default
                # Use getConfigJSON()["key"] as? String instead
                (
                    r'getConfig\(\)\.getString\("([^"]+)",\s*nil\)',
                    r'(getConfig().getConfigJSON()["\1"] as? String)',
                ),
                # call.reject not in capacitor-swift-pm 8.1.0
                (
                    r'call\.reject\("([^"]+)"\)',
                    r'call.resolve(["message": "\1"])',
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
