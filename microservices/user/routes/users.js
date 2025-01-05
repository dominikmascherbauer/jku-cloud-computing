var express = require('express');
var bcrypt = require('bcrypt');
var router = express.Router();
var jwt = require('jsonwebtoken');
const axios = require('axios');
var config = require('../../config');
const tracer = require('../tracer')('user-service')

const api = require('@opentelemetry/api');


const databaseUrl = config.url.database+"api";

const saltRounds = 10;
const jwtSecret = process.env.JWT_SECRET;

function createSpan(name, options) {
    const currentSpan = api.trace.getActiveSpan();
    // display traceid in the terminal
    const traceId = currentSpan.spanContext().traceId;
    console.log(`traceId: ${traceId}`);
    return tracer.startSpan(name, options);
}

// Login endpoint
router.post('/login', async function(req, res) {

    const span = createSpan('login-user', {
        attributes: req.body
    });
    span.addEvent('Logging in user.');

    const { mail, pw } = req.body;
    if (!mail || !pw) {
        span.addEvent('Missing email or password');
        span.end();
        return res.status(400).send({ status: 'fail', message: 'Missing email or password' });
    }

    try {
        //const user = await db.user.findUserByMail(mail);
        console.log(databaseUrl+`/${mail}`)
        const user = (await axios.get(databaseUrl+`/user/${mail}`)).data;

        span.setAttributes(user)
        span.addEvent('Found user by mail.')

        if (user && await bcrypt.compare(pw, user.password)) {
            const token = jwt.sign({ id: user.id, userMail: user.mail, name: `${user.firstname} ${user.lastname}`, userIsAdmin: user.role.startsWith('admin') }, jwtSecret, { expiresIn: '1h' });
            const response = { status: 'success', message: 'Login successful', token: token, expiresAt: Date.now() + 3600000, name: `${user.firstname} ${user.lastname}`, isAdmin: user.role.startsWith('admin')}
            res.send(response);
            span.setAttributes(response)
            span.addEvent('Login successful')
        } else {
            res.status(401).send({ status: 'fail', message: 'Invalid credentials' });
            span.addEvent('Invalid credentials')
        }
    } catch (error) {
        res.status(500).send({ status: 'fail', message: 'Server error' });
        span.addEvent('Server error: ' + error)
    }
    span.end();
});

// Registration endpoint
router.post('/register', async function(req, res) {

    const span = createSpan('register-user', {
        attributes: req.body
    });
    span.addEvent('Registering in user.');

    const { firstname, lastname, mail, pw, role } = req.body;
    if (!mail || !pw) {
        span.addEvent('Missing email or password');
        span.end();
        return res.status(400).send({ status: 'fail', message: 'Missing email or password' });
    }

    try {
        //const userExists = await db.user.findUserByMail(mail);
        const userExists = (await axios.get(databaseUrl+`/user/${mail}`)).data;
        if (userExists) {
            res.status(409).send({ status: 'fail', message: 'User already exists' });
            span.setAttributes(userExists)
            span.addEvent('Failed, user already exists.')
        } else {
            const hashedPw = await bcrypt.hash(pw, saltRounds);
            const ack =  await axios.post(databaseUrl+`/user/add`, {firstname, lastname,  mail, password: hashedPw, role });
            //await db.user.addUser({firstname, lastname,  mail, password: hashedPw, role });
            res.send({ status: 'success', message: 'Registration successful' });
            span.setAttribute('hashedPw', hashedPw)
            span.addEvent('Registration successful')
        }
    } catch (error) {
        res.status(500).send({ status: 'fail', message: 'Server error' });
        span.addEvent('Server error: ' + error)
    }

    span.end();
});

module.exports = router;
