const express = require('express');
const router = express.Router();
const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');

// Get all members
router.get('/', async (req, res) => {
    try {
        const db = getDB();
        const members = await db.collection('members').find().sort({ createdAt: -1 }).toArray();
        res.json(members);
    } catch (error) {
        console.error('Error fetching members:', error);
        res.status(500).json({ message: 'Error fetching members', error: error.message });
    }
});

// Get single member by ID
router.get('/:id', async (req, res) => {
    try {
        const db = getDB();
        const member = await db.collection('members').findOne({ _id: new ObjectId(req.params.id) });
        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }
        res.json(member);
    } catch (error) {
        console.error('Error fetching member:', error);
        res.status(500).json({ message: 'Error fetching member', error: error.message });
    }
});

// Create new member
router.post('/', async (req, res) => {
    try {
        const db = getDB();
        const { role, name, designation, experience, photo } = req.body;

        if (!role || !name || !designation) {
            return res.status(400).json({ message: 'Role, name, and designation are required' });
        }

        const newMember = {
            role,
            name,
            designation,
            experience: experience || '',
            photo: photo || '',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await db.collection('members').insertOne(newMember);
        res.status(201).json({ 
            message: 'Member created successfully', 
            memberId: result.insertedId,
            member: { ...newMember, _id: result.insertedId }
        });
    } catch (error) {
        console.error('Error creating member:', error);
        res.status(500).json({ message: 'Error creating member', error: error.message });
    }
});

// Update member
router.put('/:id', async (req, res) => {
    try {
        const db = getDB();
        const { role, name, designation, experience, photo } = req.body;

        const updateData = {
            role,
            name,
            designation,
            experience: experience || '',
            photo: photo || '',
            updatedAt: new Date()
        };

        const result = await db.collection('members').updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'Member not found' });
        }

        res.json({ message: 'Member updated successfully' });
    } catch (error) {
        console.error('Error updating member:', error);
        res.status(500).json({ message: 'Error updating member', error: error.message });
    }
});

// Delete member
router.delete('/:id', async (req, res) => {
    try {
        const db = getDB();
        const result = await db.collection('members').deleteOne({ _id: new ObjectId(req.params.id) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Member not found' });
        }

        res.json({ message: 'Member deleted successfully' });
    } catch (error) {
        console.error('Error deleting member:', error);
        res.status(500).json({ message: 'Error deleting member', error: error.message });
    }
});

module.exports = router;
