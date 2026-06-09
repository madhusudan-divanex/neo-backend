// utils/sendPush.js
import admin from "../config/firebase.js";

export const sendPush = async ({ token, title, body, data = {} }) => {
  if (!token) return;

  const message = {
    token,
    notification: { title, body, imageUrl: "https://api.neohealthcard.com:9100/uploads/assets/logo.png" },
    data
  };

  try {
    await admin.messaging().send(message);
    console.log("📲 Push sent");
  } catch (err) {
    console.error("Push error", err);
  }
};
