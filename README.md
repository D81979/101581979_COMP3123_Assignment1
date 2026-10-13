# COMP3123 Assignment 1 — Employee API

**Disha Padsala | Student 101581979**

A Node.js REST API for registration, login, and employee management. Each employee belongs to its creator. Authenticated users can list, retrieve, update, and delete only their own employees.

- Repository: https://github.com/D81979/101581979_COMP3123_Assignment1
- Deployed API: https://101581979-comp-3123-assignment1.vercel.app
- Health check: https://101581979-comp-3123-assignment1.vercel.app/health
- Database: `comp3123_assignment1`

## Technologies and architecture

JavaScript, Node.js, Express, MongoDB Atlas, Mongoose, bcryptjs, jsonwebtoken, express-validator, Helmet, express-rate-limit, Winston, dotenv, Postman, and Vercel.

| Location | Responsibility |
| --- | --- |
| `app.js` | Express middleware, routes, health check, and centralized errors |
| `server.js` | Local database connection and HTTP server startup |
| `config/` | MongoDB connection configuration and connection reuse |
| `routes/` | User and employee Express routers |
| `controllers/` | Request handling and resource operations |
| `models/` | User and Employee schemas and database relationship |
| `middleware/` | Authentication, request logging, and rate limiting |
| `utils/` | Winston logger and MongoDB rate-limit store |
| `logs/app.log` | Generated local JSON logs; excluded from Git |

Requests pass through security and logging middleware, rate limits, JSON parsing, route validation, authentication/authorization where required, and database operations. Errors return JSON through consistent handlers.

## Installation

Install Node.js with npm and Git. Use a Node.js version compatible with the dependencies in `package-lock.json`.

```bash
git clone https://github.com/D81979/101581979_COMP3123_Assignment1.git
cd 101581979_COMP3123_Assignment1
npm ci
cp .env.example .env
```

Configure `.env` with your own credentials. Do not commit it.

For MongoDB Atlas, create or start a cluster, create a database user, allow your development IP in Network Access, and copy the connection URI into `MONGODB_URI`. Atlas runs the database remotely; no local MongoDB server is needed. Alternatively, start your locally installed MongoDB service and use `mongodb://127.0.0.1:27017/comp3123_assignment1`.

```bash
npm start
```

The default local URL is `http://localhost:3000`. `npm run dev` starts Node's watch mode for development. Manual API tests are documented below; the package's placeholder `npm test` is not a completed automated test suite.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `PORT` | Local HTTP port, normally `3000` |
| `MONGODB_URI` | Private MongoDB connection URI |
| `JWT_SECRET` | Private, randomly generated signing secret of at least 32 characters |
| `JWT_EXPIRES_IN` | Token lifetime, normally `1h` |

Generate a signing secret locally and paste the result only into `.env` or the hosting environment:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

`.env.example` contains placeholders only. On Vercel, configure `MONGODB_URI`, `JWT_SECRET`, and `JWT_EXPIRES_IN` as environment variables and redeploy after changes. `app.js` exports the Express app; `server.js` starts the local listener. Connections are reused across requests where possible. The MongoDB network rules must allow the hosting environment to reach the cluster.

## API endpoints

Use the local or deployed base URL before each path.

| Method | Path | Success | Authentication and purpose |
| --- | --- | --- | --- |
| POST | `/api/v1/user/signup` | 201 | Public registration |
| POST | `/api/v1/user/login` | 200 | Public login using username or email |
| GET | `/api/v1/emp/employees` | 200 | JWT; list current user's employees |
| POST | `/api/v1/emp/employees` | 201 | JWT; create an owned employee |
| GET | `/api/v1/emp/employees/{eid}` | 200 | JWT; retrieve an owned employee |
| PUT | `/api/v1/emp/employees/{eid}` | 200 | JWT; update an owned employee |
| DELETE | `/api/v1/emp/employees?eid=xxx` | 204 | JWT; delete an owned employee; empty response |
| GET | `/health` | 200 | Public process health check |

### Registration and login

Send `Content-Type: application/json`. Example registration using fictional values:

```json
{
  "username": "demo_reader",
  "email": "demo.reader@example.com",
  "password": "DemoReader@123"
}
```

Login accepts either `username` and `password`, or `email` and `password`. Supply one identifier, not both. A successful login returns a signed JWT and user details without the password hash.

```json
{
  "username": "demo_reader",
  "password": "DemoReader@123"
}
```

Send the returned token on every employee request:

```text
Authorization: Bearer <your-login-token>
```

Missing, invalid, or expired tokens receive 401. Log in again when a token expires. The authentication middleware verifies the token and identifies an existing user from its subject.

### Employee creation and update

POST and PUT use the employee fields below. PUT requires the full validated employee payload. Use the returned employee `_id` as `{eid}` for later requests.

```json
{
  "first_name": "Alex",
  "last_name": "Taylor",
  "email": "alex.taylor@example.com",
  "position": "Developer",
  "salary": 55000,
  "date_of_joining": "2026-10-01",
  "department": "IT"
}
```

Do not send `user`: ownership is assigned from the authenticated identity. Salary must be a positive JSON number, and the joining date must be a valid calendar date in `YYYY-MM-DD` format. Required fields, lengths, email format, IDs, and unexpected fields are validated. Both models maintain `created_at` and `updated_at` timestamps.

## Ownership and authorization

Employee `user` is a required ObjectId reference to User. Creation derives it from authentication, not client input. Listings filter by the current user. Individual retrieval, update, and deletion verify ownership; accessing another user's employee returns 403. A nonexistent record returns 404. Changing the employee ID does not grant ownership. Ownership is immutable through the employee API.

## Security protections

- Passwords are bcrypt hashes, never plaintext database values, and are omitted from API responses. Password validation requires at least eight characters with uppercase, lowercase, a number, and a symbol, within bcrypt's byte limit.
- JWTs authenticate requests using the private signing secret and an expiration time.
- Helmet sets security headers, including content-type, framing, and content security protections. It complements authentication and validation.
- express-validator checks request data before operations. JSON bodies are limited to 10 KB; malformed JSON returns 400 and oversized bodies return 413.
- Environment variables keep database and signing credentials outside source code.
- Rate limiting restricts repeated requests from one IP. General `/api` traffic allows 100 requests per 15-minute window. Signup and login share a stricter 10-request limit per IP per 15-minute window, including successful attempts. Exceeding a limit returns 429 with a JSON explanation and rate-limit headers. Wait for the window to reset before retrying.
- MongoDB stores shared rate-limit counters in `rate_limits`, allowing counters to be shared between server instances. Expired counters have a TTL index. Local and Vercel environments use separate prefixes.

## Error responses

Errors contain `success: false` and a message; validation errors can include field details. Unexpected errors return a generic message without stack traces or secrets.

| Status | Meaning in this API |
| --- | --- |
| 200 | Successful login, retrieval, update, or health check |
| 201 | User or employee created |
| 204 | Employee deleted; no response body |
| 400 | Invalid input, malformed JSON, or invalid ID |
| 401 | Invalid credentials or missing/invalid/expired JWT |
| 403 | Employee belongs to another user |
| 404 | Missing employee or unsupported route |
| 409 | Duplicate unique user details |
| 413 | JSON body exceeds the size limit |
| 429 | Request rate exceeded |
| 500 | Unexpected application error |
| 503 | API initialization/database connection is unavailable |

## Logging and health

Winston writes timestamped JSON logs to `logs/app.log` locally and to the console. Request logs include method, a safe route label, response status, outcome, duration, and user ID when available. Startup, authentication, validation failures, authorization failures, and server errors are recorded. Passwords, full JWTs, signing secrets, database credentials, and request bodies are excluded. Unrecognized paths use a generic route label to avoid recording arbitrary input.

Local log files are excluded from Git; the evidence report contains logging screenshots. On Vercel, file output uses temporary storage under `/tmp/comp3123-logs`; it is not a durable archive. Console output is available through hosting logs.

`GET /health` returns:

```json
{
  "status": "ok",
  "message": "Employee API is running"
}
```

This confirms that Express can respond; it is not a database readiness check. The root `/` is not a webpage and returns a JSON 404.

## Postman testing

Import `COMP3123_Assignment1.postman_collection.json`. Set collection variable `base_url` to `http://localhost:3000` or the deployed base URL without a trailing slash. Login and creation scripts store tokens and employee IDs. Exported token values are empty; obtain fresh tokens by logging in.

Run requests individually in this order:

1. Register two distinct fictional users, or log in if the existing accounts return 409 on signup.
2. Log in as each user and create one employee for each.
3. Retrieve, list, and update User A's employee using User A's token.
4. Check that each user's list excludes the other user's employee. Try cross-user GET, PUT, and DELETE in both directions; expect 403.
5. Test missing/invalid/expired tokens, malformed JSON, invalid fields and IDs, duplicate users, and nonexistent employees.
6. Delete User A's employee last; expect 204. Recreate an employee before repeating tests that need its ID.
7. Run repeated login attempts to demonstrate 429 last, because the limiter temporarily blocks further authentication.

The testing report records successful CRUD, registration/login, validation failures, JWT failures, two-way ownership rejection, rate limiting, Helmet, MongoDB records, health checks, deployment, and local logging. Earlier local rate-limit screenshots predate the shared-counter implementation; the captions identify historical evidence.

The 500-error test used a temporary local-only `/test-error` route to trigger the centralized error handler. The response and application log are included in the testing report. The temporary route was removed after testing and is not available in the deployed API.

Sample credentials for the two fictional test accounts are provided separately in `Marking_Credentials.txt` with the assignment submission. These are application test accounts, not MongoDB database credentials.
