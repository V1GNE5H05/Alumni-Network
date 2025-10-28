const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getCollection } = require('../config/database');
const { asyncHandler, validateEmail } = require('../utils/helpers');

// Get all students
router.get('/students', asyncHandler(async (req, res) => {
  const collection = getCollection('student');
  const students = await collection.find({}).toArray();
  res.json({ success: true, students });
}));

// Get statistics
router.get('/statistics', asyncHandler(async (req, res) => {
  const studentsCollection = getCollection('student');
  
  const totalAlumni = await studentsCollection.countDocuments();
  
  // Count unique departments
  const departments = await studentsCollection.distinct('department');
  const departmentCount = departments.length;
  
  // Count by status (assuming status field contains employment info)
  const employedCount = await studentsCollection.countDocuments({ 
    status: { $regex: /employed|working|job/i } 
  });
  
  const entrepreneurCount = await studentsCollection.countDocuments({ 
    status: { $regex: /entrepreneur|business|startup|self-employed/i } 
  });
  
  res.json({
    success: true,
    statistics: {
      departments: departmentCount,
      totalAlumni,
      employed: employedCount,
      entrepreneur: entrepreneurCount
    }
  });
}));

// Get profile by username/email/alumni_id
router.get('/profile/:username', asyncHandler(async (req, res) => {
  const collection = getCollection('student');
  const usersCollection = getCollection('users');
  
  // First try to find in the student collection
  const student = await collection.findOne({ 
    $or: [
      { alumni_id: req.params.username },
      { username: req.params.username },
      { userid: req.params.username },
      { email: req.params.username }
    ]
  });
  
  if (student) {
    return res.json({ success: true, alumni: student });
  }
  
  // If not found, try to find in users collection and get studentId
  const user = await usersCollection.findOne({
    $or: [
      { username: req.params.username },
      { email: req.params.username }
    ]
  });
  
  if (user && user.studentId) {
    const studentProfile = await collection.findOne({ 
      _id: new ObjectId(user.studentId) 
    });
    if (studentProfile) {
      return res.json({ success: true, alumni: studentProfile });
    }
  }
  
  res.status(404).json({ 
    success: false,
    message: "Profile not found" 
  });
}));

// Update profile
router.put('/profile/:username', asyncHandler(async (req, res) => {
  const collection = getCollection('student');
  const usersCollection = getCollection('users');
  
  const updateFields = { ...req.body };
  // Never allow alumni_id to be changed
  delete updateFields.alumni_id;
  
  // Validate email if present
  if (updateFields.email && !validateEmail(updateFields.email)) {
    return res.status(400).json({ 
      success: false,
      message: "Valid email required" 
    });
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
    await usersCollection.updateOne(
      { $or: [
        { username: req.params.username },
        { email: req.params.username }
      ] },
      { $set: { email: updateFields.email } }
    );
  }
  
  if (studentResult.matchedCount === 0) {
    return res.status(404).json({ 
      success: false,
      message: "Profile not found" 
    });
  }
  
  res.json({ 
    success: true,
    message: "Profile updated" 
  });
}));

// Change password
router.put('/profile/:username/password', asyncHandler(async (req, res) => {
  const usersCollection = getCollection('users');
  const { oldPassword, newPassword } = req.body;
  
  if (!oldPassword || !newPassword || newPassword.length < 5) {
    return res.status(400).json({ 
      success: false,
      message: "Invalid password data" 
    });
  }
  
  // Find user by username or email
  const user = await usersCollection.findOne({
    $or: [
      { username: req.params.username },
      { email: req.params.username }
    ]
  });
  
  if (!user) {
    return res.status(404).json({ 
      success: false,
      message: "User not found" 
    });
  }
  
  if (user.password !== oldPassword) {
    return res.status(400).json({ 
      success: false,
      message: "Old password is incorrect" 
    });
  }
  
  await usersCollection.updateOne(
    { _id: user._id },
    { $set: { password: newPassword } }
  );
  
  res.json({ 
    success: true,
    message: "Password updated" 
  });
}));

// Add new student
router.post('/student', asyncHandler(async (req, res) => {
  const collection = getCollection('student');
  const usersCollection = getCollection('users');
  
  const result = await collection.insertOne(req.body);
  
  // Add user with alumni_id as username and password
  if (req.body.alumni_id) {
    await usersCollection.insertOne({
      username: req.body.alumni_id,
      password: req.body.alumni_id,
      studentId: result.insertedId,
      email: req.body.email || ""
    });
  }
  
  res.json({ 
    success: true,
    message: "Student added successfully", 
    id: result.insertedId 
  });
}));

// Update student
router.put('/student/:id', asyncHandler(async (req, res) => {
  const collection = getCollection('student');
  const usersCollection = getCollection('users');
  const { id } = req.params;
  
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid student ID format' 
    });
  }
  
  const updateFields = { ...req.body };
  // Never allow _id to be changed
  delete updateFields._id;
  
  // Validate email if present
  if (updateFields.email && !validateEmail(updateFields.email)) {
    return res.status(400).json({ 
      success: false,
      message: "Valid email required" 
    });
  }
  
  const result = await collection.updateOne(
    { _id: new ObjectId(id) },
    { $set: updateFields }
  );
  
  if (result.matchedCount === 0) {
    return res.status(404).json({ 
      success: false,
      message: "Student not found" 
    });
  }
  
  // Update email in users collection if changed
  if (updateFields.email) {
    await usersCollection.updateOne(
      { studentId: new ObjectId(id) },
      { $set: { email: updateFields.email } }
    );
  }
  
  res.json({ 
    success: true,
    message: "Student updated successfully" 
  });
}));

// Delete student
router.delete('/student/:id', asyncHandler(async (req, res) => {
  const collection = getCollection('student');
  const result = await collection.deleteOne({ 
    _id: new ObjectId(req.params.id) 
  });
  
  if (result.deletedCount === 0) {
    return res.status(404).json({ 
      success: false,
      message: "Student not found" 
    });
  }
  
  res.json({ 
    success: true,
    message: "Student deleted" 
  });
}));

// Bulk delete students
router.post('/students/bulk-delete', asyncHandler(async (req, res) => {
  const collection = getCollection('student');
  const { ids } = req.body;
  
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid or empty IDs array' 
    });
  }
  
  const objectIds = ids.map(id => new ObjectId(id));
  const result = await collection.deleteMany({ 
    _id: { $in: objectIds } 
  });
  
  res.json({ 
    success: true,
    message: `${result.deletedCount} student(s) deleted successfully`,
    deletedCount: result.deletedCount
  });
}));

module.exports = router;
