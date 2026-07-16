import Foundation
import Capacitor
import AuthenticationServices
import UIKit

/**
 * Native Sign in with Apple plugin for Capacitor.
 *
 * This is a self-contained plugin that uses ASAuthorizationAppleIDProvider
 * directly — no SPM dependency, no capacitor-swift-pm version conflict.
 *
 * Called from JavaScript via:
 *   (window as any).Capacitor.Plugins.AppleSignIn.authorize({ ... })
 */
@objc(AppleSignInPlugin)
public class AppleSignInPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AppleSignInPlugin"
    public let jsName = "AppleSignIn"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "authorize", returnType: CAPPluginReturnPromise)
    ]

    private var pendingCall: CAPPluginCall?

    @objc func authorize(_ call: CAPPluginCall) {
        self.pendingCall = call

        DispatchQueue.main.async {
            let provider = ASAuthorizationAppleIDProvider()
            let request = provider.createRequest()
            request.requestedScopes = [.fullName, .email]

            let controller = ASAuthorizationController(authorizationRequests: [request])
            controller.delegate = self
            controller.presentationContextProvider = self
            controller.performRequests()
        }
    }
}

extension AppleSignInPlugin: ASAuthorizationControllerDelegate {
    public func authorizationController(
        controller: ASAuthorizationController,
        didCompleteWithAuthorization authorization: ASAuthorization
    ) {
        guard let call = pendingCall else { return }
        pendingCall = nil

        if let credential = authorization.credential as? ASAuthorizationAppleIDCredential {
            var result: [String: Any] = [:]

            if let identityToken = credential.identityToken,
               let tokenString = String(data: identityToken, encoding: .utf8) {
                result["identityToken"] = tokenString
            }

            if let authCode = credential.authorizationCode,
               let codeString = String(data: authCode, encoding: .utf8) {
                result["authorizationCode"] = codeString
            }

            result["user"] = credential.user

            if let email = credential.email {
                result["email"] = email
            }

            if let fullName = credential.fullName {
                if let givenName = fullName.givenName {
                    result["givenName"] = givenName
                }
                if let familyName = fullName.familyName {
                    result["familyName"] = familyName
                }
            }

            call.resolve(["response": result])
        } else {
            call.reject("Unsupported credential type")
        }
    }

    public func authorizationController(
        controller: ASAuthorizationController,
        didCompleteWithError error: Error
    ) {
        guard let call = pendingCall else { return }
        pendingCall = nil

        let authError = error as? ASAuthorizationError
        if authError?.code == .canceled {
            // User pressed Cancel — resolve with a cancellation indicator
            call.reject("1001")
        } else {
            call.reject(error.localizedDescription)
        }
    }
}

extension AppleSignInPlugin: ASAuthorizationControllerPresentationContextProviding {
    public func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        // Use UIWindowScene-aware approach for iPadOS 26+ multi-scene support.
        // The old approach (webView?.window ?? UIWindow()) can return nil on iPadOS 26
        // with scenes, causing the SIWA sheet to never appear and the JS promise to hang forever.
        if let scene = UIApplication.shared.connectedScenes
            .compactMap({ $0 as? UIWindowScene })
            .first(where: { $0.activationState == .foregroundActive }),
           let window = scene.windows.first(where: { $0.isKeyWindow }) ?? scene.windows.first {
            return window
        }
        // Fallback: try the bridge's webView window
        if let window = self.bridge?.webView?.window {
            return window
        }
        // Last resort: create a new window (should never happen)
        return UIWindow()
    }
}
