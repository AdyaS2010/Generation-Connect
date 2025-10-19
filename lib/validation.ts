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
  if (!phone || !phone.trim()) {
    return { isValid: true };
  }

  const digitsOnly = phone.replace(/\D/g, '');

  if (digitsOnly.length === 10) {
    return { isValid: true };
  }

  if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    return { isValid: true };
  }

  return { isValid: false, error: 'Please enter a valid 10-digit phone number' };
};

export interface PasswordRequirements {
  minLength: boolean;
  hasNumber: boolean;
  hasLetter: boolean;
}

export const checkPasswordRequirements = (password: string): PasswordRequirements => {
  return {
    minLength: password.length >= 8,
    hasNumber: /\d/.test(password),
    hasLetter: /[a-zA-Z]/.test(password),
  };
};

export const validatePassword = (password: string): {
  isValid: boolean;
  error?: string;
  strength?: 'weak' | 'medium' | 'strong';
  requirements: PasswordRequirements;
} => {
  const requirements = checkPasswordRequirements(password);

  if (!password) {
    return { isValid: false, error: 'Password is required', requirements };
  }

  if (!requirements.minLength) {
    return {
      isValid: false,
      error: 'Password must be at least 8 characters',
      strength: 'weak',
      requirements,
    };
  }

  if (!requirements.hasNumber || !requirements.hasLetter) {
    return {
      isValid: false,
      error: 'Password must contain both letters and numbers',
      strength: 'weak',
      requirements,
    };
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const extraCriteria = [hasUpperCase && hasLowerCase, hasSpecialChar].filter(Boolean).length;

  if (extraCriteria === 0) {
    return { isValid: true, strength: 'medium', requirements };
  }

  return { isValid: true, strength: 'strong', requirements };
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

export const formatPhoneNumber = (value: string): string => {
  const digitsOnly = value.replace(/\D/g, '');

  if (digitsOnly.length <= 3) {
    return digitsOnly;
  }

  if (digitsOnly.length <= 6) {
    return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3)}`;
  }

  if (digitsOnly.length <= 10) {
    return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
  }

  return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6, 10)}`;
};}
