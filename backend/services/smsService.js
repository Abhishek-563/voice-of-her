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
}) => {
  const smsClient = getTwilioClient();
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!smsClient || !twilioPhoneNumber) {
    console.log("Twilio SMS not configured. Skipping SMS.");
    return null;
  }

  if (!to) {
    console.log("Contact phone missing. Skipping SMS.");
    return null;
  }

  const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;

  const messageBody = `🚨 SOS ALERT from ${userName || "Voice of Her User"}

Hello ${contactName || "Contact"},
Emergency help is needed.

Location: ${address || "Live GPS location"}
Map: ${mapsLink}
${evidenceUrl ? `Evidence: ${evidenceUrl}` : ""}

Please respond immediately.`;

  const message = await smsClient.messages.create({
    body: messageBody,
    from: twilioPhoneNumber,
    to,
  });

  return message;
};
