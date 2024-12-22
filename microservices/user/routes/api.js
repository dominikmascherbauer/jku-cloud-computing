const express = require('express');
const router = express.Router();
const WebSocket = require('ws');
const axios = require('axios');

const websocketPort = process.env.WEBSOCKET_PORT || '3004'
const databasePort = process.env.DABABASE_PORT || '3002'
const databaseUrl = `http://localhost:${databasePort}/api`

const wss = new WebSocket.Server({ port: websocketPort });

function broadcast(info){
  for(broadcastTarget of wss.clients){
    if(broadcastTarget.readyState === WebSocket.OPEN){
      broadcastTarget.send(JSON.stringify(info))
    }
  }
}

wss.on('connection', (ws, req) => {
  console.log(`WS Client connected, we now have ${wss.clients.size} connected clients`)
  ws.on('close', () => {
    console.log(`Client disconnected, we now have ${wss.clients.size} connected clients`)
  });
});

// Middleware to check if user is logged in
function isLoggedIn(req, res, next) {
  if (!req.jwtProvided) {
    console.log("Denied: Authentication required");
    return res.status(401).send('Authentication required');
  } else if (req.jwtVerifyError || req.jwtExpired) {
    console.log("Denied: Invalid authentication token");
    return res.status(401).send('Invalid authentication token');
  }
  next();
}

function isAdmin(req, res, next) {
  if (req.jwtPayload && req.jwtPayload.userIsAdmin) {
    next();
  } else {
    console.log("Denied: Admin privileges required");
    res.status(403).send('Admin privileges required');
  }
}

// Verifies if a user is logged in
router.get('/user/loggedIn', isLoggedIn, async (req, res) => {
  try {
    res.send({jwtPayload: req.jwtPayload})
  } catch (error) {
    console.error(error)
    return res.status(error.response.status).json(error.response.data);
  }
});

// Get logged in user information
router.get('/user/information', async (req, res) => {
  try {
    if(!req.jwtProvided ||req.jwtVerifyError || req.jwtExpired) res.send()
    else res.send({name: req.jwtPayload.name, isAdmin: req.jwtPayload.userIsAdmin})
  } catch (error) {
    res.status(500).send('Error fetching users information');
    console.error(error)
  }
});

// Get all users endpoint
router.get('/user/all', isLoggedIn, isAdmin, async (req, res) => {
  try {
    //const users = await db.user.findAllUsers()

    const users = await axios.get(databaseUrl+req.path);
    res.json(users.data);
  } catch (error) {
    res.status(500).send('Error fetching users')
    console.error(error)
  }
});

// Delete a user
router.delete('/user/delete/:mail',  isLoggedIn, isAdmin, async (req, res) => {
  try {
    //const ack = await db.user.deleteUserByMail(req.params.mail)
    const ack = await axios.delete(databaseUrl+req.path);
    res.send()
  } catch (error) {
    res.status(500).send('Error deleting user')
    console.error(error)
  }
});

// Update a users role
router.post('/user/:mail/:newRole',  isLoggedIn, isAdmin, async (req, res) => {
  try {
    //const ack = await db.user.updateUserRoleByMail(req.params.mail, req.params.newRole)
    const ack = await axios.post(databaseUrl+req.path)
    res.send()
  } catch (error) {
    res.status(500).send('Error updating user role')
    console.error(error)
  }
});


module.exports = router;
