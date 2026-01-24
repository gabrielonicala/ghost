# Setting Up Local PostgreSQL Database

## Option 1: Install PostgreSQL (Recommended)

### Windows Installation Steps:

1. **Download PostgreSQL:**
   - Go to https://www.postgresql.org/download/windows/
   - Download the installer from EnterpriseDB
   - Or use the direct link: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads

2. **Install PostgreSQL:**
   - Run the installer
   - Choose installation directory (default is fine)
   - **Remember the password you set for the `postgres` superuser!**
   - Port: 5432 (default)
   - Locale: Default (or your preference)

3. **Verify Installation:**
   - Open Command Prompt or PowerShell
   - Run: `psql --version`
   - Should show version number

4. **Create Database:**
   ```powershell
   # Connect to PostgreSQL
   psql -U postgres
   
   # Then in psql prompt, run:
   CREATE DATABASE creator_intelligence;
   \q
   ```

5. **Update .env file:**
   ```
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/creator_intelligence"
   ```
   Replace `YOUR_PASSWORD` with the password you set during installation.

---

## Option 2: Use Docker (If you have Docker Desktop)

If you have Docker Desktop installed:

```powershell
docker run --name creator-intelligence-db -e POSTGRES_PASSWORD=yourpassword -e POSTGRES_DB=creator_intelligence -p 5432:5432 -d postgres:16
```

Then update .env:
```
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/creator_intelligence"
```

---

## Option 3: Use Cloud Database (Easiest - No Installation)

If local setup is too complex, you can use:
- **Neon** (free): https://neon.tech - Just sign up and get connection string
- **Supabase** (free): https://supabase.com - Free PostgreSQL database

---

## After Setup

Once you have your DATABASE_URL configured:

1. Run migrations:
   ```bash
   npm run db:migrate
   ```

2. Generate Prisma client:
   ```bash
   npm run db:generate
   ```

3. Start the app:
   ```bash
   npm run dev
   ```




