import { withRateLimit } from "./rateLimit";

// Mock the Upstash-backed limiter so we test OUR wrapper, not Upstash/Redis.
jest.mock("../../util/rateLimit", () => ({
  rateLimit: { limit: jest.fn() },
}));

import { rateLimit } from "../../util/rateLimit";

const mockedLimit = rateLimit.limit as jest.Mock;

function makeRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function makeReq(overrides: any = {}) {
  return {
    headers: { "x-forwarded-for": "203.0.113.5, 10.0.0.1" },
    socket: { remoteAddress: "10.0.0.9" },
    user: { installationId: "install-123" },
    ...overrides,
  };
}

describe("withRateLimit", () => {
  it("calls the handler and does NOT block when under the limit", async () => {
    mockedLimit.mockResolvedValue({ success: true });
    const handler = jest.fn().mockResolvedValue("ok");
    const req = makeReq();
    const res = makeRes();

    await withRateLimit(handler)(req, res);

    expect(handler).toHaveBeenCalledWith(req, res);
    expect(res.status).not.toHaveBeenCalledWith(429);
  });

  it("returns 429 and does NOT call the handler when over the limit", async () => {
    mockedLimit.mockResolvedValue({ success: false });
    const handler = jest.fn();
    const req = makeReq();
    const res = makeRes();

    await withRateLimit(handler)(req, res);

    expect(handler).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Too many request",
    });
  });

  it("builds the limiter key from installationId + first x-forwarded-for IP", async () => {
    mockedLimit.mockResolvedValue({ success: true });
    const handler = jest.fn();
    const req = makeReq();

    await withRateLimit(handler)(req, makeRes());

    // key = `generate${installationId}:${clientsIp}`
    expect(mockedLimit).toHaveBeenCalledWith("generateinstall-123:203.0.113.5");
  });

  it("falls back to socket.remoteAddress when x-forwarded-for is missing", async () => {
    mockedLimit.mockResolvedValue({ success: true });
    const req = makeReq({ headers: {} });

    await withRateLimit(jest.fn())(req, makeRes());

    expect(mockedLimit).toHaveBeenCalledWith("generateinstall-123:10.0.0.9");
  });

  it('falls back to "unknown" when no IP can be determined', async () => {
    mockedLimit.mockResolvedValue({ success: true });
    const req = makeReq({ headers: {}, socket: {} });

    await withRateLimit(jest.fn())(req, makeRes());

    expect(mockedLimit).toHaveBeenCalledWith("generateinstall-123:unknown");
  });

  it("scopes the limit per installation (different installs => different keys)", async () => {
    mockedLimit.mockResolvedValue({ success: true });

    await withRateLimit(jest.fn())(
      makeReq({ user: { installationId: "A" } }),
      makeRes(),
    );
    await withRateLimit(jest.fn())(
      makeReq({ user: { installationId: "B" } }),
      makeRes(),
    );

    expect(mockedLimit).toHaveBeenNthCalledWith(1, "generateA:203.0.113.5");
    expect(mockedLimit).toHaveBeenNthCalledWith(2, "generateB:203.0.113.5");
  });
});
