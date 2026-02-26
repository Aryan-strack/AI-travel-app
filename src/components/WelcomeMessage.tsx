import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SparklesIcon } from './Icons';

const WelcomeMessage = () => (
  <View style={styles.container}>
    <SparklesIcon style={styles.icon} />
    <Text style={styles.title}>Your Next Adventure Starts Here</Text>
    <Text style={styles.subtitle}>Fill in the details to generate your personalized travel plan.</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  icon: {
    width: 64,
    height: 64,
    color: '#a5b4fc',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
});

export default WelcomeMessage;