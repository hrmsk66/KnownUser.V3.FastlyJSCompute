export async function getIntegrationConfig(conf: IntegrationConfig) {
  const headers = new Headers();
  headers.set("api-key", conf.apiKey);
  headers.set("host", conf.provider.getHostname(conf.customerId));
  const request = new Request(conf.provider.getEndpoint(conf.customerId), {
    method: "GET",
    body: null,
    headers: headers,
  });

  let cacheOverride = new CacheOverride("override", {});
  let cacheConf = conf.provider.getCacheConfig();

  if (cacheConf.maxAge != -1) {
    cacheOverride.ttl = cacheConf.maxAge;
  }
  if (cacheConf.staleWhileRevalidate != -1) {
    cacheOverride.swr = cacheConf.staleWhileRevalidate;
  }

  let beresp = await fetch(request, {
    backend: conf.queueItOrigin,
    cacheOverride: cacheOverride,
  });

  if (beresp.status != 200) {
    return "";
  }

  return beresp.text();
}

export class IntegrationConfig {
  constructor(
    public queueItOrigin: string,
    public customerId: string,
    public secretKey: string,
    public apiKey: string,
    public readRequestBody: boolean,
    public provider: IntegrationEndpointProvider = new QueueItIntegrationEndpointProvider()
  ) {}
}

export class IntegrationEndpointCacheConfig {
  maxAge: number = -1;
  staleWhileRevalidate: number = -1;
}

export interface IntegrationEndpointProvider {
  getHostname(customerId: string): string;

  getEndpoint(customerId: string): string;

  getCacheConfig(): IntegrationEndpointCacheConfig;
}

export class QueueItIntegrationEndpointProvider implements IntegrationEndpointProvider {
  private readonly cacheConfig: IntegrationEndpointCacheConfig;

  constructor() {
    this.cacheConfig = new IntegrationEndpointCacheConfig();
    this.cacheConfig.maxAge = 60 * 5;
    this.cacheConfig.staleWhileRevalidate = 60 * 5;
  }

  getCacheConfig(): IntegrationEndpointCacheConfig {
    return this.cacheConfig;
  }

  getHostname(customerId: string): string {
    return customerId + ".queue-it.net";
  }

  getEndpoint(customerId: string): string {
    const host = this.getHostname(customerId);
    return "https://" + host + "/status/integrationconfig/secure/" + customerId;
  }
}
