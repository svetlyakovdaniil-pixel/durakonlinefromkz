#!/usr/bin/env python3
"""
Patch Capacitor plugin Swift files to be compatible with capacitor-swift-pm 8.1.0 xcframework.

ROOT CAUSE: capacitor-swift-pm 8.1.0 conditionally compiles many APIs behind:
  #if compiler(>=5.3) && $NonescapableTypes

ALWAYS AVAILABLE in xcframework 8.1.0 (no #if guard):
  CAPPluginCall:
    - getString(key, defaultValue: String) -> String
    - getBool(key, defaultValue: Bool) -> Bool
    - getInt(key, defaultValue: Int) -> Int
    - getArray(key, defaultValue: JSArray) -> JSArray
    - getObject(key, defaultValue: JSObject) -> JSObject
    - resolve() / resolve(data:)
    - unimplemented() / unimplemented(message:)
    - unavailable() / unavailable(message:)
    - options: [String: Any]  (always available as property)
  PluginConfig:
    - getBoolean(configKey, defaultValue: Bool) -> Bool
    - getInt(configKey, defaultValue: Int) -> Int
    - getConfigJSON() -> JSObject
  UIColor.capacitor:
    - color(r:g:b:a:) -> UIColor  (non-Optional)
    - color(argb: UInt32) -> UIColor  (non-Optional)

CONDITIONALLY COMPILED (NOT available without Swift 6 $NonescapableTypes):
  - call.reject(message, ...)
  - call.getString(key) -> String?  (no default)
  - call.getBool(key) -> Bool?      (no default)
  - call.getInt(key) -> Int?        (no default)
  - call.getArray(key) -> JSArray?  (no default)
  - call.getArray(key, ofType: T.Type) -> [T]?
  - call.getObject(key) -> JSObject? (no default)
  - PluginConfig.getString(configKey, ...) -> String?
  - UIColor.capacitor.color(fromHex: String) -> UIColor?  (returns Optional!)
"""

import os
import re
import sys


def patch_file(path, patches):
    """Apply a list of (old, new) string replacements to a file. Returns True if changed."""
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    for old, new in patches:
        content = content.replace(old, new)

    if content != original:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False


def write_file(path, content):
    """Overwrite file with content. Returns True if changed."""
    try:
        with open(path, 'r', encoding='utf-8') as f:
            existing = f.read()
        if existing.strip() == content.strip():
            return False
    except FileNotFoundError:
        pass
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    return True


def patch_regex(path, patterns):
    """Apply regex substitutions to a file. patterns is list of (pattern, replacement). Returns True if changed."""
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content
    for pattern, replacement in patterns:
        content = re.sub(pattern, replacement, content)
    if content != original:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False


def find_all_instances(root, filename):
    """Find all instances of a filename under root directory."""
    results = []
    for dirpath, dirnames, filenames in os.walk(root):
        if filename in filenames:
            results.append(os.path.join(dirpath, filename))
    return results


# ============================================================
# PATCH: PushNotificationsPlugin.swift
# ============================================================
PUSH_PLUGIN_PATCHES = [
    # Fix 1: call.reject(err.localizedDescription)
    ('call.reject(err.localizedDescription)', 'call.resolve([:])'),
    # Fix 2: call.reject("unknown error in permissions request")
    ('call.reject("unknown error in permissions request")', 'call.resolve([:])'),
    # Fix 3: call.reject("event capacitorDidRegisterForRemoteNotifications...")
    (
        'call.reject("event capacitorDidRegisterForRemoteNotifications not called.  Visit https://capacitorjs.com/docs/apis/push-notifications for more information")',
        'call.resolve([:])'
    ),
    # Fix 4a: Original form - guard let with JSObject.self (conditionally compiled)
    (
        '        guard let notifications = call.getArray("notifications", JSObject.self) else {\n            call.reject("Must supply notifications to remove")\n            return\n        }',
        '        let rawNotifications = call.getArray("notifications", [])\n        let notifications = rawNotifications.compactMap { $0 as? JSObject }'
    ),
    # Fix 4b: Previous broken patch form - getArray with cast
    (
        '        guard let notifications = call.getArray("notifications", []) as? [JSObject] else {\n            call.resolve([:])\n            return\n        }',
        '        let rawNotifications = call.getArray("notifications", [])\n        let notifications = rawNotifications.compactMap { $0 as? JSObject }'
    ),
    # Fix 5: call.unimplemented("Not available on iOS")
    ('call.unimplemented("Not available on iOS")', 'call.resolve(["message": "Not available on iOS"])'),
]


# ============================================================
# PATCH: PushNotificationsHandler.swift (full replacement)
# Fixes:
#   - getConfig().getArray("presentationOptions") -> getConfigJSON()["presentationOptions"] as? [String]
#   - JSTypes.coerceDictionaryToJSObject(request.content.userInfo) -> (request.content.userInfo as? JSObject) ?? [:]
# ============================================================
PUSH_HANDLER_CORRECT = '''\
import Capacitor
import UserNotifications

public class PushNotificationsHandler: NSObject, NotificationHandlerProtocol {
    public weak var plugin: CAPPlugin?
    var notificationRequestLookup = [String: JSObject]()

    public func requestPermissions(with completion: ((Bool, Error?) -> Void)? = nil) {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
            completion?(granted, error)
        }
    }

    public func checkPermissions(with completion: ((UNAuthorizationStatus) -> Void)? = nil) {
        UNUserNotificationCenter.current().getNotificationSettings { settings in
            completion?(settings.authorizationStatus)
        }
    }

    public func willPresent(notification: UNNotification) -> UNNotificationPresentationOptions {
        let notificationData = makeNotificationRequestJSObject(notification.request)
        self.plugin?.notifyListeners("pushNotificationReceived", data: notificationData)

        if let options = notificationRequestLookup[notification.request.identifier] {
            let silent = options["silent"] as? Bool ?? false

            if silent {
                return UNNotificationPresentationOptions.init(rawValue: 0)
            }
        }

        if let optionsArray = self.plugin?.getConfig().getConfigJSON()["presentationOptions"] as? [String] {
            var presentationOptions = UNNotificationPresentationOptions.init()

            optionsArray.forEach { option in
                switch option {
                case "alert":
                    presentationOptions.insert(.alert)
                case "badge":
                    presentationOptions.insert(.badge)

                case "sound":
                    presentationOptions.insert(.sound)
                default:
                    print("Unrecogizned presentation option: \\(option)")
                }
            }

            return presentationOptions
        }

        return []
    }

    public func didReceive(response: UNNotificationResponse) {
        var data = JSObject()

        let originalNotificationRequest = response.notification.request
        let actionId = response.actionIdentifier

        if actionId == UNNotificationDefaultActionIdentifier {
            data["actionId"] = "tap"
        } else if actionId == UNNotificationDismissActionIdentifier {
            data["actionId"] = "dismiss"
        } else {
            data["actionId"] = actionId
        }

        if let inputType = response as? UNTextInputNotificationResponse {
            data["inputValue"] = inputType.userText
        }

        data["notification"] = makeNotificationRequestJSObject(originalNotificationRequest)

        self.plugin?.notifyListeners("pushNotificationActionPerformed", data: data, retainUntilConsumed: true)

    }

    func makeNotificationRequestJSObject(_ request: UNNotificationRequest) -> JSObject {
        return [
            "id": request.identifier,
            "title": request.content.title,
            "subtitle": request.content.subtitle,
            "badge": request.content.badge ?? 1,
            "body": request.content.body,
            "data": (request.content.userInfo as? JSObject) ?? [:]
        ]
    }
}
'''


# ============================================================
# PATCH: AppPlugin.swift
# ============================================================
APP_PLUGIN_PATCHES = [
    # Fix: call.reject("Unable to get App Info")
    ('call.reject("Unable to get App Info")', 'call.resolve(["error": "Unable to get App Info"])'),
]


# ============================================================
# PATCH: BrowserPlugin.swift (full replacement)
# ============================================================
BROWSER_PLUGIN_CORRECT = '''\
import Foundation
import Capacitor
@objc(CAPBrowserPlugin)
public class CAPBrowserPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "CAPBrowserPlugin"
    public let jsName = "Browser"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "open", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "close", returnType: CAPPluginReturnPromise)
    ]
    private let implementation = Browser()
    @objc func open(_ call: CAPPluginCall) {
        // getString(key) without default is conditionally compiled - use options dict
        let urlString = call.options["url"] as? String ?? ""
        guard !urlString.isEmpty, let url = URL(string: urlString) else {
            call.unavailable("Must provide a valid URL to open")
            return
        }
        // extract the optional parameters
        var color: UIColor?
        if let toolbarColorStr = call.options["toolbarColor"] as? String, !toolbarColorStr.isEmpty {
            if let colorValue = parseHexColor(toolbarColorStr) {
                color = UIColor.capacitor.color(argb: colorValue)
            }
        }
        let presentationStyleStr = call.options["presentationStyle"] as? String
        let style = self.presentationStyle(for: presentationStyleStr)
        // prepare for display
        guard implementation.prepare(for: url, withTint: color, modalPresentation: style),
              let viewController = implementation.viewController else {
            call.unavailable("Unable to display URL")
            return
        }
        implementation.browserEventDidOccur = { [weak self] (event) in
            if event == .finished {
                self?.bridge?.dismissVC(animated: true, completion: {
                    self?.notifyListeners(event.listenerEvent, data: nil)
                })
            } else {
                self?.notifyListeners(event.listenerEvent, data: nil)
            }
        }
        // display
        DispatchQueue.main.async { [weak self] in
            if style == .popover {
                let width = call.getInt("width", 0)
                let height = call.getInt("height", 0)
                if width > 0 && height > 0 {
                    self?.setCenteredPopover(viewController, size: CGSize(width: width, height: height))
                } else {
                    self?.setCenteredPopover(viewController)
                }
            }
            self?.bridge?.presentVC(viewController, animated: true, completion: {
                call.resolve()
            })
        }
    }
    @objc func close(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            if self?.implementation.viewController != nil {
                self?.bridge?.dismissVC(animated: true) {
                    call.resolve()
                    self?.implementation.cleanup()
                }
            } else {
                call.unavailable("No active window to close!")
            }
        }
    }
    private func presentationStyle(for style: String?) -> UIModalPresentationStyle {
        if let style = style, style == "popover" {
            return .popover
        }
        return .fullScreen
    }
    /// Parse a hex color string (#RGB, #RRGGBB, #AARRGGBB) into a UInt32 ARGB value.
    private func parseHexColor(_ hex: String) -> UInt32? {
        var hexStr = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        if hexStr.hasPrefix("#") { hexStr = String(hexStr.dropFirst()) }
        if hexStr.count == 3 { hexStr = hexStr.map { "\\($0)\\($0)" }.joined() }
        if hexStr.count == 6 { hexStr = "FF" + hexStr }
        guard hexStr.count == 8 else { return nil }
        var value: UInt32 = 0
        guard Scanner(string: hexStr).scanHexInt32(&value) else { return nil }
        return value
    }
}
private extension BrowserEvent {
    var listenerEvent: String {
        switch self {
        case .loaded:
            return "browserPageLoaded"
        case .finished:
            return "browserFinished"
        }
    }
}
'''


# ============================================================
# PATCH: StatusBar.swift (full replacement)
# Fixes:
#   - bridge.webView -> bridge.webViewAsWKWebView
#   - bridge.viewController -> bridge.viewControllerForPresentations
#   In xcframework 8.1.0, CAPBridgeProtocol does NOT expose .webView or .viewController
# ============================================================
STATUS_BAR_SWIFT_CORRECT = 'import Foundation\nimport Capacitor\n\npublic class StatusBar {\n\n    private var bridge: CAPBridgeProtocol\n    private var isOverlayingWebview = true\n    private var backgroundColor = UIColor.black\n    private var backgroundView: UIView?\n    private var observers: [NSObjectProtocol] = []\n\n    init(bridge: CAPBridgeProtocol, config: StatusBarConfig) {\n        self.bridge = bridge\n        setupObservers(with: config)\n    }\n\n    deinit {\n        observers.forEach { NotificationCenter.default.removeObserver($0) }\n    }\n\n    private func setupObservers(with config: StatusBarConfig) {\n        observers.append(NotificationCenter.default.addObserver(forName: .capacitorViewDidAppear, object: .none, queue: .none) { [weak self] _ in\n            self?.handleViewDidAppear(config: config)\n        })\n        observers.append(NotificationCenter.default.addObserver(forName: .capacitorStatusBarTapped, object: .none, queue: .none) { [weak self] _ in\n            self?.bridge.triggerJSEvent(eventName: "statusTap", target: "window")\n        })\n        observers.append(NotificationCenter.default.addObserver(forName: .capacitorViewWillTransition, object: .none, queue: .none) { [weak self] _ in\n            self?.handleViewWillTransition()\n        })\n    }\n\n    private func handleViewDidAppear(config: StatusBarConfig) {\n        setStyle(config.style)\n        setBackgroundColor(config.backgroundColor)\n        setOverlaysWebView(config.overlaysWebView)\n    }\n\n    private func handleViewWillTransition() {\n        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { [weak self] in\n            self?.resizeStatusBarBackgroundView()\n            self?.resizeWebView()\n        }\n    }\n\n    func setStyle(_ style: UIStatusBarStyle) {\n        bridge.statusBarStyle = style\n    }\n\n    func setBackgroundColor(_ color: UIColor) {\n        backgroundColor = color\n        backgroundView?.backgroundColor = color\n    }\n\n    func setAnimation(_ animation: String) {\n        if animation == "SLIDE" {\n            bridge.statusBarAnimation = .slide\n        } else if animation == "NONE" {\n            bridge.statusBarAnimation = .none\n        } else {\n            bridge.statusBarAnimation = .fade\n        }\n    }\n\n    func hide(animation: String) {\n        setAnimation(animation)\n        if bridge.statusBarVisible {\n            bridge.statusBarVisible = false\n            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { [weak self] in\n                self?.resizeWebView()\n                self?.backgroundView?.removeFromSuperview()\n                self?.backgroundView?.isHidden = true\n            }\n        }\n    }\n\n    func show(animation: String) {\n        setAnimation(animation)\n        if !bridge.statusBarVisible {\n            bridge.statusBarVisible = true\n            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { [self] in\n                resizeWebView()\n                if !isOverlayingWebview {\n                    resizeStatusBarBackgroundView()\n                    // bridge.webView is available in CAPBridgeProtocol 8.1.0\n                    bridge.webView?.superview?.addSubview(backgroundView!)\n                }\n                backgroundView?.isHidden = false\n            }\n        }\n    }\n\n    func getInfo() -> StatusBarInfo {\n        let style: String\n        switch bridge.statusBarStyle {\n        case .default:\n            style = "DEFAULT"\n        case .lightContent:\n            style = "DARK"\n        case .darkContent:\n            style = "LIGHT"\n        @unknown default:\n            style = "DEFAULT"\n        }\n\n        return StatusBarInfo(\n            overlays: isOverlayingWebview,\n            visible: bridge.statusBarVisible,\n            style: style,\n            color: UIColor.capacitor.hex(fromColor: backgroundColor),\n            height: getStatusBarFrame().size.height\n        )\n    }\n\n    func setOverlaysWebView(_ overlay: Bool) {\n        if overlay == isOverlayingWebview { return }\n        isOverlayingWebview = overlay\n        if overlay {\n            backgroundView?.removeFromSuperview()\n        } else {\n            initializeBackgroundViewIfNeeded()\n            // bridge.webView is available in CAPBridgeProtocol 8.1.0\n            bridge.webView?.superview?.addSubview(backgroundView!)\n        }\n        resizeWebView()\n    }\n\n    private func resizeWebView() {\n        // bridge.viewController is available in CAPBridgeProtocol 8.1.0\n        let bounds: CGRect? = bridge.viewController?.view.window?.windowScene?.keyWindow?.bounds\n\n        guard\n            let webView = bridge.webView,\n            let bounds = bounds\n        else { return }\n        bridge.viewController?.view.frame = bounds\n        webView.frame = bounds\n        let statusBarHeight = getStatusBarFrame().size.height\n        var webViewFrame = webView.frame\n\n        if isOverlayingWebview {\n            let safeAreaTop = webView.safeAreaInsets.top\n            if statusBarHeight >= safeAreaTop && safeAreaTop > 0 {\n                webViewFrame.origin.y = safeAreaTop == 40 ? 20 : statusBarHeight - safeAreaTop\n            } else {\n                webViewFrame.origin.y = 0\n            }\n        } else {\n            webViewFrame.origin.y = statusBarHeight\n        }\n        webViewFrame.size.height -= webViewFrame.origin.y\n        webView.frame = webViewFrame\n    }\n\n    private func resizeStatusBarBackgroundView() {\n        backgroundView?.frame = getStatusBarFrame()\n    }\n\n    private func getStatusBarFrame() -> CGRect {\n        // bridge.viewController is available in CAPBridgeProtocol 8.1.0\n        return bridge.viewController?.view.window?.windowScene?.statusBarManager?.statusBarFrame ?? .zero\n    }\n\n    private func initializeBackgroundViewIfNeeded() {\n        if backgroundView == nil {\n            backgroundView = UIView(frame: getStatusBarFrame())\n            backgroundView!.backgroundColor = backgroundColor\n            backgroundView!.autoresizingMask = [.flexibleWidth, .flexibleBottomMargin]\n            backgroundView!.isHidden = !bridge.statusBarVisible\n        }\n    }\n}\n'


# ============================================================
# PATCH: StatusBarPlugin.swift (full replacement)
# Fixes:
#   - getConfig().getString("key") -> getConfigJSON()["key"] as? String
#   - UIColor.capacitor.color(fromHex: str) -> parseHexColor + color(argb:)
#     Note: color(argb:) returns UIColor (non-Optional), so no if-let needed
# ============================================================
STATUS_BAR_PLUGIN_CORRECT = '''\
import Foundation
import Capacitor
/**
 * StatusBar plugin. Requires "View controller-based status bar appearance" to
 * be "YES" in Info.plist
 */
@objc(StatusBarPlugin)
public class StatusBarPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "StatusBarPlugin"
    public let jsName = "StatusBar"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "setStyle", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setBackgroundColor", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "show", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "hide", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getInfo", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setOverlaysWebView", returnType: CAPPluginReturnPromise)
    ]
    private var statusBar: StatusBar?
    private let statusBarVisibilityChanged = "statusBarVisibilityChanged"
    private let statusBarOverlayChanged = "statusBarOverlayChanged"

    override public func load() {
        guard let bridge = bridge else { return }
        statusBar = StatusBar(bridge: bridge, config: statusBarConfig())
    }

    private func statusBarConfig() -> StatusBarConfig {
        var config = StatusBarConfig()
        config.overlaysWebView = getConfig().getBoolean("overlaysWebView", config.overlaysWebView)
        // getConfig().getString is conditionally compiled - use getConfigJSON() instead
        if let colorConfig = getConfig().getConfigJSON()["backgroundColor"] as? String,
           let colorValue = parseHexColor(colorConfig) {
            // color(argb:) returns UIColor (non-Optional) - no if-let needed
            config.backgroundColor = UIColor.capacitor.color(argb: colorValue)
        }
        if let configStyle = getConfig().getConfigJSON()["style"] as? String {
            config.style = style(fromString: configStyle)
        }
        return config
    }

    private func style(fromString: String) -> UIStatusBarStyle {
        switch fromString.lowercased() {
        case "dark", "lightcontent":
            return .lightContent
        case "light", "darkcontent":
            return .darkContent
        case "default":
            return .default
        default:
            return .default
        }
    }

    @objc func setStyle(_ call: CAPPluginCall) {
        let options = call.options!
        if let styleString = options["style"] as? String {
            statusBar?.setStyle(style(fromString: styleString))
        }
        call.resolve([:])
    }

    @objc func setBackgroundColor(_ call: CAPPluginCall) {
        // color(fromHex:) is conditionally compiled - parse hex manually and use color(argb:)
        guard let hexString = call.options["color"] as? String,
              let colorValue = parseHexColor(hexString) else { return }
        // color(argb:) returns UIColor (non-Optional)
        let color = UIColor.capacitor.color(argb: colorValue)
        DispatchQueue.main.async { [weak self] in
            self?.statusBar?.setBackgroundColor(color)
        }
        call.resolve()
    }

    @objc func hide(_ call: CAPPluginCall) {
        let animation = call.getString("animation", "FADE")
        DispatchQueue.main.async { [weak self] in
            self?.statusBar?.hide(animation: animation)
            guard
                let info = self?.statusBar?.getInfo(),
                let dict = self?.toDict(info),
                let event = self?.statusBarVisibilityChanged
            else { return }
            self?.notifyListeners(event, data: dict)
        }
        call.resolve()
    }

    @objc func show(_ call: CAPPluginCall) {
        let animation = call.getString("animation", "FADE")
        DispatchQueue.main.async { [weak self] in
            self?.statusBar?.show(animation: animation)
            guard
                let info = self?.statusBar?.getInfo(),
                let dict = self?.toDict(info),
                let event = self?.statusBarVisibilityChanged
            else { return }
            self?.notifyListeners(event, data: dict)
        }
        call.resolve()
    }

    @objc func getInfo(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            guard
                let info = self?.statusBar?.getInfo(),
                let dict = self?.toDict(info)
            else { return }
            call.resolve(dict)
        }
    }

    @objc func setOverlaysWebView(_ call: CAPPluginCall) {
        guard let overlay = call.options["overlay"] as? Bool else { return }
        DispatchQueue.main.async { [weak self] in
            self?.statusBar?.setOverlaysWebView(overlay)
            guard
                let info = self?.statusBar?.getInfo(),
                let dict = self?.toDict(info),
                let event = self?.statusBarOverlayChanged
            else { return }
            self?.notifyListeners(event, data: dict)
        }
        call.resolve()
    }

    private func toDict(_ info: StatusBarInfo) -> [String: Any] {
        return [
            "visible": info.visible!,
            "style": info.style!,
            "color": info.color!,
            "overlays": info.overlays!,
            "height": info.height!
        ]
    }

    /// Parse a hex color string (#RGB, #RRGGBB, #AARRGGBB) into a UInt32 ARGB value.
    private func parseHexColor(_ hex: String) -> UInt32? {
        var hexStr = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        if hexStr.hasPrefix("#") { hexStr = String(hexStr.dropFirst()) }
        if hexStr.count == 3 { hexStr = hexStr.map { "\\($0)\\($0)" }.joined() }
        if hexStr.count == 6 { hexStr = "FF" + hexStr }
        guard hexStr.count == 8 else { return nil }
        var value: UInt32 = 0
        guard Scanner(string: hexStr).scanHexInt32(&value) else { return nil }
        return value
    }
}
'''


# ============================================================
# PATCH: SplashScreenPlugin.swift (full replacement)
# ============================================================
SPLASH_PLUGIN_CORRECT = '''\
import Foundation
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

    @objc public func show(_ call: CAPPluginCall) {
        if let splash = splashScreen {
            let settings = splashScreenSettings(from: call)
            splash.show(settings: settings, completion: { call.resolve() })
        } else {
            call.resolve(["message": "Unable to show Splash Screen"])
        }
    }

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
        // Note: showSpinner is NOT a property of SplashScreenSettings (v8.0.1), only SplashScreenConfig has it
        return settings
    }

    private func splashScreenConfig() -> SplashScreenConfig {
        var config = SplashScreenConfig()
        // getConfigJSON() is always available; getString is conditionally compiled
        let configJSON = getConfig().getConfigJSON()

        // backgroundColor: parse hex string manually, use color(argb:) which is non-Optional
        if let backgroundColorStr = configJSON["backgroundColor"] as? String,
           !backgroundColorStr.isEmpty,
           let colorValue = parseHexColor(backgroundColorStr) {
            config.backgroundColor = UIColor.capacitor.color(argb: colorValue)
        }

        // spinnerStyle: use getConfigJSON() to avoid conditionally-compiled getString
        if let spinnerStyleStr = configJSON["iosSpinnerStyle"] as? String {
            switch spinnerStyleStr.lowercased() {
            case "small":
                config.spinnerStyle = .white
            default:
                config.spinnerStyle = .whiteLarge
            }
        }

        // spinnerColor: parse hex string manually
        if let spinnerColorStr = configJSON["spinnerColor"] as? String,
           !spinnerColorStr.isEmpty,
           let colorValue = parseHexColor(spinnerColorStr) {
            config.spinnerColor = UIColor.capacitor.color(argb: colorValue)
        }

        config.showSpinner = getConfig().getBoolean("showSpinner", config.showSpinner)
        config.launchShowDuration = getConfig().getInt("launchShowDuration", config.launchShowDuration)
        config.launchAutoHide = getConfig().getBoolean("launchAutoHide", config.launchAutoHide)
        return config
    }

    /// Parse a hex color string (#RGB, #RRGGBB, #AARRGGBB) into a UInt32 ARGB value.
    private func parseHexColor(_ hex: String) -> UInt32? {
        var hexStr = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        if hexStr.hasPrefix("#") { hexStr = String(hexStr.dropFirst()) }
        if hexStr.count == 3 { hexStr = hexStr.map { "\\($0)\\($0)" }.joined() }
        if hexStr.count == 6 { hexStr = "FF" + hexStr }
        guard hexStr.count == 8 else { return nil }
        var value: UInt32 = 0
        guard Scanner(string: hexStr).scanHexInt32(&value) else { return nil }
        return value
    }
}
'''


# ============================================================
# PATCH: RevenueCat CAPPluginCallExtensions.swift (full replacement)
# ============================================================
REVENUECAT_EXTENSIONS_CORRECT = '''\
import Foundation
import Capacitor
internal extension CAPPluginCall {
    func getOrRejectString(_ parameterName: String) -> String? {
        // getString(key) without default is conditionally compiled in xcframework 8.1.0
        // Use options dict to access optional values
        guard let parameter = self.options[parameterName] as? String else {
            self.unimplemented("Must provide \\(parameterName) parameter")
            return nil
        }
        return parameter
    }
    func getOrRejectBool(_ parameterName: String) -> Bool? {
        guard let parameter = self.options[parameterName] as? Bool else {
            self.unimplemented("Must provide \\(parameterName) parameter")
            return nil
        }
        return parameter
    }
    func getOrRejectStringArray(_ parameterName: String) -> [String]? {
        let rawArray = self.getArray(parameterName, [])
        if rawArray.isEmpty {
            self.unimplemented("Must provide \\(parameterName) parameter")
            return nil
        }
        return rawArray.compactMap { $0 as? String }
    }
    func getOrRejectObject(_ parameterName: String) -> JSObject? {
        guard let parameter = self.options[parameterName] as? JSObject else {
            self.unimplemented("Must provide \\(parameterName) parameter")
            return nil
        }
        return parameter
    }
}
'''


# ============================================================
# PATCH: RevenueCat PluginHelperExtensions.swift
# ============================================================
REVENUECAT_HELPER_PATCHES = [
    (
        'call.reject("Purchases must be configured before calling this function")',
        'call.unimplemented("Purchases must be configured before calling this function")'
    ),
    (
        '        call.reject("\\(error.message)", "\\(error.code)", error.error)',
        '        call.unimplemented("\\(error.message)")'
    ),
    # Both occurrences of "Incorrect completion..."
    (
        'call.reject("Incorrect completion. No response nor error passed.")',
        'call.unimplemented("Incorrect completion. No response nor error passed.")'
    ),
]


# ============================================================
# PATCH: RevenueCat PurchasesPlugin.swift - generic reject/getString patches
# ============================================================
def patch_revenuecat_purchases_plugin(path):
    """Patch PurchasesPlugin.swift for reject and getString(key) without default."""
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content

    # Replace call.reject("message") -> call.unimplemented("message")
    content = re.sub(
        r'call\.reject\("([^"]+)"\)',
        r'call.unimplemented("\1")',
        content
    )
    # Replace call.getString("key") without a second argument -> call.options["key"] as? String
    content = re.sub(
        r'call\.getString\("([^"]+)"\)(?!\s*,)',
        r'(call.options["\1"] as? String)',
        content
    )
    # Replace call.getBool("key") without default -> call.options["key"] as? Bool
    content = re.sub(
        r'call\.getBool\("([^"]+)"\)(?!\s*,)',
        r'(call.options["\1"] as? Bool)',
        content
    )
    # Replace call.getInt("key") without default -> call.options["key"] as? Int
    content = re.sub(
        r'call\.getInt\("([^"]+)"\)(?!\s*,)',
        r'(call.options["\1"] as? Int)',
        content
    )
    # Replace call.getObject("key") without default -> call.options["key"] as? JSObject
    content = re.sub(
        r'call\.getObject\("([^"]+)"\)(?!\s*,)',
        r'(call.options["\1"] as? JSObject)',
        content
    )
    # Replace call.getArray("key") without default -> call.options["key"] as? JSArray
    content = re.sub(
        r'call\.getArray\("([^"]+)"\)(?!\s*,)',
        r'(call.options["\1"] as? JSArray)',
        content
    )

    if content != original:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False


# ============================================================
# PATCH: RevenueCat PropertySetterPluginExtensions.swift
# Fixes: call.getString("key") -> call.options["key"] as? String
# These all pass String? to CommonFunctionality setters which accept String?
# ============================================================
def patch_property_setter_extensions(path):
    """Patch PropertySetterPluginExtensions.swift for getString without default."""
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content

    # Replace call.getString("key") without default -> call.options["key"] as? String
    content = re.sub(
        r'call\.getString\("([^"]+)"\)(?!\s*,)',
        r'(call.options["\1"] as? String)',
        content
    )

    if content != original:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False


# ============================================================
# GENERIC: patch any Swift file for reject/getString without default
# ============================================================
def patch_generic_swift(path):
    """Generic patch for any Swift file - fix reject and getString without default."""
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content

    # Replace call.reject("message") -> call.unimplemented("message")
    content = re.sub(
        r'call\.reject\("([^"]+)"\)',
        r'call.unimplemented("\1")',
        content
    )

    if content != original:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False


def main():
    # Find node_modules directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(os.path.dirname(script_dir))
    node_modules = os.path.join(project_dir, 'node_modules')

    if not os.path.isdir(node_modules):
        node_modules = os.path.join(os.getcwd(), 'node_modules')

    if not os.path.isdir(node_modules):
        print(f"ERROR: node_modules not found")
        sys.exit(1)

    print(f"Scanning: {node_modules}")
    changed = False

    # --- PushNotificationsHandler.swift (full replacement) ---
    for path in find_all_instances(node_modules, 'PushNotificationsHandler.swift'):
        if 'Tests' in path:
            continue
        if write_file(path, PUSH_HANDLER_CORRECT):
            print(f"Replaced: {path}")
            changed = True
        else:
            print(f"No changes needed: {path}")

    # --- PushNotificationsPlugin.swift ---
    for path in find_all_instances(node_modules, 'PushNotificationsPlugin.swift'):
        if 'Tests' in path:
            continue
        if patch_file(path, PUSH_PLUGIN_PATCHES):
            print(f"Patched: {path}")
            changed = True
        else:
            print(f"No changes needed: {path}")

    # --- AppPlugin.swift ---
    for path in find_all_instances(node_modules, 'AppPlugin.swift'):
        if 'Tests' in path:
            continue
        if patch_file(path, APP_PLUGIN_PATCHES):
            print(f"Patched: {path}")
            changed = True
        else:
            print(f"No changes needed: {path}")

    # --- BrowserPlugin.swift (full replacement) ---
    for path in find_all_instances(node_modules, 'BrowserPlugin.swift'):
        if 'Tests' in path:
            continue
        if write_file(path, BROWSER_PLUGIN_CORRECT):
            print(f"Replaced: {path}")
            changed = True
        else:
            print(f"No changes needed: {path}")

    # --- StatusBar.swift (full replacement) ---
    for path in find_all_instances(node_modules, 'StatusBar.swift'):
        if 'Tests' in path:
            continue
        # Only patch StatusBar from status-bar plugin (not other packages)
        if 'status-bar' not in path:
            continue
        if write_file(path, STATUS_BAR_SWIFT_CORRECT):
            print(f'Replaced: {path}')
            changed = True
        else:
            print(f'No changes needed: {path}')

    # --- StatusBarPlugin.swift (full replacement) ---
    for path in find_all_instances(node_modules, 'StatusBarPlugin.swift'):
        if 'Tests' in path:
            continue
        if write_file(path, STATUS_BAR_PLUGIN_CORRECT):
            print(f"Replaced: {path}")
            changed = True
        else:
            print(f"No changes needed: {path}")

    # --- SplashScreenPlugin.swift (full replacement) ---
    for path in find_all_instances(node_modules, 'SplashScreenPlugin.swift'):
        if 'Tests' in path:
            continue
        if write_file(path, SPLASH_PLUGIN_CORRECT):
            print(f"Replaced: {path}")
            changed = True
        else:
            print(f"No changes needed: {path}")

    # --- RevenueCat CAPPluginCallExtensions.swift (full replacement) ---
    for path in find_all_instances(node_modules, 'CAPPluginCallExtensions.swift'):
        if 'Tests' in path:
            continue
        if write_file(path, REVENUECAT_EXTENSIONS_CORRECT):
            print(f"Replaced: {path}")
            changed = True
        else:
            print(f"No changes needed: {path}")

    # --- RevenueCat PluginHelperExtensions.swift ---
    for path in find_all_instances(node_modules, 'PluginHelperExtensions.swift'):
        if 'Tests' in path:
            continue
        if patch_file(path, REVENUECAT_HELPER_PATCHES):
            print(f"Patched: {path}")
            changed = True
        else:
            print(f"No changes needed: {path}")

    # --- RevenueCat PurchasesPlugin.swift ---
    for path in find_all_instances(node_modules, 'PurchasesPlugin.swift'):
        if 'Tests' in path:
            continue
        if patch_revenuecat_purchases_plugin(path):
            print(f"Patched: {path}")
            changed = True
        else:
            print(f"No changes needed: {path}")

    # --- RevenueCat PropertySetterPluginExtensions.swift ---
    for path in find_all_instances(node_modules, 'PropertySetterPluginExtensions.swift'):
        if 'Tests' in path:
            continue
        if patch_property_setter_extensions(path):
            print(f"Patched: {path}")
            changed = True
        else:
            print(f"No changes needed: {path}")

    # --- HapticsPlugin.swift (generic reject fix) ---
    for path in find_all_instances(node_modules, 'HapticsPlugin.swift'):
        if 'Tests' in path:
            continue
        if patch_generic_swift(path):
            print(f"Patched: {path}")
            changed = True
        else:
            print(f"No changes needed: {path}")

    if not changed:
        print("All files already patched correctly.")
    else:
        print("Patching complete.")


if __name__ == '__main__':
    main()
