FROM node:16-alpine

# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

COPY ./index.js .

ENV MQTT_ONLINE_CHECK_MQTT_BROKER=
ENV MQTT_ONLINE_CHECK_MQTT_TOPIC=

CMD [ "npm", "start" ]
