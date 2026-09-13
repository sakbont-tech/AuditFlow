import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it, vi } from "vitest";
import LoginPage from "./LoginPage";

describe("LoginPage", () => {
  it("stores the access token and navigates after a successful login", async () => {
    // Arrange
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        accessToken: "test-access-token",
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<h1>Dashboard</h1>} />
        </Routes>
      </MemoryRouter>,
    );

    // Act
    await user.type(screen.getByLabelText("Email"), "test@example.com");

    await user.type(screen.getByLabelText("Password"), "Password123!");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    // Assert
    expect(
      await screen.findByRole("heading", { name: "Dashboard" }),
    ).toBeInTheDocument();

    expect(sessionStorage.getItem("accessToken")).toBe("test-access-token");

    expect(fetchMock).toHaveBeenCalledOnce();

    expect(fetchMock).toHaveBeenCalledWith("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "test@example.com",
        password: "Password123!",
      }),
    });
  });

  it("shows an error when the login credentials are incorrect", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        error: {
          code: "INVALID_LOGIN_DATA",
          message: "incorrect login credentials",
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "Password123!");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(sessionStorage.getItem("accessToken")).toBeNull();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Incorrect login credentials",
    );

    expect(screen.getByRole("button", { name: "Log in" })).toBeEnabled();

    expect(fetchMock).toHaveBeenCalledOnce();

    expect(fetchMock).toHaveBeenCalledWith("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "test@example.com",
        password: "Password123!",
      }),
    });
  });

  it("shows an error when the login credentials are not provided", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        error: {
          code: "INVALID_LOGIN_FORMAT",
          message: "Login schema validation failed",
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "Password123!");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(sessionStorage.getItem("accessToken")).toBeNull();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Incorrect email and password format",
    );

    expect(screen.getByRole("button", { name: "Log in" })).toBeEnabled();

    expect(fetchMock).toHaveBeenCalledOnce();

    expect(fetchMock).toHaveBeenCalledWith("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "test@example.com",
        password: "Password123!",
      }),
    });
  });

  it("shows an error when the server returns 500", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred",
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "Password123!");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(sessionStorage.getItem("accessToken")).toBeNull();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Something went wrong",
    );

    expect(screen.getByRole("button", { name: "Log in" })).toBeEnabled();

    expect(fetchMock).toHaveBeenCalledOnce();

    expect(fetchMock).toHaveBeenCalledWith("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "test@example.com",
        password: "Password123!",
      }),
    });
  });
  it("shows an error when the network request fails", async () => {
    // Arrange
    const fetchMock = vi
      .fn()
      .mockRejectedValue(new Error("Network unavailable"));

    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>,
    );

    // Act
    await user.type(screen.getByLabelText("Email"), "test@example.com");

    await user.type(screen.getByLabelText("Password"), "Password123!");

    await user.click(screen.getByRole("button", { name: "Log in" }));

    // Assert
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Network unavailable",
    );

    expect(sessionStorage.getItem("accessToken")).toBeNull();

    expect(screen.getByRole("button", { name: "Log in" })).toBeEnabled();

    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
