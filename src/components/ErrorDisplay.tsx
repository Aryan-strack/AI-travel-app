// components/ErrorDisplay.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface ErrorDisplayProps {
  message: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message }) => {
  return (
    <View style={styles.alert}>
      <Ionicons name="alert-circle" size={24} color="#fca5a5" style={styles.icon} />
      <View style={styles.textWrapper}>
        <Text style={styles.bold}>Oops! </Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  alert: {
    backgroundColor: "rgba(127, 29, 29, 0.5)", // red-900/50
    borderWidth: 1,
    borderColor: "#b91c1c", // red-700
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: 12,
  },
  textWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  bold: {
    fontWeight: "bold",
    color: "#fca5a5", // red-300
  },
  message: {
    color: "#fca5a5",
    fontSize: 14,
  },
});
