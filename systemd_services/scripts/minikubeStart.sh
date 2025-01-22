#!/bin/bash 

# Start Minikube 
minikube start 

# Wait until Minikube is fully up and running 
until minikube status | grep -q 'host: Running'; do 
  echo "Waiting for Minikube to start..." 
  sleep 30 
done 

# enable ingress addon
minikube addons enable ingress
 
echo "Minikube is running. Proceeding with the script..."
