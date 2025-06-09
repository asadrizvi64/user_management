import { LIMITS } from './constants';

// Email validation
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation
export const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Username validation
export const validateUsername = (username) => {
  const errors = [];
  
  if (username.length < 3) {
    errors.push('Username must be at least 3 characters long');
  }
  
  if (username.length > 50) {
    errors.push('Username must be less than 50 characters');
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push('Username can only contain letters, numbers, and underscores');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Product name validation
export const validateProductName = (name) => {
  const errors = [];
  
  if (!name || name.trim().length === 0) {
    errors.push('Product name is required');
  }
  
  if (name.length > LIMITS.MAX_PRODUCT_NAME_LENGTH) {
    errors.push(`Product name must be less than ${LIMITS.MAX_PRODUCT_NAME_LENGTH} characters`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Trigger word validation
export const validateTriggerWord = (triggerWord) => {
  const errors = [];
  
  if (!triggerWord || triggerWord.trim().length === 0) {
    errors.push('Trigger word is required');
  }
  
  if (triggerWord.length > LIMITS.MAX_TRIGGER_WORD_LENGTH) {
    errors.push(`Trigger word must be less than ${LIMITS.MAX_TRIGGER_WORD_LENGTH} characters`);
  }
  
  if (!/^[a-zA-Z0-9_\s]+$/.test(triggerWord)) {
    errors.push('Trigger word can only contain letters, numbers, underscores, and spaces');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Prompt validation
export const validatePrompt = (prompt) => {
  const errors = [];
  
  if (!prompt || prompt.trim().length === 0) {
    errors.push('Prompt is required');
  }
  
  if (prompt.length > LIMITS.MAX_PROMPT_LENGTH) {
    errors.push(`Prompt must be less than ${LIMITS.MAX_PROMPT_LENGTH} characters`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// File validation
export const validateFile = (file, allowedTypes, maxSize = LIMITS.MAX_FILE_SIZE) => {
  const errors = [];
  
  if (!file) {
    errors.push('File is required');
    return { isValid: false, errors };
  }
  
  // Check file size
  if (file.size > maxSize) {
    errors.push(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
  }
  
  // Check file type
  const isValidType = allowedTypes.some(type => 
    file.type === type || file.name.toLowerCase().endsWith(type)
  );
  
  if (!isValidType) {
    errors.push(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Image file validation
export const validateImageFile = (file) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', '.jpg', '.jpeg', '.png', '.webp'];
  return validateFile(file, allowedTypes);
};

// Model file validation
export const validateModelFile = (file) => {
  const allowedTypes = ['.safetensors', '.ckpt', '.pt'];
  return validateFile(file, allowedTypes);
};

// Training images validation
export const validateTrainingImages = (images) => {
  const errors = [];
  
  if (!images || images.length === 0) {
    errors.push('At least one training image is required');
  } else if (images.length < LIMITS.MIN_TRAINING_IMAGES) {
    errors.push(`At least ${LIMITS.MIN_TRAINING_IMAGES} training images are required`);
  } else if (images.length > LIMITS.MAX_TRAINING_IMAGES) {
    errors.push(`Maximum ${LIMITS.MAX_TRAINING_IMAGES} training images allowed`);
  }
  
  // Validate each image
  images.forEach((image, index) => {
    const imageValidation = validateImageFile(image);
    if (!imageValidation.isValid) {
      errors.push(`Image ${index + 1}: ${imageValidation.errors.join(', ')}`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Training parameters validation
export const validateTrainingParams = (params) => {
  const errors = [];
  
  // Resolution validation
  if (params.resolution < 256 || params.resolution > 1024) {
    errors.push('Resolution must be between 256 and 1024');
  }
  
  if (params.resolution % 64 !== 0) {
    errors.push('Resolution must be divisible by 64');
  }
  
  // Epochs validation
  if (params.max_train_epochs < 1 || params.max_train_epochs > 100) {
    errors.push('Training epochs must be between 1 and 100');
  }
  
  // Network dimension validation
  if (params.network_dim < 4 || params.network_dim > 128) {
    errors.push('Network dimension must be between 4 and 128');
  }
  
  if (params.network_dim % 4 !== 0) {
    errors.push('Network dimension must be divisible by 4');
  }
  
  // Learning rate validation
  const learningRate = parseFloat(params.learning_rate);
  if (isNaN(learningRate) || learningRate <= 0) {
    errors.push('Learning rate must be a positive number');
  }
  
  // Guidance scale validation
  if (params.guidance_scale < 0.1 || params.guidance_scale > 10) {
    errors.push('Guidance scale must be between 0.1 and 10');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Generation parameters validation
export const validateGenerationParams = (params) => {
  const errors = [];
  
  // Number of images validation
  if (params.num_images < 1 || params.num_images > LIMITS.MAX_GENERATION_IMAGES) {
    errors.push(`Number of images must be between 1 and ${LIMITS.MAX_GENERATION_IMAGES}`);
  }
  
  // Guidance scale validation
  if (params.guidance_scale < 1 || params.guidance_scale > 20) {
    errors.push('Guidance scale must be between 1 and 20');
  }
  
  // Inference steps validation
  if (params.num_inference_steps < 10 || params.num_inference_steps > 100) {
    errors.push('Inference steps must be between 10 and 100');
  }
  
  // Seed validation (if provided)
  if (params.seed !== null && params.seed !== undefined) {
    if (params.seed < 0 || params.seed > 1000000) {
      errors.push('Seed must be between 0 and 1,000,000');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Date range validation
export const validateDateRange = (startDate, endDate) => {
  const errors = [];
  
  if (!startDate || !endDate) {
    errors.push('Both start and end dates are required');
    return { isValid: false, errors };
  }
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    errors.push('Invalid date format');
  }
  
  if (start > end) {
    errors.push('Start date must be before end date');
  }
  
  // Check if date range is not too large (e.g., more than 1 year)
  const maxDays = 365;
  const diffInDays = (end - start) / (1000 * 60 * 60 * 24);
  if (diffInDays > maxDays) {
    errors.push(`Date range cannot exceed ${maxDays} days`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// URL validation
export const validateUrl = (url) => {
  const errors = [];
  
  if (!url || url.trim().length === 0) {
    errors.push('URL is required');
    return { isValid: false, errors };
  }
  
  try {
    new URL(url);
  } catch {
    errors.push('Invalid URL format');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Form validation helper
export const validateForm = (data, rules) => {
  const errors = {};
  let isValid = true;
  
  Object.keys(rules).forEach(field => {
    const rule = rules[field];
    const value = data[field];
    
    if (rule.required && (!value || (typeof value === 'string' && value.trim().length === 0))) {
      errors[field] = `${rule.label || field} is required`;
      isValid = false;
    } else if (value && rule.validator) {
      const validation = rule.validator(value);
      if (!validation.isValid) {
        errors[field] = validation.errors[0];
        isValid = false;
      }
    }
  });
  
  return {
    isValid,
    errors
  };
};
