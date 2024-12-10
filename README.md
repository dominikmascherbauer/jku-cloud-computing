# From a Monolith to Microservices

In a previous exercise, we created a web service as a monolithic application in JavaScript with a database backend.
More precisely the web service represents a website for a tennis club. Members can be registered, tennis courts can be reserved and the watering system can be activated. SQLite was used for the database system.
The goal for this project is to split it up into multiple microservices which contain at least (but are not limited to):
 - Database Service
    - This service will offer an API to access the SQLite database.
 - Users Service
    - Is responsible for user logins, currently active sessions and user information for the administrator. It will use the API of the database service to gather this information.
 - Data Service
    - Delivers and saves information about reservations and the watering system. It will use the API of the database service to gather all necessary information.
 - Web Service
    - It delivers html, javascript and css files to the user.


The services will run on docker containers, which will be deployed using Kubernetes.
Additionally, we will build a CI pipeline using GitHub actions.
