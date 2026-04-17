# Tape — Browser extension for pyload-ng

**The new Yape.** A maintained fork of [RemiRigal/Yape](https://github.com/RemiRigal/Yape), rewritten for the modern [pyload-ng](https://github.com/pyload/pyload) API (v1.1.0+).

The upstream project is no longer actively maintained, and the old API contract it was built against (camelCase endpoints, session-cookie login via `/api/login`) no longer exists in pyload-ng 1.x. Tape restores the extension against the current API: HTTP Basic Auth, snake_case endpoints, JSON bodies.

## Features

- One-click download of the current tab
- Monitor active downloads with speed and ETA
- Monitor global bandwidth usage with a one-click speed limiter
- Context-menu "Download with Tape" on any link
- Works with pyload-ng `0.5.x` (API `1.1.0`)

## Install

Load the extension unpacked (the Chrome Web Store / Firefox Add-ons listings for the original Yape are not updated with this fork):

1. Clone or download this repo.
2. Open `chrome://extensions` and enable **Developer mode**.
3. Click **Load unpacked** and select the repo folder.

## Usage

1. Click the extension icon → **Options**.
2. Fill in your pyload server:
   - **Host** — e.g. `192.168.1.10`
   - **Port** — e.g. `8000`
   - **Path** — usually `/`
   - **Use HTTPS** — if your server has TLS
   - **Username** / **Password** — your pyload account credentials
3. Click **Save**. The page shows a green "Connected" alert when it can talk to the server.

Credentials are stored in `chrome.storage.sync` and sent as HTTP Basic Auth on every request.

The extension popup shows active downloads. If the current tab points to a pyload-supported download, an extra panel appears with a download button. You can also right-click any link and choose **Download with Tape**.

## What changed from Yape

- **Auth:** session cookie via `POST /api/login` → HTTP Basic Auth (`Authorization: Basic ...`). The `/api/login` endpoint was removed in pyload-ng 1.x.
- **Endpoints:** camelCase (`/api/statusServer`) → snake_case (`/api/status_server`).
- **Verbs:** everything-is-POST → RESTful (GET for reads, POST for mutations).
- **Request bodies:** form-encoded → JSON.
- **UI:** the login modal is gone; credentials live in the options page.

## License

MIT. Original Yape by Rémi Rigal — see [LICENSE](LICENSE).
