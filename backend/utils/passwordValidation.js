// Password validation utility
const validatePassword = (password, email = '') => {
  const errors = [];
  
  // Check minimum length
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  
  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least 1 uppercase letter');
  }
  
  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least 1 lowercase letter');
  }
  
  // Check for number
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least 1 number');
  }
  
  // Check for special character
  if (!/[@$!%*?&]/.test(password)) {
    errors.push('Password must contain at least 1 special character (@$!%*?&)');
  }
  
  // Check if password is same as email
  if (email && password.toLowerCase() === email.toLowerCase()) {
    errors.push('Password cannot be the same as email');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = { validatePassword };
