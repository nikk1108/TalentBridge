const mongoose = require('mongoose');

let isMock = false;

// In-memory data store for fallback
const mockStore = {
  users: [],
  jobs: [],
  candidates: []
};

const connectDB = async () => {
  try {
    mongoose.set('strictQuery', false);
    // Connect with a short timeout so it fails fast if MongoDB is not running
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/talentbridge', {
      serverSelectionTimeoutMS: 1500,
    });
    console.log('MongoDB Connected successfully.');
  } catch (err) {
    console.warn(`MongoDB Connection Error: ${err.message}`);
    console.warn('⚠️  MONGODB IS NOT RUNNING. Falling back to IN-MEMORY MOCK DATABASE.');
    isMock = true;
  }
};

const getIsMock = () => isMock;
const getMockStore = () => mockStore;

module.exports = { connectDB, getIsMock, getMockStore };
