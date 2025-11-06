const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getCollection } = require('../config/database');
const { asyncHandler } = require('../utils/helpers');
const { upload } = require('../config/cloudinary');

// Get all events
router.get('/', asyncHandler(async (req, res) => {
  const eventsCollection = getCollection('events');
  const events = await eventsCollection.find().sort({ date: -1 }).toArray();
  res.json(events);
}));

// Create new event
router.post('/', upload.single('posterFile'), asyncHandler(async (req, res) => {
  const eventsCollection = getCollection('events');
  const { title, date, time, location, posterUrl, description, allowParticipation } = req.body;
  
  console.log('Creating event with allowParticipation:', allowParticipation);
  console.log('Type of allowParticipation:', typeof allowParticipation);
  
  if (!title || !date || !location || !description) {
    return res.status(400).json({ 
      success: false,
      message: 'Title, date, location and description are required' 
    });
  }

  let finalPosterUrl = posterUrl;
  if (req.file) {
    // Cloudinary URL
    finalPosterUrl = req.file.path;
  }
  if (!finalPosterUrl) {
    finalPosterUrl = 'https://placehold.co/600x400/999999/FFFFFF?text=Event';
  }

  const event = {
    title,
    date,
    time: time || '',
    location,
    posterUrl: finalPosterUrl,
    description,
    allowParticipation: allowParticipation === 'true' || allowParticipation === true,
    participants: [],
    participantCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  console.log('Event object before saving:', event);

  const result = await eventsCollection.insertOne(event);
  event._id = result.insertedId;
  
  res.status(201).json({ 
    success: true, 
    message: 'Event created successfully',
    event 
  });
}));

// Update event
router.put('/:id', upload.single('posterFile'), asyncHandler(async (req, res) => {
  const eventsCollection = getCollection('events');
  const { id } = req.params;
  const { title, date, time, location, description, allowParticipation } = req.body;
  
  console.log('Updating event with allowParticipation:', allowParticipation);
  console.log('Type of allowParticipation:', typeof allowParticipation);
  
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid event ID' 
    });
  }
  
  const updateFields = { updatedAt: new Date() };
  
  if (title) updateFields.title = title;
  if (date) updateFields.date = date;
  if (time !== undefined) updateFields.time = time;
  if (location) updateFields.location = location;
  if (description) updateFields.description = description;
  if (allowParticipation !== undefined) {
    updateFields.allowParticipation = allowParticipation === 'true' || allowParticipation === true;
  }
  
  console.log('Update fields:', updateFields);
  // Only update posterUrl if a new file was uploaded
  if (req.file) {
    // Cloudinary URL
    updateFields.posterUrl = req.file.path;
  }
  
  const result = await eventsCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: updateFields }
  );
  
  if (result.matchedCount === 0) {
    return res.status(404).json({ 
      success: false,
      message: 'Event not found' 
    });
  }
  
  res.json({ 
    success: true,
    message: 'Event updated successfully' 
  });
}));

// Delete an event
router.delete('/:id', asyncHandler(async (req, res) => {
  const eventsCollection = getCollection('events');
  const { id } = req.params;
  
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid event ID' 
    });
  }
  
  const result = await eventsCollection.deleteOne({ _id: new ObjectId(id) });
  
  if (result.deletedCount === 0) {
    return res.status(404).json({ 
      success: false,
      message: 'Event not found' 
    });
  }
  
  res.json({ 
    success: true,
    message: 'Event deleted successfully' 
  });
}));

// Bulk delete events
router.post('/bulk-delete', asyncHandler(async (req, res) => {
  const eventsCollection = getCollection('events');
  const { ids } = req.body;
  
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid or empty IDs array' 
    });
  }
  
  const invalidIds = ids.filter(id => !ObjectId.isValid(id));
  if (invalidIds.length > 0) {
    return res.status(400).json({ 
      success: false,
      message: 'Some IDs are invalid' 
    });
  }
  
  const objectIds = ids.map(id => new ObjectId(id));
  const result = await eventsCollection.deleteMany({ 
    _id: { $in: objectIds } 
  });
  
  res.json({ 
    success: true,
    message: `${result.deletedCount} event(s) deleted successfully`,
    deletedCount: result.deletedCount
  });
}));

// Register for event
router.post('/:id/participate', asyncHandler(async (req, res) => {
  const eventsCollection = getCollection('events');
  const { id } = req.params;
  const { alumniId } = req.body;
  
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid event ID' 
    });
  }

  if (!alumniId) {
    return res.status(400).json({ 
      success: false,
      message: 'Alumni ID is required' 
    });
  }

  const event = await eventsCollection.findOne({ _id: new ObjectId(id) });
  
  if (!event) {
    return res.status(404).json({ 
      success: false,
      message: 'Event not found' 
    });
  }

  if (!event.allowParticipation) {
    return res.status(400).json({ 
      success: false,
      message: 'This event does not allow participation' 
    });
  }

  // Check if already registered
  const alreadyRegistered = event.participants && event.participants.some(
    p => p.alumniId === alumniId
  );

  if (alreadyRegistered) {
    return res.status(400).json({ 
      success: false,
      message: 'You are already registered for this event' 
    });
  }

  const participant = {
    alumniId,
    registeredAt: new Date()
  };

  const result = await eventsCollection.updateOne(
    { _id: new ObjectId(id) },
    { 
      $push: { participants: participant },
      $inc: { participantCount: 1 }
    }
  );

  res.json({ 
    success: true,
    message: 'Successfully registered for the event!' 
  });
}));

// Cancel event registration
router.post('/:id/cancel', asyncHandler(async (req, res) => {
  const eventsCollection = getCollection('events');
  const { id } = req.params;
  const { alumniId } = req.body;
  
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid event ID' 
    });
  }

  if (!alumniId) {
    return res.status(400).json({ 
      success: false,
      message: 'Alumni ID is required' 
    });
  }

  const result = await eventsCollection.updateOne(
    { _id: new ObjectId(id) },
    { 
      $pull: { participants: { alumniId: alumniId } },
      $inc: { participantCount: -1 }
    }
  );

  if (result.matchedCount === 0) {
    return res.status(404).json({ 
      success: false,
      message: 'Event not found' 
    });
  }

  res.json({ 
    success: true,
    message: 'Registration cancelled successfully' 
  });
}));

// Get event participants (admin only)
router.get('/:id/participants', asyncHandler(async (req, res) => {
  const eventsCollection = getCollection('events');
  const { id } = req.params;
  
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid event ID' 
    });
  }

  const event = await eventsCollection.findOne({ _id: new ObjectId(id) });
  
  if (!event) {
    return res.status(404).json({ 
      success: false,
      message: 'Event not found' 
    });
  }

  res.json({ 
    success: true,
    participants: event.participants || [],
    count: event.participantCount || 0
  });
}));

module.exports = router;
