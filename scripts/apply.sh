#!/bin/bash

docker build . -t nestjs-scheduler
kubectl create configmap nestjs-scheduler-config --from-env-file=.env
kubectl apply -f ./k8s
