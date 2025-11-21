// Session management with cookies
const crypto = require('crypto');

// In-memory session storage (sessionId -> {login, timestamp})
const sessions = {};

/**
 * Create a new session for a user
 * @param {string} login - Username
 * @returns {string} Session ID (UUID)
 */
function createSession(login) {
    const sessionId = crypto.randomUUID();
    sessions[sessionId] = {
        login,
        timestamp: Date.now()
    };
    return sessionId;
}

/**
 * Get session information
 * @param {string} sessionId - Session ID
 * @returns {object|null} Session data or null if not found
 */
function getSession(sessionId) {
    return sessions[sessionId] || null;
}

/**
 * Destroy a session
 * @param {string} sessionId - Session ID
 */
function destroySession(sessionId) {
    delete sessions[sessionId];
}

/**
 * Parse cookies from request headers
 * @param {object} req - HTTP request object
 * @returns {object} Parsed cookies as key-value pairs
 */
function parseCookies(req) {
    const cookies = {};
    const cookieHeader = req.headers.cookie;
    
    if (cookieHeader) {
        cookieHeader.split(';').forEach(cookie => {
            const parts = cookie.trim().split('=');
            cookies[parts[0]] = parts[1];
        });
    }
    
    return cookies;
}

/**
 * Get login from session cookie
 * @param {object} req - HTTP request object
 * @returns {string|null} Login if valid session exists, null otherwise
 */
function getLoginFromRequest(req) {
    const cookies = parseCookies(req);
    const sessionId = cookies.SID;
    
    if (!sessionId) {
        return null;
    }
    
    const session = getSession(sessionId);
    return session ? session.login : null;
}

exports.createSession = createSession;
exports.getSession = getSession;
exports.destroySession = destroySession;
exports.parseCookies = parseCookies;
exports.getLoginFromRequest = getLoginFromRequest;
