// Step 3: Server with routing
const http = require('http');
const url = require('url');

function start(route, handle) {
    function onRequest(req, res) {
        const pathname = url.parse(req.url).pathname;
        console.log(`Request for ${pathname} received.`);
        route(handle, pathname, req, res);
    }
    
    const PORT = process.env.PORT || 8888;
    http.createServer(onRequest).listen(PORT);
    console.log(`Server has started and is listening on port ${PORT}`);
}

exports.start = start;
