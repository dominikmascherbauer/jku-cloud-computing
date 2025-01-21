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

We decided to run a virtual machine on a server to host our Kubernetes cluster with minikube. The following describes how to setup the virtual machine.

#### Prerequisits

Download an Ubuntu Server iso [here](https://ubuntu.com/download/server). Preferably use an LTS version (24.04 was used for this deployment).
```shell
wget https://releases.ubuntu.com/24.04/ubuntu-24.04.1-live-server-amd64.iso
```

#### OS installation

Create a new virtual machine with the Ubuntu Server iso and install it. Make sure to use at least 30GB of disk space and 4GB of RAM.
For this step, we created a virtual machine on a self-hosted Unraid server, but this step could also be done locally with a VM manager.
Run through the installation, no special setup or additional packages are required.

#### Install Tools

I. Docker Engine

Now on the running virtual machine, we want to install tools for running the Kubernetes cluster.
First, we need to [install Docker Engine](https://docs.docker.com/engine/install/ubuntu/) as follows:
1. Setup the docker apt repository
```shell
# Add Docker's official GPG key:
sudo apt-get update
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
```

2. Install docker packages
```shell
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```
To test if the docker installation was successful we can use
```shell
sudo docker run hello-world
```
which pulls and runs a hello-world image that prints a message and exits.

3. [Manage docker as non-root user](https://docs.docker.com/engine/install/linux-postinstall/)

For minikube we need to be able to use docker as a non-root user.
It is also possible to run docker in rootless mode, but that did not work with minikube for us, so this is the preferred way to set up docker for minikube for us.
```shell
sudo groupadd docker
sudo usermod -aG docker $USER
newgrp docker
```
Docker should be able to run without root privileges now, to test if it worked we can run:
```shell
docker run hello-world
```
You might want to restart the virtual machine now for the change to take effect permanently.
Otherwise, the new group membership is not picked up in a new shell.

II. Minikube

For the minikube setup, we used the [guide](https://minikube.sigs.k8s.io/docs/start/?arch=%2Flinux%2Fx86-64%2Fstable%2Fbinary+download) from the minikube documentation.
For more information than the necessary setup shown below, please refer to the more detailed and up-to-date guide linked before.

1. Install minikube
Select the correct OS, architecture, and installer type for your virtual machine. We went for x86-64 Linus binary download:
```shell
curl -LO https://github.com/kubernetes/minikube/releases/latest/download/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube && rm minikube-linux-amd64
```
2. Start the cluster (with docker engine)
```shell
minikube config set driver docker
minikube start --driver=docker
```
If this step fails, resort to the additional documentation page for the docker driver [here](https://minikube.sigs.k8s.io/docs/drivers/docker/#Standard%20Docker).

3. Install kubectl

We can install kubectl in minikube to use an appropriate version for the cluster.
```shell
minikube kubectl -- cluster-info
```
Kubectl is now installed for the minikube cluster, but not available on the vm itself, so for convenience, we can define an alias for kubectl with:
```shell
alias kubectl="minikube kubectl --"
```
or if you want to type less
```shell
alias k="minikube kubectl --"
```

4. Enable ingress addon

For this project, we used an ingress controller for routing requests to the microservices. Therefore, we need to enable the ingress addon in minikube:
```shell
minikube addons enable ingress
```

III. Deploy the project

This guide assumes the following steps are done with the user's current home directory as the working directory because minikube is designed to be run as non-root user.

1. Navigate to the working directory
```shell
cd /home/<username>
```
2. Clone project repository
```shell
git clone https://github.com/dominikmascherbauer/jku-cloud-computing.git tennis-website
```
or if you want to setup an ssh key for the virtual machine
```shell
git clone git@github.com:dominikmascherbauer/jku-cloud-computing.git tennis-website
```
3. Mount database file into minikube

First, we want to copy the database file out of the repository, to be able to pull changes without the risk of changes to the database file being overwritten. Then we can mount the copied file.

**_NOTE:_**  The mount must be kept alive while the website is running. We will explain how to automate this on the VM later.
```shell
mkdir db
cp tennis-website/microservices/database/tennisclub.db db/tennisclub.db
minikube mount /home/<username>/db:/var/data
```

4. Deploy the services

This step assumes that minikube is already up and running, so we just need to apply the kubelets.
```shell
cd tennis-website/microservices
minikube kubectl -- apply -f ingress.yaml
minikube kubectl -- apply -f jaeger.yaml
minikube kubectl -- apply -f zipkin.yaml
minikube kubectl -- apply -f data/service.yaml
minikube kubectl -- apply -f database/service.yaml
minikube kubectl -- apply -f user/service.yaml
minikube kubectl -- apply -f web/service.yaml
```

5. Forward required ports

To expose all the services to the internet, we need to forward the ports of the services to the VM. This needs to be done for minikube's built-in ingress controller, the Jaeger service, and the Zipkin service. The telemetry services are not strictly required, they just provide a UI for observing the microservice communication.

**_NOTE:_**  The port forwards must be kept alive while the website is running. We will explain how to automate this on the VM later.
```shell
minikube kubectl -- port-forward --address 0.0.0.0 service/ingress-nginx-controller 8080:80 -n ingress-nginx
minikube kubectl -- port-forward --address 0.0.0.0 service/jaeger-service 16686:16686
minikube kubectl -- port-forward --address 0.0.0.0 service/zipkin-service 9411:9411
```

IV. Automate VM

In this part, we want to discuss how to automatically deploy the services, and make sure the mount and port forwards are kept alive. This will be achieved by some bash scripts and systemd services.

We will also be able to reuse the automatic deployment script for re-deploying the services if the kubelets change.

For convenience, we will also explain this step with the user's home directory a our working directory. Therefore, we will need a subfolder and the following scripts:

**_TODO Add dir creation and ls output_**

and systemd services:

**_TODO output of systemd_**

1. Deploy on startup

This requires two steps, starting minikube and deploying the services which we do with the following scripts:

**_TODO Add scripts_**

which are packed into two services:

**_TODO Add scripts_**

2. Mount database directory

**_TODO Add scripts_**

The service for this script will only start if minikube is running, and automatically restart if it crashes:

**_TODO Add scripts_**

3. Port forwarding

**_TODO Add scripts_**

Similar to the mount script, the systemd services rely on minikube being available and also restart if they crash.

**_TODO Add scripts_**


## Lessons-learned

- Conversion of a monolith webapp to multiple microservices offering the same functionality.
- Creation of correct dockerfiles for the microservices
- Automatic building of docker images and pushing on Dockerhub through a CI pipeline
- Integration of OpenTelemetry into the microservices
- Setting up Ingress to forward routes from the frontend to the correct microservice
- Setting up Minikube to execute the services on our local server
