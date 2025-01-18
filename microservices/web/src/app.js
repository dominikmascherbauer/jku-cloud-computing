const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
var config = require('./config');
const tracer = require('./tracer')(config.webService.name);

const app = express();

function traceRequest(req, res, next) {
  const span = tracer.startSpan('web-service-request', {
    attributes: {protocol: req.protocol, path: req.path},
  });
  // Annotate our span to capture metadata about the operation
  span.addEvent('Received request for ' + req.path);

  req.on('error', (err) => console.log(err));
  req.on('end', () => {
    span.addEvent('finished request');
    span.end();
  });

  next();
}

app.use(traceRequest);
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


module.exports = app;
