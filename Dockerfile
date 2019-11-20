FROM node:8.16.2-alpine

ENV NODE_ENV development
ENV NODE_CONFIG '{"port":3100,"log_options":{"level":"error","log_api_access":false},"enable":{"admin_delete_db":false}}'

ADD . /src
WORKDIR /src

RUN npm install --production && \
    npm audit fix && \
    npm dedupe

EXPOSE 3100

CMD npm start
