export const firebaseConfig = {
  apiKey: "REEMPLAZAR_API_KEY",
  authDomain: "REEMPLAZAR_PROJECT_ID.firebaseapp.com",
  projectId: "REEMPLAZAR_PROJECT_ID",
  storageBucket: "REEMPLAZAR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "REEMPLAZAR_SENDER_ID",
  appId: "REEMPLAZAR_APP_ID"
};

export const configured =
  !firebaseConfig.apiKey.startsWith("REEMPLAZAR");
