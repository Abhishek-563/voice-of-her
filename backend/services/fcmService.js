import admin from "firebase-admin";

let isFcmInitialized = false;

const initFcm = () => {
  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccountJson) {
      let credentials;
      if (serviceAccountJson.trim().startsWith("{")) {
        credentials = JSON.parse(serviceAccountJson);
      } else {
        // assume it is a path to a json file
        credentials = serviceAccountJson;
      }
      admin.initializeApp({
        credential: admin.credential.cert(credentials),
      });
      isFcmInitialized = true;
      console.log("Firebase Admin SDK for FCM initialized successfully.");
    } else {
      console.warn("FIREBASE_SERVICE_ACCOUNT not configured. FCM push notifications will be mocked.");
    }
  } catch (error) {
    console.error("Failed to initialize Firebase Admin SDK:", error.message);
  }
};

initFcm();

export const sendFcmPush = async (token, payload) => {
  if (!token) return;

  if (!isFcmInitialized) {
    console.log(`[FCM Mock Push] Token: ${token}, Payload:`, payload);
    return;
  }

  try {
    const message = {
      token: token,
      notification: {
        title: payload.title || "🚨 EMERGENCY SOS ALERT",
        body: payload.body || "Immediate assistance required.",
      },
      data: payload.data || {},
      android: {
        priority: "high",
        notification: {
          sound: "default",
        },
      },
      apns: {
        headers: {
          "apns-priority": "10",
        },
        payload: {
          aps: {
            sound: "default",
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log("FCM notification sent successfully:", response);
    return response;
  } catch (error) {
    console.error(`Failed to send FCM push to token ${token}:`, error.message);
  }
};
