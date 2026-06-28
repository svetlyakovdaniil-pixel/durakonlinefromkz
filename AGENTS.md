# AGENTS.md — Kazakh Durak Online

## iOS Build & TestFlight Upload Process

**CRITICAL: Follow these steps EXACTLY to upload a new iOS build to TestFlight.**

### Prerequisites
- GitHub repo: `svetlyakovdaniil-pixel/durakonlinefromkz`
- GitHub token: use `GH_TOKEN=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`
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
   GH_TOKEN=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 git push github HEAD:main
   ```
   **IMPORTANT:** The iOS build pulls code from GitHub. If you don't push first, the build will use OLD code!

3. **Cancel any auto-triggered push build** (push events trigger builds with wrong build_number):
   ```bash
   # Check for push-triggered builds
   GH_TOKEN=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 gh run list --workflow=ios-build.yml --repo svetlyakovdaniil-pixel/durakonlinefromkz --limit 3
   # Cancel if there's a push-triggered one running
   GH_TOKEN=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 gh run cancel <RUN_ID> --repo svetlyakovdaniil-pixel/durakonlinefromkz
   ```

4. **Trigger workflow_dispatch with correct parameters:**
   ```bash
   GH_TOKEN=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 gh workflow run ios-build.yml \
     --repo svetlyakovdaniil-pixel/durakonlinefromkz \
     -f version=1.0.68 \
     -f build_number=<NEXT_NUMBER>
   ```
   - `version` = `1.0.68` (marketing version, keep this constant)
   - `build_number` = increment from last successful TestFlight build (check with user)

5. **Wait ~6 minutes for build to complete, then verify:**
   ```bash
   GH_TOKEN=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 gh run view <RUN_ID> --repo svetlyakovdaniil-pixel/durakonlinefromkz
   # Check upload result:
   GH_TOKEN=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 gh run view --job=<JOB_ID> --repo svetlyakovdaniil-pixel/durakonlinefromkz --log 2>&1 | grep "UPLOAD SUCCEEDED"
   ```

### Common Mistakes to AVOID

| Mistake | Result | Fix |
|---------|--------|-----|
| Not pushing to GitHub before triggering build | Build uses old code | Always `git push github HEAD:main` first |
| Using wrong version (e.g., `1.0.2` instead of `1.0.68`) | Build doesn't appear in TestFlight (goes to wrong version group) | Always use `1.0.68` |
| Using build_number lower than existing builds | Apple rejects it | Always increment from last known build |
| Not cancelling push-triggered builds | They use `github.run_number` as build_number (250+) which confuses numbering | Cancel push-triggered builds, use workflow_dispatch |

### Build Number History
- Build 74: Last confirmed in TestFlight (version 1.0.68)
- Build 75: Uploaded with old code (no fixes)
- Build 76: Uploaded with old code (fixes weren't pushed to GitHub)
- Build 77: First correct upload with all fixes (version 1.0.68, safe-top + routes)

## Project Structure Notes

- **Routes must be registered in TWO places:**
  1. `client/src/App.tsx` — the wouter `<Switch>` Router (required for the route to work)
  2. `client/src/pages/Home.tsx` — early returns for full-screen pages (optional, for pages that bypass the main game UI)

- **Safe area on iOS:** All full-screen pages must have `safe-top` class on their sticky header div to avoid overlapping the iOS status bar.

## Git Remotes
- `origin` — webdev internal (auto-managed)
- `github` — https://github.com/svetlyakovdaniil-pixel/durakonlinefromkz.git
