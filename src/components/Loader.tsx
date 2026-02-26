// components/Loader.tsx
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

const messages = [
  "Scanning horizons...",
  "Identifying landmarks...",
  "Consulting world atlases...",
  "Cross-referencing satellite data...",
  "Uncovering interesting facts...",
];

export const Loader: React.FC = () => {
  const [message, setMessage] = useState(messages[0]);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % messages.length;
      setMessage(messages[index]);
    }, 2000);

    setMessage(messages[0]);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#818cf8" />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  message: {
    marginTop: 12,
    fontSize: 16,
    color: "#cbd5e1", // slate-300
    textAlign: "center",
  },
});
