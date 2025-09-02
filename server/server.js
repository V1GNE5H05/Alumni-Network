// Create a new post

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();
const port = 5000;

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
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Create a new post with image upload
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

// MongoDB connection
const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);
const dbName = "alumni_network";
const collectionName = "student";

let collection;

async function connectDB() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");
    const db = client.db(dbName);
    collection = db.collection(collectionName);
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
  }
}
connectDB();

// ---------------- ROUTES ---------------- //

// Get all students
// Get profile by email
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

// Get posts (example: all posts in a 'posts' collection)
app.get("/posts", async (req, res) => {
  try {
    const db = client.db(dbName);
    const posts = await db.collection("posts").find({}).toArray();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get events (example: all events in an 'events' collection)
app.get("/events", async (req, res) => {
  try {
    const events = await req.app.locals.db.collection("events").find({}).toArray();
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Login authentication
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

// Add a student
app.post("/student", async (req, res) => {
  try {
    const result = await collection.insertOne(req.body);
    res.json({ message: "Inserted successfully", id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a student by ID
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

// ---------------- SERVER ---------------- //
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
