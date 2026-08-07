# AGENTS.md — Kazakh Durak Online

## iOS Build & TestFlight Upload Process

**CRITICAL: Follow these steps EXACTLY to upload a new iOS build to TestFlight.**

### Prerequisites
- GitHub repo: `svetlyakovdaniil-pixel/durakonlinefromkz`
- GitHub token: stored in `GH_TOKEN` env variable (do NOT hardcode in this file — GitHub push protection will block the push)
- Workflow: `ios-build.yml`
- Marketing version: `1.0.68` (do NOT change unless user says so)

### Step-by-Step Process

1. **Make code changes and save checkpoint:**
   ```bash
   # Use webdev_save_checkpoint to save changes
   ```

2. **PUSH to GitHub BEFORE triggering the build:**
   ```bash
   cd /home/ubuntu/kazakh-durak
   GH_TOKEN=<token> git push github HEAD:main
   ```
   **IMPORTANT:** The iOS build pulls code from GitHub. If you don't push first, the build will use OLD code!

3. **Cancel any auto-triggered push build** (push events trigger builds with wrong build_number):
   ```bash
   # Check for push-triggered builds
   GH_TOKEN=<token> gh run list --workflow=ios-build.yml --repo svetlyakovdaniil-pixel/durakonlinefromkz --limit 3
   # Cancel if there's a push-triggered one running
   GH_TOKEN=<token> gh run cancel <RUN_ID> --repo svetlyakovdaniil-pixel/durakonlinefromkz
   ```

4. **Trigger workflow_dispatch with correct parameters:**
   ```bash
   GH_TOKEN=<token> gh workflow run ios-build.yml \
     --repo svetlyakovdaniil-pixel/durakonlinefromkz \
     -f version=1.0.69 \  # ALWAYS use latest marketing version from ASC!
     -f build_number=<NEXT_NUMBER>
   ```
      - `version` = **MUST match the latest marketing version in ASC** (check with `/v1/preReleaseVersions?filter[app]=APP_ID&sort=-version&limit=1`)
   - `build_number` = increment from last build in ASC (check with `/v1/builds?filter[app]=APP_ID&sort=-uploadedDate&limit=1`)

5. **Wait ~6 minutes for build to complete, then verify:**
   ```bash
   GH_TOKEN=<token> gh run view <RUN_ID> --repo svetlyakovdaniil-pixel/durakonlinefromkz
   # Check upload result:
   GH_TOKEN=<token> gh run view --job=<JOB_ID> --repo svetlyakovdaniil-pixel/durakonlinefromkz --log 2>&1 | grep "UPLOAD SUCCEEDED"
   ```

### Common Mistakes to AVOID

| Mistake | Result | Fix |
|---------|--------|-----|
| Not pushing to GitHub before triggering build | Build uses old code | Always `git push github HEAD:main` first |
| Using wrong version (e.g., `1.0.2` instead of `1.0.68`) | Build doesn't appear in TestFlight (goes to wrong version group) | Always use `1.0.68` |
| Using build_number lower than existing builds | Apple rejects it | Always increment from last known build |
| Not cancelling push-triggered builds | They use `github.run_number` as build_number (250+) which confuses numbering | Cancel push-triggered builds, use workflow_dispatch |
| Hardcoding secrets in AGENTS.md or any tracked file | GitHub push protection blocks the push | Use env vars, never hardcode tokens |

### Build Number History
- Build 74: Last confirmed in TestFlight (version 1.0.68)
- Build 75: Uploaded with old code (no fixes)
- Build 76: Uploaded with old code (fixes weren't pushed to GitHub)
- Build 77: First correct upload with all fixes (version 1.0.68, safe-top + routes)
- Build 78: Match history fix — early exit records as loss
- Build 79: Firebase iOS SDK added — push notifications now use FCM tokens
- Build 83: Fix Sign in with Apple on iPad (CODE_SIGN_ENTITLEMENTS) — version 1.0.69 ✓
- Build 84: WRONG — used version 1.0.68, did NOT appear in TestFlight ✗
- Build 85: Fix season reward button (ReactDOM.createPortal) — version 1.0.69 ✓ (CORRECT WAY)

## ⚠️ CRITICAL RULE: TestFlight Version Matching
Build MUST use the SAME marketing version as the previous builds in TestFlight.
If latest TestFlight shows v1.0.69 → new build MUST also use version=1.0.69.
Using a lower version (e.g., 1.0.68) causes the build to go to a different version group and NOT appear in TestFlight.

## 🔒 SINGLE MARKETING VERSION POLICY (as of Aug 2026)
To eliminate version confusion between TestFlight and App Review:
- **The marketing version is ALWAYS 1.0.70.** Only the build number changes.
- Every iOS build MUST be dispatched with `version=1.0.70` (workflow_dispatch input).
- NEITHER push builds (auto github.run_number) NOR any other version string are allowed.
- The App Store version record stays "1.0.70"; a new build (higher number) is attached to it for review.
- This keeps TestFlight, App Review and App Store on the SAME version string.

## Project Structure Notes

- **Routes must be registered in TWO places:**
  1. `client/src/App.tsx` — the wouter `<Switch>` Router (required for the route to work)
  2. `client/src/pages/Home.tsx` — early returns for full-screen pages (optional, for pages that bypass the main game UI)

- **Safe area on iOS:** All full-screen pages must have `safe-top` class on their sticky header div to avoid overlapping the iOS status bar.

## Push Notifications Architecture

- **Server:** Uses Firebase Admin SDK (FCM) to send push notifications. Requires `FIREBASE_SERVICE_ACCOUNT_KEY` env var (set in webdev secrets).
- **iOS app:** Uses `@capacitor/push-notifications` + `Firebase/Messaging` CocoaPod. AppDelegate initializes `FirebaseApp.configure()` and maps APNs token → FCM token via `Messaging.messaging().apnsToken`.
- **Flow:** iOS registers → gets FCM token → sends to server via `trpc.push.registerToken` → server stores in `pushTokens` table → server sends FCM messages when events occur.
- **GoogleService-Info.plist:** Already in `ios/App/App/GoogleService-Info.plist` (Firebase project: `durak-online-kz`).

## Git Remotes
- `origin` — webdev internal (auto-managed)
- `github` — https://github.com/svetlyakovdaniil-pixel/durakonlinefromkz.git
