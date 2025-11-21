// User management with password hashing
const crypto = require('crypto');

// In-memory user storage (login -> user object)
const users = {};

/**
 * Register a new user
 * @param {string} nom - Last name
 * @param {string} prenom - First name
 * @param {string} login - Username
 * @param {string} password - Plain text password
 * @returns {object} Success status and message
 */
function register(nom, prenom, login, password) {
    if (users[login]) {
        return { success: false, message: 'User already exists' };
    }
    
    // Generate salt and hash password
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256').toString('hex');
    
    users[login] = {
        nom,
        prenom,
        login,
        salt,
        hash,
        lastImage: null
    };
    
    return { success: true, message: 'User registered successfully' };
}

/**
 * Verify user credentials
 * @param {string} login - Username
 * @param {string} password - Plain text password
 * @returns {boolean} True if credentials are valid
 */
function verify(login, password) {
    const user = users[login];
    if (!user) {
        return false;
    }
    
    const hash = crypto.pbkdf2Sync(password, user.salt, 100000, 64, 'sha256').toString('hex');
    return user.hash === hash;
}

/**
 * Get user information (without sensitive data)
 * @param {string} login - Username
 * @returns {object|null} User object or null
 */
function getUser(login) {
    const user = users[login];
    if (!user) {
        return null;
    }
    
    return {
        nom: user.nom,
        prenom: user.prenom,
        login: user.login,
        lastImage: user.lastImage
    };
}

/**
 * Update user's last uploaded image
 * @param {string} login - Username
 * @param {string} imagePath - Path to the image
 */
function updateLastImage(login, imagePath) {
    if (users[login]) {
        users[login].lastImage = imagePath;
    }
}

exports.register = register;
exports.verify = verify;
exports.getUser = getUser;
exports.updateLastImage = updateLastImage;
