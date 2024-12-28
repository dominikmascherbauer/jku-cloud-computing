const express = require('express');
const router = express.Router();
//const db = require('../database');
const WebSocket = require('ws');
const axios = require('axios');
const config = require('../../config');
var tracer = require('../tracer')('data-service')

var api = require('@opentelemetry/api');


const websocketPort = config.port.data.websocket;
const databaseUrl = config.url.database+"api";
const userUrl = config.url.user+"api";

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


async function traceUserServiceRequest(req, res, next) {

}

async function traceDataBaseServiceRequest(req, res, next) {

}

async function isLoggedIn(req, res, next) {
  const reqHeaders = { headers: {'Authorization': req.headers['authorization']} }

  const currentSpan = api.trace.getActiveSpan();
  // display traceid in the terminal
  const traceId = currentSpan.spanContext().traceId;
  console.log(`traceId: ${traceId}`);
  const span = tracer.startSpan('check-is-logged-in-with-user-service', {
    attributes: reqHeaders.headers,
  });
  // Annotate our span to capture metadata about the operation
  span.addEvent('Send user login check request to user service with authorization header');
  try {
    const response = await axios.get(userUrl+"/user/loggedIn", reqHeaders)
    req.jwtPayload = response.data.jwtPayload

    span.setAttributes(response.data.jwtPayload)
    span.addEvent('Got jwt payload as response from user service');
    span.end();
  } catch (error) {
    console.error(error)
    span.addEvent('Request failed: ' + error);
    span.end();
    return res.status(error.response.status).json(error.response.data);
  }
  next();
}



// Get all articles to read
router.get('/article/all', async (req, res) => {
  const currentSpan = api.trace.getActiveSpan();
  // display traceid in the terminal
  const traceId = currentSpan.spanContext().traceId;
  console.log(`traceId: ${traceId}`);
  const span = tracer.startSpan('get-all-users-with-database-service');
  // Annotate our span to capture metadata about the operation
  span.addEvent('Send get all users request to database service.');
  try {
    //const articles = await db.article.findAllArticles()
    const articles = await axios.get(databaseUrl+req.path)
    res.json(articles.data);
    span.addEvent('Got user data: ' + articles.data);
  } catch (error) {
    res.status(500).send('Error fetching all articles')
    console.error(error)
    span.addEvent('Request failed: ' + error);
  }
  span.end();
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
    console.log("id"+req.jwtPayload.id)
    // await db.court.addReservation(req.body)
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
    console.log(reservation)
    broadcast({entity: 'reservation', op: 'delete', data: {courtId: reservation.courtId, startHour: reservation.startHour}})
    res.send()
  } catch (error) {
    res.status(500).send('Error deleting a reservation')
    console.error(error)
  }
});

module.exports = router;
