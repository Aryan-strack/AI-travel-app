import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  Dimensions,
  SafeAreaView,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthProvider';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export const ForgotPasswordScreen: React.FC = () => {
  const { resetPassword } = useAuth();
  const videoRef = useRef<Video>(null);
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email.trim());
      Alert.alert(
        'Success', 
        'Password reset email sent! Please check your inbox and follow the instructions.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Travel Video Background */}
      <Video
        source={require('../../assets/videos/1.mp4')}
        style={styles.video}
        shouldPlay={true}
        isLooping={true}
        isMuted={true}
        resizeMode={ResizeMode.COVER}
        useNativeControls={false}
        ref={videoRef}
        rate={1.0}
        volume={1.0}
        onLoad={async () => {
          console.log('ForgotPassword video loaded');
          try { 
            await videoRef.current?.playAsync(); 
            console.log('ForgotPassword video started');
          } catch (e) {
            console.log('ForgotPassword video play error:', e);
          }
        }}
        onPlaybackStatusUpdate={async (status: AVPlaybackStatus) => {
          if ('isLoaded' in status && status.isLoaded) {
            console.log('ForgotPassword video status:', status.isPlaying ? 'Playing' : 'Not playing');
            if (!status.isPlaying) {
              try { 
                await videoRef.current?.playAsync(); 
                console.log('ForgotPassword video restarted');
              } catch (e) {
                console.log('ForgotPassword video restart error:', e);
              }
            }
          }
        }}
        onError={(error) => {
          console.log('ForgotPassword video error:', error);
          setVideoError(true);
        }}
        pointerEvents="none"
      />

      {/* Fallback Background */}
      <LinearGradient
        colors={['#6366f1', '#8b5cf6']}
        style={styles.fallbackBackground}
      />

      {/* Overlay */}
      <LinearGradient
        colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)']}
        style={styles.overlay}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reset Password</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="lock-closed" size={64} color="rgba(255,255,255,0.9)" />
          </View>
          
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>
            Don't worry! Enter your email address and we'll send you a link to reset your password.
          </Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail" size={20} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
              <TextInput
                placeholder="Enter your email"
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity 
              style={[styles.resetButton, loading && styles.disabledButton]} 
              onPress={handleResetPassword}
              disabled={loading}
            >
              <LinearGradient
                colors={loading ? ['#9ca3af', '#6b7280'] : ['#f59e0b', '#f97316']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backToLogin}>
              <Text style={styles.backToLoginText}>
                Remember your password? <Text style={styles.backToLoginLink}>Back to Login</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
    opacity: 1,
  },
  fallbackBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: -1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  safeArea: {
    flex: 1,
    zIndex: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.95)',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 8,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.95)',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 40,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.95)',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 8,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: 18,
    marginBottom: 22,
    paddingHorizontal: 22,
    paddingVertical: Platform.OS === 'ios' ? 8 : 12,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    color: 'white',
    fontSize: 19,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  resetButton: {
    marginBottom: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonGradient: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  backToLogin: {
    alignItems: 'center',
  },
  backToLoginText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.95)',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 8,
  },
  backToLoginLink: {
    color: '#c4b5fd',
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.95)',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 8,
  },
});
