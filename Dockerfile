FROM node:14-alpine3.13
ENV NODE_ENV production
RUN apk update && apk upgrade && apk add dumb-init
WORKDIR /app
COPY package.json ./
RUN npm install --production
COPY ./app/ ./
CMD ["dumb-init", "node", "index.js" ]
