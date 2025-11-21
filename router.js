// Step 3: Router for handling different URL paths
function route(handle, pathname, req, res) {
    console.log(`About to route a request for ${pathname}`);
    
    if (typeof handle[pathname] === 'function') {
        handle[pathname](req, res);
    } else {
        console.log(`No request handler found for ${pathname}`);
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not found');
    }
}

exports.route = route;
