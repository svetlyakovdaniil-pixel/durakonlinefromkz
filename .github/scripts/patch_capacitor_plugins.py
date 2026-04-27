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
- CAPBridgeProtocol has no .viewController property
- PluginConfig.getString() is wrapped in #if compiler(>=5.3) && $NonescapableTypes
  -> NOT reliably available! Use getConfigJSON()["key"] as? String instead
- CAPPluginCall.getInt/getBool without default returns Optional (Int?/Bool?)
  BUT getInt/getBool WITH default returns non-optional (Int/Bool) - cannot use 'if let'
- CAPPluginCall.getArray() requires a default value (no optional overload)
- CAPPluginCall.reject() does not exist (use resolve with message)
- UIColor.capacitor.color(fromHex:) -> color(argb:)
"""
import re
import os
import sys


def find_all_files_by_name(root, filename):
    """Walk directory tree to find ALL files with exact name."""
    results = []
    for dirpath, dirnames, filenames in os.walk(root):
        if filename in filenames:
            results.append(os.path.join(dirpath, filename))
    return results


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
                        'call.getArray("notifications", [])',
                    ),
                    # call.getArray("notifications") without default -> needs default value
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
    # Strategy: Replace the entire file content with a fully patched version.
    # This is more reliable than regex patches because:
    # 1. getString() is conditionally compiled in xcframework 8.1.0 (#if $NonescapableTypes)
    # 2. bridge?.viewController?.view is not available
    # 3. call.getInt/getBool without default returns Optional - cannot use 'if let' with non-optional
    # The patched version uses getConfigJSON() for all string config access.
    print("\n[3] Patching SplashScreenPlugin.swift ...")
    paths = find_all_files_by_name(node_modules, "SplashScreenPlugin.swift")
    if paths:
        for path in paths:
            with open(path, "r") as f:
                content = f.read()
            original = content

            # Check if already fully patched (contains our marker)
            if "getConfigJSON()" in content and "self.webView?.window?.rootViewController?.view" in content:
                # Check if splashScreenSettings is also patched
                if "settings.showDuration = call.getInt" in content:
                    print(f"  Already fully patched: {path}")
                    continue

            # Full replacement of the entire SplashScreenPlugin.swift
            # This handles ALL versions (8.1.0 and 8.3.0) of the file
            new_content = '''import Foundation
import Capacitor

@objc(SplashScreenPlugin)
public class SplashScreenPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "SplashScreenPlugin"
    public let jsName = "SplashScreen"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "show", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "hide", returnType: CAPPluginReturnPromise)
    ]
    private var splashScreen: SplashScreen?

    override public func load() {
        if let view = self.webView?.window?.rootViewController?.view {
            splashScreen = SplashScreen(parentView: view, config: splashScreenConfig())
            splashScreen?.showOnLaunch()
        }
    }

    // Show the splash screen
    @objc public func show(_ call: CAPPluginCall) {
        if let splash = splashScreen {
            let settings = splashScreenSettings(from: call)
            splash.show(settings: settings,
                        completion: {
                            call.resolve()
                        })
        } else {
            call.resolve(["message": "Unable to show Splash Screen"])
        }
    }

    // Hide the splash screen
    @objc public func hide(_ call: CAPPluginCall) {
        if let splash = splashScreen {
            let settings = splashScreenSettings(from: call)
            splash.hide(settings: settings)
            call.resolve()
        } else {
            call.resolve(["message": "Unable to hide Splash Screen"])
        }
    }

    private func splashScreenSettings(from call: CAPPluginCall) -> SplashScreenSettings {
        var settings = SplashScreenSettings()
        settings.showDuration = call.getInt("showDuration", settings.showDuration)
        settings.fadeInDuration = call.getInt("fadeInDuration", settings.fadeInDuration)
        settings.fadeOutDuration = call.getInt("fadeOutDuration", settings.fadeOutDuration)
        settings.autoHide = call.getBool("autoHide", settings.autoHide)
        return settings
    }

    private func splashScreenConfig() -> SplashScreenConfig {
        var config = SplashScreenConfig()
        // Use getConfigJSON() instead of getString() because getString() is conditionally
        // compiled in capacitor-swift-pm 8.1.0 (#if compiler(>=5.3) && $NonescapableTypes)
        // and may not be available. getConfigJSON() is always available.
        let configJSON = getConfig().getConfigJSON()
        if let backgroundColorStr = configJSON["backgroundColor"] as? String, !backgroundColorStr.isEmpty {
            config.backgroundColor = UIColor.capacitor.color(argb: backgroundColorStr)
        }
        if let spinnerStyleStr = configJSON["iosSpinnerStyle"] as? String, !spinnerStyleStr.isEmpty {
            switch spinnerStyleStr.lowercased() {
            case "small":
                config.spinnerStyle = .medium
            default:
                config.spinnerStyle = .large
            }
        }
        if let spinnerColorStr = configJSON["spinnerColor"] as? String, !spinnerColorStr.isEmpty {
            config.spinnerColor = UIColor.capacitor.color(argb: spinnerColorStr)
        }
        config.showSpinner = getConfig().getBoolean("showSpinner", config.showSpinner)
        config.launchShowDuration = getConfig().getInt("launchShowDuration", config.launchShowDuration)
        config.launchAutoHide = getConfig().getBoolean("launchAutoHide", config.launchAutoHide)
        return config
    }

}
'''
            with open(path, "w") as f:
                f.write(new_content)
            print(f"  Fully replaced: {path}")
    else:
        print("  WARNING: SplashScreenPlugin.swift not found in node_modules")

    print("\n=== All plugin patches applied ===")


if __name__ == "__main__":
    main()
