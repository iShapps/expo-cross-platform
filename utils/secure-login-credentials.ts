import * as SecureStore from "expo-secure-store";

const EMAIL_KEY = "ishapps_email";
const PASSWORD_KEY = "ishapps_password";

export async function saveLoginCredentials(email: string, password: string) {
  await SecureStore.setItemAsync(EMAIL_KEY, email);
  await SecureStore.setItemAsync(PASSWORD_KEY, password);
}

export async function getLoginCredentials() {
  const email = await SecureStore.getItemAsync(EMAIL_KEY);
  const password = await SecureStore.getItemAsync(PASSWORD_KEY);

  return { email, password };
}

export async function clearLoginCredentials() {
  await SecureStore.deleteItemAsync(EMAIL_KEY);
  await SecureStore.deleteItemAsync(PASSWORD_KEY);
}
