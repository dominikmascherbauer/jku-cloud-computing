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
docker image build -f Database_Dockerfile -t michaelhaas99/data-service-image:0.0.1 ./
docker container run -p 3002:3002 michaelhaas99/data-service-image:0.0.1