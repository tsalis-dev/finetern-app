import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const key = 'finetern_session';
let webToken = null;
export async function getToken() {
  return Platform.OS === 'web' ? webToken : SecureStore.getItemAsync(key);
}
export async function saveToken(token) {
  if (Platform.OS === 'web') webToken = token;
  else await SecureStore.setItemAsync(key, token);
}
export async function clearToken() {
  if (Platform.OS === 'web') webToken = null;
  else await SecureStore.deleteItemAsync(key);
}
