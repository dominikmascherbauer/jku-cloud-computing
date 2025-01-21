#!/bin/bash

minikube kubectl -- port-forward --address 0.0.0.0 service/ingress-nginx-controller 8080:80 -n ingress-nginx
