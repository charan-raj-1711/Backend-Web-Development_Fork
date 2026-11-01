const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/userRepository');
const AppError = require('../errors/AppError');

function requiredString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}

function invalidCredentials() {
  return new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
}

async function verifyCredentials(input = {}) {
  if (!requiredString(input.email) || !requiredString(input.password)) {
    throw new AppError(400, 'INVALID_INPUT', 'Email and password are required');
  }
  const user = await userRepository.findByEmail(input.email.trim().toLowerCase());
  if (!user) throw invalidCredentials();
  if (!(await bcrypt.compare(input.password, user.passwordHash))) throw invalidCredentials();
  return publicUser(user);
}

module.exports = { verifyCredentials };