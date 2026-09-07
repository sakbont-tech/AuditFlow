# AuditFlow API Design

> Status: Draft — registration and health endpoints are implemented. Remaining endpoints are planned.

## General conventions

- Base path: `/api`
- Requests and responses use JSON.
- Money is represented in cents using integers.
- Timestamps use ISO 8601 UTC strings.
- Passwords and password hashes are never returned.
- Authenticated endpoints require an access token:

  ```text
  Authorization: Bearer <accessToken>
  ```

- Resources belonging to another user are reported as `404 Not Found` to avoid revealing their existence.
- Each user currently owns one account.
- Registration automatically creates the user’s account with an opening balance of `50000` cents.
- Account, balance, and ledger updates that belong to one operation are performed in a database transaction.

### Standard error response

```json
{
  "error": {
    "code": "MACHINE_READABLE_CODE",
    "message": "Safe explanation for the client"
  }
}
```

---

# Health

## Check API health

> Implementation status: Implemented

### Method and path

```text
GET /api/health
```

### Purpose

Confirm that the API process is running.

### Authentication

Public.

### Successful response

```text
200 OK
```

```json
{
  "status": "ok"
}
```

---

# Authentication

## Register

> Implementation status: Implemented

### Method and path

```text
POST /api/auth/register
```

### Purpose

Create a user, their default account, and an initial ledger entry.

All three database records are created in one transaction. If any operation fails, none of the records are persisted.

### Authentication

Public.

### Request body

```json
{
  "email": "bob@example.com",
  "password": "bobthebuilder123",
  "firstName": "Bob",
  "lastName": "Builder"
}
```

### Validation

- `email`
  - Required
  - Must be a valid email address
  - Leading and trailing whitespace is removed
  - Stored in lowercase
- `password`
  - Required
  - Minimum length of 8 characters
  - Maximum length of 72 UTF-8 bytes
- `firstName`
  - Required
  - Leading and trailing whitespace is removed
  - Cannot be empty after trimming
- `lastName`
  - Required
  - Leading and trailing whitespace is removed
  - Cannot be empty after trimming

### Registration behavior

The server:

1. Validates and normalizes the request.
2. Hashes the password using bcrypt.
3. Generates a unique 12-digit account number.
4. Creates the user.
5. Creates one account owned by the user.
6. Sets the account balance to `50000` cents.
7. Creates an initial ledger entry for `50000` cents.

Account-number generation is retried up to three times if a generated number already exists.

### Successful response

```text
201 Created
```

```json
{
  "user": {
    "id": "user-uuid",
    "email": "bob@example.com",
    "firstName": "Bob",
    "lastName": "Builder",
    "createdAt": "2026-09-07T18:00:00.000Z"
  },
  "account": {
    "accountId": "account-uuid",
    "accountNumber": "123456789012",
    "balanceCents": 50000,
    "createdAt": "2026-09-07T18:00:00.000Z"
  }
}
```

The password and password hash are not returned.

### Invalid registration data

```text
400 Bad Request
```

```json
{
  "error": {
    "code": "INVALID_REGISTRATION_DATA",
    "message": "Registration schema validation failed"
  }
}
```

### Duplicate email

```text
409 Conflict
```

```json
{
  "error": {
    "code": "EMAIL_ALREADY_REGISTERED",
    "message": "The email entered has already been used to register an account"
  }
}
```

### Other failures

Unexpected database failures are passed to the application’s error-handling middleware.

---

## Login

> Implementation status: Planned

### Method and path

```text
POST /api/auth/login
```

### Purpose

Authenticate a user and issue an access token.

### Authentication

Public.

### Request body

```json
{
  "email": "bob@example.com",
  "password": "bobthebuilder123"
}
```

### Successful response

```text
200 OK
```

```json
{
  "accessToken": "access-token",
  "user": {
    "id": "user-uuid",
    "email": "bob@example.com",
    "firstName": "Bob",
    "lastName": "Builder"
  }
}
```

### Possible failures

- `400 Bad Request` — missing or invalid fields
- `401 Unauthorized` — invalid email or password
- `429 Too Many Requests` — too many login attempts

The same `401` response is returned for an unknown email and an incorrect password.

---

# Accounts

Each user currently has one account, which is created automatically during registration.

Additional account creation is not included in version one.

## List the user’s accounts

> Implementation status: Planned

### Method and path

```text
GET /api/accounts
```

### Purpose

List accounts owned by the authenticated user.

The current database design limits each user to one account, but the endpoint returns an array to allow future expansion.

### Authentication

Required.

### Successful response

```text
200 OK
```

```json
{
  "accounts": [
    {
      "id": "account-uuid",
      "accountNumber": "********9012",
      "balanceCents": 50000,
      "createdAt": "2026-09-07T18:00:00.000Z"
    }
  ]
}
```

### Possible failures

- `401 Unauthorized` — missing, invalid, or expired token
- `429 Too Many Requests` — rate limit exceeded

---

## Get one account

> Implementation status: Planned

### Method and path

```text
GET /api/accounts/:accountId
```

### Purpose

Retrieve an account owned by the authenticated user.

### Authentication

Required.

### Path parameters

- `accountId` — UUID identifying the account

### Successful response

```text
200 OK
```

```json
{
  "account": {
    "id": "account-uuid",
    "accountNumber": "********9012",
    "balanceCents": 50000,
    "createdAt": "2026-09-07T18:00:00.000Z"
  }
}
```

### Possible failures

- `400 Bad Request` — invalid account ID
- `401 Unauthorized` — missing, invalid, or expired token
- `404 Not Found` — account does not exist or does not belong to the user
- `429 Too Many Requests` — rate limit exceeded

---

# Transfers

## Create a transfer

> Implementation status: Planned

### Method and path

```text
POST /api/transfers
```

### Purpose

Transfer money from the authenticated user’s account to another AuditFlow account.

### Authentication

Required.

### Request headers

```text
Authorization: Bearer <accessToken>
Idempotency-Key: <unique-client-generated-value>
```

The idempotency key prevents repeated requests from creating duplicate transfers.

### Request body

```json
{
  "sourceAccountId": "source-account-uuid",
  "destinationAccountNumber": "123456789012",
  "amountCents": 2500
}
```

### Transfer behavior

The server:

1. Verifies that the source account belongs to the authenticated user.
2. Looks up the destination account using its account number.
3. Validates the transfer amount and available balance.
4. Creates the transfer.
5. Decreases the source balance.
6. Increases the destination balance.
7. Creates corresponding source and destination ledger entries.

The transfer, balance updates, and ledger entries are written in one database transaction.

### Successful response

```text
201 Created
```

```json
{
  "transfer": {
    "id": "transfer-uuid",
    "sourceAccountId": "source-account-uuid",
    "destinationAccountNumber": "********9012",
    "amountCents": 2500,
    "createdAt": "2026-09-07T18:00:00.000Z"
  }
}
```

If an identical request is repeated with the same idempotency key, the server returns the previously created transfer without moving money again.

### Possible failures

- `400 Bad Request`
  - Missing or invalid fields
  - Amount is not a positive integer
  - Source and destination are the same account
- `401 Unauthorized` — missing, invalid, or expired token
- `404 Not Found`
  - Source account does not exist or does not belong to the user
  - Destination account does not exist
- `409 Conflict`
  - Idempotency key was reused with different request data
- `422 Unprocessable Entity`
  - Insufficient balance
- `429 Too Many Requests` — rate limit exceeded

---

## List transfers

> Implementation status: Planned

### Method and path

```text
GET /api/transfers
```

### Purpose

List transfers sent from or received by the authenticated user’s account.

### Authentication

Required.

### Optional query parameters

- `direction` — `sent` or `received`
- `limit` — maximum number of results
- `cursor` — continue from a previous page

### Successful response

```text
200 OK
```

Returns a paginated list containing:

- Transfer ID
- Source account information
- Destination account information
- Amount in cents
- Creation timestamp

If no transfers match, the API returns an empty list with status `200 OK`.

### Possible failures

- `400 Bad Request` — invalid query parameters
- `401 Unauthorized` — missing, invalid, or expired token
- `429 Too Many Requests` — rate limit exceeded

---

## Get one transfer

> Implementation status: Planned

### Method and path

```text
GET /api/transfers/:transferId
```

### Purpose

Retrieve a transfer involving the authenticated user’s account.

### Authentication

Required.

### Path parameters

- `transferId` — UUID identifying the transfer

### Successful response

```text
200 OK
```

Returns:

- Transfer ID
- Source account information
- Destination account information
- Amount in cents
- Creation timestamp

### Possible failures

- `400 Bad Request` — invalid transfer ID
- `401 Unauthorized` — missing, invalid, or expired token
- `404 Not Found` — transfer does not exist or does not involve the user’s account
- `429 Too Many Requests` — rate limit exceeded

---

# Deliberately excluded from version one

Version one does not include:

- Additional account creation
- Multiple accounts per user
- Account types
- Multiple currencies
- Currency conversion
- Account freezing or closing
- Deposits
- Withdrawals
- Account deletion
- Transfer deletion or modification
- Transfer status tracking
- Password reset
- Refresh tokens
- Administrative alert endpoints
- Transfers to external banks

These features may be added after the core authentication, account, transfer, and ledger workflows are complete.
