require('dotenv').config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const { MongoClient, ObjectId } = require("mongodb");
const mongoose = require('mongoose');

const app = express();
const port = process.env.PORT || 5000;

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json({ limit: '250kb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ============ AZURE CONFIGURATION ============
const USE_AZURE = process.env.USE_AZURE === 'true';
const dbName = "alumni_network";
const collectionName = "student";

let MONGODB_URI;
let clientOptions;

if (USE_AZURE) {
  const COSMOS_HOST = process.env.COSMOS_HOST;
  const COSMOS_PORT = process.env.COSMOS_PORT || "10255";
  const COSMOS_USERNAME = process.env.COSMOS_USERNAME;
  const COSMOS_PASSWORD = process.env.COSMOS_PASSWORD;
  
  if (!COSMOS_HOST || !COSMOS_USERNAME || !COSMOS_PASSWORD) {
    console.error("❌ Missing Azure Cosmos DB credentials");
    process.exit(1);
  }
  
  const encodedPassword = encodeURIComponent(COSMOS_PASSWORD);
  MONGODB_URI = `mongodb://${COSMOS_USERNAME}:${encodedPassword}@${COSMOS_HOST}:${COSMOS_PORT}/${dbName}?ssl=true&retrywrites=false&maxIdleTimeMS=120000&appName=@${COSMOS_USERNAME}@`;
  
  clientOptions = {
    ssl: true,
    retryWrites: false,
    maxIdleTimeMS: 120000,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 360000,
  };
  
  console.log('🔧 Using Azure Cosmos DB');
  console.log('📍 Host:', COSMOS_HOST);
} else {
  MONGODB_URI = "mongodb://localhost:27017";
  clientOptions = {};
  console.log('🔧 Using Local MongoDB');
}

const client = new MongoClient(MONGODB_URI, clientOptions);
let collection;
let fundsCollection;
let contributionsCollection;

async function connectDB() {
  try {
    await client.connect();
    console.log(`✅ Connected to ${USE_AZURE ? 'Azure Cosmos DB' : 'Local MongoDB'}`);
    const db = client.db(dbName);
    collection = db.collection(collectionName);
    app.locals.db = db;
    
    fundsCollection = db.collection('funds');
    contributionsCollection = db.collection('contributions');
  } catch (err) {
    console.error(`❌ DB connection failed:`, err);
    process.exit(1);
  }
}

// ============ MONGOOSE SETUP ============
mongoose.set('bufferCommands', false);

const jobSchema = new mongoose.Schema({
  jobTitle: { type: String, required: true },
  company: { type: String, required: true },
  companyWebsite: String,
  experienceFrom: Number,
  experienceTo: Number,
  location: [String],
  contactEmail: { type: String, required: true },
  jobArea: String,
  skills: [String],
  salary: String,
  applicationDeadline: String,
  jobDescription: { type: String, required: true },
  postedDate: { type: Date, default: Date.now },
});

const internshipSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  companyWebsite: String,
  duration: String,
  location: [String],
  contactEmail: { type: String, required: true },
  jobArea: String,
  skills: [String],
  stipend: String,
  applicationDeadline: String,
  description: { type: String, required: true },
  postedDate: { type: Date, default: Date.now },
});

const Job = mongoose.model('Job', jobSchema, 'jobposts');
const Internship = mongoose.model('Internship', internshipSchema, 'internships');

const mongooseOptions = USE_AZURE ? {
  ssl: true,
  retryWrites: false,
  maxIdleTimeMS: 120000,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 360000,
} : {};

// ============ START SERVER ============
(async () => {
  try {
    console.log('🚀 Starting server...');
    await connectDB();
    await mongoose.connect(MONGODB_URI, mongooseOptions);
    console.log(`✅ Mongoose connected`);
    
    app.listen(port, () => {
      console.log(`\n✅ Server running at http://localhost:${port}`);
      console.log(`📊 Database: ${USE_AZURE ? 'Azure Cosmos DB' : 'Local MongoDB'}`);
      console.log(`🌐 Health: http://localhost:${port}/api/health\n`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
})();

// ============ HELPERS ============
const phoneRegex = /^(?:\+?91[- ]?)?[6-9]\d{9}$/;
const pincodeRegex = /^[1-9][0-9]{5}$/;
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const isObjectId = id => /^[0-9a-fA-F]{24}$/.test(id);

function normalizeToArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).map(s => s.trim()).filter(Boolean);
  return String(value).split(',').map(s => s.trim()).filter(Boolean);
}

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ============ AUTH ROUTES ============

app.post("/login", async (req, res) => {
  const { identifier, password, email } = req.body;
  const loginIdentifier = identifier || email;
  
  try {
    const db = client.db(dbName);
    const usersCollection = db.collection("users");
    
    const user = await usersCollection.findOne({ 
      $or: [{ username: loginIdentifier }, { email: loginIdentifier }], 
      password 
    });
    
    if (user) {
      console.log("✅ Login successful:", loginIdentifier);
      res.json({ success: true, message: "Login successful" });
    } else {
      console.log("❌ Invalid login:", loginIdentifier);
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/add-user", async (req, res) => {
  const { username, userid } = req.body;
  const userIdentifier = username || userid;
  
  try {
    const db = client.db(dbName);
    const usersCollection = db.collection("users");
    
    if (!userIdentifier) {
      return res.status(400).json({ message: "username/userid required" });
    }
    
    if (username) {
      await usersCollection.insertOne({ username, password: username });
      res.json({ message: "User added", username });
    } else {
      await usersCollection.insertOne({ email: userid, password: userid, username: userid });
      res.json({ message: "User added", userid });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ PROFILE ROUTES ============

app.get("/profile/:username", async (req, res) => {
  try {
    const db = client.db(dbName);
    
    const student = await collection.findOne({ 
      $or: [
        { alumni_id: req.params.username },
        { username: req.params.username }, 
        { email: req.params.username }
      ]
    });
    
    if (student) return res.json(student);
    
    const usersCollection = db.collection("users");
    const user = await usersCollection.findOne({
      $or: [{ username: req.params.username }, { email: req.params.username }]
    });
    
    if (user && user.studentId) {
      const studentProfile = await collection.findOne({ _id: new ObjectId(user.studentId) });
      if (studentProfile) return res.json(studentProfile);
    }
    
    res.status(404).json({ message: "Profile not found" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ POSTS ROUTES ============

app.get("/posts", async (req, res) => {
  try {
    const db = client.db(dbName);
    const posts = await db.collection("posts").find({}).toArray();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/posts", upload.single('imageFile'), async (req, res) => {
  try {
    const db = client.db(dbName);
    const { author, content, time } = req.body;
    let imageUrl = req.file ? '/uploads/' + req.file.filename : '';
    
    const result = await db.collection("posts").insertOne({ author, content, imageUrl, time });
    res.json({ success: true, id: result.insertedId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============ EVENTS ROUTES ============

app.get("/events", async (req, res) => {
  try {
    const events = await req.app.locals.db.collection("events").find({}).toArray();
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ STUDENTS ROUTES ============

app.get("/students", async (req, res) => {
  try {
    const students = await collection.find({}).toArray();
    res.json(students);
  } catch (err) {
    res.status(500).send("Error: " + err.message);
  }
});

app.post("/student", async (req, res) => {
  try {
    const result = await collection.insertOne(req.body);
    const db = client.db(dbName);
    const usersCollection = db.collection("users");
    
    if (req.body.alumni_id) {
      await usersCollection.insertOne({
        username: req.body.alumni_id,
        password: req.body.alumni_id,
        studentId: result.insertedId,
        email: ""
      });
    }
    
    res.json({ message: "Inserted successfully", id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/student/:id", async (req, res) => {
  try {
    const result = await collection.deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json({ message: "Student deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ FUNDRAISING ROUTES ============

app.get('/api/fundraising', async (req, res) => {
  try {
    const funds = await fundsCollection.find().toArray();
    // ✅ Sort in JavaScript (Azure Cosmos DB compatible)
    funds.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    res.json(funds);
  } catch (err) {
    console.error('Error fetching funds:', err);
    res.status(500).json({ message: 'Error fetching funds' });
  }
});

app.get('/api/fundraising/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjectId(id)) return res.status(400).json({ message: 'Invalid fund id' });
    
    const fund = await fundsCollection.findOne({ _id: new ObjectId(id) });
    if (!fund) return res.status(404).json({ message: 'Fund not found' });
    
    res.json(fund);
  } catch (err) {
    console.error('Error fetching fund:', err);
    res.status(500).json({ message: 'Error fetching fund' });
  }
});

app.post('/api/fundraising', async (req, res) => {
  try {
    const { title, description = '', image = '', goal = 0 } = req.body;
    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: 'Title required' });
    }
    
    const fund = {
      title: String(title).trim(),
      description,
      image,
      goal: Number(goal) || 0,
      raised: 0,
      contributors: 0,
      date: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await fundsCollection.insertOne(fund);
    console.log('✅ Fund created:', result.insertedId);
    res.status(201).json({ _id: result.insertedId, ...fund });
  } catch (err) {
    console.error('Error creating fund:', err);
    res.status(500).json({ message: 'Error creating fund' });
  }
});

app.delete('/api/fundraising/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('[DELETE] Attempting to delete fund:', id);
    
    if (!isObjectId(id)) {
      console.log('[DELETE] Invalid ID format:', id);
      return res.status(400).json({ message: 'Invalid fund ID format' });
    }
    
    const result = await fundsCollection.deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      console.log('[DELETE] Fund not found:', id);
      return res.status(404).json({ message: 'Fund not found' });
    }
    
    console.log('[DELETE] ✅ Successfully deleted fund:', id);
    res.status(204).send();
    
  } catch (err) {
    console.error('[DELETE] Error:', err);
    res.status(500).json({ message: 'Server error deleting fund' });
  }
});

app.get('/api/fundraising/:id/contributions', async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjectId(id)) return res.status(400).json({ message: 'Invalid fund id' });
    
    const fund = await fundsCollection.findOne({ _id: new ObjectId(id) });
    if (!fund) return res.status(404).json({ message: 'Fund not found' });
    
    // ✅ NO .sort() - fetch all, then sort in JavaScript
    const list = await contributionsCollection.find({ fundId: id }).toArray();
    
    // ✅ Sort in JavaScript (Azure Cosmos DB compatible)
    list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    
    res.json(list);
  } catch (err) {
    console.error('Error fetching contributions:', err);
    res.status(500).json({ message: 'Error fetching contributions' });
  }
});

// ============ CONTRIBUTIONS ROUTES ============

app.post('/api/contributions', async (req, res) => {
  try {
    const b = req.body;
    const required = ['fundId', 'amount', 'firstName', 'lastName', 'email', 'phone', 'street', 'locality', 'city', 'state', 'country', 'pincode', 'transactionMode'];
    
    for (const f of required) {
      if (b[f] == null || (typeof b[f] === 'string' && b[f].trim() === '')) {
        return res.status(400).json({ message: `${f} is required` });
      }
    }
    
    if (!isObjectId(b.fundId)) return res.status(400).json({ message: 'Invalid fundId' });

    const amount = Number(b.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Amount must be positive' });
    }
    if (!emailRegex.test(b.email)) return res.status(400).json({ message: 'Invalid email' });
    if (!phoneRegex.test(b.phone)) return res.status(400).json({ message: 'Invalid phone' });
    if (!pincodeRegex.test(b.pincode)) return res.status(400).json({ message: 'Invalid pincode' });

    const fund = await fundsCollection.findOne({ _id: new ObjectId(b.fundId) });
    if (!fund) return res.status(404).json({ message: 'Fund not found' });

    const contribution = {
      fundId: b.fundId,
      amount,
      firstName: b.firstName.trim(),
      lastName: b.lastName.trim(),
      email: b.email.trim(),
      phone: b.phone.trim(),
      street: b.street,
      locality: b.locality,
      city: b.city,
      state: b.state,
      country: b.country,
      pincode: b.pincode,
      transactionMode: b.transactionMode,
      notes: b.notes,
      anonymous: !!b.anonymous,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await contributionsCollection.insertOne(contribution);
    await fundsCollection.updateOne(
      { _id: new ObjectId(b.fundId) }, 
      { $inc: { raised: amount, contributors: 1 }}
    );
    
    res.status(201).json({ message: 'Contribution saved', contributionId: result.insertedId });
  } catch (err) {
    console.error('Error saving contribution:', err);
    res.status(500).json({ message: 'Error saving contribution' });
  }
});

app.get('/api/contributions', async (req, res) => {
  try {
    // ✅ NO .sort() - fetch all, then sort in JavaScript
    const list = await contributionsCollection.find().limit(200).toArray();
    
    // ✅ Sort in JavaScript (Azure Cosmos DB compatible)
    list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    
    res.json(list);
  } catch (err) {
    console.error('Error fetching contributions:', err);
    res.status(500).json({ message: 'Error fetching contributions' });
  }
});

// ============ JOB ROUTES ============

app.get('/api/companies', async (req, res) => {
  try {
    const names = await Job.distinct('company');
    const clean = names.map(n => (n && String(n).trim()) || '').filter(Boolean);
    clean.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    res.json(clean);
  } catch (err) {
    console.error('Error fetching companies:', err);
    res.status(500).json({ message: 'Error fetching companies' });
  }
});

app.get('/api/job-areas', async (req, res) => {
  try {
    const areas = await Job.distinct('jobArea');
    const clean = areas.map(n => (n && String(n).trim()) || '').filter(Boolean);
    clean.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    res.json(clean);
  } catch (err) {
    console.error('Error fetching job areas:', err);
    res.status(500).json({ message: 'Error fetching job areas' });
  }
});

app.get('/api/skills', async (req, res) => {
  try {
    const skills = await Job.distinct('skills');
    const clean = skills.map(n => (n && String(n).trim()) || '').filter(Boolean);
    clean.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    res.json(clean);
  } catch (err) {
    console.error('Error fetching skills:', err);
    res.status(500).json({ message: 'Error fetching skills' });
  }
});

app.get('/api/locations', async (req, res) => {
  try {
    const locs = await Job.distinct('location');
    const clean = locs.map(n => (n && String(n).trim()) || '').filter(Boolean);
    clean.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    res.json(clean);
  } catch (err) {
    console.error('Error fetching locations:', err);
    res.status(500).json({ message: 'Error fetching locations' });
  }
});

// ✅ FIXED: No .sort() in database query
app.get('/api/jobs', async (req, res) => {
  try {
    const { company, jobArea, skill, location } = req.query;
    const query = {};

    if (company) query.company = { $regex: new RegExp(`^${escapeRegex(company)}$`, 'i') };
    if (jobArea) query.jobArea = { $regex: new RegExp(`^${escapeRegex(jobArea)}$`, 'i') };
    if (skill) query.skills = { $elemMatch: { $regex: new RegExp(`^${escapeRegex(skill)}$`, 'i') }};
    if (location) query.location = { $elemMatch: { $regex: new RegExp(`^${escapeRegex(location)}$`, 'i') }};

    // ✅ NO .sort() - Azure Cosmos DB fix
    const jobs = await Job.find(query);
    
    // ✅ Sort in JavaScript instead
    jobs.sort((a, b) => new Date(b.postedDate || 0) - new Date(a.postedDate || 0));
    
    console.log(`✅ Fetched ${jobs.length} jobs`);
    res.json(jobs);
  } catch (err) {
    console.error('Error fetching jobs:', err);
    res.status(500).json({ message: 'Error fetching jobs' });
  }
});

app.post('/api/jobs', async (req, res) => {
  try {
    const { jobTitle, company, companyWebsite, experienceFrom, experienceTo, location, contactEmail, jobArea, skills, salary, applicationDeadline, jobDescription } = req.body;

    if (!jobTitle || !company || !contactEmail || !jobDescription) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const job = new Job({
      jobTitle: String(jobTitle).trim(),
      company: String(company).trim(),
      companyWebsite: companyWebsite ? String(companyWebsite).trim() : undefined,
      experienceFrom: experienceFrom !== undefined && experienceFrom !== '' ? Number(experienceFrom) : undefined,
      experienceTo: experienceTo !== undefined && experienceTo !== '' ? Number(experienceTo) : undefined,
      location: normalizeToArray(location),
      contactEmail: String(contactEmail).trim(),
      jobArea: jobArea ? String(jobArea).trim() : undefined,
      skills: normalizeToArray(skills),
      salary: salary ? String(salary).trim() : undefined,
      applicationDeadline: applicationDeadline ? String(applicationDeadline).trim() : undefined,
      jobDescription: String(jobDescription).trim(),
    });

    const saved = await job.save();
    console.log('✅ Job posted:', saved._id);
    res.status(201).json({ message: 'Job posted!', job: saved });
  } catch (err) {
    console.error('Error posting job:', err);
    res.status(500).json({ message: 'Error saving job: ' + err.message });
  }
});

// ============ INTERNSHIP ROUTES ============

app.get('/api/internships/companies', async (req, res) => {
  try {
    const names = await Internship.distinct('company');
    const clean = names.map(n => (n && String(n).trim()) || '').filter(Boolean);
    clean.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    res.json(clean);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ message: 'Error fetching companies' });
  }
});

app.get('/api/internships/job-areas', async (req, res) => {
  try {
    const areas = await Internship.distinct('jobArea');
    const clean = areas.map(n => (n && String(n).trim()) || '').filter(Boolean);
    clean.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    res.json(clean);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ message: 'Error fetching job areas' });
  }
});

app.get('/api/internships/skills', async (req, res) => {
  try {
    const skills = await Internship.distinct('skills');
    const clean = skills.map(n => (n && String(n).trim()) || '').filter(Boolean);
    clean.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    res.json(clean);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ message: 'Error fetching skills' });
  }
});

app.get('/api/internships/locations', async (req, res) => {
  try {
    const locs = await Internship.distinct('location');
    const clean = locs.map(n => (n && String(n).trim()) || '').filter(Boolean);
    clean.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    res.json(clean);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ message: 'Error fetching locations' });
  }
});

// ✅ FIXED: No .sort() in database query
app.get('/api/internships', async (req, res) => {
  try {
    const { company, jobArea, skill, location } = req.query;
    const query = {};

    if (company) query.company = { $regex: new RegExp(`^${escapeRegex(company)}$`, 'i') };
    if (jobArea) query.jobArea = { $regex: new RegExp(`^${escapeRegex(jobArea)}$`, 'i') };
    if (skill) query.skills = { $elemMatch: { $regex: new RegExp(`^${escapeRegex(skill)}$`, 'i') }};
    if (location) query.location = { $elemMatch: { $regex: new RegExp(`^${escapeRegex(location)}$`, 'i') }};

    // ✅ NO .sort() - Azure Cosmos DB fix
    const internships = await Internship.find(query);
    
    // ✅ Sort in JavaScript instead
    internships.sort((a, b) => new Date(b.postedDate || 0) - new Date(a.postedDate || 0));
    
    console.log(`✅ Fetched ${internships.length} internships`);
    res.json(internships);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ message: 'Error fetching internships' });
  }
});

app.post('/api/internships', async (req, res) => {
  try {
    const { title, company, companyWebsite, duration, location, contactEmail, jobArea, skills, stipend, applicationDeadline, description } = req.body;

    if (!title || !company || !contactEmail || !description) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const internship = new Internship({
      title: String(title).trim(),
      company: String(company).trim(),
      companyWebsite: companyWebsite ? String(companyWebsite).trim() : undefined,
      duration: duration ? String(duration).trim() : undefined,
      location: normalizeToArray(location),
      contactEmail: String(contactEmail).trim(),
      jobArea: jobArea ? String(jobArea).trim() : undefined,
      skills: normalizeToArray(skills),
      stipend: stipend ? String(stipend).trim() : undefined,
      applicationDeadline: applicationDeadline ? String(applicationDeadline).trim() : undefined,
      description: String(description).trim(),
    });

    const saved = await internship.save();
    console.log('✅ Internship posted:', saved._id);
    res.status(201).json({ message: 'Internship posted!', internship: saved });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ message: 'Error saving internship' });
  }
});

// ============ STATIC FILES ============

app.use(express.static(path.join(__dirname, '../')));
app.use('/fund1', express.static(path.join(__dirname, '../fund1')));
app.use('/job_posting', express.static(path.join(__dirname, '../job_posting')));
app.use('/contribute', express.static(path.join(__dirname, '../contribute')));
app.use('/admin_portal', express.static(path.join(__dirname, '../admin_portal')));

app.get('/', (req, res) => {
  res.redirect('/index.html');
});

app.get('/api/health', async (req, res) => {
  const mongoState = client.topology?.isConnected() || false;
  const mongooseState = mongoose.connection.readyState === 1;
  let jobCount = null;
  let internshipCount = null;
  let fundCount = null;
  
  try {
    jobCount = await Job.estimatedDocumentCount();
    internshipCount = await Internship.estimatedDocumentCount();
    fundCount = await fundsCollection.countDocuments();
  } catch (err) {
    console.error('Health check error:', err);
  }
  
  res.json({ 
    ok: mongoState && mongooseState,
    environment: USE_AZURE ? 'Azure Cosmos DB' : 'Local MongoDB',
    mongodb: { connected: mongoState },
    mongoose: { connected: mongooseState, state: mongoose.connection.readyState },
    collections: { 
      jobs: jobCount, 
      internships: internshipCount,
      funds: fundCount
    },
    timestamp: new Date().toISOString()
  });
});

// ============ ERROR HANDLERS ============

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: 'API endpoint not found' });
  }
  res.status(404).send('Page not found');
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  if (err?.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  res.status(500).json({ message: 'Internal Server Error' });
});