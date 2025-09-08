
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const { MongoClient, ObjectId } = require("mongodb");


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


// MongoDB Compass/local connection string
const LOCAL_URI = "mongodb://localhost:27017";
const dbName = "alumni_network";
const collectionName = "student";
const client = new MongoClient(LOCAL_URI);
let collection;
async function connectDB() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB Compass/local");
    const db = client.db(dbName);
    collection = db.collection(collectionName);
    app.locals.db = db;
  } catch (err) {
    console.error("❌ MongoDB Compass/local connection failed:", err);
  }
}
connectDB();


// Fundraising and Contribution collections
let fundsCollection;
let contributionsCollection;
connectDB().then(() => {
  const db = client.db(dbName);
  fundsCollection = db.collection('funds');
  contributionsCollection = db.collection('contributions');
});

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
    const db = client.db(dbName);
    const usersCollection = db.collection("users");
    const user = await usersCollection.findOne({ email: email, password: password });
    if (user) {
      res.json({ success: true, message: "Login successful" });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Add new alumni to users collection (userid and password same)
app.post("/add-user", async (req, res) => {
  const { userid } = req.body;
  try {
    const db = client.db(dbName);
    const usersCollection = db.collection("users");
    if (!userid) return res.status(400).json({ message: "userid required" });
    await usersCollection.insertOne({ email: userid, password: userid });
    res.json({ message: "User added", userid });
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
