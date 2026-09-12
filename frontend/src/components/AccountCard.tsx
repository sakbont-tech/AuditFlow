import type { Account } from "../types/account";

interface AccountCardProps {
  account: Account;
}

function AccountCard({ account }: AccountCardProps) {
  return (
    <section>
      <p>Account Number: {account.accountNumber}</p>
      <p>Account Balance: {(account.balanceCents / 100).toFixed(2)}</p>
      <p>
        Account Creation Date:{" "}
        {new Date(account.createdAt).toLocaleDateString()}
      </p>
    </section>
  );
}

export default AccountCard;
