const express = require('express');
const router = express.Router();
const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');

// Get all proudable alumni
router.get('/', async (req, res) => {
    try {
        const db = getDB();
        const proudAlumni = await db.collection('proudable_alumni').find().sort({ createdAt: -1 }).toArray();
        res.json(proudAlumni);
    } catch (error) {
        console.error('Error fetching proudable alumni:', error);
        res.status(500).json({ message: 'Error fetching proudable alumni', error: error.message });
    }
});

// Get single proudable alumni by ID
router.get('/:id', async (req, res) => {
    try {
        const db = getDB();
        const alumni = await db.collection('proudable_alumni').findOne({ _id: new ObjectId(req.params.id) });
        if (!alumni) {
            return res.status(404).json({ message: 'Proudable alumni not found' });
        }
        res.json(alumni);
    } catch (error) {
        console.error('Error fetching proudable alumni:', error);
        res.status(500).json({ message: 'Error fetching proudable alumni', error: error.message });
    }
});

// Create new proudable alumni
router.post('/', async (req, res) => {
    try {
        const db = getDB();
        const { name, experience, achievements, photo } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Name is required' });
        }

        const newAlumni = {
            name,
            experience: experience || '',
            achievements: achievements || '',
            photo: photo || '',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await db.collection('proudable_alumni').insertOne(newAlumni);
        res.status(201).json({ 
            message: 'Proudable alumni created successfully', 
            alumniId: result.insertedId,
            alumni: { ...newAlumni, _id: result.insertedId }
        });
    } catch (error) {
        console.error('Error creating proudable alumni:', error);
        res.status(500).json({ message: 'Error creating proudable alumni', error: error.message });
    }
});

// Update proudable alumni
router.put('/:id', async (req, res) => {
    try {
        const db = getDB();
        const { name, experience, achievements, photo } = req.body;

        const updateData = {
            name,
            experience: experience || '',
            achievements: achievements || '',
            photo: photo || '',
            updatedAt: new Date()
        };

        const result = await db.collection('proudable_alumni').updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'Proudable alumni not found' });
        }

        res.json({ message: 'Proudable alumni updated successfully' });
    } catch (error) {
        console.error('Error updating proudable alumni:', error);
        res.status(500).json({ message: 'Error updating proudable alumni', error: error.message });
    }
});

// Delete proudable alumni
router.delete('/:id', async (req, res) => {
    try {
        const db = getDB();
        const result = await db.collection('proudable_alumni').deleteOne({ _id: new ObjectId(req.params.id) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Proudable alumni not found' });
        }

        res.json({ message: 'Proudable alumni deleted successfully' });
    } catch (error) {
        console.error('Error deleting proudable alumni:', error);
        res.status(500).json({ message: 'Error deleting proudable alumni', error: error.message });
    }
});

module.exports = router;
