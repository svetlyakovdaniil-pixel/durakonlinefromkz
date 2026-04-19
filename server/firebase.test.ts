import { describe, it, expect } from "vitest";
import * as admin from "firebase-admin";

describe("Firebase Service Account Key", () => {
  it("should parse FIREBASE_SERVICE_ACCOUNT_KEY as valid JSON", () => {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    expect(raw, "FIREBASE_SERVICE_ACCOUNT_KEY env var must be set").toBeTruthy();
    
    let parsed: Record<string, unknown>;
    expect(() => {
      parsed = JSON.parse(raw!);
    }).not.toThrow();
    
    expect(parsed!.type).toBe("service_account");
    expect(parsed!.project_id).toBe("durak-online-kz");
    expect(parsed!.client_email).toContain("@durak-online-kz.iam.gserviceaccount.com");
    expect(parsed!.private_key).toContain("BEGIN PRIVATE KEY");
  });

  it("should initialize Firebase Admin SDK without errors", () => {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!raw) {
      console.warn("Skipping Firebase Admin SDK init test: FIREBASE_SERVICE_ACCOUNT_KEY not set");
      return;
    }

    const serviceAccount = JSON.parse(raw);
    
    // Check if already initialized (vitest may reuse module state)
    const existingApp = admin.apps.find(a => a?.name === "test-validation");
    if (existingApp) {
      existingApp.delete();
    }

    const app = admin.initializeApp(
      {
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      },
      "test-validation"
    );

    expect(app).toBeTruthy();
    expect(app.name).toBe("test-validation");
    
    // Clean up
    app.delete();
  });
});
