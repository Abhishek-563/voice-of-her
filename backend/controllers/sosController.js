import SOSAlert from "../models/SOSAlert.js";
import Contact from "../models/Contact.js";
import User from "../models/User.js";
import PushSubscription from "../models/PushSubscription.js";
import webpush from "web-push";
import { sendFcmPush } from "../services/fcmService.js";
import {
  sendEmergencyEmail,
  sendEvidenceFollowUpEmail,
} from "../services/emailService.js";
import { sendEmergencySMS } from "../services/smsService.js";

export const sendSOS = async (req, res) => {
  try {
    const { latitude, longitude, address, evidenceUrl, name, email } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        message: "Latitude and longitude are required",
      });
    }

    const contacts = await Contact.find({ user: req.user._id });

    const recipients = contacts.map(c => ({
      contactName: c.name,
      contactEmail: c.email || "",
      contactPhone: c.phone || "",
      status: "Sent",
      deliveredAt: new Date()
    }));

    const alert = await SOSAlert.create({
      user: req.user?._id,
      name: req.user?.name || name || "Unknown User",
      email: req.user?.email || email || "",
      latitude,
      longitude,
      address: address || "Location address not available",
      evidenceUrl: evidenceUrl || "",
      emailStatus: "Pending",
      smsStatus: "Pending",
      evidenceStatus: evidenceUrl ? "Uploaded" : "Not uploaded",
      recipients,
    });

    const io = req.app.get("io");

    if (io) {
      io.emit("newSOSAlert", {
        ...alert.toObject(),
        notifiedEmails: contacts.map(c => c.email ? c.email.toLowerCase() : ""),
        notifiedPhones: contacts.map(c => c.phone ? c.phone.replace(/[\s\-\(\)\+]/g, "") : "")
      });
    }

    res.status(201).json({
      message: "SOS alert created. Emails and SMS are being sent.",
      alert,
      contactsNotified: contacts.length,
    });

    setImmediate(async () => {
      let emailSentCount = 0;
      let emailFailedCount = 0;
      let smsSentCount = 0;
      let smsFailedCount = 0;

      // 1. Send Email & SMS to contacts
      for (const contact of contacts) {
        if (contact.email) {
          try {
            await sendEmergencyEmail({
              to: contact.email,
              contactName: contact.name,
              userName: alert.name,
              userEmail: alert.email,
              latitude,
              longitude,
              address: address || "Live GPS location",
              evidenceUrl: evidenceUrl || "",
              alertTime: new Date().toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
              }),
              alertId: alert._id,
            });

            emailSentCount++;
          } catch (emailError) {
            emailFailedCount++;
            console.log(
              `Failed to send SOS email to ${contact.email}:`,
              emailError.message
            );
          }
        }

        if (contact.phone) {
          try {
            const smsMessage = await sendEmergencySMS({
              to: contact.phone,
              contactName: contact.name,
              userName: alert.name,
              latitude,
              longitude,
              address: address || "Live GPS location",
              evidenceUrl: evidenceUrl || "",
              alertId: alert._id,
            });

            if (smsMessage) {
              smsSentCount++;
            }
          } catch (smsError) {
            smsFailedCount++;
            console.log(
              `Failed to send SOS SMS to ${contact.phone}:`,
              smsError.message
            );
          }
        }
      }

      // 2. Send Web Push Notifications to registered contact users and admins
      try {
        const contactEmails = contacts.map(c => c.email ? c.email.toLowerCase() : "").filter(Boolean);
        const contactPhones = contacts.map(c => c.phone ? c.phone.replace(/[\s\-\(\)\+]/g, "") : "").filter(Boolean);

        let targetUserIds = [];
        if (contactEmails.length > 0 || contactPhones.length > 0) {
          // Find matching users in database
          const matchingUsers = await User.find({
            $or: [
              { email: { $in: contactEmails } },
              { phone: { $in: contactPhones } }
            ]
          });
          targetUserIds = matchingUsers.map(u => u._id);
        }

        // Include admin users in recipient list
        const adminUsers = await User.find({ role: "admin" });
        const adminUserIds = adminUsers.map(u => u._id);

        const allRecipientUserIds = [...new Set([...targetUserIds, ...adminUserIds])];

        if (allRecipientUserIds.length > 0) {
          // 2.1 Send Web Push Notifications
          const subscriptions = await PushSubscription.find({
            user: { $in: allRecipientUserIds }
          });

          const webPushPayload = JSON.stringify({
            title: "🚨 EMERGENCY SOS ALERT",
            body: `${alert.name} needs immediate help. Tap to view live location.`,
            url: `/sos-active/${alert._id}`,
            alertId: alert._id
          });

          console.log(`Found ${subscriptions.length} Web Push subscriptions. Dispatching...`);

          for (const sub of subscriptions) {
            try {
              await webpush.sendNotification(sub.subscription, webPushPayload);
            } catch (pushError) {
              if (pushError.statusCode === 410 || pushError.statusCode === 404) {
                await PushSubscription.deleteOne({ _id: sub._id });
              }
            }
          }

          // 2.2 Send Firebase Cloud Messaging (FCM) Notifications
          const matchingUsersWithToken = await User.find({
            _id: { $in: allRecipientUserIds },
            fcmToken: { $exists: true, $ne: "" }
          });

          console.log(`Found ${matchingUsersWithToken.length} users with FCM tokens. Dispatching FCM push...`);

          for (const recipientUser of matchingUsersWithToken) {
            await sendFcmPush(recipientUser.fcmToken, {
              title: "🚨 EMERGENCY SOS ALERT",
              body: `${alert.name} needs immediate help. Tap to view live location.`,
              data: {
                url: `/sos-active/${alert._id}`,
                alertId: String(alert._id),
              }
            });
          }
        }
      } catch (pushGeneralError) {
        console.error("General error dispatching Web Push/FCM Notifications:", pushGeneralError.message);
      }

      alert.emailStatus =
        emailSentCount > 0 ? "Sent" : emailFailedCount > 0 ? "Failed" : "Pending";

      alert.smsStatus =
        smsSentCount > 0 ? "Sent" : smsFailedCount > 0 ? "Failed" : "Skipped";

      await alert.save();

      const io = req.app.get("io");
      if (io) {
        io.emit("sosStatusUpdated", alert);
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to send SOS alert",
      error: error.message,
    });
  }
};

export const getSOSHistory = async (req, res) => {
  try {
    const alerts = await SOSAlert.find()
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json(alerts);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch SOS history",
      error: error.message,
    });
  }
};

export const updateSOSStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = ["Active", "Resolved"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status value",
      });
    }

    const alert = await SOSAlert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({
        message: "SOS alert not found",
      });
    }

    alert.status = status;
    await alert.save();

    const io = req.app.get("io");

    if (io) {
      io.emit("sosStatusUpdated", alert);
    }

    res.json({
      message: "SOS status updated",
      alert,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update SOS status",
      error: error.message,
    });
  }
};

export const updateSOSEvidence = async (req, res) => {
  try {
    const { evidenceUrl } = req.body;

    if (!evidenceUrl) {
      return res.status(400).json({
        message: "Evidence URL is required",
      });
    }

    const alert = await SOSAlert.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!alert) {
      return res.status(404).json({
        message: "SOS alert not found",
      });
    }

    alert.evidenceUrl = evidenceUrl;
    alert.evidenceStatus = "Uploaded";

    const updatedAlert = await alert.save();

    const io = req.app.get("io");

    if (io) {
      io.emit("sosEvidenceUpdated", updatedAlert);
    }

    const contacts = await Contact.find({
      user: req.user._id,
    });

    for (const contact of contacts) {
      if (contact.email) {
        try {
          await sendEvidenceFollowUpEmail({
            to: contact.email,
            contactName: contact.name,
            userName: alert.name,
            evidenceUrl,
            alertTime: new Date().toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
            }),
            alertId: alert._id,
          });
        } catch (emailError) {
          console.log(
            `Failed to send evidence email to ${contact.email}:`,
            emailError.message
          );
        }
      }

      if (contact.phone) {
        try {
          await sendEmergencySMS({
            to: contact.phone,
            contactName: contact.name,
            userName: alert.name,
            latitude: alert.latitude,
            longitude: alert.longitude,
            address: alert.address || "Live GPS location",
            evidenceUrl,
            alertId: alert._id,
          });
        } catch (smsError) {
          console.log(
            `Failed to send evidence SMS to ${contact.phone}:`,
            smsError.message
          );
        }
      }
    }

    res.status(200).json({
      message: "Evidence attached and follow-up notifications sent successfully",
      alert: updatedAlert,
      contactsNotified: contacts.length,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to attach evidence",
      error: error.message,
    });
  }
};

export const deleteSOSAlert = async (req, res) => {
  try {
    const alert = await SOSAlert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({
        message: "SOS alert not found",
      });
    }

    await SOSAlert.findByIdAndDelete(req.params.id);

    const io = req.app.get("io");

    if (io) {
      io.emit("sosAlertDeleted", req.params.id);
    }

    res.status(200).json({
      message: "SOS alert deleted successfully",
      deletedId: req.params.id,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete SOS alert",
      error: error.message,
    });
  }
};

export const clearAllSOSAlerts = async (req, res) => {
  try {
    await SOSAlert.deleteMany({});

    const io = req.app.get("io");

    if (io) {
      io.emit("sosAlertsCleared");
    }

    res.status(200).json({
      message: "All SOS alerts cleared successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to clear SOS alerts",
      error: error.message,
    });
  }
};

export const clearAllSOS = clearAllSOSAlerts;

export const deleteResolvedSOSAlerts = async (req, res) => {
  try {
    const result = await SOSAlert.deleteMany({
      status: "Resolved",
    });

    const io = req.app.get("io");

    if (io) {
      io.emit("resolvedSOSAlertsDeleted");
    }

    res.status(200).json({
      message: "Resolved SOS alerts deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete resolved SOS alerts",
      error: error.message,
    });
  }
};

export const deleteResolvedSOS = deleteResolvedSOSAlerts;

export const getSOSAlert = async (req, res) => {
  try {
    const alert = await SOSAlert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({
        message: "SOS alert not found",
      });
    }
    res.status(200).json(alert);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch SOS alert",
      error: error.message,
    });
  }
};

export const acknowledgeSOSAlert = async (req, res) => {
  try {
    const alert = await SOSAlert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({
        message: "SOS alert not found",
      });
    }

    const myEmail = req.user.email?.toLowerCase();
    const myPhone = req.user.phone ? req.user.phone.replace(/[\s\-\(\)\+]/g, "") : "";

    let recipientMatched = false;
    for (const recipient of alert.recipients) {
      const recEmail = recipient.contactEmail?.toLowerCase();
      const recPhone = recipient.contactPhone ? recipient.contactPhone.replace(/[\s\-\(\)\+]/g, "") : "";

      if (recEmail === myEmail || recPhone === myPhone) {
        recipient.status = "Acknowledged";
        recipient.acknowledgedAt = new Date();
        recipientMatched = true;
      }
    }

    // Admins are also recipients. If user is admin and not explicitly in contacts, still acknowledge
    if (!recipientMatched && req.user.role === "admin") {
      alert.recipients.push({
        contactName: req.user.name,
        contactEmail: myEmail,
        contactPhone: myPhone,
        status: "Acknowledged",
        acknowledgedAt: new Date(),
        deliveredAt: new Date(),
      });
      recipientMatched = true;
    }

    if (!recipientMatched) {
      return res.status(400).json({
        message: "You are not listed as an emergency contact or admin for this alert",
      });
    }

    await alert.save();

    const io = req.app.get("io");
    if (io) {
      io.emit("sosStatusUpdated", alert);
    }

    res.status(200).json({
      message: "SOS alert acknowledged successfully",
      alert,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to acknowledge SOS alert",
      error: error.message,
    });
  }
};

export const getUnacknowledgedSOSAlerts = async (req, res) => {
  try {
    const myEmail = req.user.email?.toLowerCase();
    const myPhone = req.user.phone ? req.user.phone.replace(/[\s\-\(\)\+]/g, "") : "";

    const query = {
      status: "Active",
      user: { $ne: req.user._id },
      $or: [
        {
          recipients: {
            $elemMatch: {
              status: { $in: ["Sent", "Delivered"] },
              $or: [
                { contactEmail: myEmail },
                { contactPhone: myPhone }
              ]
            }
          }
        }
      ]
    };

    // If they are an admin, they also get any active alerts they haven't acknowledged (excluding their own)
    if (req.user.role === "admin") {
      const activeAlerts = await SOSAlert.find({ status: "Active", user: { $ne: req.user._id } });
      const filteredForAdmin = activeAlerts.filter(alert => {
        const isAckedByAdmin = alert.recipients.some(
          r => (r.contactEmail?.toLowerCase() === myEmail || r.contactPhone?.replace(/[\s\-\(\)\+]/g, "") === myPhone) && r.status === "Acknowledged"
        );
        return !isAckedByAdmin;
      });
      return res.status(200).json(filteredForAdmin);
    }

    const alerts = await SOSAlert.find(query);
    res.status(200).json(alerts);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch unacknowledged alerts",
      error: error.message,
    });
  }
};
