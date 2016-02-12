FROM node:argon

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# command line utils
RUN npm install -g gulp nesh

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install

# Bundle app source
COPY . /usr/src/app

# empty envdir directory
RUN mkdir /usr/src/app/envdir

EXPOSE 3000
CMD [ "npm", "start" ]
