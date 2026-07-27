require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit=require('express-rate-limit')


const app = express();
 
// needed for express-rate-limit to see real client IPs behind Render's proxy
app.set('trust proxy', 1);

// --- Middleware ---
app.use(helmet()); // Secure HTTP headers
app.use(cors()); // Allow cross-origin requests from React
app.use(express.json()); // Parse incoming JSON payloads

// ---Rate Limiting ---
const apiLimiter=rateLimit({
    windowMs: 15*60*1000,   //15 min
    max: 100,
    message: 'Too many requests from this IP, please try again later. ',
    standardHeaders: true,
    legacyHeaders: false,
})

//limiter for login/register
const authLimiter=rateLimit({
    windowMs: 15*60*1000,
    max: 5,
    message: 'Too many login attempts. Please try again in 15 minutes ',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true
})
app.use('/api',apiLimiter);
app.use('/api/auth/login', authLimiter)
app.use('/api/auth/register', authLimiter)


// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// ---Routes ---
app.use('/api/auth',require('./routes/auth.routes.js'))
app.use('/api/triage', require('./routes/triage.routes.js'));
app.use('/api/clinics', require('./routes/clinic.routes.js'));


//health check
app.get('/', (req, res) => {
  res.send('Medical Triage API is running...');
});

// --- Server Initialization ---
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log("Listening on:", server.address());
});

server.on("error", (err) => {
  console.error("Listen error:", err);
});