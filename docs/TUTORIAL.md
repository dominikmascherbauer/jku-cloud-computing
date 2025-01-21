# Tutorial

This tutorial is split into two parts. First, we cover how to set up a virtual machine with minikube and deploy the services in it. Then we explain how to make changes to the website and update the deployments.

## Deploy Services

We decided to run a virtual machine on a server to host our Kubernetes cluster with minikube. The following describes how to setup the virtual machine.

### Prerequisits

Download an Ubuntu Server iso [here](https://ubuntu.com/download/server). Preferably use an LTS version (24.04 was used for this deployment).
```shell
wget https://releases.ubuntu.com/24.04/ubuntu-24.04.1-live-server-amd64.iso
```

### OS installation

Create a new virtual machine with the Ubuntu Server iso and install it. Make sure to use at least 30GB of disk space and 4GB of RAM.
For this step, we created a virtual machine on a self-hosted Unraid server, but this step could also be done locally with a VM manager.
Run through the installation, no special setup or additional packages are required.

### Install Tools

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

### Deploy the project

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

### Automate VM

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


## Update the deployment

This guide requires the virtual machine in the previous step to be set up.

1. Update the source code:
  - The source code for the microservices that are deployed can be found in [_microservices_](microservices).
  - The [_shared_src_](microservices/shared_src) directory contains javascript source files that are copied into all docker files.
  - The _src_ directory in each of the microservice sub-directories contains the rest of the code for each microservice.
  - The Dockerfiles can also be found in the microservice sub-directories and are designed to use [_microservices_](microservices) as their context.
  - The kubelets are also found within the [_microservices_](microservices) directory, and the microservice sub-directories.

2. Rebuild container images
  - Make sure to change the DockerHub username in the kubelet of the changed container image.
  - By default, we pull the _latest_ tag in the kubelet, if no tag is specified. Thus the example shown also pushes to the _latest_ tag.
  - Navigate to the [_microservices_](microservices) directory and run docker build:
  ```shell
  docker build -f <servicename>/Dockerfile <dockerhubuser>/<servicename> .
  docker push <dockerhubuser>/<servicename>
  ```

3. Update deployments
  - SSH into the VM
  - Navigate to the microservices and update the desired kubelet
     - make sure to set the correct image name for the docker image
  - If changes were made to the kubelet, run the deployment script **_TODO Add run script command_**
  - If no changes were made stop the pods that should receive an update. The new image is pulled when a new pod is created by the deployment.

