import { FirebaseApp, FirebaseOptions, initializeApp } from "@firebase/app";
import { Auth, browserLocalPersistence, initializeAuth } from "@firebase/auth";

import { Functions, getFunctions } from "@firebase/functions";

import { Database, getDatabase } from "@firebase/database";
import { Firestore, getFirestore } from "@firebase/firestore";
import { FirebaseStorage, getStorage } from "@firebase/storage";


const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyBNjPUKWIlGjFAgeoqoDpfTAiuxwPqOnVg",
  authDomain: "flowpoint-dev.firebaseapp.com",
  projectId: "flowpoint-dev",
  storageBucket: "flowpoint-dev.firebasestorage.app",
  messagingSenderId: "989467212222",
  appId: "1:989467212222:web:03c7ea79c5e9beb69021ef",
  measurementId: "G-TK0SRRS9DM",
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
