import { useState } from "react";
import { useNavigate } from "react-router";

function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const handleRegister = async () => {
    const navigate = useNavigate();
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, firstName, lastName }),
      });

      if (response.status == 400) {
        console.log(response);
      }

      if (response.status == 409) {
        console.log(response);
      }

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      navigate("/login");
    } catch (error) {
      console.log(error instanceof Error ? error.message : error);
    }
  };

  return (
    <div className="register-page-container">
      <h1>Register Page</h1>
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

        <button type="submit">Submit</button>
      </form>
    </div>
  );
}

export default RegisterPage;
