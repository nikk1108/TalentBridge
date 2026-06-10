const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Simple in-memory user storage for testing (remove this once working)
const tempUsers = [];

// Generate token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'testsecret123', {
    expiresIn: '30d',
  });
};

// REGISTER ROUTE - DIRECT IMPLEMENTATION
router.post('/register', async (req, res) => {
  console.log('🔥 Register endpoint HIT!');
  console.log('Request body:', req.body);
  
  try {
    const { name, email, password, role } = req.body;
    
    // Validation
    if (!name || !email || !password) {
      console.log('Missing fields');
      return res.status(400).json({ message: 'Please fill in all fields' });
    }
    
    // Check if user exists (in temp storage for now)
    const userExists = tempUsers.find(u => u.email === email);
    if (userExists) {
      console.log('User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    const newUser = {
      _id: Date.now().toString(),
      name,
      email,
      password: hashedPassword,
      role: role || 'candidate'
    };
    
    tempUsers.push(newUser);
    console.log('User created successfully:', { name, email, role });
    
    // Generate token
    const token = generateToken(newUser._id, newUser.role);
    
    // Send response
    res.status(201).json({
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      token: token
    });
    
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: error.message });
  }
});

// LOGIN ROUTE
router.post('/login', async (req, res) => {
  console.log('Login endpoint HIT!');
  console.log('Request body:', req.body);
  
  try {
    const { email, password } = req.body;
    
    const user = tempUsers.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const token = generateToken(user._id, user.role);
    
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Test route to check if router is working
router.get('/test', (req, res) => {
  res.json({ message: 'Auth routes are working!' });
});

module.exports = router;