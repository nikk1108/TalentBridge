const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { connectDB, getIsMock } = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Standard Middleware
app.use(cors({
  origin: '*', // For development, allow any origin
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve Static Uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Basic Health/Status Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    database: getIsMock() ? 'In-Memory Fallback Mock DB' : 'MongoDB Connected',
    time: new Date()
  });
});

// Route Handlers
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/jobs', require('./routes/jobRoutes'));
app.use('/api/candidates', require('./routes/candidateRoutes'));

// Error Handlers
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  if (getIsMock()) {
    console.log('⚠️ Running in OFFLINE MOCK MODE. No external database required.');
  }
});
