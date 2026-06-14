import twilio from "twilio";
import axios from "axios";

let client = null;

const getTwilioClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) return null;

  if (!client) {
    client = twilio(accountSid, authToken);
  }

  return client;
};

export const sendEmergencySMS = async ({
  to,
  contactName,
  userName,
  latitude,
  longitude,
  address,
  evidenceUrl,
  alertId,
}) => {
  if (!to) {
    console.log("Contact phone missing. Skipping SMS.");
    return null;
  }

  // Sanitize the phone number: remove spaces, dashes, parentheses
  let cleanPhone = to.replace(/[\s\-\(\)]/g, "");

  const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
  const trackerLink = alertId ? `http://localhost:5173/sos-active/${alertId}` : '';

  const messageBody = `🚨 SOS ALERT from ${userName || "Voice of Her User"}

Hello ${contactName || "Contact"},
Emergency help is needed.

Location: ${address || "Live GPS location"}
Map: ${mapsLink}
${trackerLink ? `Tracker: ${trackerLink}` : ""}
${evidenceUrl ? `Evidence: ${evidenceUrl}` : ""}

Please respond immediately.`;

  // 1. Try Twilio first if configured
  const smsClient = getTwilioClient();
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

  if (smsClient && twilioPhoneNumber) {
    try {
      // Ensure E.164 formatting for Twilio
      let twilioTo = cleanPhone;
      if (!twilioTo.startsWith("+")) {
        if (twilioTo.length === 10) {
          twilioTo = "+91" + twilioTo;
        } else {
          twilioTo = "+" + twilioTo;
        }
      }
      console.log(`Sending Twilio SMS to ${twilioTo}...`);
      const message = await smsClient.messages.create({
        body: messageBody,
        from: twilioPhoneNumber,
        to: twilioTo,
      });
      console.log("Twilio SMS sent successfully. SID:", message.sid);
      return message;
    } catch (twilioError) {
      console.error("Twilio SMS failed, trying Fast2SMS fallback:", twilioError.message);
    }
  }

  // 2. Try Fast2SMS fallback/primary
  const fast2SmsKey = process.env.FAST2SMS_API_KEY;
  if (fast2SmsKey) {
    try {
      // Fast2SMS expects 10-digit number for Indian numbers or clean digits
      let fast2SmsTo = cleanPhone.replace("+", "");
      if (fast2SmsTo.startsWith("91") && fast2SmsTo.length > 10) {
        fast2SmsTo = fast2SmsTo.substring(fast2SmsTo.length - 10);
      }
      console.log(`Sending Fast2SMS to ${fast2SmsTo}...`);
      const response = await axios.get("https://www.fast2sms.com/dev/bulkV2", {
        params: {
          authorization: fast2SmsKey,
          route: "q",
          message: messageBody,
          numbers: fast2SmsTo,
        },
      });
      console.log("Fast2SMS sent successfully. Response:", response.data);
      return response.data;
    } catch (fast2SmsError) {
      console.error("Fast2SMS failed:", fast2SmsError.message);
      throw new Error(`SMS send failed (Twilio & Fast2SMS failed): ${fast2SmsError.message}`);
    }
  }

  throw new Error("No SMS service (Twilio/Fast2SMS) is configured.");
};
