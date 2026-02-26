# Remove All Firestore Rules

## Current Rules (Open Access)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow all read and write access for testing
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

## How to Deploy

1. **Via Firebase Console:**
   - Go to Firebase Console
   - Select your project
   - Go to Firestore Database
   - Click on "Rules" tab
   - Replace ALL existing rules with the above code
   - Click "Publish"

2. **Via Firebase CLI:**
   ```bash
   firebase deploy --only firestore:rules
   ```

## What This Does

- **Removes ALL security rules**
- **Allows anyone to read/write to any document**
- **Perfect for testing and debugging**
- **Will help identify if the issue is with rules or something else**

## ⚠️ Security Warning

These rules are for **TESTING ONLY**. Do not use in production as they allow unrestricted access to your database.

## After Testing

Once we identify the issue, we'll add back proper security rules.
