# Build docker image
docker build -t node-puppeteer .

# Install node modules
docker run -it --rm -u$(id -u):$(id -g) -v$(pwd):/code node-puppeteer bash -c "cd /code && yarn install"

# Run script on unix host
docker run -it --init --rm --cap-add=SYS_ADMIN -u$(id -u):$(id -g) -v$(pwd):/code node-puppeteer node /code/teste_compra_automatica.js
