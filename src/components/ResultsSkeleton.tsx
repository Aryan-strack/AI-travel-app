import React from 'react';
import { StyleSheet, View } from 'react-native';

const ResultsSkeleton = () => (
  <View style={styles.container}>
    <View style={styles.titlePlaceholder} />
    <View style={styles.subtitlePlaceholder} />
    
    <View style={styles.visualsPlaceholder}>
      <View style={styles.imagePlaceholder} />
      <View style={styles.imagePlaceholder} />
    </View>
    
    <View style={styles.itineraryTitlePlaceholder} />
    
    <View style={styles.dayPlaceholder}>
      <View style={styles.dayTitlePlaceholder} />
      <View style={styles.activityPlaceholder} />
      <View style={styles.activityPlaceholder} />
    </View>
    
    <View style={styles.dayPlaceholder}>
      <View style={styles.dayTitlePlaceholder} />
      <View style={styles.activityPlaceholder} />
      <View style={styles.activityPlaceholder} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    gap: 24,
  },
  titlePlaceholder: {
    height: 32,
    width: '75%',
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
  },
  subtitlePlaceholder: {
    height: 16,
    width: '50%',
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
  },
  visualsPlaceholder: {
    flexDirection: 'row',
    gap: 16,
    height: 200,
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
  },
  itineraryTitlePlaceholder: {
    height: 28,
    width: '33%',
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
  },
  dayPlaceholder: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 16,
    gap: 12,
  },
  dayTitlePlaceholder: {
    height: 20,
    width: '25%',
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
  },
  activityPlaceholder: {
    height: 16,
    width: '100%',
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
  },
});

export default ResultsSkeleton;