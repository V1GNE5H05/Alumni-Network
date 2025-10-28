const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getCollection } = require('../config/database');
const { asyncHandler, isObjectId, validateEmail, validatePhone, validatePincode } = require('../utils/helpers');

// Get all funds
router.get('/fundraising', asyncHandler(async (req, res) => {
  const fundsCollection = getCollection('funds');
  const funds = await fundsCollection.find().sort({ createdAt: -1 }).toArray();
  
  const mappedFunds = funds.map(fund => ({
    ...fund,
    id: fund._id?.toString(),
    _id: fund._id?.toString()
  }));
  
  res.json(mappedFunds);
}));

// Get single fund
router.get('/fundraising/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!isObjectId(id)) {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid fund id format' 
    });
  }
  
  const fundsCollection = getCollection('funds');
  const fund = await fundsCollection.findOne({ _id: new ObjectId(id) });
  
  if (!fund) {
    return res.status(404).json({ 
      success: false,
      message: 'Fund not found' 
    });
  }
  
  res.json(fund);
}));

// Create fund
router.post('/fundraising', asyncHandler(async (req, res) => {
  const fundsCollection = getCollection('funds');
  const { title, description = '', image = '', goal = 0 } = req.body;
  
  if (!title || !String(title).trim()) {
    return res.status(400).json({ 
      success: false,
      message: 'Title is required' 
    });
  }
  
  const goalNum = Number(goal);
  if (!Number.isFinite(goalNum) || goalNum <= 0) {
    return res.status(400).json({ 
      success: false,
      message: 'Goal must be a positive number' 
    });
  }

  const fund = {
    title: String(title).trim(),
    description,
    image,
    goal: goalNum,
    raised: 0,
    contributors: 0,
    date: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const result = await fundsCollection.insertOne(fund);
  fund._id = result.insertedId;
  
  res.status(201).json({
    success: true,
    message: 'Fund created successfully',
    fund
  });
}));

// Update fund
router.put('/fundraising/:id', asyncHandler(async (req, res) => {
  const fundsCollection = getCollection('funds');
  const { id } = req.params;
  const { title, description, goal } = req.body;
  
  if (!isObjectId(id)) {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid fund id format' 
    });
  }
  
  const updateFields = { updatedAt: new Date() };
  
  if (title !== undefined) {
    if (!String(title).trim()) {
      return res.status(400).json({ 
        success: false,
        message: 'Title cannot be empty' 
      });
    }
    updateFields.title = String(title).trim();
  }
  
  if (description !== undefined) {
    updateFields.description = description;
  }
  
  if (goal !== undefined) {
    const goalNum = Number(goal);
    if (!Number.isFinite(goalNum) || goalNum <= 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Goal must be a positive number' 
      });
    }
    updateFields.goal = goalNum;
  }
  
  const result = await fundsCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: updateFields }
  );
  
  if (result.matchedCount === 0) {
    return res.status(404).json({ 
      success: false,
      message: 'Fund not found' 
    });
  }
  
  res.json({
    success: true,
    message: 'Fund updated successfully'
  });
}));

// Delete fund
router.delete('/fundraising/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!isObjectId(id)) {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid fund id format' 
    });
  }
  
  const fundsCollection = getCollection('funds');
  const result = await fundsCollection.deleteOne({ _id: new ObjectId(id) });
  
  if (result.deletedCount === 0) {
    return res.status(404).json({ 
      success: false,
      message: 'Fund not found' 
    });
  }
  
  res.json({ 
    success: true,
    message: 'Fund deleted successfully' 
  });
}));

// Bulk delete funds
router.post('/fundraising/bulk-delete', asyncHandler(async (req, res) => {
  const fundsCollection = getCollection('funds');
  const { ids } = req.body;
  
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid or empty IDs array' 
    });
  }
  
  const invalidIds = ids.filter(id => !isObjectId(id));
  if (invalidIds.length > 0) {
    return res.status(400).json({ 
      success: false,
      message: 'Some IDs are invalid' 
    });
  }
  
  const objectIds = ids.map(id => new ObjectId(id));
  const result = await fundsCollection.deleteMany({ 
    _id: { $in: objectIds } 
  });
  
  res.json({ 
    success: true,
    message: `${result.deletedCount} fund(s) deleted successfully`,
    deletedCount: result.deletedCount
  });
}));

// Get contributions for a fund
router.get('/fundraising/:id/contributions', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!isObjectId(id)) {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid fund id format' 
    });
  }
  
  const fundsCollection = getCollection('funds');
  const contributionsCollection = getCollection('contributions');
  
  const fund = await fundsCollection.findOne({ _id: new ObjectId(id) });
  if (!fund) {
    return res.status(404).json({ 
      success: false,
      message: 'Fund not found' 
    });
  }
  
  const list = await contributionsCollection.find({ fundId: id })
    .sort({ createdAt: -1 })
    .toArray();
  
  res.json(list);
}));

// Submit contribution
router.post('/contributions', asyncHandler(async (req, res) => {
  const contributionsCollection = getCollection('contributions');
  const fundsCollection = getCollection('funds');
  
  const b = req.body;
  const required = ['fundId','amount','firstName','lastName','email','phone','street','locality','city','state','country','pincode','transactionMode'];
  
  for (const f of required) {
    if (b[f] == null || (typeof b[f] === 'string' && b[f].trim() === '')) {
      return res.status(400).json({ 
        success: false,
        message: `${f} is required` 
      });
    }
  }
  
  if (!isObjectId(b.fundId)) {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid fundId format' 
    });
  }

  const amount = Number(b.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ 
      success: false,
      message: 'Amount must be a positive number' 
    });
  }
  
  if (!validateEmail(b.email)) {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid email format' 
    });
  }
  
  if (!validatePhone(b.phone)) {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid phone format' 
    });
  }
  
  if (!validatePincode(b.pincode)) {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid pincode format' 
    });
  }

  const fund = await fundsCollection.findOne({ _id: new ObjectId(b.fundId) });
  if (!fund) {
    return res.status(404).json({ 
      success: false,
      message: 'Fund not found' 
    });
  }

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
    notes: b.notes || '',
    anonymous: !!b.anonymous,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const result = await contributionsCollection.insertOne(contribution);
  await fundsCollection.updateOne(
    { _id: new ObjectId(b.fundId) }, 
    { $inc: { raised: amount, contributors: 1 } }
  );
  
  res.status(201).json({ 
    success: true,
    message: 'Contribution saved successfully', 
    contributionId: result.insertedId 
  });
}));

// Get all contributions
router.get('/contributions', asyncHandler(async (req, res) => {
  const contributionsCollection = getCollection('contributions');
  const list = await contributionsCollection.find()
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();
  res.json(list);
}));

module.exports = router;
