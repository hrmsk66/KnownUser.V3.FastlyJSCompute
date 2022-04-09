const QUEUEIT_FAILED_HEADERNAME = "x-queueit-failed";
const QUEUEIT_CONNECTOR_EXECUTED_HEADER_NAME = "x-queueit-connector";
const SHOULD_IGNORE_OPTIONS_REQUESTS = false;

declare var Response: any;

import { KnownUser, Utils } from "queueit-knownuser";
import FastlyContextProvider from "./fastlyContextProvider";
import { getIntegrationConfig, IntegrationConfig } from "./integrationConfigProvider";
import {
  addKUPlatformVersion,
  configureKnownUserHashing,
  getParameterByName,
} from "./queueitHelpers";

export default class QueueITRequestResponseHandler {
  private httpContextProvider: FastlyContextProvider | null;
  private sendNoCacheHeaders: boolean = false;

  constructor(private conf: IntegrationConfig) {}

  async onClientRequest(request: any) {
    if (isIgnored(request)) {
      return null;
    }

    try {
      let integrationConfigJson = await getIntegrationConfig(this.conf);

      configureKnownUserHashing(Utils);

      let bodyText = "";
      if (this.conf.readRequestBody) {
        //reading maximum 2k characters of body to do the mathcing
        bodyText = ((await request.clone().text()) || "").substring(0, 2048);
      }

      this.httpContextProvider = new FastlyContextProvider(request, bodyText);

      const queueitToken = getQueueItToken(request, this.httpContextProvider);
      const requestUrl = request.url;
      const requestUrlWithoutToken = requestUrl.replace(
        new RegExp("([?&])(" + KnownUser.QueueITTokenKey + "=[^&]*)", "i"),
        ""
      );
      // The requestUrlWithoutToken is used to match Triggers and as the Target url (where to return the users to).
      // It is therefor important that this is exactly the url of the users browsers. So, if your webserver is
      // behind e.g. a load balancer that modifies the host name or port, reformat requestUrlWithoutToken before proceeding.

      const validationResult = KnownUser.validateRequestByIntegrationConfig(
        requestUrlWithoutToken,
        queueitToken,
        integrationConfigJson,
        this.conf.customerId,
        this.conf.secretKey,
        this.httpContextProvider
      );

      if (validationResult.doRedirect()) {
        if (validationResult.isAjaxResult) {
          const response = new Response();
          const headerKey = validationResult.getAjaxQueueRedirectHeaderKey();
          const queueRedirectUrl = validationResult.getAjaxRedirectUrl();

          // In case of ajax call send the user to the queue by sending a custom queue-it header and redirecting user to queue from javascript
          response.headers.set(headerKey, addKUPlatformVersion(queueRedirectUrl));
          response.headers.set("Access-Control-Expose-Headers", headerKey);
          this.sendNoCacheHeaders = true;
          return response;
        } else {
          let responseResult = new Response(null, { status: 302 });

          // Send the user to the queue - either because hash was missing or because is was invalid
          responseResult.headers.set(
            "Location",
            addKUPlatformVersion(validationResult.redirectUrl)
          );
          this.sendNoCacheHeaders = true;

          return responseResult;
        }
      } else {
        // Request can continue - we remove queueittoken form querystring parameter to avoid sharing of user specific token
        if (requestUrl !== requestUrlWithoutToken && validationResult.actionType === "Queue") {
          let response = new Response(null, { status: 302 });
          response.headers.set("Location", requestUrlWithoutToken);
          this.sendNoCacheHeaders = true;
          return response;
        } else {
          // lets caller decides the next step
          return null;
        }
      }
    } catch (e) {
      // There was an error validationg the request
      // Use your own logging framework to log the Exception
      if (console && console.log) {
        console.log("ERROR:" + e);
      }
      this.httpContextProvider!.isError = true;
      // lets caller decides the next step
      return null;
    }
  }

  async onClientResponse(response: any) {
    let newResponse = new Response(response.body, response);
    newResponse.headers.set(QUEUEIT_CONNECTOR_EXECUTED_HEADER_NAME, "fastly");

    if (this.httpContextProvider) {
      const outputCookie = this.httpContextProvider.getOutputCookie();
      if (outputCookie) {
        newResponse.headers.append("Set-Cookie", outputCookie);
      }
      if (this.httpContextProvider.isError) {
        newResponse.headers.append(QUEUEIT_FAILED_HEADERNAME, "true");
      }
    }

    if (this.sendNoCacheHeaders) {
      addNoCacheHeaders(newResponse);
    }

    return newResponse;
  }
}

function isIgnored(request: any) {
  return SHOULD_IGNORE_OPTIONS_REQUESTS && request.method === "OPTIONS";
}

function addNoCacheHeaders(response: any) {
  // Adding no cache headers to prevent browsers to cache requests
  response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "Fri, 01 Jan 1990 00:00:00 GMT");
}

function getQueueItToken(request: any, httpContext: FastlyContextProvider) {
  let queueItToken = getParameterByName(request.url, KnownUser.QueueITTokenKey);
  if (queueItToken) {
    return queueItToken;
  }

  const tokenHeaderName = `x-${KnownUser.QueueITTokenKey}`;
  return httpContext.getHttpRequest().getHeader(tokenHeaderName);
}
