export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }

  if (!emailRegex.test(email.trim())) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  return { isValid: true };
};

export const validatePhone = (phone: string): { isValid: boolean; error?: string } => {
  if (!phone) {
    return { isValid: true };
  }

  const phoneRegex = /^[\d\s\-\(\)]+$/;
  const digitsOnly = phone.replace(/[\s\-\(\)]/g, '');

  if (!phoneRegex.test(phone)) {
    return { isValid: false, error: 'Phone number can only contain digits, spaces, hyphens, and parentheses' };
  }

  if (digitsOnly.length < 10 || digitsOnly.length > 15) {
    return { isValid: false, error: 'Phone number must be between 10-15 digits' };
  }

  return { isValid: true };
};

export const validatePassword = (password: string): {
  isValid: boolean;
  error?: string;
  strength?: 'weak' | 'medium' | 'strong';
} => {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return {
      isValid: false,
      error: 'Password must be at least 8 characters long',
      strength: 'weak'
    };
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const criteriaCount = [hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar].filter(Boolean).length;

  if (criteriaCount < 2) {
    return {
      isValid: false,
      error: 'Password must contain at least 2 of: uppercase, lowercase, number, special character',
      strength: 'weak'
    };
  }

  if (criteriaCount === 2) {
    return { isValid: true, strength: 'medium' };
  }

  return { isValid: true, strength: 'strong' };
};

export const getPasswordStrengthColor = (strength?: 'weak' | 'medium' | 'strong'): string => {
  switch (strength) {
    case 'weak':
      return '#dc2626';
    case 'medium':
      return '#f59e0b';
    case 'strong':
      return '#10b981';
    default:
      return '#6b7280';
  }
};
