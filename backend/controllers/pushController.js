import PushSubscription from "../models/PushSubscription.js";

export const subscribe = async (req, res) => {
  try {
    const { subscription } = req.body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({
        message: "Valid push subscription object is required",
      });
    }

    // Check if subscription endpoint already exists
    let existingSub = await PushSubscription.findOne({
      "subscription.endpoint": subscription.endpoint,
    });

    if (existingSub) {
      // Update the user mapping if it changed
      existingSub.user = req.user._id;
      existingSub.subscription = subscription;
      await existingSub.save();
      return res.status(200).json({
        message: "Push subscription updated successfully",
        subscription: existingSub,
      });
    }

    // Otherwise create new subscription mapping
    const newSub = await PushSubscription.create({
      user: req.user._id,
      subscription,
    });

    res.status(201).json({
      message: "Push subscription registered successfully",
      subscription: newSub,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to register push subscription",
      error: error.message,
    });
  }
};

export const unsubscribe = async (req, res) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({
        message: "Endpoint is required to unsubscribe",
      });
    }

    await PushSubscription.deleteMany({
      user: req.user._id,
      "subscription.endpoint": endpoint,
    });

    res.status(200).json({
      message: "Push subscription removed successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to remove push subscription",
      error: error.message,
    });
  }
};

export const registerFcmToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        message: "FCM token is required",
      });
    }

    req.user.fcmToken = token;
    await req.user.save();

    res.status(200).json({
      message: "FCM token registered successfully",
      fcmToken: token,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to register FCM token",
      error: error.message,
    });
  }
};
