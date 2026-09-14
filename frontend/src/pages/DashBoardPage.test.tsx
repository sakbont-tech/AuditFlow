import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it, vi } from "vitest";
import DashboardPage from "./DashboardPage";

describe("DashboardPage", () => {
  it("displays the user's accounts after a successful request", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        accounts: [
          {
            id: "test-account-id",
            accountNumber: "********9012",
            balanceCents: 50000,
            createdAt: "2026-07-12T00:00:00.000Z",
          },
        ],
      }),
    });

    vi.stubGlobal("fetch", fetchMock);
    sessionStorage.setItem("accessToken", "test-access-token");

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByText("Account Number: ********9012"),
    ).toBeInTheDocument();
    expect(screen.getByText("Account Balance: 500.00")).toBeInTheDocument();

    expect(fetchMock).toHaveBeenCalledOnce();

    expect(fetchMock).toHaveBeenCalledWith("/api/accounts", {
      method: "GET",
      headers: {
        Authorization: "Bearer test-access-token",
      },
    });
  });

  it("shows a message when there are no accounts", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        accounts: [],
      }),
    });

    vi.stubGlobal("fetch", fetchMock);
    sessionStorage.setItem("accessToken", "test-access-token");

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByText("No accounts to display..."),
    ).toBeInTheDocument();

    expect(fetchMock).toHaveBeenCalledOnce();

    expect(fetchMock).toHaveBeenCalledWith("/api/accounts", {
      method: "GET",
      headers: {
        Authorization: "Bearer test-access-token",
      },
    });
  });

  it("navigates to the login page when there is no access token", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/login" element={<h1>Login</h1>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", { name: "Login" }),
    ).toBeInTheDocument();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("clears the access token and navigates to login when unauthorized", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        error: {
          code: "AUTHENTICATION_REQUIRED",
          message: "A valid access token is required",
        },
      }),
    });

    vi.stubGlobal("fetch", fetchMock);
    sessionStorage.setItem("accessToken", "invalid-access-token");

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/login" element={<h1>Login</h1>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", { name: "Login" }),
    ).toBeInTheDocument();

    expect(sessionStorage.getItem("accessToken")).toBeNull();

    expect(fetchMock).toHaveBeenCalledOnce();

    expect(fetchMock).toHaveBeenCalledWith("/api/accounts", {
      method: "GET",
      headers: {
        Authorization: "Bearer invalid-access-token",
      },
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
    sessionStorage.setItem("accessToken", "test-access-token");

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByText("HTTP error! Status: 500"),
    ).toBeInTheDocument();

    expect(fetchMock).toHaveBeenCalledOnce();

    expect(fetchMock).toHaveBeenCalledWith("/api/accounts", {
      method: "GET",
      headers: {
        Authorization: "Bearer test-access-token",
      },
    });
  });

  it("shows an error when the network request fails", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValue(new Error("Network unavailable"));

    vi.stubGlobal("fetch", fetchMock);
    sessionStorage.setItem("accessToken", "test-access-token");

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Network unavailable")).toBeInTheDocument();

    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("clears the access token and navigates to login after logout", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        accounts: [],
      }),
    });

    vi.stubGlobal("fetch", fetchMock);
    sessionStorage.setItem("accessToken", "test-access-token");

    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/login" element={<h1>Login</h1>} />
        </Routes>
      </MemoryRouter>,
    );

    await screen.findByText("No accounts to display...");
    await user.click(screen.getByRole("button", { name: "Logout" }));

    expect(
      await screen.findByRole("heading", { name: "Login" }),
    ).toBeInTheDocument();

    expect(sessionStorage.getItem("accessToken")).toBeNull();

    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
