const argon2 = require('argon2');

/**
 * Hashes a password using Argon2.
 *
 * @param {string} plainTextPassword - The plain text password to hash.
 * @returns {Promise<string>} - The hashed password.
 */
const hashPassword = async (plainPassword) => {
  return argon2.hash(plainPassword, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16,
    timeCost: 3,
    parallelism: 1
  });
};

/**
 * Verifies a password against a hash.
 *
 * @param {string} plainTextPassword - The plain text password.
 * @param {string} hashedPassword - The hashed password from the DB.
 * @returns {Promise<boolean>} - Whether the password matches.
 */
const verifyPassword = async (hashedPassword, plainPassword) => {
  return argon2.verify(hashedPassword, plainPassword);
};

module.exports = { hashPassword, verifyPassword };