import SOSAlert from "../models/SOSAlert.js";
import PushSubscription from "../models/PushSubscription.js";
import User from "../models/User.js";
import webpush from "web-push";
import { sendFcmPush } from "./fcmService.js";

export const startNotificationRetryLoop = (io) => {
  if (!io) {
    console.warn("Socket.IO instance not passed to notificationRetryService. Socket re-emits will be disabled.");
  }

  console.log("Starting active SOS notification retry service loop (runs every 10s)...");

  setInterval(async () => {
    try {
      const activeAlerts = await SOSAlert.find({ status: "Active" });

      for (const alert of activeAlerts) {
        // Find recipients who have not acknowledged/resolved the alert yet
        const pendingRecipients = alert.recipients.filter(
          (r) => r.status === "Sent" || r.status === "Delivered"
        );

        if (pendingRecipients.length === 0) continue;

        console.log(
          `Alert from ${alert.name} has ${pendingRecipients.length} pending recipients. Retrying notifications...`
        );

        // 1. Re-emit Socket.IO alert targeted ONLY to pending recipients
        if (io) {
          const notifiedEmails = pendingRecipients.map((r) => r.contactEmail?.toLowerCase() || "");
          const notifiedPhones = pendingRecipients.map((r) => r.contactPhone?.replace(/[\s\-\(\)\+]/g, "") || "");

          io.emit("newSOSAlert", {
            ...alert.toObject(),
            notifiedEmails,
            notifiedPhones,
          });
        }

        // 2. Re-trigger Web Push and FCM for pending recipients
        for (const recipient of pendingRecipients) {
          const emailQuery = recipient.contactEmail ? recipient.contactEmail.toLowerCase() : "__invalid__";
          const phoneQuery = recipient.contactPhone ? recipient.contactPhone.replace(/[\s\-\(\)\+]/g, "") : "__invalid__";

          const userProfile = await User.findOne({
            $or: [{ email: emailQuery }, { phone: phoneQuery }],
          });

          if (userProfile) {
            // Send Web Push
            const subscriptions = await PushSubscription.find({ user: userProfile._id });
            const payload = JSON.stringify({
              title: "🚨 EMERGENCY SOS ALERT",
              body: `${alert.name} needs immediate help. Tap to view live location.`,
              url: `/sos-active/${alert._id}`,
              alertId: alert._id,
            });

            for (const sub of subscriptions) {
              try {
                await webpush.sendNotification(sub.subscription, payload);
              } catch (pushErr) {
                if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
                  await PushSubscription.deleteOne({ _id: sub._id });
                }
              }
            }

            // Send FCM
            if (userProfile.fcmToken) {
              await sendFcmPush(userProfile.fcmToken, {
                title: "🚨 EMERGENCY SOS ALERT",
                body: `${alert.name} needs immediate help. Tap to view live location.`,
                data: {
                  url: `/sos-active/${alert._id}`,
                  alertId: String(alert._id),
                },
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("Error in notification retry loop:", error.message);
    }
  }, 10000); // Ticks every 10 seconds
};
