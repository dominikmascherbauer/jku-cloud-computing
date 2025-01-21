# From a monolith to microservices

In the course "Introduction to Full Stack Web Development" we had to create small web applications, consisting of frontend, backend, and database. Such technologies as Vue.js, REST API, WebSocket, and SQLite database were used for it. In the course, the whole project was implemented as a monolith application.

More precisely the web service represents a website for a tennis club. Members can be registered, tennis courts can be reserved and the watering system can be activated. SQLite was used for the database system.

To apply knowledge from the course "Cloud Computing", the web application will be transformed into a microservice architecture. The goal for this project is to split it up into multiple microservices which contain at least (but are not limited to):
- Database Service: offers an API to access the SQLite database.
- Users Service: responsible for user logins, currently active sessions, and user information for the administrator. It will use the API of the database service to gather this information.
- Data Service: delivers and saves information about reservations and the watering system. It will use the API of the database service to gather all necessary information.
- Web Service: delivers HTML, javascript, and CSS files to the user.

The services will run on docker containers, which will be deployed using Kubernetes. Additionally, a CI pipeline using GitHub actions will be built and tested.

Another goal of this project is to experiment with monitoring for microservices using the OpenTelemitry framework and visualize the resulting monitoring data using Jaeger.

## Structure

The structure description of this project will be split into microservice structure and deployment structure.

### Microservice structure

The overall architecture for the microservice communication looks as follows:
![Microservices](Microservices.png)

- The frontend of the web application uses HTML, CSS and Javascript as well as the VueJS framework.
- The content displayed on a page is fetched by a request to the corresponding microservice.
- The microservices are written in Javascript and run on NodeJS 16.
- The database service is responsible for retrieving data from the SQLite-database and forwards the data to a microservice.
- In order to handle multi-user access websockets are integrated as well.
- Requests between microservices are traced with opentelemetry and forwarded by a Jaeger collector (and Zipkin collector) to the monitoring services (Jaeger and Zipkin).


### Deployment structure

The deployment is structured as follows:
![Deployment](Deployment.png)

- For hosting the Kubernetes cluster, we use an Ubuntu server VM (Ubuntu Server 24.04LTS) with minikube.
- The microservices are deployed as pods in a deployment that is accessed by a service.
- Each deployment pulls the newest image for a microservice from DockerHub.
- A change on the master branch will start a CI pipeline that creates docker images for each microservice and stores them on DockerHub.
- Deployment of new services in the Kubernetes cluster must be triggered manually (e.g. delete old pods).
- Access to microservices from outside is handled by an ingress controller, which distributes requests from the client to the microservices.
- The port of the ingress controller is exposed to the end user.
- The Jaeger container is also deployed in the Kubernetes cluster and accessed via a service (same for Zipkin, not shown in the picture).
- For testing purposes, the monitoring UI is directly exposed on the Host VM for access from the internet.
- To persist changes in the database, the database is stored on the Host VM and mounted into minikube. In minikube the database is then mounted into the database pod.
- To keep the cluster running, we installed some services on the Host VM that maintain the database mount and port forwards.


## Summary of Research
- [NodeJS](https://nodejs.org/en) 16
  - Represents a Javascript environment for executing Javascript outside of a browser
  - For our project we use it to execute the code of our backend
- [SQLite](https://www.sqlite.org/)
  - A library that can be linked in programs using a relational database model to store data in a file
  - The database services uses this library to store and retrieve data
- [WebSockets](https://developer.mozilla.org/de/docs/Web/API/WebSockets_API)
  - Make bidirectional communication between the server and the client possible
  - Therefore allow the server to inform the client that some events happened
  - We use it to update the reservation and watering page on multi user access
 - [Opentelemetry](https://opentelemetry.io/)
   - OpenSource Framework to generate, process, and transmit telemetry data in a single, unified format
   - In our project it is used to save the information of requests to and responses from the backend
- [Jaeger collector](https://www.jaegertracing.io/docs/1.21/opentelemetry/) and [Zipkin collector](https://zipkin.io/pages/architecture.html)
  - Reads the data produced by opentelemetry and displays it in a graphical user interface
  - We used both frameworks to compare the visual comparison
- [MiniKube](https://minikube.sigs.k8s.io/docs/start/)
  - Provides the possibility to run a Kuberenetes cluster on a local machine
  - Our services run in Minikube on a Ubuntu server VM
- [Docker](https://www.docker.com/)
  - A runtime for executing docker containers
  - Each of our services runs in its own docker container
- [Github Actions](https://docs.github.com/de/actions)
  - Runs a series of commands after a certain event has occured 
  - We use it to automatically build our Docker images and to push them to Dockerhub after pull and pull-requests 
- [Systemd](https://wiki.ubuntuusers.de/systemd/)
  - A service manager for Linux operating systems that brings up and manages userspace service
  - We use a service to start the Kubernetes cluster, to mount a persistent database into the cluster and to port forward the request from the host to the Kubernetes cluster

## Tutorial

### Setup Development Environment
The repository contains code to deploy the microservices locally without a Kubernetes cluster to deploy to.



### Setup Host VM

The Host VM is a virtual machine running on a server. It is used to run a Kubernetes cluster with minikube and expose the web application to end users.

#### Setting up the VM

Download an Ubuntu Server iso [here](https://ubuntu.com/download/server). Preferably use an LTS version (24.04 was used for this deployment).
```shell
wget https://releases.ubuntu.com/24.04/ubuntu-24.04.1-live-server-amd64.iso
```

Create a new virtual machine with this image and install it. Make sure to use at least 30GB of disk space and 4GB of RAM.


## Lessons-learned

- Conversion of a monolith webapp to multiple microservices offering the same functionality.
- Creation of correct dockerfiles for the microservices
- Automatic building of docker images and pushing on Dockerhub through a CI pipeline
- Integration of OpenTelemetry into the microservices
- Setting up Ingress to forward routes from the frontend to the correct microservice
- Setting up Minikube to execute the services on our local server
