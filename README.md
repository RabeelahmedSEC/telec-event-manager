# TELEC Smart Event Manager — GitHub Pages Demo

This edition runs directly on **GitHub Pages** without Node.js hosting.

## Demo login

- Username: `admin`
- Password: `Telec@2026`

## Publish on GitHub Pages

1. Open the `telec-event-manager` repository.
2. Delete the old repository files, or create a new branch/repository for this demo.
3. Upload **all files from this folder to the repository root**. `index.html` must be visible at the top level.
4. Open **Settings → Pages**.
5. Under **Build and deployment**, choose **Deploy from a branch**.
6. Select branch **main**, folder **/(root)**, and click **Save**.
7. Wait 1–3 minutes. GitHub will show the public demo URL.

## Important demo limitations

- Events, users and audit history are saved in the visitor's browser (`localStorage`). Different devices do not automatically share the same local data.
- New events can optionally sync to the configured Google Apps Script / Google Sheet.
- The Gemini key is stored in the browser in this demo edition. Use a temporary restricted key and revoke it after the demo.
- This is not production-grade authentication. Move to TELEC hosting/backend after approval.
