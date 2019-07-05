#http://www.docker.org.cn/dockerppt/114.html

FROM node:10

MAINTAINER test

COPY . /usr/src/app/

WORKDIR /usr/src/app/

COPY package*.json ./

#RUN npm install cnpm -g

RUN npm install

EXPOSE 3000

CMD ["npm","start"]
