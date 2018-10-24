FROM node:carbon
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY . .
RUN npm install
# bcrypt compiled on os x won't work on linux
RUN npm install bcrypt
EXPOSE 3000
CMD [ "node", "bin/www" ]