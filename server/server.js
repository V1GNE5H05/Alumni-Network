const express = require("express");
const cors = require("cors");
const path = require("path");
require('dotenv').config();

// Import database configuration
const { connectMongoDB, connectMongoose } = require('./config/database');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Import all modular routes
const authRoutes = require('./routes/auth');
const alumniRoutes = require('./routes/alumni');
const postsRoutes = require('./routes/posts');
const eventsRoutes = require('./routes/events');
const fundraisingRoutes = require('./routes/fundraising');
const jobsRoutes = require('./routes/jobs');
const chatRoutes = require('./routes/chat');
const membersRoutes = require('./routes/members');
const proudableAlumniRoutes = require('./routes/proudable_alumni');
const friendsRoutes = require('./routes/friends');

const app = express();
const port = process.env.PORT || 5000;

// ========== MIDDLEWARE SETUP ==========
app.use(cors());
app.use(express.json({ limit: '250kb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files (HTML, CSS, JS, images)
app.use(express.static(path.join(__dirname, '..')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ========== API ROUTES ==========
// Mount all modular routes
app.use('/', authRoutes);                    // /login, /add-user
app.use('/', alumniRoutes);                  // /profile/*, /students, /student
app.use('/', postsRoutes);                   // /posts
app.use('/events', eventsRoutes);            // /events
app.use('/api/events', eventsRoutes);        // /api/events (for consistency)
app.use('/api', fundraisingRoutes);          // /api/fundraising/*
app.use('/api', jobsRoutes);                 // /api/jobs, /api/internships, etc.
app.use('/api/chat', chatRoutes);            // /api/chat/*
app.use('/api/members', membersRoutes);      // /api/members
app.use('/api/proudable-alumni', proudableAlumniRoutes); // /api/proudable-alumni
app.use('/api/friends', friendsRoutes);      // /api/friends

// ========== ROOT & HEALTH ROUTES ==========
app.get('/', (_req, res) => res.redirect('/index.html'));

app.get('/api/health', (_req, res) => {
  const mongoose = require('mongoose');
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongoose: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ========== ERROR HANDLERS ==========
app.use(notFoundHandler);
app.use(errorHandler);

// ========== DATABASE CONNECTION & SERVER START ==========
(async () => {
  try {
    // Connect MongoDB
    const db = await connectMongoDB();
    app.locals.db = db;
    console.log("✅ MongoDB connected successfully");
    
    // Connect Mongoose
    await connectMongoose();
    console.log("✅ Mongoose connected successfully");
    
    // Start server
    app.listen(port, '0.0.0.0', () => {
      const os = require('os');
      const networkInterfaces = os.networkInterfaces();
      const addresses = [];
      
      // Find all non-internal IPv4 addresses
      Object.keys(networkInterfaces).forEach(interfaceName => {
        networkInterfaces[interfaceName].forEach(interface => {
          if (interface.family === 'IPv4' && !interface.internal) {
            addresses.push({
              name: interfaceName,
              address: interface.address
            });
          }
        });
      });
      
      // Find WiFi address specifically
      const wifiInterface = addresses.find(addr => 
        addr.name.toLowerCase().includes('wi-fi') || 
        addr.name.toLowerCase().includes('wireless')
      );
      
      const mainIP = wifiInterface ? wifiInterface.address : (addresses[0]?.address || 'localhost');
      
      console.log(`\n🚀 ========================================`);
      console.log(`   Server running on:`);
      console.log(`   - Local:    http://localhost:${port}`);
      
      if (wifiInterface) {
        console.log(`   - WiFi:     http://${mainIP}:${port} ⭐ SHARE THIS`);
      }
      
      // Show all network addresses
      if (addresses.length > 0) {
        console.log(`\n   📡 All Network Addresses:`);
        addresses.forEach(addr => {
          const isWiFi = addr.name.toLowerCase().includes('wi-fi') || addr.name.toLowerCase().includes('wireless');
          const marker = isWiFi ? ' ⭐' : '';
          console.log(`   - ${addr.name}: http://${addr.address}:${port}${marker}`);
        });
      }
      
      console.log(`   - Health:   http://${mainIP}:${port}/api/health`);
      console.log(`   ========================================`);
      console.log(`\n   📱 Share this with others on college WiFi:`);
      console.log(`   👉 http://${mainIP}:${port}\n`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
})();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⏳ Shutting down gracefully...');
  process.exit(0);
});
