import request from "supertest";
import { describe, it, expect } from "vitest";
import app from "../src/app.js";

describe("GET /api/health", () => {
  it("returns status 200 and a healthy response", async () => {
    const expectedBody = { status: "ok" };
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(expectedBody);
  });
});

describe("GET from unknown URL", () => {
  it("returns status 404 for an unknown URL", async () => {
    const expectedBody = { err: "Route not found" };
    const response = await request(app).get("/api/random");

    expect(response.status).toBe(404);
    expect(response.body).toEqual(expectedBody);
  });
});
