import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

const InputField = ({
  id,
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  keyboardType = 'default',
}: {
  id: string;
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  icon: React.ReactNode;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
}) => (
  <View style={styles.container}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputContainer}>
      <View style={styles.iconContainer}>
        {icon}
      </View>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    height: 40,
  },
  iconContainer: {
    paddingLeft: 12,
    paddingRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 8,
    paddingRight: 12,
  },
});

export default InputField;