const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  console.error('FATAL ERROR: JWT_SECRET env var is not defined.');
  process.exit(1); // Exit the process with an error code
}

const apiRouter = require('./routes/api');
const userRouter = require('./routes/users');

const app = express();

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


function verifyToken(req, res, next) {
  let token = req.headers['authorization'];
  req.jwtProvided = false;
  req.jwtVerifyError = false;
  req.jwtExpired = false;
  req.jwtPayload = null;

  if (token) {
    token = token.replace('Bearer ', '');
    req.jwtProvided = true;
    jwt.verify(token, jwtSecret, (err, decoded) => {
      if (err) {
        req.jwtVerifyError = true;
        // Check if the error is because the JWT has expired
        if (err.name === 'TokenExpiredError') {
          req.jwtExpired = true; // This line indicates specifically that the JWT expired
        }
      } else {
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
// for every static resource, which would introduce unnecessary overhead.
app.use(verifyToken);

// handles /user_handling/login and /user_handling/register
app.use('/user_handling', userRouter);
app.use('/api', apiRouter);

module.exports = app;
