import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthProvider';
import { useNavigation } from '@react-navigation/native';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const LoginScreen: React.FC = () => {
  const { loginWithEmail, loginWithBiometric } = useAuth();
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [hasPreviousLogin, setHasPreviousLogin] = useState(false);
  const videoRef = useRef<Video>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      await loginWithEmail(normalizedEmail, password);
      // Enable biometric for this user after a successful login
      try {
        await AsyncStorage.setItem(`biometric:enabled:${normalizedEmail}`, 'true');
        setHasPreviousLogin(true);
      } catch {}
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  // On mount, check if device supports biometrics and if user has previous login
  useEffect(() => {
    const checkBiometrics = async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        setBiometricAvailable(hasHardware && isEnrolled);

        const lastUid = await AsyncStorage.getItem('biometric:lastUid');
        setHasPreviousLogin(!!lastUid);
      } catch {}
    };
    checkBiometrics();
  }, []);

  const handleBiometricLogin = async () => {
    try {
      if (!biometricAvailable) {
        Alert.alert('Unavailable', 'Biometric authentication is not available on this device.');
        return;
      }

      // If no previous login, show message to login with email/password first
      if (!hasPreviousLogin) {
        Alert.alert(
          'First Time Setup',
          'Please login with your email and password first. After that, you can use fingerprint login for faster access.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Login with fingerprint',
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
      });
      if (result.success) {
        await loginWithBiometric();
      } else {
        Alert.alert('Authentication failed', 'Fingerprint not recognized.');
      }
    } catch (e: any) {
      Alert.alert('Biometric Error', e?.message || 'Unable to authenticate');
    }
  };

  const navigateToRegister = () => {
    // @ts-ignore
    navigation.navigate('Register');
  };

  const navigateToForgotPassword = () => {
    // @ts-ignore
    navigation.navigate('ForgotPassword');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Video Background */}
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
          console.log('Video loaded successfully');
          try { 
            await videoRef.current?.playAsync(); 
            console.log('Video started playing');
          } catch (e) {
            console.log('Video play error:', e);
          }
        }}
        onError={(e) => {
          console.log('Video error:', e);
        }}
        onPlaybackStatusUpdate={async (status: AVPlaybackStatus) => {
          if ('isLoaded' in status && status.isLoaded) {
            console.log('Video status:', status.isPlaying ? 'Playing' : 'Not playing');
            if (!status.isPlaying) {
              try { 
                await videoRef.current?.playAsync(); 
                console.log('Video restarted');
              } catch (e) {
                console.log('Video restart error:', e);
              }
            }
          }
        }}
        pointerEvents="none"
      />
      {/* Fallback Gradient in case video fails to load */}
      <LinearGradient
        colors={['#1f2937', '#111827']}
        style={styles.fallbackBackground}
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.headerArea}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
        </View>

        <View style={styles.scrollWrapper}>
          <View style={styles.inputContainer}>
            <Ionicons name="mail" size={20} color="#667eea" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed" size={20} color="#667eea" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons 
                name={showPassword ? "eye-off" : "eye"} 
                size={20} 
                color="#667eea" 
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={navigateToForgotPassword}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={loading}
          >
            <LinearGradient
              colors={loading ? ['#9ca3af', '#6b7280'] : ['#6366f1', '#8b5cf6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.loginButtonGradient}
            >
              <Text style={styles.loginButtonText}>
                {loading ? 'Signing In...' : 'Sign In'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={navigateToRegister}>
              <Text style={styles.registerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          {biometricAvailable && (
            <TouchableOpacity style={styles.biometricButton} onPress={handleBiometricLogin}>
              <Ionicons name="finger-print" size={22} color="white" />
              <Text style={styles.biometricText}>
                {hasPreviousLogin ? 'Use Fingerprint' : 'Setup Fingerprint'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  keyboardView: {
    flex: 1,
    zIndex: 2,
  },
  headerArea: {
    padding: 40,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 38,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.95)',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 19,
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.95)',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  scrollWrapper: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 30,
    justifyContent: 'flex-end',
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
    fontSize: 19,
    color: 'white',
    paddingVertical: 18,
    minHeight: 56,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  eyeIcon: {
    padding: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.95)',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 8,
  },
  loginButton: {
    marginBottom: 24,
  },
  loginButtonGradient: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 19,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  disabledButton: {
    opacity: 0.6,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.95)',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 8,
  },
  registerLink: {
    color: '#c4b5fd',
    fontSize: 17,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.95)',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 8,
  },
  biometricButton: {
    marginTop: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99,102,241,0.95)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  biometricText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
    marginLeft: 8,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
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
});