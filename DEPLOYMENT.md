# Deployment Instructions

This application is a **React + Vite** Single Page Application (SPA). It does **not** require a Python/Flask backend. All AI logic is handled client-side via the Google Gemini API, and user data is persisted locally (or can be easily connected to a service like Firebase).

## 1. Prerequisites

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **Google Gemini API Key** (Get one at [aistudio.google.com](https://aistudio.google.com/))

## 2. Environment Setup

Create a `.env` file in the root directory:

```env
VITE_GEMINI_API_KEY=your_actual_api_key_here
```

## 3. Local Development

1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Start the development server:
    ```bash
    npm run dev
    ```
3.  Open `http://localhost:5173` in your browser.

## 4. Deployment to Vercel (Recommended)

Vercel is the easiest way to deploy Vite apps.

1.  **Push your code to GitHub.**
2.  **Log in to Vercel** and click "Add New Project".
3.  **Import your repository.**
4.  **Configure Project:**
    -   **Framework Preset:** Vite
    -   **Root Directory:** `./`
    -   **Environment Variables:**
        -   Name: `VITE_GEMINI_API_KEY`
        -   Value: `your_actual_api_key_here`
5.  Click **Deploy**.

## 5. Deployment to Netlify

1.  **Log in to Netlify** and click "New site from Git".
2.  **Connect to your GitHub repository.**
3.  **Build Settings:**
    -   **Build command:** `npm run build`
    -   **Publish directory:** `dist`
4.  **Environment Variables:**
    -   Go to "Site settings" > "Build & deploy" > "Environment".
    -   Add `VITE_GEMINI_API_KEY` with your key.
5.  Click **Deploy site**.

## 6. User Data & Authentication

Currently, user authentication and history are **simulated** using `localStorage` for demonstration purposes. This means:
-   Data persists in the user's browser.
-   Data is *not* shared across devices.

**To upgrade to real cloud storage:**
1.  Set up a **Firebase** project.
2.  Enable **Authentication** (Email/Password) and **Firestore** (Database).
3.  Replace `src/context/AuthContext.tsx` and `src/services/storageService.ts` with Firebase SDK calls.
