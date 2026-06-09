const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { connectDB, getIsMock } = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

dotenv.config();

const app = express();

// 🔥 Connect DB FIRST (good practice)
connectDB();

// 🔧 CORS FIX (production + local safe)
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ TEST ROUTE (IMPORTANT FOR DEBUGGING)
app.get('/', (req, res) => {
  res.send('TalentBridge API is running');
});

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    database: getIsMock() ? 'Mock DB' : 'MongoDB Connected',
    time: new Date()
  });
});

// ======================
// 🔥 API ROUTES
// ======================
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/jobs', require('./routes/jobRoutes'));
app.use('/api/candidates', require('./routes/candidateRoutes'));

// Error handlers (KEEP LAST)
app.use(notFound);
app.use(errorHandler);

// Port (Render requirement)
const PORT = process.env.PORT || 10000;

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`DB Status: ${getIsMock() ? "MOCK" : "CONNECTED"}`);
});