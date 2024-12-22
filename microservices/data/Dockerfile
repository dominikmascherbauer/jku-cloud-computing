# Pull in the layer of the base image: node:16-alpine
FROM node:16-alpine
# Set author label: LABEL author=[YOUR-EMAIL]
LABEL author='michael.haas0612@gmail.com'
# Set working directory: `/opt`
WORKDIR /opt
# Copy package files
COPY package*.json ./
# Install dependencies
RUN npm install
# Copy all the source code into the container
COPY . .
# Expose the app port
EXPOSE 3005
EXPOSE 3006
# Run the app with npm start
CMD ["npm", "start"]