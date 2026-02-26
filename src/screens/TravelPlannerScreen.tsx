import React, { useCallback, useState } from "react";
import {
  Button,
  Image,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { CalendarIcon, LocationIcon, SparklesIcon } from "../components/Icons";
import InputField from "../components/InputField";
import ResultsSkeleton from "../components/ResultsSkeleton";
import WelcomeMessage from "../components/WelcomeMessage";
import {
  generateDestinationImage,
  generateTravelPlan,
} from "../services/geminiService";
import type { TravelPlan } from "../types/types";

export default function TravelPlannerScreen() {
  const [destination, setDestination] = useState("");
  const [duration, setDuration] = useState("7");
  const [interests, setInterests] = useState("");

  const [plan, setPlan] = useState<TravelPlan | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [mapUrl, setMapUrl] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    if (!destination || !duration || !interests) {
      setError("Please fill out all fields to generate a plan.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setPlan(null);
    setImageUrl(null);
    setMapUrl(null);

    try {
      const generatedPlan = await generateTravelPlan(
        destination,
        duration,
        interests
      );
      setPlan(generatedPlan);

      // Construct map URL after getting plan details
      const query = `${generatedPlan.destinationName}, ${generatedPlan.country}`;
      setMapUrl(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          query
        )}`
      );

      // Generate image in parallel
      const generatedImageUrl = await generateDestinationImage(
        generatedPlan.destinationName,
        generatedPlan.country
      );
      setImageUrl(generatedImageUrl);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [destination, duration, interests]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <SparklesIcon style={styles.headerIcon} />
          <Text style={styles.headerText}>AI Travel Planner</Text>
        </View>

        <View style={styles.main}>
          <View style={styles.formSection}>
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>Craft Your Perfect Trip</Text>
              <Text style={styles.formSubtitle}>
                Tell us your travel dreams, and we'll make them a reality.
              </Text>

              <InputField
                id="destination"
                label="Destination"
                value={destination}
                onChangeText={setDestination}
                placeholder="e.g., London, England"
                icon={<LocationIcon style={styles.inputIcon} />}
              />

              <InputField
                id="duration"
                label="Duration (in days)"
                value={duration}
                onChangeText={setDuration}
                placeholder="e.g., 7"
                keyboardType="numeric"
                icon={<CalendarIcon style={styles.inputIcon} />}
              />

              <InputField
                id="interests"
                label="Interests & Vibe"
                value={interests}
                onChangeText={setInterests}
                placeholder="e.g., Culture, Food, Nature, History, Modern Art"
                icon={<SparklesIcon style={styles.inputIcon} />}
              />

              <Button
                title={isLoading ? "Generating..." : "Generate Plan"}
                onPress={handleSubmit}
                disabled={isLoading}
                color="#4f46e5"
              />
            </View>
          </View>

          <View style={styles.resultsSection}>
            <View style={styles.resultsContainer}>
              {isLoading && <ResultsSkeleton />}

              {error && !isLoading && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>
                    Oops! Something went wrong.
                  </Text>
                  <Text style={styles.errorMessage}>{error}</Text>
                </View>
              )}

              {!isLoading && !error && !plan && <WelcomeMessage />}

              {!isLoading && !error && plan && (
                <View style={styles.planContainer}>
                  <Text style={styles.destinationTitle}>
                    {plan.destinationName}
                  </Text>
                  <Text style={styles.destinationSubtitle}>
                    Your personalized {plan.itinerary.length}-day adventure
                    awaits.
                  </Text>

                  {/* Visuals: Image and Map */}
                  <View style={styles.visualsContainer}>
                    {imageUrl ? (
                      <Image
                        source={{ uri: imageUrl }}
                        style={styles.image}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.imagePlaceholder}>
                        <LocationIcon style={styles.placeholderIcon} />
                      </View>
                    )}

                    {mapUrl ? (
                      <Button
                        title="Open in Google Maps"
                        color="#4f46e5"
                        onPress={() => Linking.openURL(mapUrl)}
                      />
                    ) : (
                      <View style={styles.mapPlaceholder}>
                        <LocationIcon style={styles.placeholderIcon} />
                      </View>
                    )}
                  </View>

                  {/* Itinerary */}
                  <View style={styles.itineraryContainer}>
                    <Text style={styles.itineraryTitle}>Daily Itinerary</Text>
                    <View style={styles.daysContainer}>
                      {plan.itinerary.map((day) => (
                        <View key={day.day} style={styles.dayContainer}>
                          <Text style={styles.dayTitle}>
                            Day {day.day}: {day.title}
                          </Text>
                          <View style={styles.activitiesContainer}>
                            {day.activities.map((activity, index) => (
                              <View
                                key={index}
                                style={styles.activityContainer}
                              >
                                <Text style={styles.activityTime}>
                                  {activity.time}
                                </Text>
                                <Text style={styles.activityDescription}>
                                  {activity.description}
                                </Text>
                              </View>
                            ))}
                          </View>
                          <View style={styles.foodContainer}>
                            <Text style={styles.foodLabel}>🍽️ Food Spot:</Text>
                            <Text style={styles.foodText}>
                              <Text style={styles.foodName}>
                                {day.foodSuggestion.name}
                              </Text>{" "}
                              - {day.foodSuggestion.description}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginTop: 20,
  },
  headerIcon: {
    width: 32,
    height: 32,
    color: "#4f46e5",
    marginRight: 12,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
  },
  main: {
    flex: 1,
    padding: 16,
  },
  formSection: {
    marginBottom: 16,
  },
  formContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 16,
  },
  inputIcon: {
    width: 20,
    height: 20,
    color: "#94a3b8",
  },
  resultsSection: {
    flex: 1,
  },
  resultsContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    minHeight: 600,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#dc2626",
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: "#b91c1c",
    textAlign: "center",
  },
  planContainer: {
    gap: 24,
  },
  destinationTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1e293b",
  },
  destinationSubtitle: {
    fontSize: 16,
    color: "#475569",
  },
  visualsContainer: {
    flexDirection: "column",
    gap: 16,
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    backgroundSize: "cover",
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: "#e2e8f0",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  map: {
    width: "100%",
    height: 200,
    borderRadius: 8,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: "#e2e8f0",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderIcon: {
    width: 40,
    height: 40,
    color: "#94a3b8",
  },
  itineraryContainer: {
    gap: 16,
  },
  itineraryTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
  },
  daysContainer: {
    gap: 16,
  },
  dayContainer: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 16,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4f46e5",
    marginBottom: 12,
  },
  activitiesContainer: {
    gap: 12,
    marginBottom: 12,
  },
  activityContainer: {
    flexDirection: "row",
    gap: 8,
  },
  activityTime: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748b",
    width: 80,
  },
  activityDescription: {
    fontSize: 14,
    color: "#334155",
    flex: 1,
  },
  foodContainer: {
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 12,
    flexDirection: "row",
    gap: 8,
  },
  foodLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748b",
  },
  foodText: {
    fontSize: 14,
    color: "#334155",
    flex: 1,
  },
  foodName: {
    fontWeight: "600",
  },
});
