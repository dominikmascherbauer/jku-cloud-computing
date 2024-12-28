const opentelemetry = require('@opentelemetry/api');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');
const { ATTR_SERVICE_NAME } = require('@opentelemetry/semantic-conventions');

const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { Resource } = require('@opentelemetry/resources');
const { SimpleSpanProcessor } = require('@opentelemetry/sdk-trace-base');
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');
const { ZipkinExporter } = require('@opentelemetry/exporter-zipkin');
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');

module.exports = (serviceName) => {
    const provider = new NodeTracerProvider({
        resource: new Resource({
            [ATTR_SERVICE_NAME]: serviceName,
        }),
        spanProcessors: [
            new SimpleSpanProcessor(new JaegerExporter()),
            new SimpleSpanProcessor(new ZipkinExporter())
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
