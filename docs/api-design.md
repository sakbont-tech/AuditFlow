# AuditFlow API Design

> Status: Draft — this design will evolve during implementation.

## User actions

1. Register
2. Log in
3. Create an account
4. List your accounts
5. View one of your accounts
6. Submit a transfer
7. List your transfers
8. View one transfer

---

## Register

### Method and path

```text
POST /api/auth/register
```

### Purpose

Create a new user.

### Authentication

Public.

### Request body

- `email`
- `password`
- `firstName`
- `lastName`

### Successful response

```text
201 Created
```

Returns:

- User ID
- Email
- First and last name
- Creation timestamp

### Possible failures

- `400 Bad Request` — invalid input
- `409 Conflict` — email is already registered

---

## Login

### Method and path

```text
POST /api/auth/login
```

### Purpose

Authenticate a user and issue an access token.

### Authentication

Public.

### Request body

- `email`
- `password`

### Successful response

```text
200 OK
```

Returns:

- Access token
- Safe user information:
  - User ID
  - Email
  - First name
  - Last name

### Possible failures

- `400 Bad Request` — invalid or missing request fields
- `401 Unauthorized` — invalid email or password
- `429 Too Many Requests` — too many login attempts

---

## Create an account

### Method and path

```text
POST /api/accounts
```

### Purpose

Open a new account for the authenticated user.

### Authentication

Required.

### Request headers

```text
Authorization: Bearer <accessToken>
```

### Request body

- `accountType`
- `currency`

The server determines the owner from the access token, generates the account number, and sets the initial balance to zero.

### Successful response

```text
201 Created
```

Returns:

- Account ID
- Masked account number
- Account type
- Balance in cents
- Currency
- Account status
- Creation timestamp

### Possible failures

- `400 Bad Request` — invalid account type or currency
- `401 Unauthorized` — missing, invalid, or expired access token
- `409 Conflict` — account creation conflicts with an account rule
- `429 Too Many Requests` — rate limit exceeded

---

## List user accounts

### Method and path

```text
GET /api/accounts
```

### Purpose

List every account owned by the authenticated user.

### Authentication

Required.

### Request headers

```text
Authorization: Bearer <accessToken>
```

### Successful response

```text
200 OK
```

Returns a list containing:

- Account ID
- Masked account number
- Account type
- Balance in cents
- Currency
- Account status
- Creation timestamp

If the user has no accounts, the API returns an empty list with status `200`.

### Possible failures

- `401 Unauthorized` — missing, invalid, or expired access token
- `429 Too Many Requests` — rate limit exceeded

---

## View one user account

### Method and path

```text
GET /api/accounts/:accountId
```

### Purpose

Display information about one account owned by the authenticated user.

### Authentication

Required.

### Request headers

```text
Authorization: Bearer <accessToken>
```

### Path parameters

- `accountId` — UUID identifying the requested account

### Successful response

```text
200 OK
```

Returns one account containing:

- Account ID
- Masked account number
- Account type
- Balance in cents
- Currency
- Account status
- Creation timestamp

### Possible failures

- `400 Bad Request` — the account ID is not a valid UUID
- `401 Unauthorized` — missing, invalid, or expired access token
- `404 Not Found` — the account does not exist or does not belong to the authenticated user
- `429 Too Many Requests` — rate limit exceeded

---

## Submit a transfer

### Method and path

```text
POST /api/transfers
```

### Purpose

Transfer funds from an account owned by the authenticated user to another AuditFlow account.

### Authentication

Required.

### Request headers

```text
Authorization: Bearer <accessToken>
Idempotency-Key: <unique-client-generated-value>
```

### Request body

- `sourceAccountId`
- `destinationAccountNumber`
- `amountCents`

The server determines the currency from the accounts and confirms that both accounts use the same currency.

### Successful response

```text
201 Created
```

Returns a transfer object containing:

- Transfer ID
- Source account ID
- Masked destination account number
- Amount in cents
- Currency
- Transfer status
- Creation timestamp
- Completion timestamp

### Possible failures

- `400 Bad Request`
  - Missing or invalid fields
  - Amount is not a positive integer
  - Source and destination are the same account

- `401 Unauthorized`
  - Missing, invalid, or expired access token

- `404 Not Found`
  - Source account does not exist or is not owned by the authenticated user
  - Destination account does not exist

- `409 Conflict`
  - Idempotency key was reused with different transfer data
  - An account is frozen or closed

- `422 Unprocessable Entity`
  - Insufficient funds
  - Account currencies do not match

- `429 Too Many Requests`
  - Rate limit exceeded

---

## List transfers

### Method and path

```text
GET /api/transfers
```

### Purpose

List transfers sent from or received by accounts owned by the authenticated user.

### Authentication

Required.

### Request headers

```text
Authorization: Bearer <accessToken>
```

### Optional query parameters

- `direction` — `sent` or `received`
- `status` — filter by transfer status
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
- Currency
- Transfer status
- Creation timestamp
- Completion timestamp

If no transfers match, the API returns an empty list with status `200`.

### Possible failures

- `400 Bad Request` — invalid query parameters
- `401 Unauthorized` — missing, invalid, or expired access token
- `429 Too Many Requests` — rate limit exceeded

---

## View one transfer

### Method and path

```text
GET /api/transfers/:transferId
```

### Purpose

Retrieve one transfer involving an account owned by the authenticated user.

### Authentication

Required.

### Request headers

```text
Authorization: Bearer <accessToken>
```

### Path parameters

- `transferId` — UUID identifying the requested transfer

### Successful response

```text
200 OK
```

Returns:

- Transfer ID
- Source account information
- Destination account information
- Amount in cents
- Currency
- Transfer status
- Creation timestamp
- Completion timestamp

### Possible failures

- `400 Bad Request` — invalid transfer ID format
- `401 Unauthorized` — missing, invalid, or expired access token
- `404 Not Found` — the transfer does not exist or does not involve one of the user’s accounts
- `429 Too Many Requests` — rate limit exceeded
