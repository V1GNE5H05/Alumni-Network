const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const { MongoClient, ObjectId } = require("mongodb");
const mongoose = require('mongoose');

const app = express();
const port = process.env.PORT || 5000;

// Multer setup for image uploads
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


// General MongoDB connection string
const url = "mongodb+srv://vigneshkathirmani:Vignesh1105@alumni-network.iz9mqwz.mongodb.net/?retryWrites=true&w=majority&appName=alumni-network";
const dbName = "alumni_network";
const collectionName = "student";
const client = new MongoClient(url);
let collection;

async function connectDB() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB Compass/local");
    const db = client.db(dbName);
    collection = db.collection(collectionName);
    app.locals.db = db;
    
    // Initialize other collections
    fundsCollection = db.collection('funds');
    contributionsCollection = db.collection('contributions');
    
    return db;
  } catch (err) {
    console.error("❌ MongoDB Compass/local connection failed:", err);
    throw err;
  }
}


// Fundraising and Contribution collections
let fundsCollection;
let contributionsCollection;

// Mongoose Setup - for job posting and other schema-based collections
mongoose.set('bufferCommands', false);

// Initialize Job Schema
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
  applicationDeadline: String, // yyyy-mm-dd from <input type="date">
  jobDescription: { type: String, required: true },
  postedDate: { type: Date, default: Date.now },
});

// Initialize Internship Schema
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

// Set collection names
const Job = mongoose.model('Job', jobSchema, 'jobposts');
const Internship = mongoose.model('Internship', internshipSchema, 'internships');

// Connect both MongoDB clients and start server
(async () => {
  try {
    await connectDB(); // Connect traditional MongoDB client
    
    // Connect Mongoose - removed deprecated options
    await mongoose.connect(url + '/' + dbName);
    console.log("✅ Mongoose connected to", url + '/' + dbName);
    
    // Start server after successful DB connections
    app.listen(port, () => {
      console.log(`🚀 Server running at http://localhost:${port}`);
    });
  } catch (err) {
    console.error("Failed to start server due to DB connection issues:", err);
  }
})();


// Helpers
const asyncRoute = fn => (req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);
const phoneRegex = /^(?:\+?91[- ]?)?[6-9]\d{9}$/;
const pincodeRegex = /^[1-9][0-9]{5}$/;
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const isObjectId = id => /^[0-9a-fA-F]{24}$/.test(id);

// ---------------- USER AUTH & ADMIN ROUTES ---------------- //
// Login: checks users collection for username or email and password
app.post("/login", async (req, res) => {
  const { identifier, password, email } = req.body;
  const loginIdentifier = identifier || email;
  
  try {
    const db = client.db(dbName);
    const usersCollection = db.collection("users");
    
    // Try login by username or email
    const user = await usersCollection.findOne({ 
      $or: [ 
        { username: loginIdentifier }, 
        { email: loginIdentifier } 
      ], 
      password 
    });
    
    if (user) {
      console.log("Login successful for: " + loginIdentifier);
      res.json({ success: true, message: "Login successful" });
    } else {
      console.log("Invalid login attempt for: " + loginIdentifier);
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Add new alumni to users collection (username/userid and password same)
app.post("/add-user", async (req, res) => {
  const { username, userid } = req.body;
  const userIdentifier = username || userid;
  try {
    const db = client.db(dbName);
    const usersCollection = db.collection("users");
    if (!userIdentifier) return res.status(400).json({ message: "username/userid required" });
    
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

// ---------------- STUDENT/POST/EVENT ROUTES ---------------- //

// ---------------- STUDENT/PROFILE ROUTES ---------------- //
app.get("/profile/:username", async (req, res) => {
  try {
    const db = client.db(dbName);
    // First try to find in the student collection
    const student = await collection.findOne({ 
      $or: [
        { alumni_id: req.params.username },
        { username: req.params.username }, 
        { email: req.params.username }
      ]
    });
    
    if (student) {
      return res.json(student);
    }
    
    // If not found, try to find in users collection and get studentId
    const usersCollection = db.collection("users");
    const user = await usersCollection.findOne({
      $or: [
        { username: req.params.username },
        { email: req.params.username }
      ]
    });
    
    if (user && user.studentId) {
      // Get the student profile using studentId
      const studentProfile = await collection.findOne({ _id: new ObjectId(user.studentId) });
      if (studentProfile) {
        return res.json(studentProfile);
      }
    }
    
    res.status(404).json({ message: "Profile not found" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT: Update alumni profile (all fields except alumni_id, sync email to users)
app.put("/profile/:username", async (req, res) => {
  try {
    const db = client.db(dbName);
    const updateFields = { ...req.body };
    // Never allow alumni_id to be changed
    delete updateFields.alumni_id;
    // Validate email if present
    if (updateFields.email && !emailRegex.test(updateFields.email)) {
      return res.status(400).json({ message: "Valid email required" });
    }
    // Update in student collection
    const studentResult = await collection.updateOne(
      { $or: [
        { alumni_id: req.params.username },
        { username: req.params.username },
        { email: req.params.username }
      ] },
      { $set: updateFields }
    );
    // Update in users collection (for authentication)
    if (updateFields.email) {
      const usersCollection = db.collection("users");
      await usersCollection.updateOne(
        { $or: [
          { username: req.params.username },
          { email: req.params.username }
        ] },
        { $set: { email: updateFields.email } }
      );
    }
    if (studentResult.matchedCount === 0) {
      return res.status(404).json({ message: "Profile not found" });
    }
    res.json({ message: "Profile updated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT: Change password for alumni (check old password, update new password in users collection)
app.put("/profile/:username/password", async (req, res) => {
  try {
    const db = client.db(dbName);
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword || newPassword.length < 5) {
      return res.status(400).json({ message: "Invalid password data" });
    }
    const usersCollection = db.collection("users");
    // Find user by username or email
    const user = await usersCollection.findOne({
      $or: [
        { username: req.params.username },
        { email: req.params.username }
      ]
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.password !== oldPassword) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }
    await usersCollection.updateOne(
      { _id: user._id },
      { $set: { password: newPassword } }
    );
    res.json({ message: "Password updated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

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
    const postsCollection = db.collection("posts");
    const { author, content, time } = req.body;
    let imageUrl = '';
    if (req.file) {
      imageUrl = '/uploads/' + req.file.filename;
    }
    const result = await postsCollection.insertOne({ author, content, imageUrl, time });
    res.json({ success: true, id: result.insertedId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/events", async (req, res) => {
  try {
    const events = await req.app.locals.db.collection("events").find({}).toArray();
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/students", async (req, res) => {
  try {
    const students = await collection.find({}).toArray();
    res.json(students);
  } catch (err) {
    res.status(500).send("Error fetching students: " + err.message);
  }
});


app.post("/student", async (req, res) => {
  try {
    const result = await collection.insertOne(req.body);
    // Add user with alumni_id as username and password, studentId as ObjectId, email as empty
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

// ---------------- FUNDRAISING ROUTES ---------------- //

app.get('/api/fundraising', async (req, res) => {
  try {
    const funds = await fundsCollection.find().sort({ createdAt: -1 }).toArray();
    res.json(funds);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching funds' });
  }
});


app.get('/api/fundraising/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjectId(id)) return res.status(400).json({ message: 'Invalid fund id format' });
    const fund = await fundsCollection.findOne({ _id: new ObjectId(id) });
    if (!fund) return res.status(404).json({ message: 'Fund not found' });
    res.json(fund);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching fund' });
  }
});


app.post('/api/fundraising', async (req, res) => {
  try {
    const { title, description = '', image = '', goal = 0 } = req.body;
    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: 'Title is required' });
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
    res.status(201).json(result.ops ? result.ops[0] : fund);
  } catch (err) {
    res.status(500).json({ message: 'Error creating fund' });
  }
});


app.get('/api/fundraising/:id/contributions', async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjectId(id)) return res.status(400).json({ message: 'Invalid fund id format' });
    const fund = await fundsCollection.findOne({ _id: new ObjectId(id) });
    if (!fund) return res.status(404).json({ message: 'Fund not found' });
    const list = await contributionsCollection.find({ fundId: id }).sort({ createdAt: -1 }).toArray();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching contributions' });
  }
});

// ---------------- CONTRIBUTION ROUTES ---------------- //

app.post('/api/contributions', async (req, res) => {
  try {
    const b = req.body;
    const required = ['fundId','amount','firstName','lastName','email','phone','street','locality','city','state','country','pincode','transactionMode'];
    for (const f of required) {
      if (b[f] == null || (typeof b[f] === 'string' && b[f].trim() === '')) {
        return res.status(400).json({ message: `${f} is required` });
      }
    }
    if (!isObjectId(b.fundId)) return res.status(400).json({ message: 'Invalid fundId format' });

    const amount = Number(b.amount);
    if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ message: 'Amount must be a positive number' });
    if (!emailRegex.test(b.email))   return res.status(400).json({ message: 'Invalid email format' });
    if (!phoneRegex.test(b.phone))   return res.status(400).json({ message: 'Invalid phone format' });
    if (!pincodeRegex.test(b.pincode)) return res.status(400).json({ message: 'Invalid pincode format' });

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
    await fundsCollection.updateOne({ _id: new ObjectId(b.fundId) }, { $inc: { raised: amount, contributors: 1 } });
    res.status(201).json({ message: 'Contribution saved', contributionId: result.insertedId });
  } catch (err) {
    res.status(500).json({ message: 'Error saving contribution' });
  }
});


app.get('/api/contributions', async (req, res) => {
  try {
    const list = await contributionsCollection.find().sort({ createdAt: -1 }).limit(200).toArray();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching contributions' });
  }
});

// ---------------- JOB POSTING ROUTES ---------------- //

// Helper functions for job/internship routes
function normalizeToArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).map((s) => s.trim()).filter(Boolean);
  return String(value).split(',').map((s) => s.trim()).filter(Boolean);
}

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ---------- JOB ROUTES ----------
// Distinct lists for filters
app.get('/api/companies', async (_req, res) => {
  try {
    const names = await Job.distinct('company');
    const clean = names.map((n) => (n && String(n).trim()) || '').filter(Boolean);
    clean.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    res.json(clean);
  } catch (err) {
    console.error('GET /api/companies error:', err);
    res.status(500).json({ message: 'Error fetching companies' });
  }
});

app.get('/api/job-areas', async (_req, res) => {
  try {
    const areas = await Job.distinct('jobArea');
    const clean = areas.map((n) => (n && String(n).trim()) || '').filter(Boolean);
    clean.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    res.json(clean);
  } catch (err) {
    console.error('GET /api/job-areas error:', err);
    res.status(500).json({ message: 'Error fetching job areas' });
  }
});

app.get('/api/skills', async (_req, res) => {
  try {
    const skills = await Job.distinct('skills');
    const clean = skills.map((n) => (n && String(n).trim()) || '').filter(Boolean);
    clean.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    res.json(clean);
  } catch (err) {
    console.error('GET /api/skills error:', err);
    res.status(500).json({ message: 'Error fetching skills' });
  }
});

app.get('/api/locations', async (_req, res) => {
  try {
    const locs = await Job.distinct('location');
    const clean = locs.map((n) => (n && String(n).trim()) || '').filter(Boolean);
    clean.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    res.json(clean);
  } catch (err) {
    console.error('GET /api/locations error:', err);
    res.status(500).json({ message: 'Error fetching locations' });
  }
});

// Jobs with filters
app.get('/api/jobs', async (req, res) => {
  try {
    const { company, jobArea, skill, location } = req.query;
    const query = {};

    if (company) {
      query.company = { $regex: new RegExp(`^${escapeRegex(company)}$`, 'i') };
    }
    if (jobArea) {
      query.jobArea = { $regex: new RegExp(`^${escapeRegex(jobArea)}$`, 'i') };
    }
    if (skill) {
      query.skills = { $elemMatch: { $regex: new RegExp(`^${escapeRegex(skill)}$`, 'i') } };
    }
    if (location) {
      query.location = { $elemMatch: { $regex: new RegExp(`^${escapeRegex(location)}$`, 'i') } };
    }

    const jobs = await Job.find(query).sort({ postedDate: -1 });
    res.json(jobs);
  } catch (err) {
    console.error('GET /api/jobs error:', err);
    res.status(500).json({ message: 'Error fetching jobs' });
  }
});

// Post a new job
app.post('/api/jobs', async (req, res) => {
  try {
    console.log('Received job submission:', JSON.stringify(req.body, null, 2));
    
    const {
      jobTitle, company, companyWebsite, experienceFrom, experienceTo,
      location, contactEmail, jobArea, skills, salary,
      applicationDeadline, jobDescription,
    } = req.body;

    if (!jobTitle || !company || !contactEmail || !jobDescription) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const job = new Job({
      jobTitle: String(jobTitle).trim(),
      company: String(company).trim(),
      companyWebsite: companyWebsite ? String(companyWebsite).trim() : undefined,
      experienceFrom: experienceFrom !== undefined && experienceFrom !== '' ? Number(experienceFrom) : undefined,
      experienceTo: experienceTo !== undefined && experienceTo !== '' ? Number(experienceTo) : undefined,
      location: location ? normalizeToArray(location) : [],
      contactEmail: String(contactEmail).trim(),
      jobArea: jobArea ? String(jobArea).trim() : undefined,
      skills: skills ? normalizeToArray(skills) : [],
      salary: salary ? String(salary).trim() : undefined,
      applicationDeadline: applicationDeadline ? String(applicationDeadline).trim() : undefined,
      jobDescription: String(jobDescription).trim(),
    });

    const saved = await job.save();
    console.log('Job saved successfully:', saved._id);
    res.status(201).json({ message: 'Job posted!', job: saved });
  } catch (err) {
    console.error('POST /api/jobs error:', err);
    res.status(500).json({ message: 'Error saving job: ' + err.message });
  }
});

// ---------- INTERNSHIP ROUTES ----------
// Distinct lists for internship filters
app.get('/api/internships/companies', async (_req, res) => {
  try {
    const names = await Internship.distinct('company');
    const clean = names.map((n) => (n && String(n).trim()) || '').filter(Boolean);
    clean.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    res.json(clean);
  } catch (err) {
    console.error('GET /api/internships/companies error:', err);
    res.status(500).json({ message: 'Error fetching internship companies' });
  }
});

app.get('/api/internships/job-areas', async (_req, res) => {
  try {
    const areas = await Internship.distinct('jobArea');
    const clean = areas.map((n) => (n && String(n).trim()) || '').filter(Boolean);
    clean.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    res.json(clean);
  } catch (err) {
    console.error('GET /api/internships/job-areas error:', err);
    res.status(500).json({ message: 'Error fetching internship job areas' });
  }
});

app.get('/api/internships/skills', async (_req, res) => {
  try {
    const skills = await Internship.distinct('skills');
    const clean = skills.map((n) => (n && String(n).trim()) || '').filter(Boolean);
    clean.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    res.json(clean);
  } catch (err) {
    console.error('GET /api/internships/skills error:', err);
    res.status(500).json({ message: 'Error fetching internship skills' });
  }
});

app.get('/api/internships/locations', async (_req, res) => {
  try {
    const locs = await Internship.distinct('location');
    const clean = locs.map((n) => (n && String(n).trim()) || '').filter(Boolean);
    clean.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    res.json(clean);
  } catch (err) {
    console.error('GET /api/internships/locations error:', err);
    res.status(500).json({ message: 'Error fetching internship locations' });
  }
});

// Internships with filters
app.get('/api/internships', async (req, res) => {
  try {
    const { company, jobArea, skill, location } = req.query;
    const query = {};

    if (company) {
      query.company = { $regex: new RegExp(`^${escapeRegex(company)}$`, 'i') };
    }
    if (jobArea) {
      query.jobArea = { $regex: new RegExp(`^${escapeRegex(jobArea)}$`, 'i') };
    }
    if (skill) {
      query.skills = { $elemMatch: { $regex: new RegExp(`^${escapeRegex(skill)}$`, 'i') } };
    }
    if (location) {
      query.location = { $elemMatch: { $regex: new RegExp(`^${escapeRegex(location)}$`, 'i') } };
    }

    const internships = await Internship.find(query).sort({ postedDate: -1 });
    res.json(internships);
  } catch (err) {
    console.error('GET /api/internships error:', err);
    res.status(500).json({ message: 'Error fetching internships' });
  }
});

// Post a new internship
app.post('/api/internships', async (req, res) => {
  try {
    const {
      title, company, companyWebsite, duration,
      location, contactEmail, jobArea, skills, stipend,
      applicationDeadline, description,
    } = req.body;

    if (!title || !company || !contactEmail || !description) {
      return res.status(400).json({ message: 'Missing required fields.' });
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
    res.status(201).json({ message: 'Internship posted!', internship: saved });
  } catch (err) {
    console.error('POST /api/internships error:', err);
    res.status(500).json({ message: 'Error saving internship.' });
  }
});

// ---------------- HEALTH & ROOT ---------------- //
app.get('/api/health', async (_req,res) => {
  const mongoState = client.topology?.isConnected() || false;
  const mongooseState = mongoose.connection.readyState === 1;
  const jobCount = await Job.estimatedDocumentCount().catch(() => null);
  const internshipCount = await Internship.estimatedDocumentCount().catch(() => null);
  
  res.json({ 
    ok: mongoState && mongooseState, 
    mongodb: {
      connected: mongoState,
      url: url + '/' + dbName
    },
    mongoose: {
      connected: mongooseState,
      state: mongoose.connection.readyState
    },
    collections: {
      jobs: jobCount,
      internships: internshipCount
    }
  });
});

// Root routes
app.get('/', (_req,res) => res.redirect('/fund.html'));
app.get('/jobs', (_req, res) => res.sendFile(path.join(__dirname, '../job_posting/job-sidebar.html')));

// ---------------- 404 & ERROR ---------------- //
app.use((req,res) => res.status(404).json({ message: 'Not Found' }));
app.use((err,_req,res,_next) => {
  console.error('Unhandled Error:', err);
  if (err?.name === 'CastError') return res.status(400).json({ message: 'Invalid id format' });
  res.status(500).json({ message: 'Internal Server Error' });
});