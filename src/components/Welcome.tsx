// components/Welcome.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export const Welcome: React.FC = () => {
  return (
    <View style={styles.container}>
      <Ionicons
        name="globe-outline"
        size={64}
        color="#818cf8"
        style={styles.icon}
      />
      <Text style={styles.title}>Welcome to the Destination Finder</Text>
      <Text style={styles.subtitle}>
        Have a photo of a famous landmark or a beautiful landscape? {"\n"}
        Upload it and let our AI tell you all about it!
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    padding: 24,
    backgroundColor: "rgba(30, 41, 59, 0.6)", // slate-800/60
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155", // slate-700
    marginTop: 20,
  },
  icon: {
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#cbd5e1", // slate-300
    textAlign: "center",
    lineHeight: 22,
  },
});
