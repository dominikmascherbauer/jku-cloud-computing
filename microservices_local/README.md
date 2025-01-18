# Default ports
- web: 3000
- database: 3002
- user:
    - http 3003
    - websocket 3004
- data:
    - http 3005
    - websocket 3006


# Browser
avoid CORS policy by using the following options in chrome:
"chrome.exe" --disable-web-security --user-data-dir="C:/ChromeDev"

# Docker
Docker image has to build from the build context `microservice`.
docker image build -f {microserivce_name}/Dockerfile -t michaelhaas99/data-service-image:0.0.1 ./

docker container run -p 3002:3002 michaelhaas99/data-service-image:0.0.1

# Start procedure
use the command `set JWT_SECRET=test` in Windows (cmd) or `JWT_SECRET=test` in Linux for the user service first\
run `npm install` followed by `npm start run` in each service directory\
navigate to `http://localhost:3000` in the browser\
use the email `michael.haas@gmx.at` and password `test` for an admin login