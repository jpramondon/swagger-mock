FROM node:alpine

# Create app directory
WORKDIR /home/node/app

COPY *.json /home/node/app/
COPY data /home/node/app/data
COPY contract /home/node/app/contract
COPY src /home/node/app/src

RUN npm ci --production

EXPOSE 8000

CMD ["npm", "start"]