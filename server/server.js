
// Combined server.js: Student, Post, Fundraising, Contribution APIs

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const { MongoClient, ObjectId } = require("mongodb");
const mongoose = require("mongoose");

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


// MongoDB Atlas connection string
const ATLAS_URI = "mongodb+srv://vigneshkathirmani:Vignesh1105@alumni-network.iz9mqwz.mongodb.net/?retryWrites=true&w=majority&appName=alumni-network";
const dbName = "alumni_network";
const collectionName = "student";
const client = new MongoClient(ATLAS_URI);
let collection;
async function connectDB() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB Atlas");
    const db = client.db(dbName);
    collection = db.collection(collectionName);
    app.locals.db = db;
  } catch (err) {
    console.error("❌ MongoDB Atlas connection failed:", err);
  }
}
connectDB();

// Mongoose connection for fundraising/contributions (Atlas)
const MONGO_URI = ATLAS_URI;
mongoose.connect(MONGO_URI, { autoIndex: true })
  .then(() => console.log('✅ Mongoose connected to Atlas:', MONGO_URI))
  .catch(err => { console.error('❌ Mongoose Atlas error:', err); process.exit(1); });

// Fundraising schemas
const fundSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  image: { type: String, default: '' },
  goal: { type: Number, default: 0 },
  raised: { type: Number, default: 0 },
  contributors: { type: Number, default: 0 },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

const contributionSchema = new mongoose.Schema({
  fundId: { type: mongoose.Schema.Types.ObjectId, ref: 'Fund', required: true, index: true },
  amount: { type: Number, required: true, min: 1 },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  street: { type: String, required: true },
  locality: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  pincode: { type: String, required: true },
  transactionMode: { type: String, required: true, enum: ['online','upi','netbanking','card','cheque','cash'] },
  notes: { type: String, maxlength: 500 },
  anonymous: { type: Boolean, default: false }
}, { timestamps: true });

const Fund = mongoose.model('Fund', fundSchema);
const Contribution = mongoose.model('Contribution', contributionSchema);

// Helpers
const asyncRoute = fn => (req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);
const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const phoneRegex = /^(?:\+?91[- ]?)?[6-9]\d{9}$/;
const pincodeRegex = /^[1-9][0-9]{5}$/;
const isObjectId = id => /^[0-9a-fA-F]{24}$/.test(id);

// ---------------- STUDENT/POST/EVENT ROUTES ---------------- //
app.get("/profile/:email", async (req, res) => {
  try {
    const user = await collection.findOne({ email: req.params.email });
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: "Profile not found" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
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

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await collection.findOne({ email: email, password: password });
    if (user) {
      res.json({ success: true, message: "Login successful" });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
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
    // Also add to users collection
    const db = client.db(dbName);
    const usersCollection = db.collection("users");
    if (req.body.email) {
      await usersCollection.insertOne({ email: req.body.email, password: req.body.email });
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
app.get('/api/fundraising', asyncRoute(async (_req,res) => {
  res.json(await Fund.find().sort({ createdAt: -1 }));
}));

app.get('/api/fundraising/:id', asyncRoute(async (req,res) => {
  const { id } = req.params;
  if (!isObjectId(id)) return res.status(400).json({ message: 'Invalid fund id format' });
  const fund = await Fund.findById(id);
  if (!fund) return res.status(404).json({ message: 'Fund not found' });
  res.json(fund);
}));

app.post('/api/fundraising', asyncRoute(async (req,res) => {
  const { title, description='', image='', goal=0 } = req.body;
  if (!title || !String(title).trim()) {
    return res.status(400).json({ message:'Title is required' });
  }
  const fund = await Fund.create({
    title: String(title).trim(),
    description, image,
    goal: Number(goal)||0,
    raised: 0, contributors: 0
  });
  res.status(201).json(fund);
}));

app.get('/api/fundraising/:id/contributions', asyncRoute(async (req,res) => {
  const { id } = req.params;
  if (!isObjectId(id)) return res.status(400).json({ message: 'Invalid fund id format' });
  if (!await Fund.exists({ _id:id }))
    return res.status(404).json({ message: 'Fund not found' });
  const list = await Contribution.find({ fundId:id }).sort({ createdAt: -1 });
  res.json(list);
}));

// ---------------- CONTRIBUTION ROUTES ---------------- //
app.post('/api/contributions', asyncRoute(async (req,res) => {
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

  const fund = await Fund.findById(b.fundId);
  if (!fund) return res.status(404).json({ message: 'Fund not found' });

  const contribution = await Contribution.create({
    fundId: fund._id,
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
    anonymous: !!b.anonymous
  });

  await Fund.updateOne({ _id: fund._id }, { $inc: { raised: amount, contributors: 1 } });

  res.status(201).json({ message: 'Contribution saved', contributionId: contribution._id });
}));

app.get('/api/contributions', asyncRoute(async (_req,res) => {
  const list = await Contribution.find().sort({ createdAt: -1 }).limit(200);
  res.json(list);
}));

// ---------------- HEALTH & ROOT ---------------- //
app.get('/api/health', (_req,res) => res.json({ ok:true, port:port }));
app.get('/', (_req,res) => res.redirect('/fund.html'));

// ---------------- 404 & ERROR ---------------- //
app.use((req,res) => res.status(404).json({ message: 'Not Found' }));
app.use((err,_req,res,_next) => {
  console.error('Unhandled Error:', err);
  if (err?.name === 'CastError') return res.status(400).json({ message: 'Invalid id format' });
  res.status(500).json({ message: 'Internal Server Error' });
});

// ---------------- SERVER ---------------- //
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
