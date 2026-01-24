# Where to Find Connection Strings in Supabase

## You're Looking at the Wrong Section!

You're currently on **"Connection pooling configuration"** (the settings page), but the **connection strings** are in a different place.

## How to Find Connection Strings:

### Option 1: Database Settings → Connection Info

1. In Supabase Dashboard, you're at: **Database → Settings**
2. Look for a section called:
   - **"Connection string"** OR
   - **"Connection info"** OR
   - **"Connection parameters"**
3. It should be near the top of the page, possibly in a different tab

### Option 2: Project Settings → Database

1. Go to: **Settings** (gear icon in left sidebar) → **Database**
2. Scroll down to find **"Connection string"** section
3. You should see multiple connection string options:
   - **URI** (this is what you need)
   - **JDBC**
   - **Connection pooling** (this has the pooler strings)

### Option 3: Look for Tabs

On the Database Settings page, there might be tabs like:
- **General**
- **Connection string** ← Look for this tab
- **Connection pooling**

### What You're Looking For:

You should see something like:

**Connection string:**
- **URI** (direct): `postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres`
- **Connection pooling** → **Session mode**: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`

---

## Quick Navigation:

1. **Left sidebar** → Click **"Settings"** (gear icon)
2. Then click **"Database"** in the settings menu
3. Scroll down to **"Connection string"** section
4. Look for **"Connection pooling"** subsection
5. Copy the **"Session mode"** connection string

---

## If You Still Can't Find It:

Try this:
1. Go to: **Settings** → **Database**
2. Look for any section that shows:
   - Host
   - Port
   - Database name
   - User
   - Password
3. Or look for a **"Copy connection string"** button

The connection strings are definitely there - they might just be in a different section or tab than where you're currently looking!




