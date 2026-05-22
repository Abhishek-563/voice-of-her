import SOSAlert from "../models/SOSAlert.js";
import Contact from "../models/Contact.js";
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
    });

    const io = req.app.get("io");

    if (io) {
      io.emit("newSOSAlert", alert);
    }

    const contacts = await Contact.find({ user: req.user._id });

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
