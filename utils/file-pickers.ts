import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { ensureWithinUploadLimit } from "./compress-file";

export class PermissionDeniedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PermissionDeniedError";
  }
}

async function ensureCameraPermission(): Promise<void> {
  const current = await ImagePicker.getCameraPermissionsAsync();
  if (current.granted) return;
  if (!current.canAskAgain) {
    throw new PermissionDeniedError(
      "Camera access is turned off for this app. Enable it in Settings to take a photo.",
    );
  }
  const requested = await ImagePicker.requestCameraPermissionsAsync();
  if (!requested.granted) {
    throw new PermissionDeniedError(
      "Camera access is required to take a photo.",
    );
  }
}

async function ensureLibraryPermission(): Promise<void> {
  const current = await ImagePicker.getMediaLibraryPermissionsAsync();
  if (current.granted) return;
  if (!current.canAskAgain) {
    throw new PermissionDeniedError(
      "Photo library access is turned off for this app. Enable it in Settings to choose a photo.",
    );
  }
  const requested = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!requested.granted) {
    throw new PermissionDeniedError(
      "Photo library access is required to choose a photo.",
    );
  }
}

export async function pickImageFromCamera() {
  await ensureCameraPermission();
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    quality: 0.8,
  });
  if (!result.canceled && result.assets && result.assets.length > 0) {
    return ensureWithinUploadLimit(result.assets[0]);
  }
  return null;
}

export async function pickImageFromLibrary() {
  await ensureLibraryPermission();
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    quality: 0.8,
  });
  if (!result.canceled && result.assets && result.assets.length > 0) {
    return ensureWithinUploadLimit(result.assets[0]);
  }
  return null;
}

export async function pickDocument() {
  const result = await DocumentPicker.getDocumentAsync({
    type: "*/*",
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (!result.canceled && result.assets && result.assets.length > 0) {
    const asset = result.assets[0];
    const file = new File(asset.uri);
    return ensureWithinUploadLimit({
      name: asset.name,
      uri: file.uri,
      mimeType: asset.mimeType,
      size: asset.size,
    });
  }
  return null;
}
