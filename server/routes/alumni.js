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
  const bcrypt = require('bcrypt');
  const usersCollection = getCollection('users');
  const { oldPassword, newPassword } = req.body;
  
  // Enhanced password validation
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ 
      success: false,
      message: "❌ Old password and new password are required" 
    });
  }
  
  // Validate new password strength
  if (newPassword.length < 8) {
    return res.status(400).json({ 
      success: false,
      message: "❌ New password must be at least 8 characters long" 
    });
  }
  
  if (!/[A-Z]/.test(newPassword)) {
    return res.status(400).json({ 
      success: false,
      message: "❌ New password must contain at least one uppercase letter" 
    });
  }
  
  if (!/[a-z]/.test(newPassword)) {
    return res.status(400).json({ 
      success: false,
      message: "❌ New password must contain at least one lowercase letter" 
    });
  }
  
  if (!/[0-9]/.test(newPassword)) {
    return res.status(400).json({ 
      success: false,
      message: "❌ New password must contain at least one number" 
    });
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
    return res.status(400).json({ 
      success: false,
      message: "❌ New password must contain at least one special character" 
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
      message: "❌ User not found" 
    });
  }
  
  // Check old password (support both hashed and plain text)
  let oldPasswordMatch = false;
  if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$')) {
    // Password is hashed - use bcrypt
    oldPasswordMatch = await bcrypt.compare(oldPassword, user.password);
  } else {
    // Legacy plain text password
    oldPasswordMatch = (user.password === oldPassword);
  }
  
  if (!oldPasswordMatch) {
    return res.status(400).json({ 
      success: false,
      message: "❌ Old password is incorrect" 
    });
  }
  
  // Hash the new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  await usersCollection.updateOne(
    { _id: user._id },
    { $set: { 
      password: hashedPassword,
      passwordUpdatedAt: new Date()
    } }
  );
  
  res.json({ 
    success: true,
    message: "✅ Password updated successfully" 
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

// Add single student to student database
router.post('/api/add-student-to-database', asyncHandler(async (req, res) => {
  const { admissionNumber, name, department, batch, degree } = req.body;
  
  // Validation
  if (!admissionNumber || !name || !department || !batch) {
    return res.status(400).json({
      success: false,
      message: 'Admission number, name, department, and batch are required'
    });
  }
  
  try {
    const { MongoClient } = require('mongodb');
    const studentDbUri = process.env.STUDENT_DB_URI || process.env.MONGODB_URI;
    const client = new MongoClient(studentDbUri);
    await client.connect();
    
    const studentDb = client.db('alumni_network');
    
    // Use preregistered_students collection instead of department-specific collections
    const collection = studentDb.collection('preregistered_students');
    
    // Check if student already exists
    const existingStudent = await collection.findOne({ admissionNumber });
    if (existingStudent) {
      await client.close();
      return res.status(400).json({
        success: false,
        message: 'Student with this admission number already exists'
      });
    }
    
    // Insert student
    const studentData = {
      admissionNumber,
      name,
      department,
      batch,
      degree: degree || 'B.E',
      status: 'Pending Registration',
      uploadedAt: new Date()
    };
    
    await collection.insertOne(studentData);
    await client.close();
    
    res.json({
      success: true,
      message: `Student ${name} added successfully to ${department}`,
      student: studentData
    });
    
  } catch (error) {
    console.error('Error adding student:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding student: ' + error.message
    });
  }
}));

// Bulk upload students to student database
router.post('/api/upload-students-bulk', asyncHandler(async (req, res) => {
  const { students } = req.body;
  
  if (!students || !Array.isArray(students) || students.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Students array is required'
    });
  }
  
  try {
    // Connect to alumni_network database
    const { MongoClient } = require('mongodb');
    const studentDbUri = process.env.STUDENT_DB_URI || process.env.MONGODB_URI;
    const client = new MongoClient(studentDbUri);
    await client.connect();
    
    const studentDb = client.db('alumni_network');
    const collection = studentDb.collection('preregistered_students');
    
    // Prepare student data
    const studentData = students.map(student => ({
      admissionNumber: student.alumni_id || student.admissionNumber,
      name: student.name,
      department: student.department,
      batch: student.batch,
      degree: student.degree || 'B.E',
      status: 'Pending Registration',
      uploadedAt: new Date()
    }));
    
    // Insert all students into single collection
    let totalInserted = 0;
    let duplicates = 0;
    
    try {
      const result = await collection.insertMany(studentData, { ordered: false });
      totalInserted = result.insertedCount;
    } catch (error) {
      // Handle duplicate key errors
      if (error.code === 11000) {
        totalInserted = error.result?.nInserted || 0;
        duplicates = studentData.length - totalInserted;
      } else {
        throw error;
      }
    }
    
    await client.close();
    
    res.json({
      success: true,
      message: `Successfully uploaded ${totalInserted} students (${duplicates} duplicates skipped)`,
      totalInserted,
      duplicates,
      total: studentData.length
    });
    
  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading students: ' + error.message
    });
  }
}));

// Get all students from preregistered_students collection
router.get('/api/students-database', asyncHandler(async (req, res) => {
  try {
    const { MongoClient } = require('mongodb');
    const studentDbUri = process.env.STUDENT_DB_URI || process.env.MONGODB_URI;
    const client = new MongoClient(studentDbUri);
    await client.connect();
    
    const studentDb = client.db('alumni_network');
    const collection = studentDb.collection('preregistered_students');
    
    // Fetch all preregistered students
    const allStudents = await collection.find({}).toArray();
    
    // Format the response
    const formattedStudents = allStudents.map(student => ({
      _id: student._id,
      admissionNumber: student.admissionNumber,
      name: student.name,
      department: student.department,
      batch: student.batch,
      degree: student.degree || 'B.E',
      status: student.status || 'Pending Registration',
      uploadedAt: student.uploadedAt || student.createdAt || null
    }));
    
    await client.close();
    
    res.json({
      success: true,
      students: formattedStudents,
      count: formattedStudents.length
    });
    
  } catch (error) {
    console.error('Error fetching students from database:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching students: ' + error.message
    });
  }
}));

module.exports = router;
