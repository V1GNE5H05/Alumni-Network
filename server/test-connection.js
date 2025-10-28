// Test script to verify database connection and data
require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'alumni_network';

async function testConnection() {
  console.log('\n🔍 Testing Database Connection...\n');
  console.log('📋 Configuration:');
  console.log(`   URI: ${MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')}`);
  console.log(`   Database Name: ${DB_NAME}\n`);

  const isAtlas = MONGODB_URI.includes('mongodb+srv://') || MONGODB_URI.includes('mongodb.net');
  console.log(`🗄️  Database Type: ${isAtlas ? 'MongoDB Atlas (Cloud) ☁️' : 'Local MongoDB 🏠'}\n`);

  let client;
  
  try {
    // Connect
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connection successful!\n');

    // Get database
    const db = client.db(DB_NAME);
    console.log(`📦 Connected to database: ${db.databaseName}\n`);

    // List all collections
    const collections = await db.listCollections().toArray();
    console.log(`📚 Collections found (${collections.length}):`);
    
    if (collections.length === 0) {
      console.log('   ⚠️  No collections found - database is empty!\n');
    } else {
      for (const collection of collections) {
        const count = await db.collection(collection.name).countDocuments();
        console.log(`   - ${collection.name}: ${count} documents`);
      }
      console.log('');
    }

    // Check specific collections for your project
    const importantCollections = ['student', 'users', 'events', 'posts', 'friends'];
    console.log('🔍 Checking important collections:\n');
    
    for (const collName of importantCollections) {
      try {
        const count = await db.collection(collName).countDocuments();
        if (count > 0) {
          console.log(`   ✅ ${collName}: ${count} documents`);
          
          // Show sample document
          const sample = await db.collection(collName).findOne();
          if (sample) {
            console.log(`      Sample: ${JSON.stringify(sample, null, 2).substring(0, 200)}...`);
          }
        } else {
          console.log(`   ⚠️  ${collName}: empty`);
        }
      } catch (err) {
        console.log(`   ❌ ${collName}: doesn't exist`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ Test completed successfully!');
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('\n❌ Connection failed!');
    console.error('Error:', error.message);
    console.error('\n💡 Tips:');
    console.error('   - Check your MONGODB_URI in .env file');
    console.error('   - Verify username and password are correct');
    console.error('   - For Atlas: Check IP whitelist (0.0.0.0/0)');
    console.error('   - For Local: Ensure MongoDB is running\n');
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Connection closed.\n');
    }
  }
}

// Run the test
testConnection().catch(console.error);
