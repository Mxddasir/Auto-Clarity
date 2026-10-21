# Auto Clarity

OBD fault code diagnosis app: look up codes, run an AI-powered diagnostic interview, and get repair guidance with cost estimates and video links.


## What you need installed

- **Node.js** (v18 or later) — [nodejs.org](https://nodejs.org)
- **npm** (comes with Node.js)
- **PostgreSQL** (v14 or later) — [postgresql.org](https://www.postgresql.org/download/)

## 1. Database setup

### Install and start PostgreSQL

- **macOS (Homebrew):** `brew install postgresql@16` then `brew services start postgresql@16`

- **Windows:** Install from the [PostgreSQL installer](https://www.postgresql.org/download/windows/) and start the service.


### Create the database

Using the default `postgres` user (or a user you created):

```bash
# Open the PostgreSQL shell (psql)
psql -U postgres

# Create the database
CREATE DATABASE auto_clarity;

# Exit
\q
```

If your PostgreSQL user or password is different, note them for the connection string below.

---

## 2. Backend setup

```bash
cd backend
npm install
```


### Run database migrations

From the `backend` folder:

```bash
npx prisma migrate deploy
```

Or to sync and generate the client in development:

```bash
npx prisma generate
npx prisma migrate dev
```

### Start the backend

```bash
npm run dev
```

The API runs at **http://localhost:5001**

---

## 3. Frontend setup

In a **new terminal**:

```bash
cd frontend
npm install
```

### Start the frontend

```bash
npm run dev
```

The app runs at **http://localhost:5173**.

---

## 4. Running the project

1. **Start PostgreSQL** (if not running as a service).
2. **Start the backend** (from `backend`):
   ```bash
   npm run dev
   ```
3. **Start the frontend** (from `frontend`):
   ```bash
   npm run dev
   ```
4. Open **http://localhost:5173** in your browser.

if frontend does not run then ask chatgpt for the command to unistall npm package json cache  and reinstall by using npm i/ npm install
