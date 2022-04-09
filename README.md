# Queue-it connector for Fastly Compute@Edge (JavaScript)

Before getting started please read the [documentation](https://github.com/queueit/Documentation/tree/main/edge-connectors) to get acquainted with edge connectors.

This Fastly Queue-it Connector (aka, Queue-it's server-side KnownUser connector) uses a Compute@Edge service to
integrate Queue-it's functionality into Fastly's network.

A Compute service is required to utilize this connector.

> You can find the latest released version [here](https://github.com/hrmsk66/KnownUser.V3.FastlyJSCompute/releases/latest).

## Installation

### Create a new Compute@Edge project

- Use `fastly compute init --from=` to scaffold a new Fastly Compute@Edge project. The CLI will generate source code for your project in the current working directory.

```
fastly compute init --from=https://github.com/hrmsk66/KnownUser.V3.FastlyJSCompute
```

### Running a local testing server

- Edit the `fastly.toml` file and replace **{yourCustomerID}** with your customer ID.
- Edit the `integrationConfiguration.json` file and replaces the values for each JSON key. You can find these values in the Go Queue-It self-service platform.
- Run the `fastly compute serve` command to start the testing server

```
fastly compute serve
✓ Initializing...
✓ Verifying package manifest...
✓ Verifying local javascript toolchain...
✓ Building package using javascript toolchain...
✓ Creating package archive...

SUCCESS: Built package 'protected-site' (pkg/protected-site.tar.gz)

✓ Running local server...

Apr 10 08:09:37.189  INFO checking if the dictionary 'integrationConfiguration' adheres to Fastly's API
Apr 10 08:09:37.190  INFO checking if the items in dictionary 'integrationConfiguration' adhere to Fastly's API
Apr 10 08:09:37.190  INFO checking if backend 'queue-it' is up
Apr 10 08:09:38.226  INFO backend 'queue-it' is up
Apr 10 08:09:38.226  INFO Listening on http://127.0.0.1:7676
```

### Publish the project to a new Fastly service

- Once you’re happy with your code and want to deploy the project to Fastly, run `fastly compute publish`.
- At the prompts, provide details about the service you're creating:
  - **Domain**: Press enter to accept the automatically generated domain name or enter the name of the domain you'd like to associate with your service.
  - **Backend(queue-it)**: Create a host that has the hostname of `{yourCustomerId}.queue-it.net`, enter `443` for the port number and name it **queue-it**.
  - **Backend(origin)**: Create a host that has the hostname of your origin server.

```
fastly compute publish
✓ Initializing...
( snip )
Create new service: [y/N] y

✓ Initializing...
✓ Creating service...

Domain: [example.edgecompute.app]

Backend (hostname or IP address, or leave blank to stop adding backends): yourCustomerID.queue-it.net
Backend port number: [80] 443
Backend name: [backend_1] queue-it

Backend (hostname or IP address, or leave blank to stop adding backends): httpbin.org
Backend port number: [80] 443
Backend name: [backend_2] my-origin

Backend (hostname or IP address, or leave blank to stop adding backends):

✓ Creating domain 'example.edgecompute.app'...
✓ Creating backend 'queue-it' (host: fastlyjapan.queue-it.net, port: 443)...
✓ Creating backend 'my-backend' (host: httpbin.org, port: 443)...
✓ Uploading package...
✓ Activating version...

Manage this service at:
	https://manage.fastly.com/configure/services/XXXXX

View this service at:
	https://example.edgecompute.app


SUCCESS: Deployed package (service XXXXX, version 1)
```

- Once the project is deployed successfully, go to the Fastly service page, click `Edit configuration`, and select `Clone version 1` to edit.
- Go to Dictionaries and create a new dictionary named `integrationConfiguration`. Add the following items in the dictionary:
  - **customerId**: Your customer ID
  - **apiKey**: The API key for your account
  - **secret**: Your KnownUserV3 secret
  - **queueItOrigin**: The name of the queue-it host, in this case it's queue-it
    You can find these values in the Go Queue-It self-service platform.
- To finish up and deploy your service click on the **Activate** button.
