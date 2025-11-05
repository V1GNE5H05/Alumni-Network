const express = require("express");
const cors = require("cors");
const path = require("path");
const rateLimit = require('express-rate-limit');
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

// ========== RATE LIMITING ==========
// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: '❌ Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiter for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: {
    success: false,
    message: '❌ Too many login attempts. Please try again after 15 minutes.'
  },
  skipSuccessfulRequests: true, // Don't count successful requests
});

// ========== MIDDLEWARE SETUP ==========
app.use(cors());
app.use(express.json({ limit: '250kb' }));
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// Serve static files (HTML, CSS, JS, images)
app.use(express.static(path.join(__dirname, '..')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ========== API ROUTES ==========
// Mount all modular routes
app.use('/', authRoutes);                    // /login, /add-user (backward compatibility)
app.use('/api', authRoutes);                 // /api/login, /api/forgot-password, /api/reset-password
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

// ========== BULK IMPORT STUDENTS ENDPOINT (NEW) ==========
app.post('/students/bulk-import', async (req, res) => {
  try {
    const students = req.body.students;
    
    // Validate request
    if (!students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No students data provided or invalid format'
      });
    }
    
    console.log(`📋 Bulk import started: ${students.length} students`);
    
    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };
    
    // Process each student
    for (const studentData of students) {
      try {
        // Validate required fields
        if (!studentData.alumni_id || !studentData.name || !studentData.dob || 
            !studentData.department || !studentData.batch || !studentData.contact || !studentData.status) {
          results.failed++;
          results.errors.push({
            alumni_id: studentData.alumni_id || 'Unknown',
            name: studentData.name || 'Unknown',
            error: 'Missing required fields'
          });
          continue;
        }
        
        // Check for duplicate alumni_id in database
        const existing = await app.locals.db.collection('students').findOne({
          alumni_id: studentData.alumni_id
        });
        
        if (existing) {
          results.skipped++;
          results.errors.push({
            alumni_id: studentData.alumni_id,
            name: studentData.name,
            error: 'Alumni ID already exists in database'
          });
          continue;
        }
        
        // Insert student into database
        const result = await app.locals.db.collection('students').insertOne({
          alumni_id: studentData.alumni_id,
          name: studentData.name,
          dob: studentData.dob,
          department: studentData.department,
          batch: studentData.batch,
          contact: studentData.contact,
          status: studentData.status,
          created_at: new Date(),
          updated_at: new Date()
        });
        
        if (result.insertedId) {
          results.success++;
        } else {
          results.failed++;
          results.errors.push({
            alumni_id: studentData.alumni_id,
            name: studentData.name,
            error: 'Failed to insert into database'
          });
        }
        
      } catch (err) {
        results.failed++;
        results.errors.push({
          alumni_id: studentData.alumni_id || 'Unknown',
          name: studentData.name || 'Unknown',
          error: err.message
        });
      }
    }
    
    console.log(`✅ Bulk import completed: ${results.success} success, ${results.skipped} skipped, ${results.failed} failed`);
    
    res.json({
      success: true,
      message: `Bulk import completed: ${results.success} successful, ${results.skipped} skipped, ${results.failed} failed`,
      results: results
    });
    
  } catch (err) {
    console.error('❌ Bulk import error:', err);
    res.status(500).json({
      success: false,
      message: 'Bulk import failed: ' + err.message
    });
  }
});

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
    app.listen(port, '0.0.0.0', async () => {
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