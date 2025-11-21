// Main entry point - Complete P2P Web Application
const server = require('./server');
const router = require('./router');
const requestHandlers = require('./requestHandlers');

// Route mapping
const handle = {};
handle['/'] = requestHandlers.start;
handle['/start'] = requestHandlers.start;
handle['/register'] = requestHandlers.register;
handle['/login'] = requestHandlers.login;
handle['/logout'] = requestHandlers.logout;
handle['/upload'] = requestHandlers.upload;
handle['/show'] = requestHandlers.show;
handle['/find'] = requestHandlers.find;

server.start(router.route, handle);
