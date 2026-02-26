# Firestore Security Rules Setup

## Issue
The app is showing "Missing or insufficient permissions" errors because Firestore security rules are blocking access to user subcollections.

## Solution
You need to update your Firestore security rules in the Firebase Console.

### Steps:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `smarttravelplaner`
3. Go to **Firestore Database** → **Rules**
4. Replace the existing rules with the content from `firestore.rules` file
5. Click **Publish**

### Alternative: Quick Fix
If you want to allow all access for testing (NOT recommended for production), use these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Recommended Rules (from firestore.rules)
The recommended rules allow users to only access their own data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read and write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Allow users to read and write their own subcollections
      match /bookings/{bookingId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      match /savedItems/{itemId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      match /itineraries/{itineraryId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // Allow public read access to destinations and other public data
    match /destinations/{document} {
      allow read: if true;
    }
    
    match /hotels/{document} {
      allow read: if true;
    }
    
    match /restaurants/{document} {
      allow read: if true;
    }
    
    match /activities/{document} {
      allow read: if true;
    }
  }
}
```

## Demo Mode
The app will automatically fall back to demo mode when Firestore permissions are blocked, showing mock data instead of real database operations.
