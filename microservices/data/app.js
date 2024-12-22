var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
    console.error('FATAL ERROR: JWT_SECRET env var is not defined.');
    process.exit(1); // Exit the process with an error code
}

var apiRouter = require('./routes/api');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


function verifyToken(req, res, next) {
    let token = req.headers['authorization'];
    req.jwtProvided = false;
    req.jwtVerifyError = false;
    req.jwtExpired = false;
    req.jwtPayload = null;

    if (token) {
        token = token.replace("Bearer ", "")
        req.jwtProvided = true;
        jwt.verify(token, jwtSecret, (err, decoded) => {
            if (err) {
                req.jwtVerifyError = true;
                // Check if the error is because the JWT has expired
                if (err.name === 'TokenExpiredError') {
                    req.jwtExpired = true; // You can add this line to indicate specifically that the JWT expired
                }
            } else {
                // console.log("JWT: ", decoded)
                req.jwtPayload = decoded;
            }
            next();
        });
    } else {
        next();
    }
}

// Apply the verifyToken middleware to all routes
// The order of our middlewares matters: If we put this before
// setting up our express.static middleware, JWT would even be checked
// for every static resource, which would introduce unncessary overhead.
app.use(verifyToken);


app.use('/api', apiRouter)

module.exports = app;
