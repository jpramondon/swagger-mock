# swagger-mock (yet another one)

Swagger Mock is based on [Swagger Express Middleware](https://github.com/BigstickCarpet/swagger-express-middleware).
This library allows to customize the behaviour of some endpoints, this feature is described [at this page](https://github.com/BigstickCarpet/swagger-express-middleware/blob/master/docs/middleware/mock.md#customizing-behavior).

## Main goals

There are 2:
- ease up local testing by mocking whatever API is required by your application,
- gather several API mocks in one mock server that can then be deployed on a dev environment,
- offer a simple and stupid authentication route htat's really handy when it comes to integration and end-to-end testing.
(that's 3, I know)

Suggestion:
  Every application may come with their own mocking requirements on the same API to mock. This behaviour is achievable and totally encouraged when using `mock-server`, using a per-application mock organisation. For instance, here `myApp1` and `myApp2` are application requiring that the same mocked API (`toastApi`) returns different responses:
  - /myApp1/toastApi/1
  - /myapp2/toastApi/1

## Usage

### Register routes with swagger and data files

Just as in _swagger-express-middeware_, you may want to register routes using a swagger file. Data returned by these routes is a data file.
Both file can be provided to the SwaggerMock Docker image using the `SWAGGER_FILE_PATH` and `DATA_FILE_PATH` environment variables.
Please make sure these fiels are accessible from the Docker image (by using a volume mapping for instance).

### Register routes by API

It's also possible to register new mock routes using the provided API.
For instance, start your SwaggerMock Docker image and issue:
```bash
> curl -XPOST localhost:8000/__config -d 'url=/api/toast/1' -d 'content_to_return={"key": 1}'
Saved file /api/v1/test
> curl localhost:8000/api/toast/1
{"key": 1}
 ```
You have just registered the new route `/api/`

### Register routes by code

Custom routes can be provide to SwaggerMock using Express-like behaviours written in Typescript.

#### Write your custom behaviour

Given a `index.ts` file is created in the `/src/custom` folder, an example of such middleware is shown below: 
```Typescript
import { Express } from 'express';
const SwaggerExpressMiddleware = require("swagger-express-middleware");

export function customBehaviour(application: Express, datastore: any){
 // Your custom behaviour code goes here
}
```

A more complete example could be:
```Typescript
application.get('/api/toast/1', (req, res: any, next) => {
    // set whatever header is required
    res.set('access-control-allow-origin', '*');
    // return a response body
    res.send({
      "key": 1,
      "type": "toast"
    });
});
```

#### Register your code

Your typescript middleware will be transpiled when the SwaggerMock image starts. For this to happen, you need to help SwaggerMock finding it by mounting your source folder in the Docker image.
The single rule is pointing the folder where your index.ts file is stored to the folder "home/node/app/src/custom_behaviour".

```
  mock-server:
    image: swaggermockserver:version
    volumes:
      - "$PWD/test:/tmp"
      - "$PWD/test/custom/src:/home/node/app/src/custom_behaviour"
    ports:
      - "8000:8000"
    environment:
      - SWAGGER_FILE_PATH=${SWAGGER_FILE_PATH}
      - DATA_FILE_PATH=${DATA_FILE_PATH}
    working_dir: /home/node/app
    healthcheck:
          test: wget -O dev/null http://localhost:8000/api/swaggermock/_health > dev/null
          interval: 5s
          timeout: 3s
          retries: 5
```
Please note in the above example:
- the custom-coded behaviour is mounted in the `/home/node/app/src/custom_behaviour`. Any code mounted elsewhere will not be included in the customised routes.
- the Docker service combines both _by files_ and _by code_ customisation techniques.

## Docker

The main usage for this project is to be used through its Docker image, either 
 - to deploy it on a dev server 
 - or to use it through a composition

### Build the image locally

```bash
> npm run docker:build
```

### Pull an existing image

```bash
> docker pull gearedminds/swaggermockserver:VERSION
```

### Run the docker image

You may want to run the Docker image from the command line (as opposed to a Docker composition). 
Given you want to use SwaggerMock with files (swagger and data) and your files are located there 
- /usr/swagger-files/swagger.json for your swagger file
- /usr/data-files/data.json for your data file
Then all you have to do is issue:

```bash
> docker run --name swagger-mock-server -e SWAGGER_FILE_PATH=/tmp/swagger-files/swagger.json -e DATA_FILE_PATH=/tmp/data-files/data.json -v /usr:/tmp -p 8000:8000 -d gearedminds/swaggermockserver:latest
```

### Using in a composition

The docker image may be used in a composition just like in the following example (a fake authentication server):
```yaml
  #...
  auth-server:
    image: gearedminds/swaggermockserver:version
    volumes:
      - ./test/fakeauth/:/home/node/app/src/custom_behaviour/
    working_dir: /home/node/app
    healthcheck:
      test: wget -O - http://localhost:8000/api/mock/_health > /dev/null
      interval: 5s
      timeout: 3s
      retries: 5
  #...
```
In the above sample, swagger-mock is used in the _by code_ customisation mode, where you provide it with some TS code in order to register a specific route. 

Another example using provided swagger and data files:

```yaml
  #...
  mock-server:
    image: gearedminds/swaggermockserver:version
    volumes:
      - "$PWD/test:/tmp"
    ports:
      - "8000"
    environment:
      - SWAGGER_FILE_PATH=${SWAGGER_FILE_PATH}
      - DATA_FILE_PATH=${DATA_FILE_PATH}
    working_dir: /home/node/app
    healthcheck:
          test: wget -O dev/null http://localhost:8000/api/mock/_health > dev/null
          interval: 5s
          timeout: 3s
          retries: 5
  #...
```

You can then refer to your SwaggerMock service like this:
```yaml
  #...
  myApp:
    #...
    depends_on:
      mock-server:
        condition: service_healthy
  #...
```

Please note: 
- both of these example use the default provided `/_health` route.
- you can use as many SwaggerMock instances as you want in your Docker composition

# Contribute

Feel free to checkout the project and contribute.

## Checkout

```bash
> git clone git@github.com:jpramondon/swagger-mock.git
> cd swagger-mock
> npm install
```

## Install & Build

``` bash
> npm install
> npm run build
```

## Run locally

Though the project is intended to be run using its Docker image, you may want to run it locally, for testing purposes for instance.
To do so, just issue (using here the _file_ customisation mode):

``` bash 
SWAGGER_FILE_PATH='/path/to/your/swagger/file' DATA_FILE_PATH='/path/to/your/data/file' PORT='9000' npm start
```

Note, this example also uses the `PORT` variable to change the port the mock API is available at.