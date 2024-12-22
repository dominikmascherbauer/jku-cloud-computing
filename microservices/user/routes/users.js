var express = require('express');
var bcrypt = require('bcrypt');
var router = express.Router();
var jwt = require('jsonwebtoken');
//var db = require('../database');
const axios = require('axios');

const databasePort = process.env.DABABASE_PORT || '3002'
const databaseUrl = `http://localhost:${databasePort}/api`

const saltRounds = 10;
const jwtSecret = process.env.JWT_SECRET;

// Login endpoint
router.post('/login', async function(req, res) {
    const { mail, pw } = req.body;
    if (!mail || !pw) {
        return res.status(400).send({ status: 'fail', message: 'Missing email or password' });
    }

    try {
        //const user = await db.user.findUserByMail(mail);
        const user = (await axios.get(databaseUrl+`/${req.params.mail}`)).data;
        if (user && await bcrypt.compare(pw, user.password)) {
            const token = jwt.sign({ id: user.id, userMail: user.mail, name: `${user.firstname} ${user.lastname}`, userIsAdmin: user.role.startsWith('admin') }, jwtSecret, { expiresIn: '1h' });
            res.send({ status: 'success', message: 'Login successful', token: token, expiresAt: Date.now() + 3600000, name: `${user.firstname} ${user.lastname}`, isAdmin: user.role.startsWith('admin')});
        } else {
            res.status(401).send({ status: 'fail', message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).send({ status: 'fail', message: 'Server error' });
    }
});

// Registration endpoint
router.post('/register', async function(req, res) {
    const { firstname, lastname, mail, pw, role } = req.body;
    if (!mail || !pw) {
        return res.status(400).send({ status: 'fail', message: 'Missing email or password' });
    }

    try {
        //const userExists = await db.user.findUserByMail(mail);
        const userExists = (await axios.get(databaseUrl+`/user/${req.params.mail}`)).data;
        if (userExists) {
            console.log("addUser")
            res.status(409).send({ status: 'fail', message: 'User already exists' });
        } else {
            const hashedPw = await bcrypt.hash(pw, saltRounds);
            console.log("addUser")
            const ack =  axios.post(databaseUrl+req.path, {firstname, lastname,  mail, password: hashedPw, role });
            //await db.user.addUser({firstname, lastname,  mail, password: hashedPw, role });
            console.log("addUser")
            res.send({ status: 'success', message: 'Registration successful' });
        }
    } catch (error) {
        res.status(500).send({ status: 'fail', message: 'Server error' });
    }
});

module.exports = router;
