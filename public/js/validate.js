// Browser-side checks for instant feedback. The server repeats every check,
// because the browser can never be trusted.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function checkName(value) {
  const name = value.trim();
  if (!name) return 'Name is required.';
  if (name.length < 2) return 'Name must be at least 2 characters.';
  if (name.length > 50) return 'Name must be 50 characters or less.';
  return '';
}

export function checkEmail(value) {
  const email = value.trim();
  if (!email) return 'Email is required.';
  if (!EMAIL_RE.test(email)) return 'Enter a valid email address.';
  return '';
}

export function checkNewPassword(value) {
  if (!value) return 'Password is required.';
  if (value.length < 8) return 'Password must be at least 8 characters.';
  if (value.length > 72) return 'Password must be 72 characters or less.';
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return 'Password must contain at least one letter and one number.';
  return '';
}

export function checkRequired(label) {
  return (value) => (value ? '' : `${label} is required.`);
}

export function checkConfirm(password) {
  return (value) => {
    if (!value) return 'Please confirm your password.';
    if (value !== password) return 'Passwords do not match.';
    return '';
  };
}
