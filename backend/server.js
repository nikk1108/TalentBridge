const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { connectDB, getIsMock } = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

dotenv.config();

const app = express();

// Connect DB
connectDB();

// CORS fix
app.use(cors({
  origin: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Test route
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
// API ROUTES WITH DEBUGGING
// ======================

// Load auth routes with error handling
console.log('Loading auth routes...');
try {
  const authRoutes = require('./routes/authRoutes');
  console.log('Auth routes loaded successfully');
  app.use('/api/auth', authRoutes);
} catch (err) {
  console.error('ERROR loading auth routes:', err.message);
}

// Load job routes
console.log('Loading job routes...');
try {
  const jobRoutes = require('./routes/jobRoutes');
  console.log('Job routes loaded successfully');
  app.use('/api/jobs', jobRoutes);
} catch (err) {
  console.error('ERROR loading job routes:', err.message);
}

// Load candidate routes
console.log('Loading candidate routes...');
try {
  const candidateRoutes = require('./routes/candidateRoutes');
  console.log('Candidate routes loaded successfully');
  app.use('/api/candidates', candidateRoutes);
} catch (err) {
  console.error('ERROR loading candidate routes:', err.message);
}

// Error handlers (KEEP LAST)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`DB Status: ${getIsMock() ? "MOCK" : "CONNECTED"}`);
});