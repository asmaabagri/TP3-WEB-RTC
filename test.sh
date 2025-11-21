#!/bin/bash
# Test script for TP2 P2P Web Application

BASE_URL="http://localhost:8888"
COOKIE_FILE="test_cookies.txt"

echo "======================================"
echo "TP2 P2P Web Application Test Script"
echo "======================================"
echo ""

# Clean up old cookie file
rm -f $COOKIE_FILE

echo "1. Testing home page..."
curl -s $BASE_URL/ | grep -q "Welcome to P2P Web"
if [ $? -eq 0 ]; then
    echo "✅ Home page accessible"
else
    echo "❌ Home page failed"
fi
echo ""

echo "2. Registering test user..."
REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/register \
  -H "Content-Type: application/json" \
  -d '{"nom":"Test","prenom":"User","login":"testuser","password":"test123"}')

echo "$REGISTER_RESPONSE" | grep -q "success"
if [ $? -eq 0 ]; then
    echo "✅ User registration successful"
    echo "Response: $REGISTER_RESPONSE"
else
    echo "⚠️  User may already exist or registration failed"
    echo "Response: $REGISTER_RESPONSE"
fi
echo ""

echo "3. Logging in..."
curl -s -X POST $BASE_URL/login \
  -H "Content-Type: application/json" \
  -d '{"login":"testuser","password":"test123"}' \
  -c $COOKIE_FILE | grep -q "success"

if [ $? -eq 0 ]; then
    echo "✅ Login successful"
else
    echo "❌ Login failed"
fi
echo ""

echo "4. Checking authenticated dashboard..."
curl -s $BASE_URL/ -b $COOKIE_FILE | grep -q "Welcome, User Test"
if [ $? -eq 0 ]; then
    echo "✅ Authenticated dashboard accessible"
else
    echo "⚠️  Dashboard check inconclusive"
fi
echo ""

echo "5. Testing file listing..."
LIST_RESPONSE=$(curl -s "$BASE_URL/find?dir=uploads" -b $COOKIE_FILE)
echo "$LIST_RESPONSE" | grep -q "directory"
if [ $? -eq 0 ]; then
    echo "✅ File listing works"
    echo "Response: $LIST_RESPONSE"
else
    echo "❌ File listing failed"
fi
echo ""

echo "6. Testing image display..."
curl -s $BASE_URL/show -b $COOKIE_FILE -o /tmp/test_image.dat
if [ -s /tmp/test_image.dat ]; then
    echo "✅ Image endpoint accessible"
    FILE_TYPE=$(file -b /tmp/test_image.dat | cut -d',' -f1)
    echo "Received: $FILE_TYPE"
    rm -f /tmp/test_image.dat
else
    echo "❌ Image endpoint failed"
fi
echo ""

echo "7. Testing logout..."
curl -s $BASE_URL/logout -b $COOKIE_FILE | grep -q "Logged Out"
if [ $? -eq 0 ]; then
    echo "✅ Logout successful"
else
    echo "❌ Logout failed"
fi
echo ""

# Cleanup
rm -f $COOKIE_FILE

echo "======================================"
echo "Test completed!"
echo "======================================"
echo ""
echo "To test file upload manually:"
echo "1. Start the server: npm start"
echo "2. Open browser: http://localhost:8888"
echo "3. Register/Login and upload an image"
echo ""
