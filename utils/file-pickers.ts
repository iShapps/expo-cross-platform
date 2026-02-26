import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";

export async function pickImageFromCamera() {
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.8,
  });
  if (!result.canceled && result.assets && result.assets.length > 0) {
    return result.assets[0];
  }
  return null;
}

export async function pickImageFromLibrary() {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.8,
  });
  if (!result.canceled && result.assets && result.assets.length > 0) {
    return result.assets[0];
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
    // Return the first selected file
    return result.assets[0];
  }
  return null;
}
