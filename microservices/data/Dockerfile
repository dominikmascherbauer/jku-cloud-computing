# Pull in the layer of the base image: node:16-alpine
FROM node:16-alpine
# Set author label: LABEL author=[YOUR-EMAIL]
LABEL author='michael.haas0612@gmail.com'
# Set working directory: `/opt`
WORKDIR /opt
# Copy all the source code into the container
COPY ./data ./data
# Set working directory: `/opt/data`
WORKDIR /opt/data
RUN ls -lsa
# Install dependencies
RUN npm install
RUN ls -lsa
# Copy config file
COPY ./config.js ../config.js
# Expose the app port
EXPOSE 3005
EXPOSE 3006
# Run the app with npm start
CMD ["npm", "start"]