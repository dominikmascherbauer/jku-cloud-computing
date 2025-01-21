#!/bin/bash

minikube kubectl -- port-forward --address 0.0.0.0 service/jaeger-service 16686:16686
