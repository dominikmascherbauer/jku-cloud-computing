const express = require('express');
const router = express.Router();
//const db = require('../database');
const WebSocket = require('ws');
const axios = require('axios');
const config = require('../../config');
const tracer = require('../tracer')('data-service')

const api = require('@opentelemetry/api');


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


function createSpan(name, options) {
  const currentSpan = api.trace.getActiveSpan();
  // display traceid in the terminal
  const traceId = currentSpan.spanContext().traceId;
  console.log(`traceId: ${traceId}`);
  return tracer.startSpan(name, options);
}

async function isLoggedIn(req, res, next) {
  const reqHeaders = { headers: {'Authorization': req.headers['authorization']} }

  const span = createSpan('is-logged-in', {
    attributes: reqHeaders.headers,
  });
  span.addEvent('Send user login check request to user service with authorization header');

  try {
    const response = await axios.get(userUrl+"/user/loggedIn", reqHeaders)
    req.jwtPayload = response.data.jwtPayload
    span.setAttributes(response.data.jwtPayload)
    span.addEvent('Received jwt payload from user service.');
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

  const span = createSpan('get-all-articles');
  span.addEvent('Send get all articles request to database service.');

  try {
    //const articles = await db.article.findAllArticles()
    const articles = await axios.get(databaseUrl+req.path)
    res.json(articles.data);
    span.setAttributes(articles.data)
    span.addEvent('Received all article data from database service.');
  } catch (error) {
    res.status(500).send('Error fetching all articles')
    console.error(error)
    span.addEvent('Request failed: ' + error);
  }
  span.end();
});

// Get all courts including reservations and unavailabilites on a certain date
router.get('/court/all/:date', isLoggedIn, async (req, res) => {

  const span = createSpan('get-courts-by-date', {
    attributes: { date: req.params.date },
  });
  span.addEvent('Request courts on a certain date from database service');

  try {
    //const courts = await db.court.findAllCourtsWithReservationsUnavailabilites(req.params.date);
    const courts = await axios.get(databaseUrl + req.path)
    res.json(courts.data)
    span.setAttributes(courts.data)
    span.addEvent('Received court data.');
  } catch (error) {
    res.status(500).send('Error fetching all courts')
    console.error(error)
    span.addEvent('Request failed: ' + error);
  }
  span.end();
});


// Get all courts
router.get('/court/all', isLoggedIn, async (req, res) => {

  const span = createSpan('get-all-courts');
  span.addEvent('Send get all courts request to database service.');

  try {
    //const courts = await db.court.findAllCourts()
    const courts = await axios.get(databaseUrl+req.path)
    res.json(courts.data);
    span.setAttributes(courts.data)
    span.addEvent('Received court data.');
  } catch (error) {
    res.status(500).send('Error fetching all courts')
    console.error(error)
    span.addEvent('Request failed: ' + error);
  }
  span.end();
});

// Start watering on a court
router.post('/court/startWatering/:courtId', isLoggedIn, async (req, res) => {

  const span = createSpan('start-court-watering', {
    attributes: { courtId: req.params.courtId },
  });
  span.addEvent('Send start court watering to database service.');

  try {
    //const ack = await db.court.startWatering(req.params.courtId)
    const ack = (await axios.post(databaseUrl+req.path)).data;
    broadcast({entity: 'watering', op: 'start', data: {courtId: req.params.courtId, lastWatering: ack}});
    res.json(ack);
    span.addEvent('Received acknowledge, broadcasting watering information with webservice.');
  } catch (error) {
    res.status(500).send('Error starting watering');
    console.error(error);
    span.addEvent('Start watering failed: ' + error);
  }
  span.end();
});

// Stop watering on a court
router.post('/court/stopWatering/:courtId', isLoggedIn, async (req, res) => {

  const span = createSpan('stop-court-watering', {
    attributes: { courtId: req.params.courtId },
  });
  span.addEvent('Send stop court watering to database service.');

  try {
    //const ack = await db.court.stopWatering(req.params.courtId)
    const ack = (await axios.post(databaseUrl+req.path)).data
    broadcast({entity: 'watering', op: 'stop', data: {courtId: req.params.courtId}});
    res.json(ack);
    span.addEvent('Received acknowledge, broadcasting watering information with webservice.');
  } catch (error) {
    res.status(500).send('Error starting watering');
    console.error(error);
    span.addEvent('Stop watering failed: ' + error);
  }
  span.end();
});

// Get personal reservations on a court on a date
router.get('/court/reservation/:date', isLoggedIn,  async (req, res) => {

  const span = createSpan('get-reservations-by-date', {
    attributes: { date: req.params.date },
  });
  span.addEvent('Request reservations on a certain date from database service');

  try {
    //const reservations = await db.court.findPersonalReservations(req.jwtPayload.id, req.params.date)
    const reservations = await axios.get(databaseUrl+req.path+`/${req.jwtPayload.id}`)
    res.json(reservations.data);
    span.setAttributes(reservations.data)
    span.addEvent('Received reservation data.')
  } catch (error) {
    res.status(500).send('Error fetching all personal reservations')
    console.error(error)
    span.addEvent('Request failed: ' + error);
  }
  span.end();
});

// Add a reservation on a court
router.post('/court/reservation/add', isLoggedIn,  async (req, res) => {

  const span = createSpan('add-reservation', {
    attributes: req.body
  });
  span.addEvent('send add reservation request to database service');

  try {
    req.body.userId = req.jwtPayload.id;
    console.log("id"+req.jwtPayload.id)
    // await db.court.addReservation(req.body)
    const ack = (await axios.post(databaseUrl+req.path, req.body)).data
    broadcast({entity: 'reservation', op: 'add', data: {courtId: req.body.courtId, startHour: req.body.startHour}})
    res.send()
    span.addEvent('Received acknowledge, broadcasting reservation information with webservice.');
  } catch (error) {
    res.status(500).send('Error adding a reservation')
    console.error(error)
    span.addEvent('Request failed: ' + error);
  }
  span.end();
});

// Delete a reservation on a court
router.delete('/court/reservation/delete/:reservationId', isLoggedIn, async (req, res) => {

  const span = createSpan('delete-reservation', {
    attributes: { reservationId: req.params.reservationId }
  });
  span.addEvent('Send delete reservation request to database service');

  try {
    //const reservation = await db.court.deleteReservation(req.params.reservationId)
    const reservation = (await axios.delete(databaseUrl+req.path)).data
    console.log(reservation)
    broadcast({entity: 'reservation', op: 'delete', data: {courtId: reservation.courtId, startHour: reservation.startHour}})
    res.send()
    span.setAttributes(reservation)
    span.addEvent('Received acknowledge, broadcasting reservation information with webservice.');
  } catch (error) {
    res.status(500).send('Error deleting a reservation')
    console.error(error)
    span.addEvent('Request failed: ' + error);
  }
  span.end();
});

module.exports = router;
