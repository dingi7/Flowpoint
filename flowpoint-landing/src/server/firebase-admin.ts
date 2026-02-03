import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const projectId = "brogrammers-crm";
const clientEmail = "firebase-adminsdk-fbsvc@brogrammers-crm.iam.gserviceaccount.com";
const privateKey = "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC1hx4GixoUTXDq\nU7yjnWl+HLTz0+kW0S2AeQN9qk3RMuWOerfb9hsqo/xyfawW5ZsC95yP4zQI9vBN\n7/eZhYuQj5591xCDQy/fBTdjdJglktdm9A5h+FlZpJvPBOxsfD7qdudHD4yXW7Zc\nO+9LaCwI0k6VU/reB66dOdpcizc+hI1yiBYHSd8AuRik3REPQeafprp5plSW9PHQ\nfHsgFhtp/MszZjD87sT+cMetSB2GCe9/nmx37DQKR0mQCEJbOgaJzlp7v3pQAx/J\nIKIURlVAqrAXid/W8mafto9kD8V6hOOZCEH9ZOFGPOq364DspYQh7JhxfcMwwRk5\nLZSSeEK9AgMBAAECggEAJxix09Dzzfmb3ywnzcliZiICqx0x75MfzLLDmLYsSmk+\n3b/6h2prEXT+Mx50CP5ss2fnFWpm06NzwCV121/S3lDAXvQJ/2tiDROPiWEcP8Nv\nlyHrUxhtDgyQ7jZuQTNFTbRMPZbQveynyxexgzkterzo5eqPdnCLIBvMtu/Y9yKx\n8ZVf9R+VprfTEvAlsH54NeG1eVRldvwVYI9TWShvBBwYac/YuSubn/pl/6BIrhQh\njIs9PYMdCPJBBTBseutiT62yxqJuEMw8Y3tR03Kcn/OYQWujsE4gPoyEBZTNrNRg\nrRO9VHjgwjgB4H7de5+33DQfPRlcZPAxQsFXMHnmwQKBgQDw5rJmlm+kLaPOTH5C\n2omB7DYU0auhyd1gmZvvl+cZGQFRpeojv5pBF4QqcjbUMd9vumLFHHkKQZ0QTdkr\n5gge8hFev3jXq/vrtOQAVKexmisBIKRyDahiA6WJFTymel4nP0uMjbhlZNnJY/Va\n+ZlBUvVo6sEyR052hSBPviCfTQKBgQDA58OX2qJaxqafs3Lxq3Vm0QpnZF4uocDi\nnlWejHMgoY/S5Voy6MVLDQd0/CDAY82lUcKhmCEDFDei6kRi4ThEN0TNFOyuu9q1\n7NAYlalWr54YUgkC2mU7NQSXM1UjgVH27IdAnRo+RKdggdolQFfPUK4IPPavcuCY\nT9qF9jhZMQKBgQDqAG3S0NZpOBwhzJPpBLcFiRmPZ4u8gIWVzCB4v6kv6+YoFW42\ng2unRtyPDprLzBYqRXaj2WCJ4epbaANIbQ3+YU0WKA+OD/WJpBDFcXXjQsn7MmYK\nk9G4Q6qMWiCr5bmHjigow5EWjLwwr/QpBsMjfR39Z+t6l2FUJ0SXsSunEQKBgFOt\n9eXQnK7+D1elk04MT5A7S+UP398gobhscL2nNWXJT8dvYFJHMRZeX4a6vEZYxONa\n9S/9+wwH4B6WuvWdtze4Nes0kXs22Cgkwxx3B48n/U+Vfn0zWch2NjiUtvEA7xpK\n/lzkCXdLdsPhcEzKfYzb9bJzJ5tyHMVVlniYF1dxAoGAHkGc9pwX3xchS40EstTP\nJnSuI4zusRlkDKURh2uKZmsOOUjR/eT4krQTjBU2Z2YtFyKdBmXcbKVzegGMaEYG\ngZHtSVVbFza7LsxzNfJ1TuHq88B7QY4kJPt6ML1N9gjoY6b/KSlqcA1hAF4Y4SJF\nuT+sVRZ/E5BPBbWlP7hdpec=\n-----END PRIVATE KEY-----\n"

// {
//   "type": "service_account",
//   "project_id": "brogrammers-crm",
//   "private_key_id": "6dc8bf1fc529244064c4344a10ca61173de9d2b6",
//   "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC1hx4GixoUTXDq\nU7yjnWl+HLTz0+kW0S2AeQN9qk3RMuWOerfb9hsqo/xyfawW5ZsC95yP4zQI9vBN\n7/eZhYuQj5591xCDQy/fBTdjdJglktdm9A5h+FlZpJvPBOxsfD7qdudHD4yXW7Zc\nO+9LaCwI0k6VU/reB66dOdpcizc+hI1yiBYHSd8AuRik3REPQeafprp5plSW9PHQ\nfHsgFhtp/MszZjD87sT+cMetSB2GCe9/nmx37DQKR0mQCEJbOgaJzlp7v3pQAx/J\nIKIURlVAqrAXid/W8mafto9kD8V6hOOZCEH9ZOFGPOq364DspYQh7JhxfcMwwRk5\nLZSSeEK9AgMBAAECggEAJxix09Dzzfmb3ywnzcliZiICqx0x75MfzLLDmLYsSmk+\n3b/6h2prEXT+Mx50CP5ss2fnFWpm06NzwCV121/S3lDAXvQJ/2tiDROPiWEcP8Nv\nlyHrUxhtDgyQ7jZuQTNFTbRMPZbQveynyxexgzkterzo5eqPdnCLIBvMtu/Y9yKx\n8ZVf9R+VprfTEvAlsH54NeG1eVRldvwVYI9TWShvBBwYac/YuSubn/pl/6BIrhQh\njIs9PYMdCPJBBTBseutiT62yxqJuEMw8Y3tR03Kcn/OYQWujsE4gPoyEBZTNrNRg\nrRO9VHjgwjgB4H7de5+33DQfPRlcZPAxQsFXMHnmwQKBgQDw5rJmlm+kLaPOTH5C\n2omB7DYU0auhyd1gmZvvl+cZGQFRpeojv5pBF4QqcjbUMd9vumLFHHkKQZ0QTdkr\n5gge8hFev3jXq/vrtOQAVKexmisBIKRyDahiA6WJFTymel4nP0uMjbhlZNnJY/Va\n+ZlBUvVo6sEyR052hSBPviCfTQKBgQDA58OX2qJaxqafs3Lxq3Vm0QpnZF4uocDi\nnlWejHMgoY/S5Voy6MVLDQd0/CDAY82lUcKhmCEDFDei6kRi4ThEN0TNFOyuu9q1\n7NAYlalWr54YUgkC2mU7NQSXM1UjgVH27IdAnRo+RKdggdolQFfPUK4IPPavcuCY\nT9qF9jhZMQKBgQDqAG3S0NZpOBwhzJPpBLcFiRmPZ4u8gIWVzCB4v6kv6+YoFW42\ng2unRtyPDprLzBYqRXaj2WCJ4epbaANIbQ3+YU0WKA+OD/WJpBDFcXXjQsn7MmYK\nk9G4Q6qMWiCr5bmHjigow5EWjLwwr/QpBsMjfR39Z+t6l2FUJ0SXsSunEQKBgFOt\n9eXQnK7+D1elk04MT5A7S+UP398gobhscL2nNWXJT8dvYFJHMRZeX4a6vEZYxONa\n9S/9+wwH4B6WuvWdtze4Nes0kXs22Cgkwxx3B48n/U+Vfn0zWch2NjiUtvEA7xpK\n/lzkCXdLdsPhcEzKfYzb9bJzJ5tyHMVVlniYF1dxAoGAHkGc9pwX3xchS40EstTP\nJnSuI4zusRlkDKURh2uKZmsOOUjR/eT4krQTjBU2Z2YtFyKdBmXcbKVzegGMaEYG\ngZHtSVVbFza7LsxzNfJ1TuHq88B7QY4kJPt6ML1N9gjoY6b/KSlqcA1hAF4Y4SJF\nuT+sVRZ/E5BPBbWlP7hdpec=\n-----END PRIVATE KEY-----\n",
//   "client_email": "firebase-adminsdk-fbsvc@brogrammers-crm.iam.gserviceaccount.com",
//   "client_id": "103230180474263089021",
//   "auth_uri": "https://accounts.google.com/o/oauth2/auth",
//   "token_uri": "https://oauth2.googleapis.com/token",
//   "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
//   "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40brogrammers-crm.iam.gserviceaccount.com",
//   "universe_domain": "googleapis.com"
// }


if (!projectId || !clientEmail || !privateKey) {
  throw new Error(
    "Missing Firebase Admin credentials. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.",
  );
}

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

export const adminFirestore = getFirestore();
