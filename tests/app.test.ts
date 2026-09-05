import request from "supertest";
import bcrypt from "bcrypt";
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

describe("POST /api/auth/register", () => {
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

    const savedUser = await db.user.findUnique({
      where: { email: registrationEmail },
    });

    expect(savedUser).not.toBeNull();
    expect(
      await bcrypt.compare(testBody.password, savedUser!.passwordHash),
    ).toBe(true);
  });

  it("returns status 400 for a missing user schema field", async () => {
    const testBody = {
      email: registrationEmail,
      password: "123456789",
      lastName: "testlast",
    };

    const response = await request(app)
      .post("/api/auth/register")
      .send(testBody);
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: {
        code: "INVALID_REGISTRATION_DATA",
        message: "Registration schema validation failed",
      },
    });
  });

  it("returns status 400 for an invalid user schema field", async () => {
    const testBody = {
      email: registrationEmail,
      firstName: "test",
      password: "123",
      lastName: "testlast",
    };

    const response = await request(app)
      .post("/api/auth/register")
      .send(testBody);
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: {
        code: "INVALID_REGISTRATION_DATA",
        message: "Registration schema validation failed",
      },
    });
  });

  it("returns status 409 when the email is already registered", async () => {
    const testBody = {
      email: registrationEmail,
      password: "123456789",
      firstName: "test",
      lastName: "testlast",
    };

    const firstResponse = await request(app)
      .post("/api/auth/register")
      .send(testBody);

    expect(firstResponse.status).toBe(201);

    const secondResponse = await request(app)
      .post("/api/auth/register")
      .send(testBody);

    expect(secondResponse.status).toBe(409);
    expect(secondResponse.body).toEqual({
      error: {
        code: "EMAIL_ALREADY_REGISTERED",
        message: "The email entered has already been used to register an account",
      },
    });
    const userCount = await db.user.count({
      where: { email: registrationEmail },
    });

    expect(userCount).toBe(1);
  });
});
