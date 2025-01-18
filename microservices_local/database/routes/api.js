const express = require('express');
const router = express.Router();
const db = require('../database');
const tracer = require('../tracer')('database-service');

// Get all users endpoint
router.get('/user/all', async (req, res) => {

  const span = tracer.startSpan('get-all-users');
  span.addEvent('Fetching all users.');

  try {
    const users = await db.user.findAllUsers();
    res.json(users);

    if (users) {
      span.setAttributes(users);
    }
    span.addEvent('Found all users.');
  } catch (error) {
    res.status(500).send('Error fetching users');
    console.error(error);
    span.addEvent('Request failed: ' + error);
  }
  span.end();
});

// Get a user by mail endpoint
router.get('/user/:mail', async (req, res) => {

  const span = tracer.startSpan('get-user-by-mail', {
    attributes: {mail: req.params.mail}
  });
  span.addEvent('Fetching user by mail.');

  try {
    const user = await db.user.findUserByMail(req.params.mail);
    res.json(user);

    if (user) {
      span.setAttributes(user);
      span.addEvent('Found user.');
    } else {
      span.addEvent('Could not find user.');
    }
  } catch (error) {
    res.status(500).send('Error fetching user');
    console.error(error);
    span.addEvent('Request failed: ' + error);
  }
  span.end();
});

// Add a user
router.post('/user/add', async (req, res) => {

  const span = tracer.startSpan('add-user', {
    attributes: req.body
  });
  span.addEvent('Adding a user.');

  try {
    const ack = await db.user.addUser(req.body);
    res.send();

    span.addEvent('User add successful.');
  } catch (error) {
    res.status(500).send('Error adding a user');
    console.error(error);
    span.addEvent('Request failed: ' + error);
  }
  span.end();
});

// Delete a user
router.delete('/user/delete/:mail', async (req, res) => {

  const span = tracer.startSpan('delete-user-by-mail', {
    attributes: {mail: req.params.mail}
  });
  span.addEvent('Deleting user by mail.');

  try {
    const ack = await db.user.deleteUserByMail(req.params.mail);
    res.send();

    span.addEvent('User deletion successful.');
  } catch (error) {
    res.status(500).send('Error deleting user');
    console.error(error);
    span.addEvent('Request failed: ' + error);
  }
  span.end();
});

// Update a users role
router.post('/user/:mail/:newRole', async (req, res) => {

  const span = tracer.startSpan('update-user-role', {
    attributes: {mail: req.params.mail, newRole: req.params.newRole}
  });
  span.addEvent('Update user role.');

  try {
    const ack = await db.user.updateUserRoleByMail(req.params.mail, req.params.newRole);
    res.send();

    span.addEvent('Update role successful.');
  } catch (error) {
    res.status(500).send('Error updating user role');
    console.error(error);
    span.addEvent('Request failed: ' + error);
  }
  span.end();
});

// Get all articles to read
router.get('/article/all', async (req, res) => {

  const span = tracer.startSpan('get-all-articles');
  span.addEvent('Fetching all articles.');

  try {
    const articles = await db.article.findAllArticles();
    res.json(articles);

    if (articles) {
      span.setAttributes(articles);
    }
    span.addEvent('Found articles.');
  } catch (error) {
    res.status(500).send('Error fetching all articles');
    console.error(error);
    span.addEvent('Request failed: ' + error);
  }
  span.end();
});

// Get all courts including reservations and unavailabilites on a certain date
router.get('/court/all/:date', async (req, res) => {

  const span = tracer.startSpan('get-court-by-date', {
    attributes: {date: req.params.date}
  });
  span.addEvent('Fetching courts by date.');

  try {
    const courts = await db.court.findAllCourtsWithReservationsUnavailabilites(req.params.date);
    res.json(courts);

    if (courts) {
      span.setAttributes(courts);
    }
    span.addEvent('Found courts.');
  } catch (error) {
    res.status(500).send('Error fetching all courts');
    console.error(error);
    span.addEvent('Request failed: ' + error);
  }
  span.end();
});


// Get all courts
router.get('/court/all', async (req, res) => {

  const span = tracer.startSpan('get-all-courts');
  span.addEvent('Fetching all courts.');

  try {
    const courts = await db.court.findAllCourts();
    res.json(courts);

    if (courts) {
      span.setAttributes(courts);
    }
    span.addEvent('Found courts.');
  } catch (error) {
    res.status(500).send('Error fetching all courts');
    console.error(error);
    span.addEvent('Request failed: ' + error);
  }
  span.end();
});

// Start watering on a court
router.post('/court/startWatering/:courtId', async (req, res) => {

  const span = tracer.startSpan('start-court-watering', {
    attributes: {courtId: req.params.courtId}
  });
  span.addEvent('Start court watering.');

  try {
    const ack = await db.court.startWatering(req.params.courtId);
    res.json(ack);

    span.addEvent('Started watering.');
  } catch (error) {
    res.status(500).send('Error starting watering');
    console.error(error);
    span.addEvent('Request failed: ' + error);
  }
  span.end();
});

// Stop watering on a court
router.post('/court/stopWatering/:courtId', async (req, res) => {

  const span = tracer.startSpan('stop-court-watering', {
    attributes: {courtId: req.params.courtId}
  });
  span.addEvent('Stop court watering.');

  try {
    const ack = await db.court.stopWatering(req.params.courtId);
    res.json(ack);

    span.addEvent('Stopped watering.');
  } catch (error) {
    res.status(500).send('Error starting watering');
    console.error(error);
    span.addEvent('Request failed: ' + error);
  }
  span.end();
});

// Get personal reservations on a court on a date
router.get('/court/reservation/:date/:id', async (req, res) => {

  const span = tracer.startSpan('get-reservations-by-date-and-id', {
    attributes: {date: req.params.date, id: req.params.id}
  });
  span.addEvent('Fetching court reservations.');

  try {
    const reservations = await db.court.findPersonalReservations(req.params.id, req.params.date);
    res.json(reservations);

    if (reservations) {
      span.setAttributes(reservations);
    }
    span.addEvent('Found reservations.');
  } catch (error) {
    res.status(500).send('Error fetching all personal reservations');
    console.error(error);
    span.addEvent('Request failed: ' + error);
  }
  span.end();
});

// Add a reservation on a court
router.post('/court/reservation/add', async (req, res) => {

  const span = tracer.startSpan('add reservation', {
    attributes: req.body
  });
  span.addEvent('Adding reservation.');

  try {
    const ack = await db.court.addReservation(req.body);
    res.send();

    span.addEvent('Added reservation');
  } catch (error) {
    res.status(500).send('Error adding a reservation');
    console.error(error);
    span.addEvent('Request failed: ' + error);
  }
  span.end();
});

// Delete a reservation on a court
router.delete('/court/reservation/delete/:reservationId', async (req, res) => {

  const span = tracer.startSpan('delete reservation', {
    attributes: {reservationId: req.params.reservationId}
  });
  span.addEvent('Deleting court reservation.');

  try {
    const reservation = await db.court.deleteReservation(req.params.reservationId);
    res.send(reservation);

    if (reservation) {
      span.setAttributes(reservation);
    }
    span.addEvent('Deleted reservation.');
  } catch (error) {
    res.status(500).send('Error deleting a reservation');
    console.error(error);
    span.addEvent('Request failed: ' + error);
  }
  span.end();
});

module.exports = router;
