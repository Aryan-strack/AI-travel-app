import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SearchTabsProps {
  activeTab: 'flights' | 'hotels' | 'cars';
  onTabChange: (tab: 'flights' | 'hotels' | 'cars') => void;
}

export const SearchTabs: React.FC<SearchTabsProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { key: 'flights' as const, label: 'Flights', icon: 'airplane' },
    { key: 'hotels' as const, label: 'Hotels', icon: 'bed' },
    { key: 'cars' as const, label: 'Cars', icon: 'car' },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.tab,
            activeTab === tab.key && styles.activeTab
          ]}
          onPress={() => onTabChange(tab.key)}
        >
          <View style={[
            styles.iconContainer,
            activeTab === tab.key && styles.activeIconContainer
          ]}>
            <Ionicons
              name={tab.icon as any}
              size={20}
              color={activeTab === tab.key ? '#667eea' : '#999'}
            />
          </View>
          <Text style={[
            styles.tabText,
            activeTab === tab.key && styles.activeTabText
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 16,
    padding: 6,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: '#f0f2ff',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  activeIconContainer: {
    backgroundColor: '#e0e7ff',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },
  activeTabText: {
    color: '#667eea',
  },
});
