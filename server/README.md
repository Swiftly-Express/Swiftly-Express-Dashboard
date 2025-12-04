Local test backend for Swiftly Express

Run a minimal Express server that implements the `POST /api/auth/register` endpoint
used by the frontend for local development and testing.

Quick start:

1. Install dependencies

```powershell
cd server; npm install
```

2. Start the server

```powershell
npm start
# or for auto-reload during development
npm run dev
```

By default the server listens on `http://localhost:8080` and exposes:

- `POST /api/auth/register` — expects JSON body:

```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "confirmPassword": "password123",
  "role": "customer"
}
```

This is a minimal, purely local testing server. It uses an in-memory array
to store registered users and is not secure or suitable for production.
