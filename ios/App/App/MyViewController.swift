import UIKit
import Capacitor

/**
 * MyViewController.swift
 *
 * Capacitor 6 removed automatic plugin registration on iOS.
 * Custom (local) plugins MUST be registered manually via capacitorDidLoad().
 * See: https://capacitorjs.com/docs/ios/custom-code
 *
 * Without this, registerPlugin('AppleSignIn') in JS returns a no-op stub
 * and Sign in with Apple silently fails with "Ошибка входа через Apple".
 */
class MyViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(AppleSignInPlugin())
    }
}
