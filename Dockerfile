FROM node

WORKDIR /app

COPY . /app

RUN npm install -g underscore && npm link underscore

CMD ["node", "dump-all.js"]