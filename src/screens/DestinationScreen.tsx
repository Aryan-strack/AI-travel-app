import React, { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { DestinationCard } from "../components/DestinationCard";
import { ErrorDisplay } from "../components/ErrorDisplay";
import { Header } from "../components/Header";
import { ImageUploader } from "../components/ImageUploader";
import { Loader } from "../components/Loader";
import { Welcome } from "../components/Welcome";
import { identifyDestination } from "../services/destinationgeminiService";
import type { Destination } from "../types/destinationtypes";

export default function DestinationScreen() {
  const [imageFile, setImageFile] = useState<any>(null);
  const [destinationInfo, setDestinationInfo] = useState<Destination | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageSelect = (file: { uri: string; name: string; type: string }) => {
    setImageFile(file);
    setDestinationInfo(null);
    setError(null);
  };

  const resetState = () => {
    setImageFile(null);
    setDestinationInfo(null);
    setError(null);
    setIsLoading(false);
  };

  const handleSubmit = useCallback(async () => {
    if (!imageFile) {
      setError("Please select an image first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setDestinationInfo(null);

    try {
      const result = await identifyDestination(imageFile);
      setDestinationInfo(result);
    } catch (err) {
      console.error(err);
      setError("Could not identify the destination. Try another image.");
    } finally {
      setIsLoading(false);
    }
  }, [imageFile]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Header />
  <ImageUploader onImageSelect={handleImageSelect} imageDataUrl={imageFile?.uri ?? null} disabled={isLoading} />

      {imageFile && (
        <View style={styles.buttonRow}>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isLoading}
            style={[styles.primaryButton, isLoading && styles.disabledButton]}
          >
            {isLoading && <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />}
            <Text style={styles.buttonText}>{isLoading ? "Analyzing..." : "Find Destination"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={resetState}
            disabled={isLoading}
            style={[styles.secondaryButton, isLoading && styles.disabledButton]}
          >
            <Text style={styles.buttonText}>Reset</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ marginTop: 20 }}>
        {isLoading && <Loader />}
        {error && <ErrorDisplay message={error} />}
        {destinationInfo && <DestinationCard data={destinationInfo} />}
        {!isLoading && !error && !destinationInfo && !imageFile && <Welcome />}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flexGrow: 1,
    backgroundColor: "#0f172a",
    alignItems: "center",
  },
  buttonRow: {
    flexDirection: "row",
    marginTop: 20,
    gap: 12,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6366f1",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  secondaryButton: {
    backgroundColor: "#1e293b",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  disabledButton: {
    opacity: 0.6,
  },
});
