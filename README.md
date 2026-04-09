# QUEVA — AI Study Companion

QUEVA is a Progressive Web App (PWA) that helps students study smarter. Upload your lecture notes, ask questions about them, and generate quizzes — all powered by a fast AI model running on Groq.

---

## What It Does

- Upload lecture notes (PDF or text) and chat with them
- Generate quizzes from your study material
- Remembers your past sessions so you can pick up where you left off
- Works offline after first load (PWA with service worker caching)
- Installable on Android and iOS like a native app

---

## How the Memory Works

**Short-Term Memory (STM)** — the active conversation lives as a JavaScript array in the browser. It resets when the session ends.

**Long-Term Memory (LTM)** — past sessions are saved to Firebase Firestore under your user account. When you return, that history gets loaded back into context so the AI remembers previous conversations.

**AI Model** — LLaMA 3.3-70B served via the Groq API. Groq's inference speed keeps responses fast even with large context.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML, CSS, JavaScript (no framework) |
| AI | LLaMA 3.3-70B via Groq API |
| Auth | Firebase Authentication (Google Sign-In + Guest) |
| Database | Firebase Firestore (LTM / session history) |
| PDF parsing | PDF.js |
| PDF export | jsPDF |
| Email | EmailJS |
| Installability | PWA — Web App Manifest + Service Worker |

---

## Local Setup

### 1. Clone the repo

```bash
git clone https://github.com/obinna18/QUEVA.git
cd QUEVA
```

### 2. Add your environment config

Create a `config.js` file (do not commit this) with the following:

```js
// config.js — keep this out of version control
const GROQ_API_KEY = "your_groq_api_key_here";

const firebaseConfig = {
  apiKey: "your_firebase_api_key",
  authDomain: "your_project.firebaseapp.com",
  projectId: "your_project_id",
  storageBucket: "your_project.firebasestorage.app",
  messagingSenderId: "your_sender_id",
  appId: "your_app_id",
  measurementId: "your_measurement_id"
};
```

Add `config.js` to your `.gitignore`:

```
config.js
```

### 3. Get a Groq API key

Sign up at [console.groq.com](https://console.groq.com) and create a free API key.

### 4. Set up Firebase

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a project and register a web app
3. Enable **Authentication** (Google provider + Anonymous)
4. Enable **Firestore Database**
5. Copy your config values into `config.js`

### 5. Run locally

Since this is plain HTML/JS, you just need a local server. The simplest way:

```bash
npx serve .
```

Or with Python:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

---

## Deployment

QUEVA is live at:
👉 [https://obinna18.github.io/QUEVA/](https://obinna18.github.io/QUEVA/)

To deploy your own fork, push to the `gh-pages` branch or enable GitHub Pages from your repo settings pointing at the `main` branch root.

---

## Project Structure

```
QUEVA/
├── index.html        # Main app shell and all UI
├── sw.js             # Service worker (offline support + caching)
├── manifest.json     # PWA manifest (icons, theme, install config)
├── icon-192.png      # App icon
├── icon-512.png      # App icon
└── config.js         # Local only — API keys (not committed)
```

---

## Security Note

Never commit your Firebase `apiKey` or Groq API key to a public repo. Use Firebase Security Rules to restrict Firestore read/write access to authenticated users only.

---

## Built By

Obinna Egenti — [obinna18.github.io](https://obinna18.github.io) · [LinkedIn](https://www.linkedin.com/in/obinnaegenti)
