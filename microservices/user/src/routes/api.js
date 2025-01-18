const express = require('express');
const router = express.Router();
const WebSocket = require('ws');
const axios = require('axios');
const config = require('../config');
const tracer = require('../tracer')(config.userService.name);

const databaseUrl = `http://${config.databaseService.name}:${config.databaseService.port.http}/api`;

// Middleware to check if user is logged in
function isLoggedIn(req, res, next) {

  const span = tracer.startSpan('is-logged-in-middleware', {
    attributes: req.jwtPayload
  });
  span.addEvent('Checking login status.');

  if (!req.jwtProvided) {
    console.log('Denied: Authentication required');
    span.addEvent('Denied: Authentication required');
    span.end();
    return res.status(401).send('Authentication required');
  } else if (req.jwtVerifyError || req.jwtExpired) {
    console.log('Denied: Invalid authentication token');
    span.addEvent('Denied: Invalid authentication token');
    span.end();
    return res.status(401).send('Invalid authentication token');
  }
  span.addEvent('Login check successful.');
  span.end();
  next();
}

function isAdmin(req, res, next) {

  const span = tracer.startSpan('is-admin-middleware', {
    attributes: req.jwtPayload
  });
  span.addEvent('Checking if logged in user is admin.');

  if (req.jwtPayload && req.jwtPayload.userIsAdmin) {
    span.addEvent('Is admin check successful.');
    next();
  } else {
    console.log('Denied: Admin privileges required');
    span.addEvent('Denied: Admin privileges required');
    res.status(403).send('Admin privileges required');
  }
  span.end();
}

// Verifies if a user is logged in
router.get('/user/loggedIn', isLoggedIn, async (req, res) => {

  const span = tracer.startSpan('verify-user-logged-in', {
    attributes: req.jwtPayload
  });
  span.addEvent('Send current login data.');

  try {
    res.send({jwtPayload: req.jwtPayload});
    span.addEvent('Sent jwt payload.');
    span.end();
  } catch (error) {
    console.error(error);
    span.addEvent('Request failed: ' + error);
    span.end();
    return res.status(error.response.status).json(error.response.data);
  }
});

// Get logged in user information
router.get('/user/information', async (req, res) => {

  const span = tracer.startSpan('get-logged-in-user-information', {
    attributes: req.jwtPayload
  });
  span.addEvent('Fetching user information.');

  try {
    if (!req.jwtProvided || req.jwtVerifyError || req.jwtExpired) {
      res.send();
      span.addEvent('No valid jwt token found.');
    } else {
      res.send({name: req.jwtPayload.name, isAdmin: req.jwtPayload.userIsAdmin});
      span.addEvent('Valid jwt token found.');
    }
  } catch (error) {
    res.status(500).send('Error fetching users information');
    console.error(error);
    span.addEvent('Request failed: ' + error);
  }
  span.end();
});

// Get all users endpoint
router.get('/user/all', isLoggedIn, isAdmin, async (req, res) => {

  const span = tracer.startSpan('get-all-users', {
    attributes: {mail: req.params.mail}
  });
  span.addEvent('Fetching all users.');

  try {
    const users = await axios.get(databaseUrl + req.path);
    res.json(users.data);

    if (users) {
      span.setAttributes(users);
    }
    span.addEvent('Found users.');
  } catch (error) {
    res.status(500).send('Error fetching users');
    console.error(error);
    span.addEvent('Request failed: ' + error);
  }
  span.end();
});

// Delete a user
router.delete('/user/delete/:mail', isLoggedIn, isAdmin, async (req, res) => {

  const span = tracer.startSpan('delete-user-by-mail', {
    attributes: {mail: req.params.mail}
  });
  span.addEvent('Deleting user by mail.');

  try {
    const ack = await axios.delete(databaseUrl + req.path);
    res.send();

    span.addEvent('Deleted user.');
  } catch (error) {
    res.status(500).send('Error deleting user');
    console.error(error);
    span.addEvent('Request failed: ' + error);
  }
  span.end();
});

// Update a users role
router.post('/user/:mail/:newRole', isLoggedIn, isAdmin, async (req, res) => {

  const span = tracer.startSpan('update-user-role', {
    attributes: {mail: req.params.mail, newRole: req.params.newRole}
  });
  span.addEvent('Updating user role.');

  try {
    const ack = await axios.post(databaseUrl + req.path);
    res.send();

    span.addEvent('Updated user role.');
  } catch (error) {
    res.status(500).send('Error updating user role');
    console.error(error);
    span.addEvent('Request failed: ' + error);
  }
  span.end();
});


module.exports = router;
