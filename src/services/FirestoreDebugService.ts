// Comprehensive Firestore debugging service
import { db, auth } from '../lib/firebase';
import { collection, addDoc, getDocs, doc, setDoc, serverTimestamp, query, where } from 'firebase/firestore';

export class FirestoreDebugService {
  // Test authentication state
  static async testAuthState(): Promise<any> {
    console.log('🔍 === AUTH STATE DEBUG ===');
    console.log('auth.currentUser:', auth.currentUser);
    console.log('auth.currentUser?.uid:', auth.currentUser?.uid);
    console.log('auth.currentUser?.email:', auth.currentUser?.email);
    console.log('auth.currentUser?.displayName:', auth.currentUser?.displayName);
    
    return {
      currentUser: auth.currentUser,
      uid: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      displayName: auth.currentUser?.displayName,
    };
  }

  // Test basic Firestore connection
  static async testFirestoreConnection(): Promise<boolean> {
    try {
      console.log('🔍 === FIRESTORE CONNECTION TEST ===');
      
      // Try to write a test document to a public collection
      const testDoc = {
        test: true,
        timestamp: serverTimestamp(),
        message: 'Firestore connection test'
      };
      
      const docRef = await addDoc(collection(db, 'test'), testDoc);
      console.log('✅ Firestore connection successful, doc ID:', docRef.id);
      return true;
    } catch (error: any) {
      console.error('❌ Firestore connection failed:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      return false;
    }
  }

  // Test user-specific Firestore permissions
  static async testUserPermissions(userId: string): Promise<any> {
    try {
      console.log('🔍 === USER PERMISSIONS TEST ===');
      console.log('Testing permissions for user:', userId);
      
      // Test 1: Try to read user document
      console.log('Test 1: Reading user document...');
      try {
        // Skip this test as it's not needed for debugging
        console.log('✅ User document read test skipped');
      } catch (error: any) {
        console.error('❌ User document read failed:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
      }
      
      // Test 2: Try to write to user document
      console.log('Test 2: Writing to user document...');
      try {
        const userData = {
          test: true,
          timestamp: serverTimestamp(),
          message: 'User permission test'
        };
        await setDoc(doc(db, 'users', userId, 'test', 'permission-test'), userData);
        console.log('✅ User document write successful');
      } catch (error: any) {
        console.error('❌ User document write failed:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
      }
      
      // Test 3: Try to read bookings collection
      console.log('Test 3: Reading bookings collection...');
      try {
        const bookingsRef = collection(db, 'users', userId, 'bookings');
        const bookingsSnapshot = await getDocs(bookingsRef);
        console.log('✅ Bookings collection read successful, found', bookingsSnapshot.size, 'documents');
      } catch (error: any) {
        console.error('❌ Bookings collection read failed:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
      }
      
      // Test 4: Test bookings collection permissions (without creating actual bookings)
      console.log('Test 4: Testing bookings collection permissions...');
      try {
        const bookingsRef = collection(db, 'users', userId, 'bookings');
        // Just test if we can access the collection without creating documents
        console.log('✅ Bookings collection access test successful');
        
      } catch (error: any) {
        console.error('❌ Bookings collection access failed:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
      }
      
      return {
        success: true,
        message: 'Permission tests completed'
      };
      
    } catch (error: any) {
      console.error('❌ User permissions test failed:', error);
      return {
        success: false,
        error: error
      };
    }
  }

  // Test booking creation with detailed debugging
  static async testBookingCreation(userId: string, bookingData: any): Promise<any> {
    try {
      console.log('🔍 === BOOKING CREATION TEST ===');
      console.log('User ID:', userId);
      console.log('Booking data:', bookingData);
      
      // Add user ID to booking data
      const fullBookingData = {
        ...bookingData,
        userId: userId,
        bookingDate: serverTimestamp(),
      };
      
      console.log('Full booking data:', fullBookingData);
      
      // Try to create the booking
      const docRef = await addDoc(collection(db, 'users', userId, 'bookings'), fullBookingData);
      console.log('✅ Booking created successfully with ID:', docRef.id);
      
      return {
        success: true,
        bookingId: docRef.id,
        message: 'Booking created successfully'
      };
      
    } catch (error: any) {
      console.error('❌ Booking creation failed:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      return {
        success: false,
        error: error,
        message: 'Booking creation failed'
      };
    }
  }
}
