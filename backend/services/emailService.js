import nodemailer from "nodemailer";

const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

export const sendEmergencyEmail = async ({
  to,
  contactName,
  userName,
  userEmail,
  latitude,
  longitude,
  address,
  evidenceUrl,
  alertTime,
  alertId,
}) => {
  const transporter = createTransporter();

  const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
  const publicTrackingLink = alertId ? `http://localhost:5173/sos-active/${alertId}` : null;

  const html = `
    <div style="font-family: Arial, sans-serif; background:#f4f6fb; padding:24px;">
      <div style="max-width:650px; margin:auto; background:#ffffff; border-radius:18px; overflow:hidden; border:1px solid #e5e7eb;">

        <div style="background:linear-gradient(135deg,#e11d48,#9333ea); padding:24px; color:white;">
          <h1 style="margin:0; font-size:26px;">🚨 Emergency SOS Alert</h1>
          <p style="margin:8px 0 0;">Voice of Her Safety Notification</p>
        </div>

        <div style="padding:26px;">
          <p style="font-size:16px;">Hello <strong>${contactName}</strong>,</p>

          <p style="font-size:16px; line-height:1.6;">
            <strong>${userName}</strong> has triggered an emergency SOS alert and may need immediate help.
          </p>

          <div style="background:#fff1f2; border-left:5px solid #e11d48; padding:16px; border-radius:12px; margin:20px 0;">
            <p style="margin:6px 0;"><strong>User:</strong> ${userName}</p>
            <p style="margin:6px 0;"><strong>Email:</strong> ${userEmail || "Not available"}</p>
            <p style="margin:6px 0;"><strong>Alert Time:</strong> ${alertTime}</p>
            <p style="margin:6px 0;"><strong>Address:</strong> ${address || "Live GPS location"}</p>
            <p style="margin:6px 0;"><strong>Coordinates:</strong> ${latitude}, ${longitude}</p>
          </div>

          <div style="text-align:center; margin:28px 0;">
            <a href="${mapsLink}" target="_blank"
              style="display:inline-block; background:#e11d48; color:white; padding:14px 22px; border-radius:12px; text-decoration:none; font-weight:bold; margin-right:10px;">
              📍 Open Google Maps
            </a>
            ${publicTrackingLink ? `
            <a href="${publicTrackingLink}" target="_blank"
              style="display:inline-block; background:#7c3aed; color:white; padding:14px 22px; border-radius:12px; text-decoration:none; font-weight:bold;">
              🚨 Open Emergency Alarm Tracker
            </a>
            ` : ''}
          </div>

          ${
            evidenceUrl
              ? `
              <div style="text-align:center; margin:20px 0;">
                <a href="${evidenceUrl}" target="_blank"
                  style="display:inline-block; background:#7c3aed; color:white; padding:14px 22px; border-radius:12px; text-decoration:none; font-weight:bold;">
                  🎥 View Evidence Recording
                </a>
              </div>
              `
              : `
              <p style="background:#f8fafc; padding:14px; border-radius:10px; color:#64748b;">
                No evidence recording was attached to this alert.
              </p>
              `
          }

          <p style="font-size:14px; color:#64748b; line-height:1.6;">
            This alert was sent automatically by the Voice of Her safety system.
            If this is a real emergency, contact the user immediately or reach nearby emergency services.
          </p>
        </div>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `"Voice of Her SOS" <${process.env.EMAIL_USER}>`,
    to,
    subject: "🚨 Emergency SOS Alert - Immediate Attention Needed",
    html,
  };

  return transporter.sendMail(mailOptions);
};

export const sendEvidenceFollowUpEmail = async ({
  to,
  contactName,
  userName,
  evidenceUrl,
  alertTime,
  alertId,
}) => {
  const transporter = createTransporter();
  const publicTrackingLink = alertId ? `http://localhost:5173/sos-active/${alertId}` : null;

  const html = `
    <div style="font-family: Arial, sans-serif; background:#f4f6fb; padding:24px;">
      <div style="max-width:650px; margin:auto; background:#ffffff; border-radius:18px; overflow:hidden; border:1px solid #e5e7eb;">
        
        <div style="background:linear-gradient(135deg,#7c3aed,#db2777); padding:24px; color:white;">
          <h1 style="margin:0; font-size:26px;">🎥 SOS Evidence Update</h1>
          <p style="margin:8px 0 0;">Voice of Her Evidence Notification</p>
        </div>

        <div style="padding:26px;">
          <p style="font-size:16px;">Hello <strong>${contactName}</strong>,</p>

          <p style="font-size:16px; line-height:1.6;">
            A new evidence recording has been attached to the SOS alert triggered by
            <strong>${userName}</strong>.
          </p>

          <div style="background:#f5f3ff; border-left:5px solid #7c3aed; padding:16px; border-radius:12px; margin:20px 0;">
            <p style="margin:6px 0;"><strong>User:</strong> ${userName}</p>
            <p style="margin:6px 0;"><strong>Evidence Time:</strong> ${alertTime}</p>
          </div>

          <div style="text-align:center; margin:28px 0;">
            <a href="${evidenceUrl}" target="_blank"
              style="display:inline-block; background:#7c3aed; color:white; padding:14px 22px; border-radius:12px; text-decoration:none; font-weight:bold; margin-right:10px;">
              🎥 View Evidence Recording
            </a>
            ${publicTrackingLink ? `
            <a href="${publicTrackingLink}" target="_blank"
              style="display:inline-block; background:#b91c1c; color:white; padding:14px 22px; border-radius:12px; text-decoration:none; font-weight:bold;">
              🚨 Open Emergency Alarm Tracker
            </a>
            ` : ''}
          </div>

          <p style="font-size:14px; color:#64748b; line-height:1.6;">
            This evidence was recorded after the SOS alert was triggered.
          </p>
        </div>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `"Voice of Her Evidence" <${process.env.EMAIL_USER}>`,
    to,
    subject: "🎥 SOS Evidence Recording Attached - Voice of Her",
    html,
  };

  return transporter.sendMail(mailOptions);
};