// utils/passwordGenerator.js — Generate cryptographically random passwords
const crypto = require('crypto');

/**
 * Generate a random password with:
 *  - at least 1 uppercase, 1 lowercase, 1 digit, 1 special char
 *  - total length: 10 chars
 */
const generateRandomPassword = () => {
  const upper   = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower   = 'abcdefghjkmnpqrstuvwxyz';
  const digits  = '23456789';
  const special = '@#$!%&';
  const all     = upper + lower + digits + special;

  const rand = (str) => str[crypto.randomInt(str.length)];

  // Guarantee at least one of each category
  const mandatory = [rand(upper), rand(lower), rand(digits), rand(special)];

  // Fill remaining 6 chars from all chars
  const rest = Array.from({ length: 6 }, () => rand(all));

  // Shuffle combined array
  const combined = [...mandatory, ...rest];
  for (let i = combined.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }

  return combined.join('');
};

module.exports = { generateRandomPassword };
