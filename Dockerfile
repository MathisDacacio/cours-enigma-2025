FROM node:23-bookworm

WORKDIR /usr/app

COPY package*.json .

RUN npm install

COPY src ./src
COPY tests ./tests

RUN npm run test

EXPOSE 3000

ENTRYPOINT [ "npm" ]

CMD [ "run", "dev" ]