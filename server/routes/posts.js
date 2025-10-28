const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getCollection } = require('../config/database');
const { asyncHandler } = require('../utils/helpers');
const { upload, isCloudinaryConfigured } = require('../config/cloudinary');

// Get all posts
router.get('/posts', asyncHandler(async (req, res) => {
  const postsCollection = getCollection('posts');
  const posts = await postsCollection.find({}).toArray();
  res.json(posts);
}));

// Create new post
router.post('/posts', upload.single('imageFile'), asyncHandler(async (req, res) => {
  const postsCollection = getCollection('posts');
  const { author, content, time } = req.body;
  
  let imageUrl = '';
  if (req.file) {
    // Cloudinary automatically provides the URL in req.file.path
    imageUrl = req.file.path;
  }
  
  const result = await postsCollection.insertOne({ 
    author, 
    content, 
    imageUrl, 
    time,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  res.json({ 
    success: true, 
    message: 'Post created successfully',
    id: result.insertedId 
  });
}));

// Update post
router.put('/posts/:id', upload.single('imageFile'), asyncHandler(async (req, res) => {
  const postsCollection = getCollection('posts');
  const { id } = req.params;
  const { author, content, time } = req.body;
  
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid post ID format' 
    });
  }
  
  const updateFields = { author, content, time, updatedAt: new Date() };
  
  // Only update imageUrl if a new file was uploaded
  if (req.file) {
    // Cloudinary URL in req.file.path
    updateFields.imageUrl = req.file.path;
  }
  
  const result = await postsCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: updateFields }
  );
  
  if (result.matchedCount === 0) {
    return res.status(404).json({ 
      success: false,
      message: 'Post not found' 
    });
  }
  
  res.json({ 
    success: true, 
    message: 'Post updated successfully' 
  });
}));

// Delete post
router.delete('/posts/:id', asyncHandler(async (req, res) => {
  const postsCollection = getCollection('posts');
  const { id } = req.params;
  
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid post ID format' 
    });
  }
  
  const result = await postsCollection.deleteOne({ 
    _id: new ObjectId(id) 
  });
  
  if (result.deletedCount === 0) {
    return res.status(404).json({ 
      success: false,
      message: 'Post not found' 
    });
  }
  
  res.json({ 
    success: true,
    message: 'Post deleted successfully' 
  });
}));

// Bulk delete posts
router.post('/posts/bulk-delete', asyncHandler(async (req, res) => {
  const postsCollection = getCollection('posts');
  const { ids } = req.body;
  
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid or empty IDs array' 
    });
  }
  
  // Validate all IDs
  const invalidIds = ids.filter(id => !ObjectId.isValid(id));
  if (invalidIds.length > 0) {
    return res.status(400).json({ 
      success: false,
      message: 'Some IDs are invalid' 
    });
  }
  
  const objectIds = ids.map(id => new ObjectId(id));
  const result = await postsCollection.deleteMany({ 
    _id: { $in: objectIds } 
  });
  
  res.json({ 
    success: true,
    message: `${result.deletedCount} post(s) deleted successfully`,
    deletedCount: result.deletedCount
  });
}));

module.exports = router;
