// components/ImageUploader.tsx
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface ImageUploaderProps {
  onImageSelect: (file: { uri: string; name: string; type: string }) => void;
  imageDataUrl: string | null;
  disabled: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageSelect,
  imageDataUrl,
  disabled,
}) => {
  const pickImage = async () => {
  if (disabled) return;

  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    alert("Permission required to access gallery.");
    return;
  }

 const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images, 
  allowsEditing: true,
  quality: 1,
});

  if (!result.canceled) {
    const asset = result.assets[0];

    const getMimeType = (uri: string) => {
      if (uri.endsWith(".png")) return "image/png";
      if (uri.endsWith(".webp")) return "image/webp";
      return "image/jpeg";
    };

    const file = {
      uri: asset.uri,
      name: asset.fileName || "photo.jpg",
      type: getMimeType(asset.uri), // ✅ exact MIME type
    };

    onImageSelect(file);
  }
};


  return (
    <TouchableOpacity
      style={[
        styles.container,
        disabled && { opacity: 0.6 },
        imageDataUrl && { borderColor: "#6366f1" },
      ]}
      onPress={pickImage}
      disabled={disabled}
    >
      {imageDataUrl ? (
        <View style={styles.previewWrapper}>
          <Image
            source={{ uri: imageDataUrl }}
            style={styles.previewImage}
            resizeMode="contain"
          />
          <View style={styles.overlay}>
            <Text style={styles.overlayText}>
              Tap to change image
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.placeholder}>
          <Ionicons name="cloud-upload-outline" size={48} color="#94a3b8" />
          <Text style={styles.placeholderText}>
            Tap to upload an image
          </Text>
          <Text style={styles.supported}>PNG, JPG, WEBP</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#475569", // gray-600
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    backgroundColor: "rgba(30, 41, 59, 0.5)", // gray-800/50
  },
  previewWrapper: {
    position: "relative",
    width: "100%",
    alignItems: "center",
  },
  previewImage: {
    width: "100%",
    height: 220,
    borderRadius: 12,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  overlayText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
    height: 160,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#e2e8f0", // slate-200
    marginTop: 8,
  },
  supported: {
    fontSize: 12,
    color: "#94a3b8", // slate-400
    marginTop: 4,
  },
});
