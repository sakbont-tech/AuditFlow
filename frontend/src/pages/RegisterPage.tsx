import { type SubmitEvent, useState } from "react";
import { useNavigate } from "react-router";

type Status = "Loading" | "Success" | "Error" | "Idle";

function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [status, setStatus] = useState<Status>("Idle");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setStatus("Loading");
      setErrorMessage("");

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, firstName, lastName }),
      });

      if (response.status === 400) {
        setStatus("Error");
        setErrorMessage("Please enter valid registration details");
        return;
      }

      if (response.status === 409) {
        setStatus("Error");
        setErrorMessage("An account with this email already exists");
        return;
      }

      if (!response.ok) {
        setStatus("Error");
        setErrorMessage("Something went wrong");
        return;
      }

      setStatus("Success");
      navigate("/login");
    } catch (error) {
      setStatus("Error");
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      setErrorMessage(message);
    }
  };

  return (
    <div className="register-page-container">
      <h1>Register Page</h1>

      {status === "Error" && (
        <p className="error-message" role="alert">
          {errorMessage}
        </p>
      )}

      <form className="login-form" onSubmit={handleRegister}>
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

        <label htmlFor="first-name">First Name</label>
        <input
          id="first-name"
          type="text"
          name="first-name"
          value={firstName}
          required
          onChange={(event) => setFirstName(event.target.value)}
        />

        <label htmlFor="last-name">Last Name</label>
        <input
          id="last-name"
          type="text"
          name="last-name"
          value={lastName}
          required
          onChange={(event) => setLastName(event.target.value)}
        />

        <button type="submit" disabled={status === "Loading"}>
          {status === "Loading" ? "Creating Account..." : "Submit"}
        </button>
      </form>
    </div>
  );
}

export default RegisterPage;
