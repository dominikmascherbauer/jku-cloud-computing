# From a Monolith to Microservices

## Team members

- Michael Haas (k12005211 / 066 921)
- Dmitry Maklakov (k12021224 / 066 921)
- Dominik Mascherbauer (k12005607 / 066 921)

## Initial state

In the course "Introduction to Full Stack Web Development" we had to create small web applications, consisting of frontend, backend, and database. Such technologies as Vue.js, REST API, WebSocket, and SQLite database were used for it. In the course, the whole project was implemented as a monolith application.

More precisely the web service represents a website for a tennis club. Members can be registered, tennis courts can be reserved and the watering system can be activated. SQLite was used for the database system.

## Project goal

To apply knowledge from the course "Cloud Computing", the web application will be transformed into a microservice architecture.
The goal for this project is to split it up into multiple microservices which contain at least (but are not limited to):

- Database Service: offers an API to access the SQLite database.
- Users Service: responsible for user logins, currently active sessions, and user information for the administrator. It will use the API of the database service to gather this information.
- Data Service: delivers and saves information about reservations and the watering system. It will use the API of the database service to gather all necessary information.
- Web Service: delivers HTML, javascript, and CSS files to the user.

The services will run on docker containers, which will be deployed using Kubernetes.
Additionally, a CI pipeline using GitHub actions will be built and tested.
