'use strict';

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

/* ---- Config ---- */
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI ||
  'mongodb://127.0.0.1:27017/fundraisingDB';

/* ---- Middleware ---- */
// Allow Live Server origin (5501). Add more origins as needed.
app.use(cors({
  origin: [/^http:\/\/(localhost|127\.0\.0\.1):5501$/],
  credentials: false
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ---- Mongo ---- */
mongoose.connect(MONGO_URI, { autoIndex: true })
  .then(()=>console.log('Mongo connected'))
  .catch(err => { console.error(err); process.exit(1); });

/* ---- Schemas ---- */
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

/* ---- Helpers ---- */
const asyncRoute = fn => (req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);
const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const phoneRegex = /^(?:\+?91[- ]?)?[6-9]\d{9}$/;
const pincodeRegex = /^[1-9][0-9]{5}$/;

/* ---- Fund Routes ---- */
app.get('/api/fundraising', asyncRoute(async (_req,res) => {
  res.json(await Fund.find().sort({ createdAt: -1 }));
}));

app.get('/api/fundraising/:id', asyncRoute(async (req,res) => {
  const fund = await Fund.findById(req.params.id);
  if (!fund) return res.status(404).json({ message: 'Fund not found' });
  res.json(fund);
}));

app.post('/api/fundraising', asyncRoute(async (req,res) => {
  const { title, description='', image='', goal=0 } = req.body;
  if (!title) return res.status(400).json({ message:'Title is required' });
  const fund = await Fund.create({
    title: String(title).trim(),
    description, image,
    goal: Number(goal)||0,
    raised: 0, contributors: 0
  });
  res.status(201).json(fund);
}));

app.get('/api/fundraising/:id/contributions', asyncRoute(async (req,res) => {
  if (!await Fund.exists({ _id:req.params.id }))
    return res.status(404).json({ message: 'Fund not found' });
  const list = await Contribution.find({ fundId:req.params.id }).sort({ createdAt: -1 });
  res.json(list);
}));

/* ---- Contribution Routes ---- */
app.post('/api/contributions', asyncRoute(async (req,res) => {
  const b = req.body;
  const required = ['fundId','amount','firstName','lastName','email','phone','street','locality','city','state','country','pincode','transactionMode'];
  for (const f of required) {
    if (!b[f] || (typeof b[f] === 'string' && b[f].trim()===''))
      return res.status(400).json({ message: `${f} is required` });
  }
  const amount = Number(b.amount);
  if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ message:'Amount must be a positive number' });
  if (!emailRegex.test(b.email)) return res.status(400).json({ message:'Invalid email format' });
  if (!phoneRegex.test(b.phone)) return res.status(400).json({ message:'Invalid phone format' });
  if (!pincodeRegex.test(b.pincode)) return res.status(400).json({ message:'Invalid pincode format' });

  const fund = await Fund.findById(b.fundId);
  if (!fund) return res.status(404).json({ message:'Fund not found' });

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

/* ---- Health ---- */
app.get('/api/health', (_req,res)=>res.json({ ok:true }));

/* ---- 404 & Error ---- */
app.use((req,res)=>res.status(404).json({ message:'Not Found'}));
app.use((err,_req,res,_next)=>{
  console.error(err);
  res.status(500).json({ message:'Internal Server Error' });
});

/* ---- Start ---- */
app.listen(PORT, () => {
  console.log(`API server on http://localhost:${PORT}`);
});