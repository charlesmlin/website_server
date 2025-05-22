# Build
To build docker image, run:

```
docker build -t website_server .
```

To test docker image, run:

```
docker run --env-file .env -p 3000:80 website_server
```

To kill docker image, run:

```
docker ps
docker rm -f $(docker ps | grep 3000 | awk '{print $1}')
```

To tag and push image into AWS ECR, run:

```
aws ecr get-login-password | docker login --username AWS --password-stdin 048283574717.dkr.ecr.eu-west-2.amazonaws.com
docker tag website_server:latest 048283574717.dkr.ecr.eu-west-2.amazonaws.com/personal_website/server:latest
docker push 048283574717.dkr.ecr.eu-west-2.amazonaws.com/personal_website/server:latest
```
