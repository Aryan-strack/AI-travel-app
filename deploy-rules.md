# Firestore Rules Deployment

## Current Rules
The Firestore rules have been updated to allow proper access to user bookings. Here are the rules that should be deployed:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read and write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Allow authenticated users to read and write their own subcollections
      match /{subcollection=**} {
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

## How to Deploy

1. **Via Firebase Console:**
   - Go to Firebase Console
   - Select your project
   - Go to Firestore Database
   - Click on "Rules" tab
   - Replace the existing rules with the above rules
   - Click "Publish"

2. **Via Firebase CLI:**
   ```bash
   firebase deploy --only firestore:rules
   ```

## What These Rules Do

- **User Documents**: Users can read/write their own user document
- **Subcollections**: Users can read/write their own subcollections (bookings, savedItems, itineraries)
- **Public Data**: Anyone can read destinations, hotels, restaurants, activities
- **Security**: Only authenticated users can access their own data

## Testing

After deploying the rules, test the booking functionality:
1. Try to book a hotel
2. Check the console logs for detailed debugging information
3. Verify that bookings appear in "My Trips" page
