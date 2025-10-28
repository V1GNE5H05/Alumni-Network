const { MongoClient } = require("mongodb");
const mongoose = require('mongoose');
require('dotenv').config();

// Environment-based configuration
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/alumni_network";
const DB_NAME = process.env.DB_NAME || "alumni_network";

let client = null;
let db = null;

// Detect if using MongoDB Atlas or local
const isAtlas = MONGODB_URI.includes('mongodb+srv://') || MONGODB_URI.includes('mongodb.net');
const dbType = isAtlas ? 'MongoDB Atlas (Cloud)' : 'MongoDB Compass (Local)';

// Connect to MongoDB using native driver
async function connectMongoDB() {
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log(`✅ Connected to ${dbType} (Native Driver)`);
    
    // Extract DB name from URI if it includes it, otherwise use DB_NAME
    if (MONGODB_URI.includes('/') && !MONGODB_URI.endsWith('/')) {
      const dbNameFromUri = MONGODB_URI.split('/').pop().split('?')[0];
      db = client.db(dbNameFromUri || DB_NAME);
    } else {
      db = client.db(DB_NAME);
    }
    
    console.log(`📦 Using database: ${db.databaseName}`);
    return db;
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    console.error("💡 Tip: Check your MONGODB_URI in .env file");
    throw err;
  }
}

// Connect to MongoDB using Mongoose
async function connectMongoose() {
  try {
    mongoose.set('bufferCommands', false);
    await mongoose.connect(MONGODB_URI);
    console.log(`✅ Mongoose connected to ${dbType}`);
    console.log(`📦 Database: ${mongoose.connection.db.databaseName}`);
  } catch (err) {
    console.error("❌ Mongoose connection failed:", err.message);
    console.error("💡 Tip: Check your MONGODB_URI in .env file");
    throw err;
  }
}

// Get MongoDB client
function getClient() {
  return client;
}

// Get database instance
function getDB() {
  return db;
}

// Get specific collection
function getCollection(collectionName) {
  if (!db) {
    throw new Error("Database not connected");
  }
  return db.collection(collectionName);
}

module.exports = {
  connectMongoDB,
  connectMongoose,
  getClient,
  getDB,
  getCollection
};
