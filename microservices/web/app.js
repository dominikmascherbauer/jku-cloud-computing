var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
var tracer = require('./tracer')('web-service')

var api = require('@opentelemetry/api');


var app = express();


function traceRequest(req, res, next) {
    const currentSpan = api.trace.getActiveSpan();
    // display traceid in the terminal
    const traceId = currentSpan.spanContext().traceId;
    console.log(`traceId: ${traceId}`);
    const span = tracer.startSpan('web-service-request', {
        kind: 1,
        attributes: { protocol: req.protocol, path: req.path },
    });
    // Annotate our span to capture metadata about the operation
    span.addEvent('Received request for ' + req.path);

    req.on('error', (err) => console.log(err));
    req.on('end', () => {
        span.addEvent('finished request')
        span.end()
    });

    next();
}

app.use(traceRequest)

app.use(cors())
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


module.exports = app;
