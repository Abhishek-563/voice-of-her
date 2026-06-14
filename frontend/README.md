# Voice of Her 🚨

Voice of Her is an AI-powered women safety web application that provides instant SOS alerts, real-time location tracking, emergency contact notifications, evidence recording, and admin monitoring.

---

# Features ✨

- User Authentication (Login/Register)
- JWT-based Secure Authentication
- Role-based Admin/User Access
- Emergency SOS Trigger
- Live GPS Location Sharing
- Emergency Contact Management
- Real-time SOS Dashboard
- Evidence Video Recording
- Cloudinary Evidence Upload
- Email Notifications
- Twilio SMS Integration (Configured)
- Admin Monitoring Panel
- Resolve/Delete SOS Alerts
- Socket.io Real-time Updates
- Responsive Modern UI

---

# Tech Stack 🛠️

## Frontend
- React.js
- Tailwind CSS
- Axios
- React Router
- Socket.io Client
- Lucide React Icons

## Backend
- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JWT Authentication
- Nodemailer
- Twilio
- Socket.io

## Cloud Services
- MongoDB Atlas
- Cloudinary
- Twilio

---

# Project Structure 📁

```bash
voice-of-her/
│
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── config/
│   └── server.js
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── context/
│   └── App.jsx
│
├── public/
├── package.json
└── README.md
```

---

# Installation ⚙️

## Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/voiceofher.git
cd voiceofher
```

---

# Install Frontend Dependencies

```bash
npm install
```

---

# Install Backend Dependencies

```bash
cd backend
npm install
```

---

# Environment Variables 🔑

Create `.env` file inside backend folder:

```env
PORT=5000

MONGO_URI=your_mongodb_uri

JWT_SECRET=your_secret_key

EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number
```

---

# Run Frontend 🚀

```bash
npm run dev
```

---

# Run Backend 🚀

```bash
cd backend
npm run dev
```

---

# Screenshots 📸

## Home Page
- Modern women safety landing page
- SOS trigger system

## Admin Dashboard
- Live SOS monitoring
- Evidence viewing
- Alert management

## Emergency Contacts
- Add/Delete trusted contacts

---

# Future Improvements 🔮

- AI Threat Detection
- Voice Command SOS
- Shake Detection
- Mobile App Version
- Live Audio Streaming
- SMS Delivery Tracking
- Nearby Emergency Services

---

# Author 👨‍💻

Developed by Abhishek

---

# License 📄

This project is developed for educational and safety purposes.
