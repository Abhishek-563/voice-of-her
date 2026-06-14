import mongoose from "mongoose";

const sosAlertSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    name: {
      type: String,
      default: "Unknown User",
    },

    email: {
      type: String,
      default: "",
    },

    latitude: {
      type: Number,
      required: true,
    },

    longitude: {
      type: Number,
      required: true,
    },

    address: {
      type: String,
      default: "Location address not available",
    },

    evidenceUrl: {
      type: String,
      default: "",
    },

    emailStatus: {
      type: String,
      enum: ["Pending", "Sent", "Failed"],
      default: "Pending",
    },

    smsStatus: {
      type: String,
      enum: ["Pending", "Sent", "Failed", "Skipped"],
      default: "Pending",
    },

    evidenceStatus: {
      type: String,
      enum: ["Not uploaded", "Uploaded", "Failed"],
      default: "Not uploaded",
    },

    priority: {
      type: String,
      default: "High Priority",
    },

    status: {
      type: String,
      enum: ["Active", "Resolved"],
      default: "Active",
    },

    recipients: [
      {
        contactName: String,
        contactEmail: String,
        contactPhone: String,
        status: {
          type: String,
          enum: ["Sent", "Delivered", "Acknowledged", "Resolved"],
          default: "Sent",
        },
        deliveredAt: { type: Date, default: Date.now },
        acknowledgedAt: Date,
        resolvedAt: Date,
      }
    ],
  },
  {
    timestamps: true,
  }
);

const SOSAlert = mongoose.model("SOSAlert", sosAlertSchema);

export default SOSAlert;
