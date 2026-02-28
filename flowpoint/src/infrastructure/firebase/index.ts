import { FirebaseApp, FirebaseOptions, initializeApp } from "@firebase/app";
import { Auth, browserLocalPersistence, initializeAuth } from "@firebase/auth";

import { Functions, getFunctions } from "@firebase/functions";

import { Database, getDatabase } from "@firebase/database";
import { Firestore, getFirestore } from "@firebase/firestore";
import { FirebaseStorage, getStorage } from "@firebase/storage";
import config from "../../../../firebase-config.json";

const firebaseConfig: FirebaseOptions = config.DEV;

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