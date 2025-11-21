// Complete Request Handlers with authentication and file upload
const fs = require('fs');
const path = require('path');
const formidable = require('formidable');
const users = require('./users');
const sessions = require('./sessions');

/**
 * Home page - Shows login/register forms or user dashboard
 */
function start(req, res) {
    console.log('Request handler "start" was called.');
    
    const login = sessions.getLoginFromRequest(req);
    
    if (login) {
        const user = users.getUser(login);
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.write(`
            <html>
            <head><title>P2P Web - Dashboard</title></head>
            <body>
                <h1>Welcome, ${user.prenom} ${user.nom}!</h1>
                <p>You are logged in as: <strong>${user.login}</strong></p>
                
                <h2>Upload an Image</h2>
                <form action="/upload" method="post" enctype="multipart/form-data">
                    <input type="file" name="upload" accept="image/*" required>
                    <button type="submit">Upload</button>
                </form>
                
                <h2>Actions</h2>
                <ul>
                    <li><a href="/show">View My Image</a></li>
                    <li><a href="/find?dir=uploads">Browse Uploads</a></li>
                    <li><a href="/logout">Logout</a></li>
                </ul>
            </body>
            </html>
        `);
        res.end();
    } else {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.write(`
            <html>
            <head><title>P2P Web - Home</title></head>
            <body>
                <h1>Welcome to P2P Web</h1>
                
                <h2>Register</h2>
                <form action="/register" method="post">
                    <input type="text" name="nom" placeholder="Last Name" required><br>
                    <input type="text" name="prenom" placeholder="First Name" required><br>
                    <input type="text" name="login" placeholder="Username" required><br>
                    <input type="password" name="password" placeholder="Password" required><br>
                    <button type="submit">Register</button>
                </form>
                
                <h2>Login</h2>
                <form action="/login" method="post">
                    <input type="text" name="login" placeholder="Username" required><br>
                    <input type="password" name="password" placeholder="Password" required><br>
                    <button type="submit">Login</button>
                </form>
            </body>
            </html>
        `);
        res.end();
    }
}

/**
 * Register a new user
 */
function register(req, res) {
    console.log('Request handler "register" was called.');
    
    if (req.method === 'POST') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            let data;
            
            // Parse JSON or URL-encoded data
            if (req.headers['content-type']?.includes('application/json')) {
                data = JSON.parse(body);
            } else {
                // Parse URL-encoded form data
                data = {};
                body.split('&').forEach(pair => {
                    const [key, value] = pair.split('=');
                    data[decodeURIComponent(key)] = decodeURIComponent(value);
                });
            }
            
            const result = users.register(data.nom, data.prenom, data.login, data.password);
            
            if (req.headers['content-type']?.includes('application/json')) {
                res.writeHead(result.success ? 200 : 400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.write(`
                    <html>
                    <head><title>Registration Result</title></head>
                    <body>
                        <h1>${result.success ? 'Success!' : 'Error'}</h1>
                        <p>${result.message}</p>
                        <a href="/">Go back to home</a>
                    </body>
                    </html>
                `);
                res.end();
            }
        });
    } else {
        res.writeHead(405, { 'Content-Type': 'text/plain' });
        res.end('Method Not Allowed');
    }
}

/**
 * Login user and create session
 */
function login(req, res) {
    console.log('Request handler "login" was called.');
    
    if (req.method === 'POST') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            let data;
            
            // Parse JSON or URL-encoded data
            if (req.headers['content-type']?.includes('application/json')) {
                data = JSON.parse(body);
            } else {
                data = {};
                body.split('&').forEach(pair => {
                    const [key, value] = pair.split('=');
                    data[decodeURIComponent(key)] = decodeURIComponent(value);
                });
            }
            
            if (users.verify(data.login, data.password)) {
                const sessionId = sessions.createSession(data.login);
                
                res.writeHead(200, {
                    'Content-Type': 'text/html; charset=utf-8',
                    'Set-Cookie': `SID=${sessionId}; HttpOnly; Path=/`
                });
                
                if (req.headers['content-type']?.includes('application/json')) {
                    res.end(JSON.stringify({ success: true, message: 'Login successful' }));
                } else {
                    res.write(`
                        <html>
                        <head>
                            <title>Login Successful</title>
                            <meta http-equiv="refresh" content="2;url=/">
                        </head>
                        <body>
                            <h1>Login Successful!</h1>
                            <p>Redirecting to dashboard...</p>
                        </body>
                        </html>
                    `);
                    res.end();
                }
            } else {
                res.writeHead(401, { 'Content-Type': 'text/html; charset=utf-8' });
                res.write(`
                    <html>
                    <head><title>Login Failed</title></head>
                    <body>
                        <h1>Login Failed</h1>
                        <p>Invalid username or password</p>
                        <a href="/">Go back</a>
                    </body>
                    </html>
                `);
                res.end();
            }
        });
    } else {
        res.writeHead(405, { 'Content-Type': 'text/plain' });
        res.end('Method Not Allowed');
    }
}

/**
 * Logout user and destroy session
 */
function logout(req, res) {
    console.log('Request handler "logout" was called.');
    
    const cookies = sessions.parseCookies(req);
    const sessionId = cookies.SID;
    
    if (sessionId) {
        sessions.destroySession(sessionId);
    }
    
    res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Set-Cookie': 'SID=; HttpOnly; Path=/; Max-Age=0'
    });
    res.write(`
        <html>
        <head>
            <title>Logged Out</title>
            <meta http-equiv="refresh" content="2;url=/">
        </head>
        <body>
            <h1>Logged Out Successfully</h1>
            <p>Redirecting to home...</p>
        </body>
        </html>
    `);
    res.end();
}

/**
 * Upload file handler
 */
function upload(req, res) {
    console.log('Request handler "upload" was called.');
    
    const login = sessions.getLoginFromRequest(req);
    
    if (!login) {
        res.writeHead(401, { 'Content-Type': 'text/html; charset=utf-8' });
        res.write('<h1>Unauthorized</h1><p>Please <a href="/">login</a> first.</p>');
        res.end();
        return;
    }
    
    if (req.method === 'POST') {
        const form = formidable({
            uploadDir: path.join(__dirname, 'uploads'),
            keepExtensions: true,
            maxFileSize: 5 * 1024 * 1024, // 5MB
            filter: function ({name, originalFilename, mimetype}) {
                // Only allow images
                return mimetype && mimetype.startsWith('image/');
            }
        });
        
        form.parse(req, (err, fields, files) => {
            if (err) {
                res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
                res.write(`<h1>Upload Error</h1><p>${err.message}</p><a href="/">Go back</a>`);
                res.end();
                return;
            }
            
            const uploadedFile = files.upload?.[0];
            
            if (!uploadedFile) {
                res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
                res.write('<h1>No file uploaded</h1><a href="/">Go back</a>');
                res.end();
                return;
            }
            
            // Rename file to username.extension
            const ext = path.extname(uploadedFile.originalFilename || '.png');
            const newPath = path.join(__dirname, 'uploads', `${login}${ext}`);
            
            fs.rename(uploadedFile.filepath, newPath, (renameErr) => {
                if (renameErr) {
                    res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
                    res.write('<h1>Error saving file</h1><a href="/">Go back</a>');
                    res.end();
                    return;
                }
                
                users.updateLastImage(login, `${login}${ext}`);
                
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.write(`
                    <html>
                    <head><title>Upload Successful</title></head>
                    <body>
                        <h1>Upload Successful!</h1>
                        <p>File uploaded: ${uploadedFile.originalFilename}</p>
                        <ul>
                            <li><a href="/show">View Image</a></li>
                            <li><a href="/">Go back to dashboard</a></li>
                        </ul>
                    </body>
                    </html>
                `);
                res.end();
            });
        });
    } else {
        res.writeHead(405, { 'Content-Type': 'text/plain' });
        res.end('Method Not Allowed');
    }
}

/**
 * Show user's uploaded image
 */
function show(req, res) {
    console.log('Request handler "show" was called.');
    
    const login = sessions.getLoginFromRequest(req);
    
    if (!login) {
        res.writeHead(401, { 'Content-Type': 'text/html; charset=utf-8' });
        res.write('<h1>Unauthorized</h1><p>Please <a href="/">login</a> first.</p>');
        res.end();
        return;
    }
    
    const user = users.getUser(login);
    let imagePath;
    
    if (user.lastImage) {
        imagePath = path.join(__dirname, 'uploads', user.lastImage);
    } else {
        // Try PNG first, then SVG
        const pngPath = path.join(__dirname, 'public', 'default.png');
        const svgPath = path.join(__dirname, 'public', 'default.svg');
        
        if (fs.existsSync(pngPath)) {
            imagePath = pngPath;
        } else {
            imagePath = svgPath;
        }
    }
    
    fs.readFile(imagePath, (err, data) => {
        if (err) {
            // Fallback to default images
            const defaultPaths = [
                path.join(__dirname, 'public', 'default.png'),
                path.join(__dirname, 'public', 'default.svg')
            ];
            
            let foundDefault = false;
            
            for (const defaultPath of defaultPaths) {
                if (fs.existsSync(defaultPath)) {
                    fs.readFile(defaultPath, (err2, data2) => {
                        if (err2) {
                            res.writeHead(404, { 'Content-Type': 'text/plain' });
                            res.end('Image not found');
                            return;
                        }
                        
                        const ext = path.extname(defaultPath).toLowerCase();
                        const contentType = ext === '.svg' ? 'image/svg+xml' : 'image/png';
                        
                        res.writeHead(200, { 'Content-Type': contentType });
                        res.write(data2);
                        res.end();
                    });
                    foundDefault = true;
                    break;
                }
            }
            
            if (!foundDefault) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Image not found');
            }
        } else {
            // Determine content type from extension
            const ext = path.extname(imagePath).toLowerCase();
            const contentTypes = {
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.gif': 'image/gif',
                '.bmp': 'image/bmp',
                '.svg': 'image/svg+xml'
            };
            
            res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'image/png' });
            res.write(data);
            res.end();
        }
    });
}

/**
 * List files in a directory (with path traversal protection)
 */
function find(req, res) {
    console.log('Request handler "find" was called.');
    
    const login = sessions.getLoginFromRequest(req);
    
    if (!login) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
    }
    
    const url = require('url');
    const queryObject = url.parse(req.url, true).query;
    const dirParam = queryObject.dir || 'uploads';
    
    // Security: prevent directory traversal
    const safePath = path.normalize(dirParam).replace(/^(\.\.(\/|\\|$))+/, '');
    const targetDir = path.join(__dirname, safePath);
    
    // Ensure the path is within the project directory
    if (!targetDir.startsWith(__dirname)) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Access denied' }));
        return;
    }
    
    // Read directory recursively
    function readDirRecursive(dir, basePath = '') {
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            const result = [];
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                const relativePath = path.join(basePath, entry.name);
                
                if (entry.isDirectory()) {
                    result.push({
                        name: entry.name,
                        type: 'directory',
                        path: relativePath,
                        children: readDirRecursive(fullPath, relativePath)
                    });
                } else {
                    const stats = fs.statSync(fullPath);
                    result.push({
                        name: entry.name,
                        type: 'file',
                        path: relativePath,
                        size: stats.size
                    });
                }
            }
            
            return result;
        } catch (err) {
            return [];
        }
    }
    
    const fileTree = readDirRecursive(targetDir);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
        directory: dirParam,
        files: fileTree
    }, null, 2));
}

exports.start = start;
exports.register = register;
exports.login = login;
exports.logout = logout;
exports.upload = upload;
exports.show = show;
exports.find = find;
