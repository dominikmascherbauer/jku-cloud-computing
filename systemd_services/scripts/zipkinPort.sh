#!/bin/bash

minikube kubectl -- port-forward --address 0.0.0.0 service/zipkin-service 9411:9411
