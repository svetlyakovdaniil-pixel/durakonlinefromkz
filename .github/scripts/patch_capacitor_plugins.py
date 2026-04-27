#!/usr/bin/env python3
"""
Patch Capacitor plugin Swift sources for capacitor-swift-pm 8.1.0 compatibility.

capacitor-swift-pm 8.1.0 is a binary XCFramework that lacks several APIs
present in @capacitor/ios 8.0.x (CocoaPods). This script patches ALL instances
of the plugin Swift source files in node_modules directly before Xcode compiles them.

IMPORTANT: pnpm may install multiple versions of the same package under different
peer-dependency suffixes (e.g. @capacitor+core@8.1.0 vs @capacitor+core@8.3.0).
This script patches ALL found instances to ensure the CI version is also patched.

Key differences in capacitor-swift-pm 8.1.0 vs @capacitor/ios 8.0.x (CocoaPods):
- CAPBridgeProtocol has no .viewController property (use self.webView?.window?.rootViewController)
- CAPBridgeProtocol has no .webView property (use self.webView on CAPPlugin directly)
- CAPPluginCall.getInt/getBool without default returns Optional (Int?/Bool?)
  BUT getInt/getBool WITH default returns non-optional (Int/Bool) - cannot use 'if let'
- CAPPluginCall.getArray() requires a default value (no optional overload)
- PluginConfig.getString() requires a default value (no optional overload with nil)
- CAPPluginCall.reject() does not exist (use resolve with message)
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


def find_all_files_by_name(root, filename):
    """Walk directory tree to find ALL files with exact name."""
    results = []
    for dirpath, dirnames, filenames in os.walk(root):
        if filename in filenames:
            results.append(os.path.join(dirpath, filename))
    return results


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
    paths = find_all_files_by_name(node_modules, "PushNotificationsHandler.swift")
    if paths:
        for path in paths:
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
    paths = find_all_files_by_name(node_modules, "PushNotificationsPlugin.swift")
    if paths:
        for path in paths:
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
    paths = find_all_files_by_name(node_modules, "SplashScreenPlugin.swift")
    if paths:
        for path in paths:
            patch_file(
                path,
                [
                    # bridge?.viewController not in capacitor-swift-pm 8.1.0
                    # CAPBridgeProtocol does not have .viewController in 8.1.0
                    # Use self.webView (CAPPlugin property) instead of bridge?.webView
                    (
                        r"bridge\?\.viewController\?\.view",
                        "self.webView?.window?.rootViewController?.view",
                    ),
                    # Also fix the intermediate patched form (bridge?.webView?.window...)
                    # in case the file was already partially patched
                    (
                        r"bridge\?\.webView\?\.window\?\.rootViewController\?\.view",
                        "self.webView?.window?.rootViewController?.view",
                    ),
                    # call.getInt("key") without default -> returns Int? in 8.1.0
                    # 'if let x = call.getInt("key")' works because it returns Optional
                    # BUT if already patched to call.getInt("key", 0) it returns Int (non-optional)
                    # Fix: change 'if let x = call.getInt("key", 0)' to 'let x = call.getInt("key", settings.x)'
                    # Pattern: if let showDuration = call.getInt("showDuration", 0) {
                    #           settings.showDuration = showDuration
                    #           }
                    # -> settings.showDuration = call.getInt("showDuration", settings.showDuration)
                    (
                        r'if let showDuration = call\.getInt\("showDuration",\s*\d+\) \{\s*\n\s*settings\.showDuration = showDuration\s*\n\s*\}',
                        'settings.showDuration = call.getInt("showDuration", settings.showDuration)',
                    ),
                    (
                        r'if let fadeInDuration = call\.getInt\("fadeInDuration",\s*\d+\) \{\s*\n\s*settings\.fadeInDuration = fadeInDuration\s*\n\s*\}',
                        'settings.fadeInDuration = call.getInt("fadeInDuration", settings.fadeInDuration)',
                    ),
                    (
                        r'if let fadeOutDuration = call\.getInt\("fadeOutDuration",\s*\d+\) \{\s*\n\s*settings\.fadeOutDuration = fadeOutDuration\s*\n\s*\}',
                        'settings.fadeOutDuration = call.getInt("fadeOutDuration", settings.fadeOutDuration)',
                    ),
                    (
                        r'if let autoHide = call\.getBool\("autoHide",\s*\w+\) \{\s*\n\s*settings\.autoHide = autoHide\s*\n\s*\}',
                        'settings.autoHide = call.getBool("autoHide", settings.autoHide)',
                    ),
                    # Also handle the original form (without default) - convert to direct assignment
                    (
                        r'if let showDuration = call\.getInt\("showDuration"\) \{\s*\n\s*settings\.showDuration = showDuration\s*\n\s*\}',
                        'settings.showDuration = call.getInt("showDuration", settings.showDuration)',
                    ),
                    (
                        r'if let fadeInDuration = call\.getInt\("fadeInDuration"\) \{\s*\n\s*settings\.fadeInDuration = fadeInDuration\s*\n\s*\}',
                        'settings.fadeInDuration = call.getInt("fadeInDuration", settings.fadeInDuration)',
                    ),
                    (
                        r'if let fadeOutDuration = call\.getInt\("fadeOutDuration"\) \{\s*\n\s*settings\.fadeOutDuration = fadeOutDuration\s*\n\s*\}',
                        'settings.fadeOutDuration = call.getInt("fadeOutDuration", settings.fadeOutDuration)',
                    ),
                    (
                        r'if let autoHide = call\.getBool\("autoHide"\) \{\s*\n\s*settings\.autoHide = autoHide\s*\n\s*\}',
                        'settings.autoHide = call.getBool("autoHide", settings.autoHide)',
                    ),
                    # getConfig().getString("key", nil) -> nil is not valid as String default
                    # Use getConfig().getString("key", "") and check for empty string
                    # Pattern: if let backgroundColor = getConfig().getString("backgroundColor", nil) {
                    # ->       let backgroundColor = getConfig().getString("backgroundColor", "")
                    #          if !backgroundColor.isEmpty {
                    (
                        r'if let backgroundColor = (?:getConfig\(\)\.getString\("backgroundColor",\s*nil\)|(?:getConfig\(\)\.getConfigJSON\(\)\["backgroundColor"\] as\? String))',
                        'let backgroundColorStr = getConfig().getString("backgroundColor", "")\n        if !backgroundColorStr.isEmpty',
                    ),
                    # Fix the body to use backgroundColorStr instead of backgroundColor
                    (
                        r'config\.backgroundColor = UIColor\.capacitor\.color\(argb: backgroundColor\)',
                        'config.backgroundColor = UIColor.capacitor.color(argb: backgroundColorStr)',
                    ),
                    (
                        r'if let spinnerStyle = (?:getConfig\(\)\.getString\("iosSpinnerStyle",\s*nil\)|(?:getConfig\(\)\.getConfigJSON\(\)\["iosSpinnerStyle"\] as\? String))',
                        'let spinnerStyleStr = getConfig().getString("iosSpinnerStyle", "")\n        if !spinnerStyleStr.isEmpty',
                    ),
                    (
                        r'switch spinnerStyle\.lowercased\(\)',
                        'switch spinnerStyleStr.lowercased()',
                    ),
                    (
                        r'if let spinnerColor = (?:getConfig\(\)\.getString\("spinnerColor",\s*nil\)|(?:getConfig\(\)\.getConfigJSON\(\)\["spinnerColor"\] as\? String))',
                        'let spinnerColorStr = getConfig().getString("spinnerColor", "")\n        if !spinnerColorStr.isEmpty',
                    ),
                    (
                        r'config\.spinnerColor = UIColor\.capacitor\.color\(argb: spinnerColor\)',
                        'config.spinnerColor = UIColor.capacitor.color(argb: spinnerColorStr)',
                    ),
                    # UIColor.capacitor.color(fromHex:) -> color(argb:) in capacitor-swift-pm 8.1.0
                    (
                        r"UIColor\.capacitor\.color\(fromHex:",
                        "UIColor.capacitor.color(argb:",
                    ),
                    # call.reject not in capacitor-swift-pm 8.1.0
                    (
                        r'call\.reject\("([^"]+)"\)',
                        r'call.resolve(["message": "\1"])',
                    ),
                ],
            )
    else:
        print("  WARNING: SplashScreenPlugin.swift not found in node_modules")

    print("\n=== All plugin patches applied ===")


if __name__ == "__main__":
    main()
