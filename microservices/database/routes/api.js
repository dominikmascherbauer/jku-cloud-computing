const express = require('express');
const router = express.Router();
const db = require('../database');


// Get all users endpoint
router.get('/user/all',  async (req, res) => {
  try {
    const users = await db.user.findAllUsers()
    res.json(users);
  } catch (error) {
    res.status(500).send('Error fetching users')
    console.error(error)
  }
});

// Get a user by mail endpoint
router.get('/user/:mail',  async (req, res) => {
  try {
    const user = await db.user.findUserByMail(req.params.mail);
    res.json(user);
  } catch (error) {
    res.status(500).send('Error fetching user')
    console.error(error)
  }
});

// Add a user
router.post('/user/add',  async (req, res) => {
  try {
    const ack = await db.user.addUser(req.body);
    res.send()
  } catch (error) {
    res.status(500).send('Error adding a user')
    console.error(error)
  }
});

// Delete a user
router.delete('/user/delete/:mail',  async (req, res) => {
  try {
    const ack = await db.user.deleteUserByMail(req.params.mail)
    res.send()
  } catch (error) {
    res.status(500).send('Error deleting user')
    console.error(error)
  }
});

// Update a users role
router.post('/user/:mail/:newRole', async (req, res) => {
  try {
    const ack = await db.user.updateUserRoleByMail(req.params.mail, req.params.newRole)
    res.send()
  } catch (error) {
    res.status(500).send('Error updating user role')
    console.error(error)
  }
});

// Get all articles to read
router.get('/article/all', async (req, res) => {
  try {
    const articles = await db.article.findAllArticles()
    res.json(articles);
  } catch (error) {
    res.status(500).send('Error fetching all articles')
    console.error(error)
  }
});

// Get all courts including reservations and unavailabilites on a certain date
router.get('/court/all/:date', async (req, res) => {
  try {
    const courts = await db.court.findAllCourtsWithReservationsUnavailabilites(req.params.date);
    res.json(courts)
  } catch (error) {
    res.status(500).send('Error fetching all courts')
    console.error(error)
  }
});


// Get all courts
router.get('/court/all',  async (req, res) => {
  try {
    const courts = await db.court.findAllCourts()
    res.json(courts);
  } catch (error) {
    res.status(500).send('Error fetching all courts')
    console.error(error)
  }
});

// Start watering on a court
router.post('/court/startWatering/:courtId',  async (req, res) => {
  try {
    const ack = await db.court.startWatering(req.params.courtId)
    res.json(ack)
  } catch (error) {
    res.status(500).send('Error starting watering')
    console.error(error)
  }
});

// Stop watering on a court
router.post('/court/stopWatering/:courtId',  async (req, res) => {
  try {
    const ack = await db.court.stopWatering(req.params.courtId)
    res.json(ack)
  } catch (error) {
    res.status(500).send('Error starting watering')
    console.error(error)
  }
});

// Get personal reservations on a court on a date
router.get('/court/reservation/:date/:id',  async (req, res) => {
  try {
    const reservations = await db.court.findPersonalReservations(req.params.id, req.params.date)
    res.json(reservations)
  } catch (error) {
    res.status(500).send('Error fetching all personal reservations')
    console.error(error)
  }
});

// Add a reservation on a court
router.post('/court/reservation/add',  async (req, res) => {
  try {
    console.log(req.body)
    //req.body.userId = req.params.id;
    const ack = await db.court.addReservation(req.body)
    res.send()
  } catch (error) {
    res.status(500).send('Error adding a reservation')
    console.error(error)
  }
});

// Delete a reservation on a court
router.delete('/court/reservation/delete/:reservationId', async (req, res) => {
  try {
    const reservation = await db.court.deleteReservation(req.params.reservationId)
    res.send()
  } catch (error) {
    res.status(500).send('Error deleting a reservation')
    console.error(error)
  }
});

module.exports = router;
