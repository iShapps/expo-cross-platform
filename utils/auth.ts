import { Hcp } from "@/data-types/auth";
import { error } from "@/utils/logger";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "authToken-ishapps";

export const setToken = async (token: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (err) {
    error("Error setting token:", err);
  }
};

export const getToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (err) {
    error("Error getting token:", err);
    return null;
  }
};

export const removeToken = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (err) {
    error("Error removing token:", err);
  }
};

export const getAvatarImageSource = (hcp: Hcp, imagePath: string) => {
  if (!hcp?.image) return undefined;
  return `${imagePath}${encodeURIComponent(
    `${hcp.hcp_prefix}${hcp.id}`,
  )}/image/${hcp.image}`;
};
