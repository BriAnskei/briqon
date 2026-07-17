import { withAuth } from "./auth";

jest.mock("jsonwebtoken", () => ({
  __esModule: true,
  default: { verify: jest.fn() },
}));

import jwt from "jsonwebtoken";

const mockedVerify = jwt.verify as unknown as jest.Mock;

function makeRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("withAuth", () => {
  it("returns 401 when the Authorization header is missing", async () => {
    const handler = jest.fn();
    const res = makeRes();

    await withAuth(handler)({ headers: {} }, res);

    expect(handler).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Unauthorize",
    });
  });

  it("returns 401 when the token is invalid", async () => {
    mockedVerify.mockImplementation(() => {
      throw new Error("bad token");
    });
    const handler = jest.fn();
    const res = makeRes();

    await withAuth(handler)(
      { headers: { authorization: "Bearer nope" } },
      res,
    );

    expect(handler).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Invalid token",
    });
  });

  it("attaches the payload to req.user and calls the handler on a valid token", async () => {
    const payload = { installationId: "install-123" };
    mockedVerify.mockReturnValue(payload);
    const handler = jest.fn().mockResolvedValue("ok");
    const req: any = { headers: { authorization: "Bearer good.token" } };
    const res = makeRes();

    await withAuth(handler)(req, res);

    expect(mockedVerify).toHaveBeenCalledWith("good.token", process.env.JWT_SECRET);
    expect(req.user).toEqual(payload);
    expect(handler).toHaveBeenCalledWith(req, res);
  });
});
