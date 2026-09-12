import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import AccountCard from "../components/AccountCard";
import type { Account } from "../types/account";

type Status = "Loading" | "Success" | "Empty" | "Error";

function DashboardPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [status, setStatus] = useState<Status>("Loading");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setStatus("Loading");
        setErrorMessage("");
        const accessToken = sessionStorage.getItem("accessToken");
        if (!accessToken) {
          return navigate("/login");
        }

        const response = await fetch("/api/accounts", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.status === 401) {
          sessionStorage.removeItem("accessToken");
          return navigate("/login");
        }

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setAccounts(data.accounts);
        setStatus(data.accounts.length === 0 ? "Empty" : "Success");
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.log(message);
        setErrorMessage(message);
        setStatus("Error");
      }
    };
    fetchAccounts();
  }, [navigate]);

  function handleLogout() {
    sessionStorage.removeItem("accessToken");
    navigate("/login");
  }

  return (
    <>
      {status === "Loading" && (
        <p className="loading-message">Loading accounts...</p>
      )}

      {status === "Error" && <p className="error-message">{errorMessage}</p>}

      {status === "Empty" && (
        <p className="empty-message">No accounts to display...</p>
      )}

      <h1>AuditFlow</h1>
      <button onClick={handleLogout}>Logout</button>

      {status === "Success" && (
        <>
          {accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </>
      )}
    </>
  );
}

export default DashboardPage;
