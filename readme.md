# AI-Powered Medical Triage Assistant
**Stack:** React.js, Node.js, Express, MongoDB, Mongoose, Google Gemini API, Google Maps API

---

## Project Overview

A full-stack web application that helps users evaluate their symptoms and determine the appropriate level of medical care — whether to rest at home, visit a clinic, or go to the emergency room. The platform uses AI-powered natural language analysis to assess symptom severity and provides real-time nearby clinic recommendations.

> **Disclaimer:** This tool is not a substitute for professional medical advice. It is designed to assist users in making informed decisions, not to replace a licensed physician.

---

## Problem Statement

Many people face uncertainty when experiencing symptoms — they don't know whether their condition warrants an ER visit, a clinic appointment, or simply rest at home. This indecision can lead to:
- Overcrowding in emergency rooms for non-critical cases
- Delayed care for genuinely urgent conditions
- Anxiety and confusion for patients unfamiliar with medical terminology

---

## Solution

The AI-Powered Medical Triage Assistant bridges this gap by providing an intelligent, conversational interface where users describe their symptoms in plain English and receive an instant, structured assessment — with support for multi-turn follow-up questions so the AI can refine its assessment as the user provides more detail.

---

## Core Features

### 1. Symptom Input & AI Analysis
- Users describe symptoms in a natural language text box
- Google Gemini API processes the input and returns strict, structured JSON:
  - List of possible conditions
  - Urgency level classification
  - Recommended next action
  - Follow-up clarifying questions
- Multi-turn flow: if the AI asks a follow-up question, the user's next message is linked to the same symptom check (`checkId`) and the AI reasons over the full conversation context, not just the latest message

### 2. Urgency Level System
| Level | Color | Meaning | Action |
|---|---|---|---|
| Low | 🟢 Green | Mild symptoms | Rest at home |
| Medium | 🟡 Yellow | Moderate concern | Visit a clinic soon |
| High | 🔴 Red | Serious symptoms | Visit ER today |
| Emergency | 🚨 Critical | Life-threatening | Call emergency services immediately |

### 3. Nearby Clinic Finder
- Google Maps JavaScript API + Places API (Nearby Search) integration
- Uses browser Geolocation API for real-time location, with an automatic fallback location if permission is denied or unavailable
- Queries multiple keywords (doctor, clinic, hospital, physician, medical clinic) in parallel and de-duplicates results by `place_id`
- Displays nearest hospitals, clinics, and urgent care centers on an interactive map, automatically surfaced when urgency is Medium or higher

### 4. User Authentication & History
- JWT-based login and signup with bcrypt password hashing
- Symptom check history saved per user in MongoDB
- Users can review past assessments in a dashboard sidebar with derived stats (total checks, % low-risk)

---

## Tech Stack

### Frontend
- **React.js** — component-based UI
- **Tailwind CSS** — responsive, SaaS-dashboard-style UI
- **Axios** — API communication with JWT auto-attached via interceptors
- **React Router** — client-side routing with protected routes
- **@react-google-maps/api** — clinic map display
- **Lucide React** — icon set

### Backend
- **Node.js + Express** — RESTful API server
- **JWT (JSON Web Tokens)** — secure authentication
- **bcryptjs** — password hashing
- **Google Gemini API** (`@google/generative-ai`) — AI symptom analysis with structured JSON output mode
- **Helmet** — secure HTTP headers
- **CORS** — cross-origin request handling
- **express-rate-limit** — abuse protection

### Database
- **MongoDB Atlas** — managed MongoDB (free tier), flexible document storage for user data and symptom history
- **Mongoose** — ODM for schema modeling and validation

### Deployment
- **Vercel** — frontend hosting
- **Render** — backend hosting
- **MongoDB Atlas** — managed database

---

## System Architecture

```
User (Browser)
     │
     ▼
React Frontend (Vercel)
     │
     ├──► Google Maps API  (clinic locations)
     │
     └──► Express Backend (Render)
               │
               ├──► Google Gemini API  (symptom analysis)
               │
               └──► MongoDB Atlas  (user data & history)
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | User login, returns JWT |
| POST | `/api/triage/analyze` | Submit symptoms (or a follow-up answer), get AI assessment |
| GET | `/api/triage/history` | Get user's past symptom checks |
| GET | `/api/clinics/nearby` | Get nearby clinics/hospitals by coordinates |

---

## Gemini API Prompt Design

The backend enforces strict JSON-only output using Gemini's structured output mode (`responseMimeType: "application/json"`), so responses parse reliably without markdown fences or conversational filler.

```
System Instruction: "You are an expert AI medical triage assistant.
Analyze the user's symptoms."

Prompt:
[Previous symptoms + previous follow-up questions, if this is a continued check]

Analyze the following symptoms: "<user symptoms>"

You MUST output a JSON object matching this structure:
{
  "urgencyLevel": "low" | "medium" | "high" | "emergency",
  "possibleConditions": ["Condition 1", "Condition 2"],
  "recommendedAction": "A clear, actionable recommendation",
  "followUpQuestions": ["Question 1?", "Question 2?"]
}
```

If a `checkId` is present, the previous symptoms and previously asked follow-up questions are injected into the prompt so Gemini can reason over the full conversation before updating the same database record — rather than treating each message as an isolated query.

---

## Project Folder Structure

```
medical-triage/
├── client/                       # React Frontend
│   ├── src/
│   │   ├── api.js                # Axios instance + JWT interceptor
│   │   ├── components/
│   │   │   └── ClinicMap.jsx
│   │   ├── pages/
│   │   │   ├── Auth.jsx          # Split-screen login/register
│   │   │   └── Dashboard.jsx     # App shell: symptom input, results, history
│   │   ├── App.jsx               # Routing + protected routes
│   │   └── main.jsx
│
├── server/                       # Express Backend
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── triage.routes.js
│   │   └── clinic.routes.js
│   ├── middleware/
│   │   └── auth.middleware.js
│   ├── models/
│   │   ├── User.js
│   │   └── SymptomCheck.js
│   └── index.js
│
└── README.md
```

---

## Database Schema (Mongoose)

```js
// User.js
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// SymptomCheck.js
const symptomCheckSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  symptoms: { type: String, required: true },
  urgencyLevel: { type: String, enum: ['low', 'medium', 'high', 'emergency'], required: true },
  possibleConditions: [String],
  recommendedAction: String,
  followUpQuestions: [String],
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });
```

---

## Security & Compliance Considerations

### Data Privacy
- All passwords are cryptographically hashed using **bcrypt** before storage
- JWT tokens are short-lived (1 hour) and validated on every protected route via middleware
- Helmet middleware secures HTTP response headers
- In a production environment, symptom data would be **encrypted at rest** to comply with **HIPAA/GDPR** standards
- No raw passwords or sensitive health data are ever logged

### Rate Limiting
- Global `express-rate-limit` on all `/api` routes: 100 requests / 15 minutes per IP
- Stricter limiter on `/api/auth/login` and `/api/auth/register`: 5 attempts / 15 minutes per IP, protecting against brute-force credential attacks
- Rate limiting also protects the Gemini API from abuse-driven billing spikes

### AI JSON Enforcement
- Gemini is called with `responseMimeType: "application/json"` and an explicit schema in the prompt, so output is strict JSON — no markdown, no backticks, no conversational filler
- Backend still strips accidental code-fence formatting before `JSON.parse()` as a defensive fallback
- Malformed AI output and Mongoose validation errors are caught and surfaced as clean, user-facing error messages rather than raw stack traces

---

## Future Enhancements
- Multi-language support
- Voice input for symptoms
- Integration with telemedicine platforms
- PWA / mobile app version
- Admin dashboard for usage analytics
- RAG-lite grounding of the AI's assessments in public health guideline documents
