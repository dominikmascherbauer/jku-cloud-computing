const opentelemetry = require('@opentelemetry/api');
const {registerInstrumentations} = require('@opentelemetry/instrumentation');
const {ATTR_SERVICE_NAME} = require('@opentelemetry/semantic-conventions');
const {NodeTracerProvider} = require('@opentelemetry/sdk-trace-node');
const {Resource} = require('@opentelemetry/resources');
const {SimpleSpanProcessor} = require('@opentelemetry/sdk-trace-base');
const {JaegerExporter} = require('@opentelemetry/exporter-jaeger');
const {ZipkinExporter} = require('@opentelemetry/exporter-zipkin');
const {HttpInstrumentation} = require('@opentelemetry/instrumentation-http');

const config = require('./config')

// Custom Span Processor to filter out unwanted spans
class CustomSpanProcessor extends SimpleSpanProcessor {
  onEnd(span) {
    // Filter out HTTP request spans
    if (span.instrumentationLibrary.name === 'tennis-website') {
      super.onEnd(span);
    }
  }
}

module.exports = (serviceName) => {
  const provider = new NodeTracerProvider({
    resource: new Resource({
      [ATTR_SERVICE_NAME]: serviceName,
    }),
    spanProcessors: [
      new SimpleSpanProcessor(new JaegerExporter({
        serviceName,
        endpoint: `http://${config.jaegerService.name}:${config.jaegerService.port.collector}/api/traces`
      })),
      new SimpleSpanProcessor(new ZipkinExporter({
        serviceName,
        url: `http://${config.zipkinService.name}:${config.zipkinService.port.collector}/api/v2/spans`
      }))
    ]
  });

  // Initialize the OpenTelemetry APIs to use the NodeTracerProvider bindings
  provider.register();

  registerInstrumentations({
    instrumentations: [
      new HttpInstrumentation(),
    ],
  });

  return opentelemetry.trace.getTracer('tennis-website');
};
