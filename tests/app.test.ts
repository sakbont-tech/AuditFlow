import request from "supertest";
import { afterAll, beforeEach, describe, it, expect } from "vitest";
import app from "../src/app.js";
import { db } from "../src/db/prismaDB.js";
import bcrypt from "bcrypt";

afterAll(async () => {
  await db.$disconnect();
});

const testUser = {
  email: "1234@gmail.com",
  password: "1234bobthebuilder",
  firstName: "Bob",
  lastName: "Builder",
};

describe("GET /api/health", () => {
  it("returns successful health response", async () => {
    const expectedResponse = { status: "ok" };
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual(expectedResponse);
  });
});

describe("POST /api/auth/register", () => {
  beforeEach(async () => {
    await db.ledgerEntry.deleteMany();
    await db.transfer.deleteMany();
    await db.account.deleteMany();
    await db.user.deleteMany();
  });

  it("creates a user, account, and initial ledger entry when registration is valid", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send(testUser);
    expect(response.status).toBe(201);

    expect(response.body).toEqual({
      user: {
        id: expect.any(String),
        email: testUser.email,
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        createdAt: expect.any(String),
      },
      account: {
        accountId: expect.any(String),
        accountNumber: expect.stringMatching(/^\d{12}$/),
        balanceCents: 50000,
        createdAt: expect.any(String),
      },
    });

    const user = await db.user.findUniqueOrThrow({
      where: { email: testUser.email },
    });

    const account = await db.account.findUniqueOrThrow({
      where: { ownerId: user.id },
    });

    const ledgerEntries = await db.ledgerEntry.findMany({
      where: { accountId: account.id },
    });

    const isMatch = await bcrypt.compare(testUser.password, user.passwordHash);
    expect(isMatch).toBe(true);
    expect(user).toMatchObject({
      id: expect.any(String),
      email: testUser.email,
      firstName: testUser.firstName,
      lastName: testUser.lastName,
      passwordHash: expect.any(String),
      createdAt: expect.any(Date),
    });

    expect(account).toMatchObject({
      id: expect.any(String),
      accountNumber: expect.stringMatching(/^\d{12}$/),
      ownerId: user.id,
      balanceCents: 50000,
      createdAt: expect.any(Date),
    });

    expect(ledgerEntries).toHaveLength(1);
    expect(ledgerEntries[0]).toMatchObject({
      id: expect.any(String),
      accountId: account.id,
      amountCents: 50000,
      transferId: null,
      createdAt: expect.any(Date),
    });
    expect(response.body.user.id).toBe(user.id);
    expect(response.body.account.accountId).toBe(account.id);
    expect(response.body.account.accountNumber).toBe(account.accountNumber);
  });

  it("returns a 409 error if users have duplicate emails", async () => {
    const expectedBody = {
      error: {
        code: "EMAIL_ALREADY_REGISTERED",
        message:
          "The email entered has already been used to register an account",
      },
    };

    const firstResponse = await request(app)
      .post("/api/auth/register")
      .send(testUser);

    const duplicateResponse = await request(app)
      .post("/api/auth/register")
      .send({
        email: testUser.email,
        password: "213124324324",
        firstName: "Krishten",
        lastName: "Bale",
      });

    expect(firstResponse.status).toBe(201);
    expect(duplicateResponse.status).toBe(409);
    expect(duplicateResponse.body).toEqual(expectedBody);

    expect(await db.user.count()).toBe(1);
    expect(await db.account.count()).toBe(1);
    expect(await db.ledgerEntry.count()).toBe(1);
  });

  const requiredFields = [
    "email",
    "password",
    "firstName",
    "lastName",
  ] as const;

  it.each(requiredFields)(
    "returns 400 when %s is missing",
    async (missingField) => {
      const requestBody: Partial<typeof testUser> = { ...testUser };
      delete requestBody[missingField];

      const response = await request(app)
        .post("/api/auth/register")
        .send(requestBody);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("INVALID_REGISTRATION_DATA");
      expect(await db.user.count()).toBe(0);
    },
  );
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await db.ledgerEntry.deleteMany();
    await db.transfer.deleteMany();
    await db.account.deleteMany();
    await db.user.deleteMany();
  });

  it("returns 200 status if user logs in successfully", async () => {
    const expectedResponse = {
      email: "1234@gmail.com",
      password: "1234bobthebuilder",
    };
    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send(testUser);
    expect(registerResponse.status).toBe(201);

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send(testUser);
    expect(loginResponse.status).toBe(200);

    expect(loginResponse.body).toEqual({
      accessToken: expect.any(String),
      user: {
        id: expect.any(String),
        email: testUser.email,
        firstName: testUser.firstName,
        lastName: testUser.lastName,
      },
    });
  });

  it("returns a 401 error if user is not in the database", async () => {
    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send(testUser);
    expect(loginResponse.status).toBe(401);
    expect(loginResponse.body.error.code).toBe("INVALID_LOGIN_DATA");
  });

  it("returns a 401 error if the password is incorrect", async () => {
    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send(testUser);
    expect(registerResponse.status).toBe(201);

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: testUser.email,
      password: "wrong-password",
    });

    expect(loginResponse.status).toBe(401);
    expect(loginResponse.body).toEqual({
      error: {
        code: "INVALID_LOGIN_DATA",
        message: "incorrect login credentials",
      },
    });
  });

  it("returns a 400 error if the login schema is invalid", async () => {
    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "not-an-email",
      password: "short",
    });

    expect(loginResponse.status).toBe(400);
    expect(loginResponse.body).toEqual({
      error: {
        code: "INVALID_LOGIN_FORMAT",
        message: "Login schema validation failed",
      },
    });
  });
});
