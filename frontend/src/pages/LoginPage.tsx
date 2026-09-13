import { type SubmitEvent, useState } from "react";
import { useNavigate } from "react-router";

type Status = "Loading" | "Success" | "Error" | "Idle";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>("Idle");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setStatus("Loading");
      setErrorMessage("");
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (response.status === 400) {
        setStatus("Error");
        setErrorMessage("Incorrect email and password format");
        return;
      }

      if (response.status === 401) {
        setStatus("Error");
        setErrorMessage("Incorrect login credentials");
        return;
      }

      if (!response.ok) {
        setStatus("Error");
        setErrorMessage("Something went wrong");
        return;
      }

      if (typeof data.accessToken === "string") {
        setStatus("Success");
        sessionStorage.setItem("accessToken", data.accessToken);
        navigate("/dashboard");
        return;
      }

      setStatus("Error");
      setErrorMessage("The server returned an invalid response.");
    } catch (error) {
      setStatus("Error");
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      setErrorMessage(message);
      return;
    }
  };

  return (
    <div className="login-page">
      <h1>Login Page</h1>

      {status === "Error" && (
        <p className="error-message" role="alert">
          {errorMessage}
        </p>
      )}

      <form className="login-form" onSubmit={handleSubmit}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          name="email"
          value={email}
          required
          onChange={(event) => setEmail(event.target.value)}
        />
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          name="password"
          value={password}
          required
          onChange={(event) => setPassword(event.target.value)}
        />
        <button type="submit" disabled={status === "Loading"}>
          {status === "Loading" ? "Checking Credentials..." : "Log in"}
        </button>
      </form>
    </div>
  );
}

export default LoginPage;
