FROM node:23

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE ${EXPRESS_PORT}

CMD ["npm", "run", "dev"]
