import http from "http";
import { AddressInfo } from "net";
import { accountBalanceNormalizingFetch } from "../utils/network";
import { StacksService } from "../services/stacks.service";

/**
 * The Hiro key must not follow a redirect off the Stacks API origin (review item 11).
 *
 * The same-origin check runs once, against the URL the request was made to. A redirect
 * to another origin is then followed by the HTTP client, and a custom header such as
 * x-hiro-api-key is carried along — only Authorization is dropped on a cross-origin hop.
 *
 * Real sockets, not mocks: "the Stacks API" redirects to "elsewhere" (another port, so
 * another origin), and "elsewhere" records what it receives.
 */

const HEADER = "x-hiro-api-key";
const KEY = "hiro-key-under-test";

let stacksApi: http.Server;
let elsewhere: http.Server;
let stacksOrigin: string;
let seenElsewhere: Array<string | undefined>;

const listen = (server: http.Server) =>
  new Promise<string>((resolve) =>
    server.listen(0, "127.0.0.1", () =>
      resolve(`http://127.0.0.1:${(server.address() as AddressInfo).port}`),
    ),
  );

beforeAll(async () => {
  elsewhere = http.createServer((req, res) => {
    seenElsewhere.push(req.headers[HEADER] as string | undefined);
    res.writeHead(200, { "content-type": "application/json" });
    res.end("{}");
  });
  const elsewhereOrigin = await listen(elsewhere);
  stacksApi = http.createServer((req, res) => {
    res.writeHead(302, { location: `${elsewhereOrigin}${req.url}` });
    res.end();
  });
  stacksOrigin = await listen(stacksApi);
});

afterAll(async () => {
  await new Promise((r) => stacksApi.close(r));
  await new Promise((r) => elsewhere.close(r));
});

beforeEach(() => {
  seenElsewhere = [];
});

describe("the Hiro key does not follow a cross-origin redirect", () => {
  it("fetch path (every PoX-5 read)", async () => {
    const keyedFetch = accountBalanceNormalizingFetch(fetch, KEY, stacksOrigin);

    await keyedFetch(`${stacksOrigin}/v2/pox`).catch(() => undefined);

    expect(seenElsewhere.filter((k) => k === KEY)).toHaveLength(0);
  });

  it("axios path (StacksService reads)", async () => {
    const svc: any = new StacksService(
      true,
      { baseUrl: stacksOrigin, chainId: 1, magicBytes: "id" },
      KEY,
    );

    await svc.axiosClient.get(`${stacksOrigin}/v2/info`).catch(() => undefined);

    expect(seenElsewhere.filter((k) => k === KEY)).toHaveLength(0);
  });

  it("still sends the key on a plain same-origin request", async () => {
    const seen: Array<string | undefined> = [];
    const direct = http.createServer((req, res) => {
      seen.push(req.headers[HEADER] as string | undefined);
      res.writeHead(200, { "content-type": "application/json" });
      res.end("{}");
    });
    const origin = await listen(direct);
    try {
      await accountBalanceNormalizingFetch(
        fetch,
        KEY,
        origin,
      )(`${origin}/v2/pox`);
      const svc: any = new StacksService(
        true,
        { baseUrl: origin, chainId: 1, magicBytes: "id" },
        KEY,
      );
      await svc.axiosClient.get(`${origin}/v2/info`);
    } finally {
      await new Promise((r) => direct.close(r));
    }

    expect(seen).toEqual([KEY, KEY]);
  });
});
