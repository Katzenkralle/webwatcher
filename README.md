# Webwatcher

### Running in development mode:
1. Clone/Pull this repo
2. Run: `docker build -t someone/webwatcher:latest .` frot the projects root
3. Launch the container with `docker run -d --network=host -e DEV=true someone/webwatcher:latest`
   (Note: `--network=host` is optional but recomendet for development)