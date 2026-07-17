// Mock the Gemini client so no real API calls happen.
jest.mock("../util/ai", () => ({
  ai: { models: { generateContent: jest.fn() } },
}));

import { generateHanlder } from "./generate";
import { ai } from "../util/ai";

const mockedGenerate = ai.models.generateContent as jest.Mock;

function makeRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function makeReq(overrides: any = {}) {
  return {
    method: "POST",
    body: { prompt: "make me a schedule", systemInstruction: "be helpful" },
    ...overrides,
  };
}

// A payload that satisfies CreateScheduleResponseSchema.
const VALID_SCHEDULE = {
  summary: {
    categories: [{ name: "Work", total: "4h" }],
  },
  schedule: [
    { start_time: "09:00", end_time: "10:00", activity: "Deep work" },
  ],
};

describe("generateHanlder", () => {
  it("returns 405 for non-POST methods", async () => {
    const res = makeRes();
    await generateHanlder(makeReq({ method: "GET" }), res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(mockedGenerate).not.toHaveBeenCalled();
  });

  it("returns 400 when prompt is missing", async () => {
    const res = makeRes();
    await generateHanlder(makeReq({ body: { systemInstruction: "x" } }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Missing fields",
    });
    expect(mockedGenerate).not.toHaveBeenCalled();
  });

  it("returns 400 when systemInstruction is missing", async () => {
    const res = makeRes();
    await generateHanlder(makeReq({ body: { prompt: "x" } }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockedGenerate).not.toHaveBeenCalled();
  });

  it("returns 200 with parsed data on a valid AI response", async () => {
    mockedGenerate.mockResolvedValue({ text: JSON.stringify(VALID_SCHEDULE) });
    const res = makeRes();

    await generateHanlder(makeReq(), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      res: VALID_SCHEDULE,
    });
    expect(mockedGenerate).toHaveBeenCalledTimes(1);
  });

  it("retries once then succeeds when the first response fails schema validation", async () => {
    mockedGenerate
      .mockResolvedValueOnce({ text: JSON.stringify({ bogus: true }) })
      .mockResolvedValueOnce({ text: JSON.stringify(VALID_SCHEDULE) });
    const res = makeRes();

    await generateHanlder(makeReq(), res);

    expect(mockedGenerate).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("returns 500 after exhausting MAX_ATTEMPS (2) on repeated invalid output", async () => {
    mockedGenerate.mockResolvedValue({ text: JSON.stringify({ bogus: true }) });
    const res = makeRes();

    await generateHanlder(makeReq(), res);

    expect(mockedGenerate).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Failed request",
    });
  });

  it("returns 500 with the error message when the AI call throws", async () => {
    // Silence the handler's console.error for this expected-error case.
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockedGenerate.mockRejectedValue(new Error("gemini exploded"));
    const res = makeRes();

    await generateHanlder(makeReq(), res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "gemini exploded",
    });
    spy.mockRestore();
  });
});
