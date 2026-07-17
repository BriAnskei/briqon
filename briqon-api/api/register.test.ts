// Mock the Upstash-backed limiter and jwt so no real Redis / signing happens.
jest.mock("../util/rateLimit", () => ({
  rateLimit: { limit: jest.fn() },
}));

jest.mock("jsonwebtoken", () => ({
  __esModule: true,
  default: { sign: jest.fn() },
}));

import registerDefault, { registerHanlder } from "./register";
import { rateLimit } from "../util/rateLimit";
import jwt from "jsonwebtoken";

const mockedLimit = rateLimit.limit as jest.Mock;
const mockedSign = jwt.sign as unknown as jest.Mock;

function makeRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function makeReq(overrides: any = {}) {
  return {
    method: "POST",
    headers: { "x-forwarded-for": "203.0.113.5, 10.0.0.1" },
    socket: { remoteAddress: "10.0.0.9" },
    body: { installationId: "install-123" },
    ...overrides,
  };
}

beforeEach(() => {
  // Silence the handler's console.log noise during tests.
  jest.spyOn(console, "log").mockImplementation(() => {});
});

describe("register handler (logic)", () => {
  it("returns 405 for non-POST methods", async () => {
    const res = makeRes();
    await registerHanlder(makeReq({ method: "GET" }), res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(mockedSign).not.toHaveBeenCalled();
  });

  it("returns 400 when installationId is missing", async () => {
    const res = makeRes();
    await registerHanlder(makeReq({ body: {} }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Missing installationId",
      success: false,
    });
    expect(mockedSign).not.toHaveBeenCalled();
  });

  it("returns 200 with a signed token on a valid request", async () => {
    mockedSign.mockReturnValue("signed.jwt.token");
    const res = makeRes();

    await registerHanlder(makeReq(), res);

    expect(mockedSign).toHaveBeenCalledWith(
      { installationId: "install-123", iss: "briqon", aud: "mobile" },
      process.env.JWT_SECRET,
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      token: "signed.jwt.token",
      success: true,
    });
  });
});

describe("register rate limiting (default export)", () => {
  it("returns 429 and does NOT run the handler when over the limit", async () => {
    mockedLimit.mockResolvedValue({ success: false });
    const res = makeRes();

    await registerDefault(makeReq(), res);

    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Too many request",
    });
    // Handler never ran => no token minted.
    expect(mockedSign).not.toHaveBeenCalled();
  });

  it("runs the handler and mints a token when under the limit", async () => {
    mockedLimit.mockResolvedValue({ success: true });
    mockedSign.mockReturnValue("signed.jwt.token");
    const res = makeRes();

    await registerDefault(makeReq(), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      token: "signed.jwt.token",
      success: true,
    });
  });

  it("keys the limit on IP + body.installationId (unauthenticated request)", async () => {
    mockedLimit.mockResolvedValue({ success: true });

    await registerDefault(makeReq(), makeRes());

    expect(mockedLimit).toHaveBeenCalledWith(
      "register:203.0.113.5:install-123",
    );
  });

  it("falls back to socket IP and 'unknown' installationId when both are absent", async () => {
    mockedLimit.mockResolvedValue({ success: true });

    await registerDefault(makeReq({ headers: {}, body: {} }), makeRes());

    expect(mockedLimit).toHaveBeenCalledWith("register:10.0.0.9:unknown");
  });
});
