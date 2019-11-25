# build stage
FROM node:lts-alpine 

LABEL maintainer=491883290@qq.com

WORKDIR /app

COPY ..

RUN yarn install. --registry=https://registry.npm.taobao.org

RUN npm run build

EXPOSE 12005

VOLUME ["/app/public"]

CMD ["node","dist/server.bundle.js"]
 