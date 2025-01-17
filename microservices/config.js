module.exports = {
    // port used by each service internally
    port:{
        web: 3000,
        database: 3002,
        user: {
            http: 3003,
            websocket: 3004
        },
        data: {
            http: 3005,
            websocket: 3006
        }
    },
    // urls used by services to access api of other services
    // ATTENTION: ports in the html files need to be specified manually
    url: {
        web: 'http://web-service:3000/',
        database: 'http://database-service:3002/',
        user: 'http://user-service:3003/',
        data: 'http://data-service:3005/',
        dataws: 'ws://data-service:3006/',
    }
    
  };