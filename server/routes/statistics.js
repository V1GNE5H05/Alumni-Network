const express = require('express');
const router = express.Router();
const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');

/**
 * GET /api/statistics/registration
 * Get department-wise registration statistics
 */
router.get('/registration', async (req, res) => {
  try {
    const db = getDB();
    
    // Get all students from students_database collection
    const allStudents = await db.collection('students_database').find({}).toArray();
    
    // Get all registered alumni
    const registeredAlumni = await db.collection('alumni_profiles').find({}).toArray();
    
    // Create a set of registered admission numbers for quick lookup
    const registeredAdmissionNumbers = new Set(
      registeredAlumni.map(alumni => alumni.admissionNumber || alumni.alumni_id)
    );
    
    // Group students by department
    const departmentStats = {};
    
    allStudents.forEach(student => {
      const dept = student.department || 'Unknown';
      
      if (!departmentStats[dept]) {
        departmentStats[dept] = {
          name: dept,
          total: 0,
          registered: 0,
          notRegistered: 0
        };
      }
      
      departmentStats[dept].total++;
      
      // Check if student is registered
      const isRegistered = registeredAdmissionNumbers.has(student.admissionNumber);
      
      if (isRegistered) {
        departmentStats[dept].registered++;
      } else {
        departmentStats[dept].notRegistered++;
      }
    });
    
    // Convert to array and sort by department name
    const departments = Object.values(departmentStats).sort((a, b) => 
      a.name.localeCompare(b.name)
    );
    
    // Calculate summary
    const summary = {
      total: allStudents.length,
      registered: registeredAlumni.length,
      notRegistered: allStudents.length - registeredAlumni.length
    };
    
    res.json({
      success: true,
      summary,
      departments
    });
  } catch (error) {
    console.error('Error fetching registration statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

/**
 * GET /api/statistics/department/:departmentName
 * Get detailed student list for a specific department
 */
router.get('/department/:departmentName', async (req, res) => {
  try {
    const db = getDB();
    const departmentName = decodeURIComponent(req.params.departmentName);
    
    // Get all students from this department
    const allStudents = await db.collection('students_database')
      .find({ department: departmentName })
      .toArray();
    
    // Get all registered alumni from this department
    const registeredAlumni = await db.collection('alumni_profiles')
      .find({ department: departmentName })
      .toArray();
    
    // Create a map of registered students by admission number
    const registeredMap = new Map();
    registeredAlumni.forEach(alumni => {
      const admissionNumber = alumni.admissionNumber || alumni.alumni_id;
      registeredMap.set(admissionNumber, alumni);
    });
    
    // Separate registered and not registered students
    const registered = [];
    const notRegistered = [];
    
    allStudents.forEach(student => {
      const alumniProfile = registeredMap.get(student.admissionNumber);
      
      if (alumniProfile) {
        registered.push({
          name: student.name,
          alumniId: alumniProfile.alumni_id || alumniProfile._id.toString(),
          email: alumniProfile.email || student.email,
          department: student.department,
          batch: student.batch
        });
      } else {
        notRegistered.push({
          name: student.name,
          admissionNumber: student.admissionNumber,
          email: student.email,
          department: student.department,
          batch: student.batch
        });
      }
    });
    
    res.json({
      success: true,
      department: departmentName,
      registered,
      notRegistered
    });
  } catch (error) {
    console.error('Error fetching department details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch department details',
      error: error.message
    });
  }
});

module.exports = router;
