# AuditFlow Data Model

> Status: Draft — this design will evolve during implementation.

# Version One

Version one contains three core tables:

* `Users`
* `Accounts`
* `Transfers`

The ledger and suspicious-activity alert systems are deferred until the core transfer workflow is complete.

---

## Table: Users

### Purpose

Store user identity and authentication information.

### Fields

* `id`: UUID, required
* `email`: string, required, unique
* `passwordHash`: string, required
* `firstName`: string, required
* `lastName`: string, required
* `createdAt`: timestamp, required

### Primary key

* `id`

### Important constraints

* Every user must have a unique email address.
* Emails should be normalized before storage.
* Passwords must be hashed before storage.
* Plain-text passwords must never be stored.
* Password hashes must never be returned in API responses.

---

## Table: Accounts

### Purpose

Store financial accounts and associate each account with its owner.

### Fields

* `id`: UUID, required
* `accountNumber`: string, required, unique
* `ownerId`: UUID, required
* `accountType`: enum, required
* `balanceCents`: integer, required, default `0`
* `currency`: enum, required
* `status`: enum, required, default `ACTIVE`
* `createdAt`: timestamp, required

### Primary key

* `id`

### Foreign keys

* `ownerId` references `Users.id`

### Account type enum

```text
CHEQUING
SAVINGS
```

### Currency enum

```text
CAD
USD
```

### Account status enum

```text
ACTIVE
FROZEN
CLOSED
```

### Important constraints

* Every account belongs to exactly one user.
* One user can own multiple accounts.
* Every account number must be unique.
* `balanceCents` must be greater than or equal to zero.
* Money is stored in cents using integers.
* An account’s currency cannot change after financial activity begins.
* Closed accounts cannot send or receive transfers.
* Frozen accounts cannot send or receive transfers.
* Accounts with financial history cannot be deleted.

---

## Table: Transfers

### Purpose

Store requests to move funds between two AuditFlow accounts.

### Fields

* `id`: UUID, required
* `sourceAccountId`: UUID, required
* `destinationAccountId`: UUID, required
* `amountCents`: integer, required
* `currency`: enum, required
* `status`: enum, required, default `PENDING`
* `idempotencyKey`: string, required, unique
* `createdAt`: timestamp, required
* `completedAt`: timestamp, optional

### Primary key

* `id`

### Foreign keys

* `sourceAccountId` references `Accounts.id`
* `destinationAccountId` references `Accounts.id`

### Transfer status enum

```text
PENDING
COMPLETED
FAILED
CANCELLED
```

### Important constraints

* `amountCents` must be greater than zero.
* Source and destination accounts must be different.
* Source and destination accounts must exist.
* Source and destination accounts must use the transfer currency.
* The idempotency key must be unique.
* A completed transfer cannot be modified or deleted.
* `completedAt` should only contain a value when the transfer is completed.

### Business rules

Before completing a transfer, the service must confirm:

* The source account belongs to the authenticated user.
* Both accounts are active.
* Source and destination accounts use the same currency.
* The source account has sufficient funds.
* The idempotency key hasn’t already created another transfer.

The API accepts a destination account number. The service uses that number to find the account, then stores its internal UUID in `destinationAccountId`.

### Atomic transfer rule

The following operations must happen inside one database transaction:

1. Confirm that the transfer rules are satisfied.
2. Subtract `amountCents` from the source account.
3. Add `amountCents` to the destination account.
4. Mark the transfer as `COMPLETED`.
5. Set its `completedAt` timestamp.

If any operation fails, the database must roll back all operations. The system must never update only one account.

---

# Relationships

```text
Users.id
    → Accounts.ownerId

Accounts.id
    → Transfers.sourceAccountId

Accounts.id
    → Transfers.destinationAccountId
```

In plain language:

* One user can own many accounts.
* Every account belongs to one user.
* One account can be the source of many transfers.
* One account can be the destination of many transfers.
* Every transfer has one source account and one destination account.

---

# Later Phase

## LedgerEntries

Ledger entries will provide an immutable record of every account balance change.

A completed transfer will eventually create:

* One `DEBIT` ledger entry for the source account
* One `CREDIT` ledger entry for the destination account

The ledger is deferred until the version-one account and transfer workflows are working.

## Alerts

Alerts will eventually identify suspicious transfer activity for administrative review.

The alert system and its administrative endpoints are deferred until after the version-one transfer workflow is complete.

---

# Deliberately Excluded from Version One

Version one does not include:

* Deposits
* Withdrawals
* Account deletion
* Transfer modification or deletion
* Password resets
* Refresh tokens
* Currency conversion
* Transfers to external banks
* Ledger-entry endpoints
* Administrative alert endpoints
