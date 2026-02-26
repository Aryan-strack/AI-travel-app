// components/Header.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export const Header: React.FC = () => {
  return (
    <View style={styles.header}>
      <View style={styles.container}>
        <Ionicons name="globe-outline" size={40} color="#818cf8" style={styles.icon} />
        <LinearGradient
          colors={["#818cf8", "#67e8f9"]} // from indigo-400 to cyan-300
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientTextWrapper}
        >
          <Text style={styles.title}>AI Destination Finder</Text>
        </LinearGradient>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingVertical: 12,
    backgroundColor: "rgba(17, 24, 39, 0.7)", // gray-900/70
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b", // slate-800
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 4,
  },
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    marginRight: 10,
  },
  gradientTextWrapper: {
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "transparent", // hidden, gradient will show
    backgroundColor: "transparent",
  },
});
