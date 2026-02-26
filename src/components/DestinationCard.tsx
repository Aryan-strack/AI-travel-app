// components/DestinationCard.tsx
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { Destination } from "../types";

interface DestinationCardProps {
  data: Destination;
}

export const DestinationCard: React.FC<DestinationCardProps> = ({ data }) => {
  return (
    <View style={styles.cardWrapper}>
      <View style={styles.card}>
        {/* Title Section */}
        <View style={styles.header}>
          <Ionicons name="location-sharp" size={28} color="#818cf8" style={styles.icon} />
          <Text style={styles.title}>{data.placeName}</Text>
        </View>

        {/* City + Country */}
        <View style={styles.locationWrapper}>
          <Text style={styles.location}>
            {data.city}, {data.country}
          </Text>
        </View>

        {/* Description */}
        <Text style={styles.description}>{data.description}</Text>

        {/* Facts */}
        <View>
          <Text style={styles.factsTitle}>Interesting Facts</Text>
          {data.interestingFacts.map((fact, index) => (
            <View key={index} style={styles.factItem}>
              <MaterialIcons name="star" size={20} color="#22d3ee" style={styles.factIcon} />
              <Text style={styles.factText}>{fact}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    backgroundColor: "linear-gradient(135deg, #6366f1, #06b6d4)", // gradient replace
    borderRadius: 16,
    padding: 2,
    marginBottom: 16,
  },
  card: {
    backgroundColor: "rgba(30, 41, 59, 0.8)", // slate-800/80
    borderRadius: 14,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  icon: {
    marginRight: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#818cf8", // indigo-400
  },
  locationWrapper: {
    paddingLeft: 40,
    marginBottom: 12,
  },
  location: {
    fontSize: 16,
    fontWeight: "500",
    color: "#94a3b8", // slate-400
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: "#cbd5e1", // slate-300
    marginBottom: 16,
  },
  factsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#e2e8f0", // slate-200
    marginBottom: 12,
  },
  factItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  factIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  factText: {
    color: "#cbd5e1", // slate-300
    flex: 1,
  },
});
