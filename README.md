# Compute@Edge starter kit for JavaScript

[![Deploy to Fastly](https://deploy.edgecompute.app/button)](https://deploy.edgecompute.app/deploy)

Get to know the Fastly Compute@Edge environment with a basic starter that demonstrates routing, simple synthetic responses and code comments that cover common patterns.

**For more details about other starter kits for Compute@Edge, see the [Fastly developer hub](https://developer.fastly.com/solutions/starters)**

## Features

- Allow only requests with particular HTTP methods
- Match request URL path and methods for routing
- Build synthetic responses at the edge

## Understanding the code

This starter is intentionally lightweight, and requires no dependencies aside from the [`@fastly/js-compute`](https://www.npmjs.com/package/@fastly/js-compute) npm package. It will help you understand the basics of processing requests at the edge using Fastly. This starter includes implementations of common patterns explained in our [using Compute@Edge](https://developer.fastly.com/learning/compute/javascript/) and [VCL migration](https://developer.fastly.com/learning/compute/migrate/) guides.

The starter doesn't require the use of any backends. Once deployed, you will have a Fastly service running on Compute@Edge that can generate synthetic responses at the edge.

The template uses webpack to bundle `index.js` and its imports into a single JS file, `bin/index.js`, which is then wrapped into a `.wasm` file, `bin/index.wasm` using the `js-compute-runtime` CLI tool bundled with the `@fastly/js-compute` npm package, and bundled into a `.tar.gz` file ready for deployment to Compute@Edge.

# KnownUser.V3.FastlyJSCompute

Before getting started please read the [documentation](https://github.com/queueit/Documentation/tree/main/edge-connectors) to get acquainted with edge connectors.

This Fastly Queue-it Connector (aka, Queue-it's server-side KnownUser connector) uses a Compute@Edge service to
integrate Queue-it's functionality into Fastly's network.

A Compute service is required to utilize this connector.

> You can find the latest released version [here](https://github.com/hrmsk66/KnownUser.V3.FastlyJSCompute/releases/latest).

## Installation

There are two methods of installation:

### As a standalone service

- Go to the Fastly services page and create a new **Compute** service.
- Go to Domains and fill in the domain that you want your service to be reachable at. You may need to register a CNAME
  record if you have your own domain.
- Then click on _Origins_ and add a new host that has the hostname of your origin server.  
  You need to edit the Host and name it **origin**.
- Create a second host that has the hostname of `{yourCustomerId}.queue-it.net` and name it **queue-it**.  
  Edit the host, go to advanced options and fill in the same hostname in **Override host**
- Go to **Dictionaries** and create a new dictionary named `IntegrationConfiguration`.  
  Add the following items in the dictionary:
  - customerId: Your customer ID
  - apiKey: The API key for your account
  - secret: Your KnownUserV3 secret
  - queueItOrigin: The name of the queue-it host, in this case it's `queue-it`  
    You can find these values in the Go Queue-It self-service platform.
- Download the latest package from the releases page and unarchive it.
- Edit the `fastly.toml` file and copy the ID of your service (you can see this by opening up the service in Fastly) and
  replace **{YourServiceId}** with it.
- Archive the directory in the same format (tar.gz).
- Go to `Package` in the Fastly service page and upload the package.
- To finish up and deploy your service click on the **Activate** button.

### Customizable service with the connector

- Go to the Fastly services page and create a new **Wasm** service and copy it's ID.
- Clone this repository and edit the fastly.toml file, make sure to set the `service_id` field to the ID you copied.
- Then click on _Origins_ and add a new host that has the hostname of your origin server.  
  You can name the host **origin** or whatever you choose.
- Create a host that has the hostname of `{yourCustomerId}.queue-it.net` and name it **queue-it**.  
  Edit the host, go to advanced options and fill in the same hostname in **Override host**
- Open up the service in Fastly and go to **Dictionaries** and create a new dictionary named `integrationConfiguration`
  .  
  Add the following items in the dictionary:
  - customerId: Your customer ID
  - apiKey: The API key for your account
  - secret: Your KnownUserV3 secret
  - queueItOrigin: The name of the queue-it origin, in this case it's `queue-it`  
    You can find these values in the Go Queue-It self-service platform.
- You need to add some code that uses this connector. Here is an example:

```ts
import { IntegrationConfig } from "./integrationConfigProvider";
import QueueITRequestResponseHandler from "./requestResponseHandler";
import welcomePage from "./welcome-to-compute@edge.html";

// Set to true, if you have any trigger(s) containing experimental 'RequestBody' condition.
const READ_REQUEST_BODY = false;

addEventListener("fetch", (event) => event.respondWith(handleRequest(event)));

async function handleRequest(event: any) {
  const dict = new Dictionary("integrationConfiguration");
  const queueItOrigin = dict.get("queueItOrigin");
  const customerId = dict.get("customerId");
  const secret = dict.get("secret");
  const apiKey = dict.get("apiKey");
  const readRequestBody = READ_REQUEST_BODY;

  const conf = new IntegrationConfig(queueItOrigin, customerId, secret, apiKey, readRequestBody);

  // Get the client request.
  const handler = new QueueITRequestResponseHandler(conf);

  const req = event.request;
  let queueitResponse = await handler.onClientRequest(req);

  if (queueitResponse) {
    return await handler.onClientResponse(queueitResponse);
  } else {
    const response = new Response(welcomePage, {
      status: 200,
      headers: new Headers({ "Content-Type": "text/html; charset=utf-8" }),
    });
    return await handler.onClientResponse(response);
  }
}
```

- Build and deploy the package running `fastly compute build` and `fastly compute deploy` in the same directory.
- Create desired waiting room(s), triggers, and actions in the Go Queue-It self-service platform.  
  Then, save/publish the configuration.
