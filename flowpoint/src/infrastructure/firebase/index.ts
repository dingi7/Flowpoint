import { FirebaseApp, FirebaseOptions, initializeApp } from "@firebase/app";
import { Auth, browserLocalPersistence, initializeAuth } from "@firebase/auth";

import { Functions, getFunctions } from "@firebase/functions";

import { Database, getDatabase } from "@firebase/database";
import { Firestore, getFirestore } from "@firebase/firestore";
import { FirebaseStorage, getStorage } from "@firebase/storage";

const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyCm8OdIao7dLe8G2XwZrlPQ7SgeOgXS-DU",
  authDomain: "brogrammers-crm.firebaseapp.com",
  projectId: "brogrammers-crm",
  storageBucket: "brogrammers-crm.firebasestorage.app",
  messagingSenderId: "922559053217",
  appId: "1:922559053217:web:f134c319d6ef1de02d1fe0",
  measurementId: "G-YGWVLDZFS6",
};

const app = initializeApp(firebaseConfig);

export type Firebase = {
  app: FirebaseApp;
  auth: Auth;
  database: Database;
  firestore: Firestore;
  functions: Functions;
  storage: FirebaseStorage;
};

export const firebase: Firebase = {
  app,
  auth: initializeAuth(app, {
    persistence: browserLocalPersistence,
  }),
  database: getDatabase(app),
  firestore: getFirestore(app),
  functions: getFunctions(app),
  storage: getStorage(app),
};

export const projectId = firebaseConfig.projectId;

// connectFunctionsEmulator(firebase.functions, "localhost", 5001);