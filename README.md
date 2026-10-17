# phase.

A calm, private period tracker with daily check-ins and hormone-based insights, styled after the Stoic app.

- Static files only: `index.html`, plus `sw.js`, `manifest.webmanifest`, `fonts/` and `icons/`. No build step, no server, no account.
- Data stays in the browser (`localStorage`). Nothing is sent anywhere, and the fonts are self-hosted.
- Works offline after the first visit (service worker, needs https or localhost).
- Optional passcode in Settings encrypts the stored data (AES-GCM, key from PBKDF2). There is no recovery if you forget it.
- Settings → Export backup keeps a copy. The app reminds you when your last backup is old.
- Settings also has a doctor summary (print or save as PDF), a calendar file of predicted periods (.ics) and a CSV of check-ins.

## Run locally

```bash
python3 -m http.server 8765
```

Then open http://127.0.0.1:8765. On iPhone, host it anywhere static over https and use "Add to Home Screen" so Safari keeps the data.

When you change a cached file other than `index.html`, bump `VERSION` in `sw.js`.

Not medical advice. Predictions are estimates and are not birth control.
