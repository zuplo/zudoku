---
title: Firebase Setup
sidebar_label: Firebase
description:
  Learn how to set up Firebase Authentication for Zudoku, leveraging Google's secure authentication
  infrastructure with multiple sign-in providers.
---

Firebase Authentication provides a comprehensive identity solution from Google, supporting
email/password authentication and federated identity providers like Google, Facebook, Twitter, and
more. This guide shows you how to integrate Firebase Authentication with your Zudoku documentation
site.

## Prerequisites

- A Google account to access Firebase Console
- A Firebase project (free tier available)
- Basic knowledge of Firebase configuration

## Setup Firebase

1. Go to the [Firebase Console](https://console.firebase.google.com/):
2. Click **Create a project** (or select an existing project)
3. Make sure authentication is enabled. Choose your preferred authentication providers.
4. Configure Authorized Domains, add your domains where the authentication will be used.
5. **Get Your Firebase Configuration**
   - Go to **Project settings**
   - Scroll to **Your apps** section
   - Click **Add app** → **Web** if you haven't already
   - Register your app with a nickname
   - Copy the Firebase configuration object

## Configure Zudoku

Add the Firebase configuration to your [Zudoku configuration file](./overview.md):

```typescript title="zudoku.config.ts"
export default {
  authentication: {
    type: "firebase",
    // Replace these with your Firebase project configuration
    // Get these values from Firebase Console > Project Settings
    apiKey: "<insert your API key here>",
    authDomain: "your-domain.firebaseapp.com",
    projectId: "your-project-id",
    appId: "1:296819355813:web:91d29f11cac6f073595d4c",
    // Optional fields
    storageBucket: "your-project.firebasestorage.app",
    messagingSenderId: "296819355813",
    measurementId: "G-12W6TTNR75",
    // Optional: specify which providers to show in the sign-in UI
    // Available providers: "google", "github", "facebook", "twitter",
    // "microsoft", "apple", "yahoo", "password", "phone"
    // If not specified, all enabled providers in Firebase will be available
    providers: ["google", "github", "password"],
    // Optional: configure redirect URLs after authentication
    redirectToAfterSignIn: "/docs",
    redirectToAfterSignUp: "/getting-started",
    redirectToAfterSignOut: "/",
  },
};
```
