// Service for managing saved/favorite items
import { db, auth } from '../lib/firebase';
import { collection, addDoc, deleteDoc, getDocs, query, where, doc } from 'firebase/firestore';
import { Hotel, Flight, Car } from '../types/api';

export interface SavedItem {
  id: string;
  type: 'hotel' | 'flight' | 'car';
  data: Hotel | Flight | Car;
  savedDate: any;
  userId: string;
}

class SavedItemsService {
  // Save an item to user's favorites
  async saveItem(item: Hotel | Flight | Car, type: 'hotel' | 'flight' | 'car', userId: string): Promise<string> {
    try {
      console.log('💾 Saving item:', type, item);
      
      const savedItemData = {
        type: type,
        data: item,
        savedDate: new Date(),
        userId: userId,
      };

      const docRef = await addDoc(collection(db, 'users', userId, 'savedItems'), savedItemData);
      console.log('✅ Item saved with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error saving item:', error);
      throw error;
    }
  }

  // Remove an item from user's favorites
  async unsaveItem(itemId: string, userId: string): Promise<void> {
    try {
      console.log('🗑️ Removing saved item:', itemId);
      
      // Find the saved item by searching through saved items
      const savedItemsRef = collection(db, 'users', userId, 'savedItems');
      const q = query(savedItemsRef, where('data.id', '==', itemId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const docToDelete = querySnapshot.docs[0];
        await deleteDoc(doc(db, 'users', userId, 'savedItems', docToDelete.id));
        console.log('✅ Item removed from favorites');
      } else {
        console.log('⚠️ Item not found in saved items');
      }
    } catch (error) {
      console.error('❌ Error removing item:', error);
      throw error;
    }
  }

  // Check if an item is saved
  async isItemSaved(itemId: string, userId: string): Promise<boolean> {
    try {
      const savedItemsRef = collection(db, 'users', userId, 'savedItems');
      const q = query(savedItemsRef, where('data.id', '==', itemId));
      const querySnapshot = await getDocs(q);
      
      return !querySnapshot.empty;
    } catch (error) {
      console.error('❌ Error checking if item is saved:', error);
      return false;
    }
  }

  // Get all saved items for a user
  async getSavedItems(userId: string): Promise<SavedItem[]> {
    try {
      console.log('📚 Loading saved items for user:', userId);
      
      const savedItemsRef = collection(db, 'users', userId, 'savedItems');
      const querySnapshot = await getDocs(savedItemsRef);
      
      const savedItems: SavedItem[] = [];
      querySnapshot.forEach((doc) => {
        savedItems.push({
          id: doc.id,
          ...doc.data(),
        } as SavedItem);
      });
      
      console.log('✅ Loaded', savedItems.length, 'saved items');
      return savedItems;
    } catch (error) {
      console.error('❌ Error loading saved items:', error);
      return [];
    }
  }
}

export const savedItemsService = new SavedItemsService();
