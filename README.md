# QUEVA — AI Study Companion

QUEVA is a Progressive Web App that helps students study smarter. Upload lecture notes, chat with an AI, generate custom quizzes, set study alarms, and track your progress — all in one installable app powered by Groq.

Live at **[obinna18.github.io/QUEVA](https://obinna18.github.io/QUEVA/)**

---

## Features

**AI Assistant**
Upload a PDF or text file and chat with it. Queva reads your document and can summarise it, extract key points, generate exam questions, or answer specific questions about the content.

**Quiz Mode**
Answer daily general knowledge questions or generate custom multiple-choice quizzes on any topic at Easy, Medium, or Hard difficulty. Track your accuracy, correct answers, and study streak over time.

**Study Alarm**
Set a topic and an alarm time. When the alarm fires, Queva rings and locks you into a short quiz — you must answer at least 3 questions correctly before the alarm dismisses. Works via system notifications even with the tab closed (requires notification permission).

**Key Points**
Key concepts extracted from AI responses are automatically saved here. Export them as a PDF or share directly to WhatsApp.

**Offline Support**
After first load, the app shell is cached by a Service Worker. Recent sessions remain accessible offline. AI features require an internet connection.

**Installable**
Add Queva to your Android or iOS home screen as a native-feeling app via the browser's "Add to Home Screen" prompt.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML, CSS, JavaScript (single file, no framework) |
| AI | LLaMA 3.3-70B via Groq API |
| Proxy | Vercel serverless function (hides API key from client) |
| Auth | Firebase Authentication (Google Sign-In + Email/Password + Guest) |
| Database | Firebase Firestore (session history, long-term memory) |
| PDF parsing | PDF.js |
| PDF export | jsPDF |
| Email | EmailJS |
| PWA | Web App Manifest + Service Worker (offline cache + alarm notifications) |

---

## How the AI Works

Queva routes requests through a private Vercel proxy at `queva-proxy.vercel.app`. The Groq API key lives only on the server — it is never exposed to the client. Users can optionally supply their own Groq API key in Settings for faster responses on their own quota.

**Fallback chain:** If the primary model hits a rate limit, Queva automatically retries on `llama-3.1-8b-instant`, then `gemma2-9b-it`, then `mixtral-8x7b-32768` before returning an error.

---

## How Memory Works

**Short-Term Memory (STM):** The active conversation lives as a JavaScript array in the browser. It resets when you start a new session.

**Long-Term Memory (LTM):** Sessions are saved to Firebase Firestore under your account. When you return, the last 30 sessions are loaded back so the AI retains context across visits.

**Guest mode:** Sessions save to `localStorage` only. Clearing browser data or switching devices loses them. Sign in to sync across devices.

---

## How the Study Alarm Works

1. Go to Quiz tab and tap **Set Alarm**
2. Enter your topic or course name and choose a time
3. Allow notifications when prompted
4. When the alarm fires, a quiz modal opens and the alarm beeps
5. Answer at least 3 of 5 generated questions correctly to dismiss it
6. Fail a round and a fresh set of questions loads automatically

If the browser tab is closed, the alarm fires as a system notification (Android Chrome: works out of the box. iOS Safari: requires the app to be installed to home screen first).

---

## Project Structure

```
QUEVA/
├── index.html        # Entire app — UI, styles, and logic in one file
├── sw.js             # Service Worker (offline caching + study alarm scheduling)
├── manifest.json     # PWA manifest (icons, theme, install config)
├── icon-192.png      # App icon
├── icon-512.png      # App icon
└── config.js         # Local only — API keys (not committed)
```

---

## Local Setup

### 1. Clone the repo

```bash
git clone https://github.com/obinna18/QUEVA.git
cd QUEVA
```

### 2. Add your config

Create a `config.js` file (never commit this):

```js
// config.js — excluded from version control
const GROQ_API_KEY = "your_groq_api_key_here";

const firebaseConfig = {
  apiKey: "your_firebase_api_key",
  authDomain: "your_project.firebaseapp.com",
  projectId: "your_project_id",
  storageBucket: "your_project.firebasestorage.app",
  messagingSenderId: "your_sender_id",
  appId: "your_app_id"
};
```

Add to `.gitignore`:

```
config.js
```

### 3. Get a Groq API key

Sign up at [console.groq.com](https://console.groq.com) and create a free key. Free tier: 14,400 requests/day, no credit card required.

### 4. Set up Firebase

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a project and register a web app
3. Enable **Authentication** (Google provider + Email/Password + Anonymous)
4. Enable **Firestore Database**
5. Copy config values into `config.js`

### 5. Run locally

```bash
npx serve .
```

Or with Python:

```bash
python -m http.server 8000
```

Open `http://localhost:8000`. The Service Worker and push notifications require HTTPS in production — GitHub Pages provides this automatically.

---

## Deployment

Push to the `main` branch with GitHub Pages enabled. No build step required.

```bash
git add .
git commit -m "your message"
git push origin main
```

GitHub Pages serves the site within seconds at `obinna18.github.io/QUEVA/`.

---

## Security Notes

- Never commit your Groq API key or Firebase config to a public repo
- The production Groq key lives only on the Vercel proxy server
- Firebase Security Rules should restrict Firestore reads and writes to authenticated users only
- Developer mode (5-tap unlock) is hard-gated to a single authorised email address

---

## Built By

Obinna Egenti · [obinna18.github.io](https://obinna18.github.io) · [LinkedIn](https://www.linkedin.com/in/obinnaegenti)
