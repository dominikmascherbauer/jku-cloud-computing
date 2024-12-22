const express = require('express');
const router = express.Router();
//const db = require('../database');
const WebSocket = require('ws');
const axios = require('axios');

const websocketPort = process.env.WEBSOCKET_PORT || '3006'
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


// Get all articles to read
router.get('/article/all', async (req, res) => {
  try {
    //const articles = await db.article.findAllArticles()
    const articles = await axios.get(databaseUrl+req.path)
    res.json(articles.data);
  } catch (error) {
    res.status(500).send('Error fetching all articles')
    console.error(error)
  }
});

// Get all courts including reservations and unavailabilites on a certain date
router.get('/court/all/:date', isLoggedIn, async (req, res) => {
  try {
    //const courts = await db.court.findAllCourtsWithReservationsUnavailabilites(req.params.date);
    const courts = await axios.get(databaseUrl+req.path)
    res.json(courts.data)
  } catch (error) {
    res.status(500).send('Error fetching all courts')
    console.error(error)
  }
});


// Get all courts
router.get('/court/all', isLoggedIn, async (req, res) => {
  try {
    //const courts = await db.court.findAllCourts()
    const courts = await axios.get(databaseUrl+req.path)
    res.json(courts.data);
  } catch (error) {
    res.status(500).send('Error fetching all courts')
    console.error(error)
  }
});

// Start watering on a court
router.post('/court/startWatering/:courtId', isLoggedIn, async (req, res) => {
  try {
    //const ack = await db.court.startWatering(req.params.courtId)
    const ack = (await axios.post(databaseUrl+req.path)).data
    broadcast({entity: 'watering', op: 'start', data: {courtId: req.params.courtId, lastWatering: ack}})
    res.json(ack)
  } catch (error) {
    res.status(500).send('Error starting watering')
    console.error(error)
  }
});

// Stop watering on a court
router.post('/court/stopWatering/:courtId', isLoggedIn, async (req, res) => {
  try {
    //const ack = await db.court.stopWatering(req.params.courtId)
    const ack = (await axios.post(databaseUrl+req.path)).data
    broadcast({entity: 'watering', op: 'stop', data: {courtId: req.params.courtId}})
    res.json(ack)
  } catch (error) {
    res.status(500).send('Error starting watering')
    console.error(error)
  }
});

// Get personal reservations on a court on a date
router.get('/court/reservation/:date', isLoggedIn,  async (req, res) => {
  try {
    //const reservations = await db.court.findPersonalReservations(req.jwtPayload.id, req.params.date)
    const reservations = await axios.get(databaseUrl+req.path+`/${req.jwtPayload.id}`)
    res.json(reservations.data)
  } catch (error) {
    res.status(500).send('Error fetching all personal reservations')
    console.error(error)
  }
});

// Add a reservation on a court
router.post('/court/reservation/add', isLoggedIn,  async (req, res) => {
  try {
    req.body.userId = req.jwtPayload.id;
    // await db.court.addReservation(req.body)
    console.log(req.body)
    const ack = (await axios.post(databaseUrl+req.path, req.body)).data
    broadcast({entity: 'reservation', op: 'add', data: {courtId: req.body.courtId, startHour: req.body.startHour}})
    res.send()
  } catch (error) {
    res.status(500).send('Error adding a reservation')
    console.error(error)
  }
});

// Delete a reservation on a court
router.delete('/court/reservation/delete/:reservationId', isLoggedIn, async (req, res) => {
  try {
    //const reservation = await db.court.deleteReservation(req.params.reservationId)
    const reservation = (await axios.delete(databaseUrl+req.path)).data
    broadcast({entity: 'reservation', op: 'delete', data: {courtId: reservation.courtId, startHour: reservation.startHour}})
    res.send()
  } catch (error) {
    res.status(500).send('Error deleting a reservation')
    console.error(error)
  }
});

module.exports = router;
