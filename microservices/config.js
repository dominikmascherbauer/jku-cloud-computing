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
        web: 'http://localhost:3000/',
        database: 'http://localhost:3002/',
        user: 'http://localhost:3003/',
        data: 'http://localhost:3005/',
    }
    
  };