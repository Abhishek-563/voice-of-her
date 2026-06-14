import twilio from "twilio";

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
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const trackerLink = alertId ? `${frontendUrl}/sos-active/${alertId}` : '';

  const messageBody = `🚨 SOS ALERT from ${userName || "Voice of Her User"}

Hello ${contactName || "Contact"},
Emergency help is needed.

Location: ${address || "Live GPS location"}
Map: ${mapsLink}
${trackerLink ? `Tracker: ${trackerLink}` : ""}
${evidenceUrl ? `Evidence: ${evidenceUrl}` : ""}

Please respond immediately.`;

  // 1. Try Twilio if configured
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
      console.error("Twilio SMS failed:", twilioError.message);
      throw new Error(`Twilio SMS failed: ${twilioError.message}`);
    }
  }

  throw new Error("Twilio SMS service is not configured.");
};
