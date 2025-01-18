const express = require('express');
const router = express.Router();
const WebSocket = require('ws');
const axios = require('axios');
const config = require('../config');
const tracer = require('../tracer')(config.dataService.name);

const websocketPort = config.dataService.port.websocket;
const databaseUrl = `http://${config.databaseService.name}:${config.databaseService.port.http}/api`;
const userUrl = `http://${config.userService.name}:${config.userService.port.http}/api`;

const wss = new WebSocket.Server({port: websocketPort});

function broadcast(info) {
  for (broadcastTarget of wss.clients) {
    if (broadcastTarget.readyState === WebSocket.OPEN) {
      broadcastTarget.send(JSON.stringify(info));
    }
  }
}

wss.on('connection', (ws, req) => {
  console.log(`WS Client connected, we now have ${wss.clients.size} connected clients`);
  ws.on('close', () => {
    console.log(`Client disconnected, we now have ${wss.clients.size} connected clients`);
  });
});

async function isLoggedIn(req, res, next) {
  const reqHeaders = {headers: {'Authorization': req.headers['authorization']}};

  const span = tracer.startSpan('is-logged-in', {
    attributes: reqHeaders.headers,
  });
  span.addEvent('Send user login check request to user service with authorization header');

  try {
    const response = await axios.get(userUrl + '/user/loggedIn', reqHeaders);
    req.jwtPayload = response.data.jwtPayload;
    span.setAttributes(response.data.jwtPayload);

    span.addEvent('Received jwt payload from user service.');
  } catch (error) {
    console.error(error);
    span.addEvent('Request failed: ' + error);
    span.end();
    return res.status(error.response.status).json(error.response.data);
  }
  span.end();
  next();
}


// Get all articles to read
router.get('/article/all', async (req, res) => {

  const span = tracer.startSpan('get-all-articles');
  span.addEvent('Send get all articles request to database service.');

  try {
    const articles = await axios.get(databaseUrl + req.path);
    res.json(articles.data);

    if (articles && articles.data) {
      span.setAttributes(articles.data);
    }
    span.addEvent('Received all article data from database service.');
  } catch (error) {
    res.status(500).send('Error fetching all articles');
    console.error(error);
    span.addEvent('Request failed: ' + error);
  }
  span.end();
});

// Get all courts including reservations and unavailabilites on a certain date
router.get('/court/all/:date', isLoggedIn, async (req, res) => {

  const span = tracer.startSpan('get-courts-by-date', {
    attributes: {date: req.params.date},
  });
  span.addEvent('Request courts on a certain date from database service');

  try {
    const courts = await axios.get(databaseUrl + req.path);
    res.json(courts.data);

    if (courts && courts.data) {
      span.setAttributes(courts.data);
    }
    span.addEvent('Received court data.');
  } catch (error) {
    res.status(500).send('Error fetching all courts');
    console.error(error);
    span.addEvent('Request failed: ' + error);
  }
  span.end();
});


// Get all courts
router.get('/court/all', isLoggedIn, async (req, res) => {

  const span = tracer.startSpan('get-all-courts');
  span.addEvent('Send get all courts request to database service.');

  try {
    const courts = await axios.get(databaseUrl + req.path);
    res.json(courts.data);

    if (courts && courts.data) {
      span.setAttributes(courts.data);
    }
    span.addEvent('Received court data.');
  } catch (error) {
    res.status(500).send('Error fetching all courts');
    console.error(error);
    span.addEvent('Request failed: ' + error);
  }
  span.end();
});

// Start watering on a court
router.post('/court/startWatering/:courtId', isLoggedIn, async (req, res) => {

  const span = tracer.startSpan('start-court-watering', {
    attributes: {courtId: req.params.courtId},
  });
  span.addEvent('Send start court watering to database service.');

  try {
    const ack = (await axios.post(databaseUrl + req.path)).data;
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

  const span = tracer.startSpan('stop-court-watering', {
    attributes: {courtId: req.params.courtId},
  });
  span.addEvent('Send stop court watering to database service.');

  try {
    const ack = (await axios.post(databaseUrl + req.path)).data;
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
router.get('/court/reservation/:date', isLoggedIn, async (req, res) => {

  const span = tracer.startSpan('get-reservations-by-date', {
    attributes: {date: req.params.date},
  });
  span.addEvent('Request reservations on a certain date from database service');

  try {
    const reservations = await axios.get(databaseUrl + req.path + `/${req.jwtPayload.id}`);
    res.json(reservations.data);

    if (reservations && reservations.data) {
      span.setAttributes(reservations.data);
    }
    span.addEvent('Received reservation data.');
  } catch (error) {
    res.status(500).send('Error fetching all personal reservations');
    console.error(error);
    span.addEvent('Request failed: ' + error);
  }
  span.end();
});

// Add a reservation on a court
router.post('/court/reservation/add', isLoggedIn, async (req, res) => {

  const span = tracer.startSpan('add-reservation', {
    attributes: req.body
  });
  span.addEvent('send add reservation request to database service');

  try {
    req.body.userId = req.jwtPayload.id;
    console.log('id' + req.jwtPayload.id);
    const ack = (await axios.post(databaseUrl + req.path, req.body)).data;
    broadcast({entity: 'reservation', op: 'add', data: {courtId: req.body.courtId, startHour: req.body.startHour}});
    res.send();

    span.addEvent('Received acknowledge, broadcasting reservation information with webservice.');
  } catch (error) {
    res.status(500).send('Error adding a reservation');
    console.error(error);
    span.addEvent('Request failed: ' + error);
  }
  span.end();
});

// Delete a reservation on a court
router.delete('/court/reservation/delete/:reservationId', isLoggedIn, async (req, res) => {

  const span = tracer.startSpan('delete-reservation', {
    attributes: {reservationId: req.params.reservationId}
  });
  span.addEvent('Send delete reservation request to database service');

  try {
    const reservation = (await axios.delete(databaseUrl + req.path)).data;
    broadcast({
      entity: 'reservation',
      op: 'delete',
      data: {courtId: reservation.courtId, startHour: reservation.startHour}
    });
    res.send();

    if (reservation) {
      span.setAttributes(reservation);
    }
    span.addEvent('Received acknowledge, broadcasting reservation information with webservice.');
  } catch (error) {
    res.status(500).send('Error deleting a reservation');
    console.error(error);
    span.addEvent('Request failed: ' + error);
  }
  span.end();
});

module.exports = router;
