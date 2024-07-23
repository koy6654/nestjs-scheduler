#!/bin/bash

kubectl delete -f ./k8s
kubectl delete configmap nestjs-scheduler-config
docker rmi -f nestjs-scheduler
