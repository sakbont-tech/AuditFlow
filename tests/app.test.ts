import request from "supertest";
import { afterAll, beforeEach, describe, it, expect } from "vitest";
import app from "../src/app.js";
import { db } from "../src/db/prismaDB.js";

afterAll(async () => {
  await db.$disconnect();
});

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

describe("POST /api/auth/registration", () => {
  const registrationEmail = "register-test@example.com";

  beforeEach(async () => {
    await db.user.deleteMany({
      where: { email: registrationEmail },
    });
  });

  it("returns status 201 for a successfully created user", async () => {
    const testBody = {
      email: registrationEmail,
      password: "123456789",
      firstName: "test",
      lastName: "testlast",
    };

    const response = await request(app)
      .post("/api/auth/register")
      .send(testBody);
    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      id: expect.any(String),
      email: testBody.email,
      firstName: testBody.firstName,
      lastName: testBody.lastName,
      createdAt: expect.any(String),
    });
  });
});
