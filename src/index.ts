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
