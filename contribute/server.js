'use strict';

/**
 * server.js (no dotenv dependency)
 * Run from project root:
 *   node server.js
 * Static files served from ./public
 */

const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

/* ------------- Config ------------- */
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fundraisingDB';

/* ------------- App Setup ------------- */
const app = express();
app.use(cors());
app.use(express.json({ limit: '250kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

/* ------------- Mongo Connection ------------- */
mongoose.connect(MONGO_URI, { autoIndex: true })
  .then(() => console.log('✅ MongoDB connected:', MONGO_URI))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

/* ------------- Schemas ------------- */
const fundSchema = new mongoose.Schema({
  title:        { type: String, required: true, trim: true },
  description:  { type: String, default: '' },
  image:        { type: String, default: '' },
  goal:         { type: Number, default: 0 },
  raised:       { type: Number, default: 0 },
  contributors: { type: Number, default: 0 },
  date:         { type: Date, default: Date.now }
}, { timestamps: true });

const contributionSchema = new mongoose.Schema({
  fundId:          { type: mongoose.Schema.Types.ObjectId, ref: 'Fund', required: true, index: true },
  amount:          { type: Number, required: true, min: 1 },
  firstName:       { type: String, required: true, trim: true },
  lastName:        { type: String, required: true, trim: true },
  email:           { type: String, required: true, trim: true },
  phone:           { type: String, required: true, trim: true },
  street:          { type: String, required: true },
  locality:        { type: String, required: true },
  city:            { type: String, required: true },
  state:           { type: String, required: true },
  country:         { type: String, required: true },
  pincode:         { type: String, required: true },
  transactionMode: { type: String, required: true, enum: ['online','upi','netbanking','card','cheque','cash'] },
  notes:           { type: String, maxlength: 500 },
  anonymous:       { type: Boolean, default: false }
}, { timestamps: true });

const Fund = mongoose.model('Fund', fundSchema);
const Contribution = mongoose.model('Contribution', contributionSchema);

/* ------------- Helpers ------------- */
const asyncRoute = fn => (req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);
const isObjectId = id => /^[0-9a-fA-F]{24}$/.test(id);

const emailRegex   = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const phoneRegex   = /^(?:\+?91[- ]?)?[6-9]\d{9}$/;
const pincodeRegex = /^[1-9][0-9]{5}$/;

/* ------------- Seed (optional) ------------- */
(async () => {
  try {
    if (await Fund.countDocuments() === 0) {
      const seed = await Fund.create({
        title: 'Sample Seed Fund',
        description: 'Auto-created fund. Add your own via POST /api/fundraising.',
        goal: 50000
      });
      console.log('🌱 Seed fund id:', seed._id.toString());
      console.log(`🔗 Contribute: http://localhost:${PORT}/contribute/contribute.html?fundId=${seed._id}&title=${encodeURIComponent(seed.title)}`);
    }
  } catch (e) {
    console.error('Seed error:', e);
  }
})();

/* ------------- Fund Routes ------------- */
app.get('/api/fundraising', asyncRoute(async (_req,res) => {
  const funds = await Fund.find().sort({ createdAt: -1 });
  res.json(funds);
}));

app.get('/api/fundraising/:id', asyncRoute(async (req,res) => {
  const { id } = req.params;
  if (!isObjectId(id)) return res.status(400).json({ message: 'Invalid fund id format' });
  const fund = await Fund.findById(id);
  if (!fund) return res.status(404).json({ message: 'Fund not found' });
  res.json(fund);
}));

app.post('/api/fundraising', asyncRoute(async (req,res) => {
  const { title, description = '', image = '', goal = 0 } = req.body;
  if (!title || !String(title).trim()) {
    return res.status(400).json({ message: 'Title is required' });
  }
  const fund = await Fund.create({
    title: String(title).trim(),
    description,
    image,
    goal: Number(goal) || 0,
    raised: 0,
    contributors: 0
  });
  res.status(201).json(fund);
}));

app.get('/api/fundraising/:id/contributions', asyncRoute(async (req,res) => {
  const { id } = req.params;
  if (!isObjectId(id)) return res.status(400).json({ message: 'Invalid fund id format' });
  if (!await Fund.exists({ _id:id })) return res.status(404).json({ message: 'Fund not found' });
  const list = await Contribution.find({ fundId:id }).sort({ createdAt: -1 });
  res.json(list);
}));

/* ------------- Contribution Routes ------------- */
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

  res.status(201).json({
    message: 'Contribution saved',
    contributionId: contribution._id
  });
}));

app.get('/api/contributions', asyncRoute(async (_req,res) => {
  const list = await Contribution.find().sort({ createdAt: -1 }).limit(200);
  res.json(list);
}));

/* ------------- Health & Root ------------- */
app.get('/api/health', (_req,res) => res.json({ ok:true, port:PORT }));
app.get('/', (_req,res) => res.redirect('/fund.html'));

/* ------------- 404 & Error ------------- */
app.use((req,res) => res.status(404).json({ message: 'Not Found' }));
app.use((err,_req,res,_next) => {
  console.error('Unhandled Error:', err);
  if (err?.name === 'CastError') return res.status(400).json({ message: 'Invalid id format' });
  res.status(500).json({ message: 'Internal Server Error' });
});

/* ------------- Start ------------- */
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});