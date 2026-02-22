import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";


// PROD
// const projectId = "brogrammers-crm";
// const clientEmail = "firebase-adminsdk-fbsvc@brogrammers-crm.iam.gserviceaccount.com";
// const privateKey = "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC1hx4GixoUTXDq\nU7yjnWl+HLTz0+kW0S2AeQN9qk3RMuWOerfb9hsqo/xyfawW5ZsC95yP4zQI9vBN\n7/eZhYuQj5591xCDQy/fBTdjdJglktdm9A5h+FlZpJvPBOxsfD7qdudHD4yXW7Zc\nO+9LaCwI0k6VU/reB66dOdpcizc+hI1yiBYHSd8AuRik3REPQeafprp5plSW9PHQ\nfHsgFhtp/MszZjD87sT+cMetSB2GCe9/nmx37DQKR0mQCEJbOgaJzlp7v3pQAx/J\nIKIURlVAqrAXid/W8mafto9kD8V6hOOZCEH9ZOFGPOq364DspYQh7JhxfcMwwRk5\nLZSSeEK9AgMBAAECggEAJxix09Dzzfmb3ywnzcliZiICqx0x75MfzLLDmLYsSmk+\n3b/6h2prEXT+Mx50CP5ss2fnFWpm06NzwCV121/S3lDAXvQJ/2tiDROPiWEcP8Nv\nlyHrUxhtDgyQ7jZuQTNFTbRMPZbQveynyxexgzkterzo5eqPdnCLIBvMtu/Y9yKx\n8ZVf9R+VprfTEvAlsH54NeG1eVRldvwVYI9TWShvBBwYac/YuSubn/pl/6BIrhQh\njIs9PYMdCPJBBTBseutiT62yxqJuEMw8Y3tR03Kcn/OYQWujsE4gPoyEBZTNrNRg\nrRO9VHjgwjgB4H7de5+33DQfPRlcZPAxQsFXMHnmwQKBgQDw5rJmlm+kLaPOTH5C\n2omB7DYU0auhyd1gmZvvl+cZGQFRpeojv5pBF4QqcjbUMd9vumLFHHkKQZ0QTdkr\n5gge8hFev3jXq/vrtOQAVKexmisBIKRyDahiA6WJFTymel4nP0uMjbhlZNnJY/Va\n+ZlBUvVo6sEyR052hSBPviCfTQKBgQDA58OX2qJaxqafs3Lxq3Vm0QpnZF4uocDi\nnlWejHMgoY/S5Voy6MVLDQd0/CDAY82lUcKhmCEDFDei6kRi4ThEN0TNFOyuu9q1\n7NAYlalWr54YUgkC2mU7NQSXM1UjgVH27IdAnRo+RKdggdolQFfPUK4IPPavcuCY\nT9qF9jhZMQKBgQDqAG3S0NZpOBwhzJPpBLcFiRmPZ4u8gIWVzCB4v6kv6+YoFW42\ng2unRtyPDprLzBYqRXaj2WCJ4epbaANIbQ3+YU0WKA+OD/WJpBDFcXXjQsn7MmYK\nk9G4Q6qMWiCr5bmHjigow5EWjLwwr/QpBsMjfR39Z+t6l2FUJ0SXsSunEQKBgFOt\n9eXQnK7+D1elk04MT5A7S+UP398gobhscL2nNWXJT8dvYFJHMRZeX4a6vEZYxONa\n9S/9+wwH4B6WuvWdtze4Nes0kXs22Cgkwxx3B48n/U+Vfn0zWch2NjiUtvEA7xpK\n/lzkCXdLdsPhcEzKfYzb9bJzJ5tyHMVVlniYF1dxAoGAHkGc9pwX3xchS40EstTP\nJnSuI4zusRlkDKURh2uKZmsOOUjR/eT4krQTjBU2Z2YtFyKdBmXcbKVzegGMaEYG\ngZHtSVVbFza7LsxzNfJ1TuHq88B7QY4kJPt6ML1N9gjoY6b/KSlqcA1hAF4Y4SJF\nuT+sVRZ/E5BPBbWlP7hdpec=\n-----END PRIVATE KEY-----\n"

// DEV

const projectId = "flowpoint-dev"; 
const clientEmail = "firebase-adminsdk-fbsvc@flowpoint-dev.iam.gserviceaccount.com";
const privateKey = "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDCUOqVAAkHbaeC\n3P94/Ii2+X0BhE2OnEa1ryoPBgNOqBh5fQXjQyY1nKMjSTsutfIRItBuPXNE9kT5\noJLXCeLvHFyFjDl8iET6Qj48BpUwcONPQ/9k1Js+HA8h74kUCArKUq4faPHyCP2B\niLuj+sGmXcmgmQu5Oy0cjXLjn558n+ry95/N9gCZIOLXuGEzTnsnGGYpfFZyvCvc\n+flGc1C5FHVgsQCBdrO9aYFxFVPILhrl3b8nuflD4hhjJ0MKyESCLvaHmDfrdHUO\n5dSV4c1m4oAK6FzpxTTroiBtje3FJx5HhO8fJyd/pfXwuH63zarxpdSm5CcbUCss\nE4cYDHarAgMBAAECggEAHghFiUvdGWHQPwCLF5boRmde86oQFpd+sjvlYzcJsdF3\nHue8zjgloqmX6S87T2fdhtp7nl4u/5yUYoR3zXaAtXYLsrROejnRd2BfoAVgb4Ez\nEKAwy9O0PrA1gog0Bn2LtWN79+zPYBoVnDyWy6xI276pGAIvdqx3t28BL78OzrHf\ntuAPO2xszaguE8/3nMTec4+5/WCv/riZnWxvGPcNBqDkf0rf4pevm5qeaUxqJ7H6\ng4MusdavfpV9WXlLGIvb3WOUbXIDT3Zefy/a+yU6/al/g5wGgncNyIqvpCuf71rF\npTF0jJpacnaY8HDg1M1sASrQH6RW27TrEU31+t5jOQKBgQDkWqrf9qgwynVHX4zD\nb9WBZXU3bUMoO7UZ5Zixu+7KNvDJWP+emGHgSexuGOGmxKDaf2VuVaVIU+BtfFiS\n0RpFztak7g4A+Al4J8W68g7jVlR42IEwoStUX0L3wOASWBZBTETDnuQO2PwDCesx\n+jGP1fJvegD494JYHwNfBJ7m7wKBgQDZ11BCfscldW2q4wCW2Fypx1hIKIFUCi0z\nOezUQaYqUSkT01dTq1+H3+h9UgOeWimKXWEIfGrxWqNFYIKzUBLT4VUWnBTZORTB\nELep9Ep07CxW++yKaq5xoZCQms3ADgsM2elpMXxQtpxQ5PyhivrJe9KAB7KdxhgC\nW7cIic1MBQKBgQDLdV06H3LLxheoeCHbIBGDMPq3X8quVkSNxlu+QEwKL9lqDLn0\nfKD4TeUyU0j6ZcdL5qZhID4bq2ATLO9eIKDgAeKNIO2pP1ZwkD9EydcqBwlMgtrY\nkUEh856fUGJU9dceZu39vdxEvmAL9RJxfRIbrexMFtA3A5BHI5rFVkCeUQKBgQCJ\nJHd/1Wa0m3AWdGELll0H+dsHWpDJArsgE+iYXFgrLftJYvUIVMyIsxsfwoFKsQKT\n/GO5PvLozaIabD78en3P7H1wBYVOmBQL0+V81rIFWCY2ANYS8kSufwOPNhYwQecN\nCSdcNW5JNh3FA9RUMzXdoNmOBsqZb3vwCCN7+Z1IrQKBgQCnVd8FoDTa9MHr4SMd\nv0Vr126D4gZABYaKJZUt2APne8DxS/fQCdTLZdrY/YRDIKdoCZSMXjF9hY3XWQyw\nH/V6b/nhZ2EKQ5Psg8Shkh9gqS5MTlI3vr7aNMPb/GVPVpiDsPZK140TnLXPLRu4\n0XzDVzCQlFjzkM+4zw8NzijwrQ==\n-----END PRIVATE KEY-----\n"


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
