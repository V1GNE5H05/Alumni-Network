require('dotenv').config();
const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');

const USE_AZURE = process.env.USE_AZURE === 'true';
const dbName = "alumni_network";

let MONGODB_URI;
if (USE_AZURE) {
  const COSMOS_HOST = process.env.COSMOS_HOST;
  const COSMOS_PORT = process.env.COSMOS_PORT || "10255";
  const COSMOS_USERNAME = process.env.COSMOS_USERNAME;
  const COSMOS_PASSWORD = process.env.COSMOS_PASSWORD;
  const encodedPassword = encodeURIComponent(COSMOS_PASSWORD);
  MONGODB_URI = `mongodb://${COSMOS_USERNAME}:${encodedPassword}@${COSMOS_HOST}:${COSMOS_PORT}/${dbName}?ssl=true&retrywrites=false&maxIdleTimeMS=120000&appName=@${COSMOS_USERNAME}@`;
} else {
  MONGODB_URI = "mongodb://localhost:27017";
}

async function checkData() {
  const client = new MongoClient(MONGODB_URI, {
    ssl: USE_AZURE,
    retryWrites: false,
    maxIdleTimeMS: 120000,
  });

  try {
    await client.connect();
    console.log('✅ Connected\n');
    
    const db = client.db(dbName);
    
    // Check funds
    console.log('📊 FUNDS COLLECTION:');
    const funds = await db.collection('funds').find().toArray();
    console.log(`   Count: ${funds.length}`);
    if (funds.length > 0) {
      console.log('   Sample:', JSON.stringify(funds[0], null, 2));
    }
    
    // Check jobs
    console.log('\n💼 JOBPOSTS COLLECTION:');
    const jobs = await db.collection('jobposts').find().toArray();
    console.log(`   Count: ${jobs.length}`);
    if (jobs.length > 0) {
      console.log('   Sample:', JSON.stringify(jobs[0], null, 2));
    }
    
    // Check internships
    console.log('\n🎓 INTERNSHIPS COLLECTION:');
    const internships = await db.collection('internships').find().toArray();
    console.log(`   Count: ${internships.length}`);
    if (internships.length > 0) {
      console.log('   Sample:', JSON.stringify(internships[0], null, 2));
    }
    
    // List all collections
    console.log('\n📁 ALL COLLECTIONS:');
    const collections = await db.listCollections().toArray();
    collections.forEach(c => console.log(`   - ${c.name}`));
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.close();
  }
}

checkData();