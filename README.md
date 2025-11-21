# TP2 P2P Web Application

A simple peer-to-peer web application built with Node.js demonstrating user authentication, session management, and file uploads.

## Features

- ✅ User Registration with password hashing (PBKDF2)
- ✅ User Authentication with sessions
- ✅ Cookie-based session management
- ✅ File upload (images only, max 5MB)
- ✅ Image display per user
- ✅ Directory browsing with security
- ✅ In-memory user and session storage

## Prerequisites

- Node.js ≥ 14.x
- npm or yarn

## Installation

1. Navigate to the project directory:
```bash
cd /Users/akramelmamoun/Desktop/tp_p2p/TP2_p2p
```

2. Install dependencies:
```bash
npm install
```

## Running the Application

Start the server:
```bash
npm start
```

Or directly:
```bash
node index.js
```

The server will start on **http://localhost:8888**

## Project Structure

```
TP2_p2p/
├── index.js              # Main entry point
├── server.js             # HTTP server
├── router.js             # URL routing
├── requestHandlers.js    # Request handlers (controllers)
├── users.js              # User management
├── sessions.js           # Session management
├── package.json          # Dependencies
├── uploads/              # User uploaded images
└── public/               # Static files (default.png)
```

## API Endpoints

### Public Routes
- `GET /` or `/start` - Home page (login/register or dashboard)
- `POST /register` - Register a new user
- `POST /login` - Login and create session

### Protected Routes (require authentication)
- `GET /logout` - Logout and destroy session
- `POST /upload` - Upload an image
- `GET /show` - Display user's uploaded image
- `GET /find?dir=uploads` - List files in directory (JSON)

## Usage

### 1. Register a New User

**Via Browser:**
- Go to http://localhost:8888/
- Fill in the registration form
- Click "Register"

**Via cURL:**
```bash
curl -X POST http://localhost:8888/register \
  -H "Content-Type: application/json" \
  -d '{"nom":"Doe","prenom":"John","login":"johndoe","password":"password123"}'
```

### 2. Login

**Via Browser:**
- Use the login form on the home page

**Via cURL:**
```bash
curl -X POST http://localhost:8888/login \
  -H "Content-Type: application/json" \
  -d '{"login":"johndoe","password":"password123"}' \
  -c cookies.txt
```

### 3. Upload an Image

**Via Browser:**
- After logging in, use the upload form on the dashboard

**Via cURL:**
```bash
curl -X POST http://localhost:8888/upload \
  -b cookies.txt \
  -F "upload=@/path/to/image.png"
```

### 4. View Your Image

**Via Browser:**
- Click "View My Image" on the dashboard
- Or go to http://localhost:8888/show

**Via cURL:**
```bash
curl http://localhost:8888/show -b cookies.txt -o myimage.png
```

### 5. Browse Uploaded Files

```bash
curl http://localhost:8888/find?dir=uploads -b cookies.txt
```

### 6. Logout

**Via Browser:**
- Click "Logout" link

**Via cURL:**
```bash
curl http://localhost:8888/logout -b cookies.txt
```

## Security Features

- **Password Hashing**: Uses PBKDF2 with 100,000 iterations and SHA-256
- **Random Salt**: Each user has a unique salt
- **HttpOnly Cookies**: Session cookies cannot be accessed via JavaScript
- **Path Traversal Protection**: Directory listing is secured
- **File Type Validation**: Only image files can be uploaded
- **File Size Limit**: Maximum 5MB per upload
- **Session-based Authentication**: All protected routes require valid session

## Limitations

⚠️ **This is a demonstration project for learning purposes:**

- **No Persistent Storage**: All data (users, sessions) is stored in memory and lost on server restart
- **No HTTPS**: Communications are not encrypted
- **No Rate Limiting**: Vulnerable to brute force attacks
- **Single Server**: Not designed for horizontal scaling
- **No Database**: Should use PostgreSQL/MongoDB for production
- **No Input Validation**: Should add comprehensive validation
- **No CSRF Protection**: Should implement CSRF tokens

## Development Steps (as per TP requirements)

1. ✅ **Step 1**: Minimal "Hello World" server
2. ✅ **Step 2**: Modularize into server.js and index.js
3. ✅ **Step 3**: Add router for URL routing
4. ✅ **Step 4**: Add request handlers
5. ✅ **Step 5**: Synchronous response patterns
6. ✅ **Step 6**: Asynchronous response patterns
7. ✅ **Additional**: User management with authentication
8. ✅ **Additional**: Session management with cookies
9. ✅ **Additional**: File upload with formidable

## Technologies Used

- **Node.js**: Runtime environment
- **http module**: HTTP server
- **crypto module**: Password hashing and session IDs
- **fs module**: File system operations
- **formidable**: File upload handling


