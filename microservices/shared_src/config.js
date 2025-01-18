module.exports = {
    // ports and names for all services
    dataService: {
        name: 'data-service',
        port: {
            http: 3000,
            websocket: 3001
        }
    },
    databaseService: {
        name: 'database-service',
        port: {
            http: 3000
        }
    },
    userService: {
        name: 'user-service',
        port: {
            http: 3000
        }
    },
    webService: {
        name: 'web-service',
        port: {
            http: 3000
        }
    },
    jaegerService: {
        name: 'jaeger-service',
        port: {
            collector: 14268,
            ui: 16686 
        }
    },
    zipkinService: {
        name: 'zipkin-service',
        port: {
            collector: 9412  // same for ui
        }
    }
  };