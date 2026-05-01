import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyDyNkk3BuofXAHyrPCYPm6XRpJp4_zsOrI",
  authDomain: "falou-app.firebaseapp.com",
  projectId: "falou-app",
  storageBucket: "falou-app.firebasestorage.app",
  messagingSenderId: "294883976776",
  appId: "1:294883976776:web:f72bada4d65ea5c2831a7d"
};

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
const db = getFirestore(app);

export { auth, db };
