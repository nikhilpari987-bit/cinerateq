# CineRate – Setup Guide

## What You Need
- A free [Firebase](https://firebase.google.com) account
- A free [Vercel](https://vercel.com) or [Netlify](https://netlify.com) account to host

---

## Step 1: Create a Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **"Add project"** → name it `CineRate` → Continue
3. Disable Google Analytics (optional) → Create project

---

## Step 2: Enable Authentication

1. In Firebase Console → **Authentication** → Get Started
2. Click **"Sign-in method"** tab
3. Enable **Google** → enter your support email → Save
4. Enable **Apple** → follow Apple Developer setup (needs Apple Developer account)
   - Or skip Apple for now and use Google-only

---

## Step 3: Enable Firestore Database

1. Firebase Console → **Firestore Database** → Create database
2. Choose **Production mode** → pick a region close to India (e.g., `asia-south1`) → Enable
3. Go to **Rules** tab and paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /movies/{movieId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```
4. Click **Publish**

---

## Step 4: Get Your Firebase Config

1. Firebase Console → ⚙️ Project Settings → **General** tab
2. Scroll to **"Your apps"** → click **</>** (Web app)
3. Register app name → copy the `firebaseConfig` object
4. You need: `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`

---

## Step 5: Configure the App

1. Copy `.env.example` to `.env.local`
2. Fill in your Firebase values:

```
REACT_APP_FIREBASE_API_KEY=AIzaSy...
REACT_APP_FIREBASE_AUTH_DOMAIN=cinerate-xxxx.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=cinerate-xxxx
REACT_APP_FIREBASE_STORAGE_BUCKET=cinerate-xxxx.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abc123
REACT_APP_ADMIN_EMAILS=youremail@gmail.com
```

> `REACT_APP_ADMIN_EMAILS` is your Gmail. This gives you access to the "+ Add Movie" button.

---

## Step 6: Add Authorized Domains in Firebase

1. Firebase → Authentication → Settings → **Authorized domains**
2. Add your Vercel/Netlify URL (e.g., `cinerate.vercel.app`)

---

## Step 7: Deploy to Vercel (Free)

1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → Import your GitHub repo
3. In **Environment Variables**, add all your `REACT_APP_*` values from `.env.local`
4. Click **Deploy** → your app is live! 🎉

---

## How to Use the App

### As Admin (you):
- Sign in with your Gmail
- Click **"+ Add Movie"** in the top bar
- Fill in title, year, genre, director, synopsis, and a poster image URL
  - Free poster images: search the movie on Google Images, right-click → Copy image address

### As a User:
- Sign in with Google or Apple
- Click any movie card to open it
- Give it a star rating + optional review
- Click **"Share Rating 🎬"** to generate a share card
- Download the image and post it as Instagram/WhatsApp Status

---

## Getting Movie Poster URLs

Free sources for poster images:
- [The Movie Database (TMDB)](https://www.themoviedb.org) — right-click poster → Copy Image Address
- [IMDb](https://www.imdb.com) — search movie → copy poster image URL
- Format: must end in `.jpg` or `.png`

---

## App Features Summary

| Feature | Details |
|--------|---------|
| Login | Google Sign-In, Apple Sign-In |
| Rating | 1–5 star rating per user per movie |
| Reviews | Optional text review with rating |
| Share | Downloads a branded image card for Instagram/WhatsApp Status |
| Admin | Add movies with title, poster, genre, director, synopsis |
| Search | Live search by title or director |
| Filter | Filter by genre |
| Hosting | Deploy free on Vercel |
