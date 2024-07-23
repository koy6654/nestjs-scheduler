FROM node:20

COPY . /opt/nestjs-scheduler
WORKDIR /opt/nestjs-scheduler/

RUN npm install

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
