const Joi = require('joi');

// Registration validation schema
const registrationSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': '❌ Name must be at least 2 characters long',
      'string.max': '❌ Name cannot exceed 100 characters',
      'any.required': '❌ Name is required'
    }),
  
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': '❌ Please enter a valid email address',
      'any.required': '❌ Email is required'
    }),
  
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.min': '❌ Password must be at least 8 characters long',
      'string.pattern.base': '❌ Password must contain uppercase, lowercase, number, and special character',
      'any.required': '❌ Password is required'
    }),
  
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
      'string.pattern.base': '❌ Please enter a valid 10-digit phone number',
      'any.required': '❌ Phone number is required'
    }),
  
  admissionNumber: Joi.string()
    .min(3)
    .required()
    .messages({
      'string.min': '❌ Admission number must be at least 3 characters',
      'any.required': '❌ Admission number is required'
    }),
  
  degree: Joi.string().allow(''),
  department: Joi.string().allow(''),
  batch: Joi.string().allow('')
});

// Login validation schema
const loginSchema = Joi.object({
  identifier: Joi.string().required().messages({
    'any.required': '❌ Username or email is required'
  }),
  password: Joi.string().required().messages({
    'any.required': '❌ Password is required'
  }),
  email: Joi.string().email().optional()
});

// Student validation schema (for admin)
const studentSchema = Joi.object({
  alumni_id: Joi.string().required().messages({
    'any.required': '❌ Alumni ID is required'
  }),
  name: Joi.string().min(2).max(100).required(),
  dob: Joi.date().optional(),
  department: Joi.string().required(),
  batch: Joi.string().required(),
  contact: Joi.string().required(),
  status: Joi.string().optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().pattern(/^[6-9]\d{9}$/).optional()
});

// Post validation schema
const postSchema = Joi.object({
  author: Joi.string().required().messages({
    'any.required': '❌ Author is required'
  }),
  content: Joi.string().min(1).max(5000).required().messages({
    'string.min': '❌ Post content cannot be empty',
    'string.max': '❌ Post content cannot exceed 5000 characters',
    'any.required': '❌ Post content is required'
  }),
  time: Joi.string().optional(),
  imageUrl: Joi.string().uri().optional()
});

// Event validation schema
const eventSchema = Joi.object({
  title: Joi.string().min(3).max(200).required().messages({
    'string.min': '❌ Event title must be at least 3 characters',
    'string.max': '❌ Event title cannot exceed 200 characters',
    'any.required': '❌ Event title is required'
  }),
  date: Joi.date().required().messages({
    'any.required': '❌ Event date is required'
  }),
  time: Joi.string().optional(),
  location: Joi.string().required().messages({
    'any.required': '❌ Event location is required'
  }),
  description: Joi.string().min(10).max(2000).required().messages({
    'string.min': '❌ Event description must be at least 10 characters',
    'string.max': '❌ Event description cannot exceed 2000 characters',
    'any.required': '❌ Event description is required'
  }),
  posterUrl: Joi.string().uri().optional(),
  allowParticipation: Joi.boolean().optional()
});

// Fund validation schema
const fundSchema = Joi.object({
  title: Joi.string().min(5).max(200).required().messages({
    'string.min': '❌ Fund title must be at least 5 characters',
    'string.max': '❌ Fund title cannot exceed 200 characters',
    'any.required': '❌ Fund title is required'
  }),
  description: Joi.string().min(20).max(2000).required().messages({
    'string.min': '❌ Fund description must be at least 20 characters',
    'string.max': '❌ Fund description cannot exceed 2000 characters',
    'any.required': '❌ Fund description is required'
  }),
  goal: Joi.number().positive().required().messages({
    'number.positive': '❌ Goal must be a positive number',
    'any.required': '❌ Goal amount is required'
  }),
  image: Joi.string().uri().optional()
});

// Contribution validation schema
const contributionSchema = Joi.object({
  fundId: Joi.string().required(),
  amount: Joi.number().positive().required().messages({
    'number.positive': '❌ Contribution amount must be positive'
  }),
  firstName: Joi.string().min(2).required(),
  lastName: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
  street: Joi.string().required(),
  locality: Joi.string().required(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  country: Joi.string().required(),
  pincode: Joi.string().pattern(/^[1-9][0-9]{5}$/).required().messages({
    'string.pattern.base': '❌ Please enter a valid 6-digit pincode'
  }),
  transactionMode: Joi.string().required(),
  notes: Joi.string().max(500).optional(),
  anonymous: Joi.boolean().optional()
});

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Return all errors
      stripUnknown: true // Remove unknown fields
    });
    
    if (error) {
      const errors = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        message: errors[0], // Return first error
        errors: errors // Return all errors
      });
    }
    
    // Replace req.body with validated and sanitized value
    req.body = value;
    next();
  };
};

module.exports = {
  registrationSchema,
  loginSchema,
  studentSchema,
  postSchema,
  eventSchema,
  fundSchema,
  contributionSchema,
  validate
};
