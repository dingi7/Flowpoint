import * as admin from "firebase-admin";
import serviceAccount from "./service-account-dev.json";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});
