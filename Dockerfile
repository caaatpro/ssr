FROM node:21.7.3

RUN apt-get update && \
    apt-get install -y chromium chromium-driver

ENV CHROME_BIN=/usr/bin/chromium
ENV CHROME_PATH=/usr/lib/chromium/

WORKDIR /app

COPY package*.json ./

RUN npm install -g npm@10.5.2

RUN npm install

COPY . .

EXPOSE 3000

CMD [ "npm", "start" ]