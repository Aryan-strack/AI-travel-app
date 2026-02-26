import React, { useState, useEffect } from 'react';
import { Button, SafeAreaView, StyleSheet, Text, TextInput, View, ScrollView, TouchableOpacity, Alert, Image, Modal, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useAuth } from '../context/AuthProvider';
import { useNavigation } from '@react-navigation/native';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const ProfileScreen: React.FC = () => {
  const { profile, logout, updatePreferences, updateUserName, resetPassword, deleteAccount } = useAuth();
  const navigation = useNavigation();
  const [saving, setSaving] = useState(false);
  const [userName, setUserName] = useState(profile?.userName ?? '');
  const [profileImage, setProfileImage] = useState<string | null>(profile?.photoURL || null);
  const [showAboutModal, setShowAboutModal] = useState(false);

  // Sync form state when profile changes
  useEffect(() => {
    setUserName(profile?.userName ?? '');
    setProfileImage(profile?.photoURL || null);
  }, [profile]);

  const pickImage = async () => {
    try {
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1.0,
        exif: false,
        base64: false,
        allowsMultipleSelection: false,
        presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your camera');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1.0,
        exif: false,
        base64: false,
        allowsMultipleSelection: false,
        presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const showImagePicker = () => {
    Alert.alert(
      'Select Profile Picture',
      'Choose how you want to add your profile picture. You can crop the image to a square after selection.',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Photo Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const onSave = async () => {
    try {
      setSaving(true);
      
      // Update user name if it has changed
      if (userName !== profile?.userName) {
        await updateUserName(userName);
      }
      
      // Update preferences (photoURL)
      const prefs = {
        photoURL: profileImage || undefined,
      };
      await updatePreferences(prefs);
      
      Alert.alert('Profile Updated', 'Your profile has been saved successfully.');
      // Force a minimal delay to allow context to propagate before navigating back
      await new Promise(res => setTimeout(res, 150));
      // Navigate back to previous screen (e.g., Dashboard)
      // @ts-ignore
      navigation.goBack?.();
    } catch (e: any) {
      Alert.alert('Save Failed', e?.message ?? 'Unable to save your profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. Are you sure you want to delete your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: deleteAccount },
      ]
    );
  };

  const handleContactUs = () => {
    Alert.alert(
      'Contact Us',
      'How would you like to contact us?',
      [
        { text: 'Email', onPress: () => Linking.openURL('mailto:bugzero.de@gmail.com') },
        { text: 'Phone', onPress: () => Linking.openURL('tel:+923027004625') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const exportTripsToPDF = async () => {
    try {
      if (!profile?.uid) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      // Show loading alert
      Alert.alert('Exporting', 'Generating PDF...', [], { cancelable: false });

      // Fetch user's bookings
      const bookingsRef = collection(db, 'users', profile.uid, 'bookings');
      const q = query(bookingsRef, orderBy('bookingDate', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const bookings = [];
      querySnapshot.forEach((doc) => {
        bookings.push({ id: doc.id, ...doc.data() });
      });

      if (bookings.length === 0) {
        Alert.alert('No Trips', 'You don\'t have any trips to export yet.');
        return;
      }

      // Generate PDF HTML
      const html = generateTripsPDFHTML(bookings, profile);
      
      // Create PDF
      const { uri } = await Print.printToFileAsync({ html });
      
      // Share the PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Export My Trips',
        });
      } else {
        Alert.alert('Success', 'PDF generated successfully!');
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      Alert.alert('Error', 'Failed to export trips. Please try again.');
    }
  };

  const generateTripsPDFHTML = (bookings: any[], userProfile: any) => {
    const currentDate = new Date().toLocaleDateString();
    const totalAmount = bookings.reduce((sum, booking) => sum + (booking.price || 0), 0);
    
    const bookingRows = bookings.map((booking, index) => {
      const bookingDate = new Date(booking.bookingDate).toLocaleDateString();
      const typeIcon = booking.type === 'flight' ? '✈️' : booking.type === 'hotel' ? '🏨' : '🚗';
      
      return `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px; text-align: center;">${index + 1}</td>
          <td style="padding: 12px;">${typeIcon} ${booking.title || 'N/A'}</td>
          <td style="padding: 12px; text-align: center;">${booking.type}</td>
          <td style="padding: 12px; text-align: center;">${bookingDate}</td>
          <td style="padding: 12px; text-align: right;">${booking.currency || 'USD'} ${booking.price || 0}</td>
        </tr>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>My Travel Trips - Export</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f8fafc;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
          }
          .header p {
            margin: 8px 0 0 0;
            opacity: 0.9;
            font-size: 16px;
          }
          .content {
            padding: 30px;
          }
          .summary {
            background: #f8fafc;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .summary-item {
            text-align: center;
          }
          .summary-number {
            font-size: 24px;
            font-weight: bold;
            color: #1f2937;
          }
          .summary-label {
            font-size: 14px;
            color: #6b7280;
            margin-top: 4px;
          }
          .table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          .table th {
            background: #f3f4f6;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            color: #374151;
            border-bottom: 2px solid #e5e7eb;
          }
          .table td {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
            color: #1f2937;
          }
          .footer {
            background: #f8fafc;
            padding: 20px 30px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            border-top: 1px solid #e5e7eb;
          }
          .total-section {
            background: #10b981;
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin-top: 20px;
            text-align: center;
          }
          .total-amount {
            font-size: 32px;
            font-weight: bold;
            margin: 0;
          }
          .total-label {
            font-size: 16px;
            opacity: 0.9;
            margin: 8px 0 0 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>My Travel Trips</h1>
            <p>Travel Summary Report - ${currentDate}</p>
          </div>
          
          <div class="content">
            <div class="summary">
              <div class="summary-item">
                <div class="summary-number">${bookings.length}</div>
                <div class="summary-label">Total Trips</div>
              </div>
              <div class="summary-item">
                <div class="summary-number">${bookings.filter(b => b.type === 'flight').length}</div>
                <div class="summary-label">Flights</div>
              </div>
              <div class="summary-item">
                <div class="summary-number">${bookings.filter(b => b.type === 'hotel').length}</div>
                <div class="summary-label">Hotels</div>
              </div>
              <div class="summary-item">
                <div class="summary-number">${bookings.filter(b => b.type === 'car').length}</div>
                <div class="summary-label">Cars</div>
              </div>
            </div>

            <h2 style="color: #1f2937; margin-bottom: 20px;">Trip Details</h2>
            <table class="table">
              <thead>
                <tr>
                  <th style="text-align: center;">#</th>
                  <th>Trip</th>
                  <th style="text-align: center;">Type</th>
                  <th style="text-align: center;">Date</th>
                  <th style="text-align: right;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${bookingRows}
              </tbody>
            </table>

            <div class="total-section">
              <h2 class="total-amount">$${totalAmount.toLocaleString()}</h2>
              <p class="total-label">Total Spent on Travel</p>
            </div>
          </div>
          
          <div class="footer">
            <p>Generated on ${currentDate} by Smart Travel Planner</p>
            <p>User: ${userProfile.userName || userProfile.email || 'Traveler'}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.profileInfo}>
            <TouchableOpacity style={styles.avatarContainer} onPress={showImagePicker}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.avatar} />
              ) : (
                <View style={styles.avatar}>
                  <Ionicons name="person" size={40} color="white" />
                </View>
              )}
              <View style={styles.cameraIcon}>
                <Ionicons name="camera" size={16} color="white" />
              </View>
            </TouchableOpacity>
            <Text style={styles.userName}>{profile?.userName || profile?.email || 'Traveler'}</Text>
            <Text style={styles.userSubtitle}>Travel Enthusiast</Text>
          </View>
        </LinearGradient>

        {/* Profile Info Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>User Name</Text>
              <TextInput 
                placeholder="Enter your name" 
                value={userName} 
                onChangeText={setUserName} 
                style={styles.input} 
              />
            </View>
            
            <TouchableOpacity style={styles.saveButton} onPress={onSave} disabled={saving}>
              <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Profile'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Contact Us Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.actionButton} onPress={handleContactUs}>
              <View style={styles.actionLeft}>
                <Ionicons name="mail" size={20} color="#ef4444" />
                <View style={styles.actionTextContainer}>
                  <Text style={styles.actionText}>Get in Touch</Text>
                  <Text style={styles.actionSubtext}>Email: bugzero.de@gmail.com</Text>
                  <Text style={styles.actionSubtext}>Phone: +923027004625</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>

        {/* About Us Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Us</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.actionButton} onPress={() => setShowAboutModal(true)}>
              <View style={styles.actionLeft}>
                <Ionicons name="information-circle" size={20} color="#6366f1" />
                <View style={styles.actionTextContainer}>
                  <Text style={styles.actionText}>Learn More</Text>
                  <Text style={styles.actionSubtext}>About Smart Travel Planner</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.actionButton} onPress={exportTripsToPDF}>
              <View style={styles.actionLeft}>
                <Ionicons name="download" size={20} color="#10b981" />
                <Text style={styles.actionText}>Export My Trips (PDF)</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
              <View style={styles.actionLeft}>
                <Ionicons name="log-out" size={20} color="#f59e0b" />
                <Text style={styles.actionText}>Logout</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.actionButton, styles.dangerButton]} onPress={handleDeleteAccount}>
              <View style={styles.actionLeft}>
                <Ionicons name="trash" size={20} color="#ef4444" />
                <Text style={[styles.actionText, styles.dangerText]}>Delete Account</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* About Us Modal */}
      <Modal visible={showAboutModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>About Smart Travel Planner</Text>
            <TouchableOpacity onPress={() => setShowAboutModal(false)}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.aboutContent}>
              <Text style={styles.aboutVersion}>Version 1.0.0</Text>
              <Text style={styles.aboutDescription}>
                Smart Travel Planner is your ultimate companion for planning and managing your travel adventures. 
                From booking flights and hotels to organizing your itinerary, we make travel planning simple and enjoyable.
              </Text>
              <Text style={styles.aboutFeatures}>Key Features:</Text>
              <Text style={styles.aboutFeatureItem}>• AI-powered travel suggestions</Text>
              <Text style={styles.aboutFeatureItem}>• Smart booking management</Text>
              <Text style={styles.aboutFeatureItem}>• Travel library and resources</Text>
              <Text style={styles.aboutFeatureItem}>• Expense tracking and budgeting</Text>
              <Text style={styles.aboutFeatureItem}>• PDF export for trip records</Text>
              <Text style={styles.aboutCopyright}>
                © 2024 Smart Travel Planner. All rights reserved.
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  profileInfo: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  userSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  saveButton: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  actionTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  actionSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  dangerButton: {
    borderBottomWidth: 0,
  },
  dangerText: {
    color: '#ef4444',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: 'white',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  // About Modal Styles
  aboutContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  aboutVersion: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  aboutDescription: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 20,
  },
  aboutFeatures: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  aboutFeatureItem: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    marginLeft: 8,
  },
  aboutCopyright: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
});


