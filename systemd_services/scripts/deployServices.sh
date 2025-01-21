#!/bin/bash

cd /opt/jku-cloud-computing/microservices
minikube kubectl -- apply -f ingress.yaml
minikube kubectl -- apply -f jaeger.yaml
minikube kubectl -- apply -f zipkin.yaml
minikube kubectl -- apply -f database/service.yaml
minikube kubectl -- apply -f data/service.yaml
minikube kubectl -- apply -f user/service.yaml
minikube kubectl -- apply -f web/service.yaml
