# Complete Docker Setup Guide
# Postgres + Axum + React Stack

## 📋 Prerequisites

1. **Install Docker Desktop for Windows**
   - Download from: https://www.docker.com/products/docker-desktop
   - Install and restart your computer
   - Make sure Docker Desktop is running (check system tray)

2. **Install Git** (optional but recommended)
   - Download from: https://git-scm.com/download/win

3. **Install a Code Editor**
   - VS Code: https://code.visualstudio.com/
   - Or use your preferred editor

---

## 🏗️ Project Structure

Create this folder structure:

```
my-app/
├── docker-compose.yml
├── init.sql
├── backend/
│   ├── Dockerfile
│   ├── Cargo.toml
│   └── src/
│       └── main.rs
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── public/
    │   └── index.html
    └── src/
        ├── App.js
        ├── App.css
        └── index.js
```

---

## 📦 Step-by-Step Setup

### Step 1: Create Project Folder

Open PowerShell or Command Prompt:

```powershell
# Create project directory
mkdir my-app
cd my-app

# Create subdirectories
mkdir backend
mkdir backend\src
mkdir frontend
mkdir frontend\src
mkdir frontend\public
```

### Step 2: Copy Files

Copy the provided files to their locations:

1. **docker-compose.yml** → Root folder (`my-app/`)
2. **init.sql** → Root folder (`my-app/`)
3. **backend_Dockerfile** → Rename to `Dockerfile` and place in `backend/`
4. **backend_Cargo.toml** → Rename to `Cargo.toml` and place in `backend/`
5. **backend_main.rs** → Rename to `main.rs` and place in `backend/src/`
6. **frontend_Dockerfile** → Rename to `Dockerfile` and place in `frontend/`
7. **frontend_App.js** → Rename to `App.js` and place in `frontend/src/`
8. **frontend_App.css** → Rename to `App.css` and place in `frontend/src/`

### Step 3: Create React Package.json

Create `frontend/package.json`:

```json
{
  "name": "frontend",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
```

### Step 4: Create React Index Files

Create `frontend/src/index.js`:

```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import './App.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

Create `frontend/public/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="Axum + React + Postgres App" />
    <title>Full Stack App</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
```

---

## 🚀 Running the Application

### Start Everything (One Command!)

Open PowerShell in your project folder (`my-app/`) and run:

```powershell
docker-compose up
```

**First time:** This will take 5-15 minutes to download images and build everything.

**What happens:**
1. ✅ Postgres starts on port 5432
2. ✅ Creates database and tables from `init.sql`
3. ✅ Axum backend builds and starts on port 8000
4. ✅ React frontend starts on port 3000

### Access Your Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **Postgres:** localhost:5432

### Useful Commands

```powershell
# Start in background (detached mode)
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop everything
docker-compose down

# Stop and remove volumes (fresh start)
docker-compose down -v

# Rebuild after code changes
docker-compose up --build

# Restart a specific service
docker-compose restart backend
```

---

## 🔧 Making Changes

### Backend Changes (Axum/Rust)

1. Edit `backend/src/main.rs`
2. Rebuild:
   ```powershell
   docker-compose up --build backend
   ```

### Frontend Changes (React)

React changes are live-reloaded! Just save your file and see changes instantly.

If changes don't appear:
```powershell
docker-compose restart frontend
```

### Database Changes

Edit `init.sql` and restart:
```powershell
docker-compose down -v  # Remove old data
docker-compose up
```

---

## 🎯 Testing the API

### Using PowerShell

```powershell
# Get all users
Invoke-WebRequest -Uri http://localhost:8000/api/users | Select-Object -Expand Content

# Create a user
$body = @{
    name = "Test User"
    email = "test@example.com"
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:8000/api/users -Method POST -Body $body -ContentType "application/json"
```

### Using Browser

Visit: http://localhost:8000/api/users

### Using Postman or Insomnia

- **GET** http://localhost:8000/api/users
- **POST** http://localhost:8000/api/users
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com"
  }
  ```

---

## 🔍 Troubleshooting

### Port Already in Use

**Error:** "Port 3000/8000/5432 is already allocated"

**Solution:**
```powershell
# Find what's using the port
netstat -ano | findstr :3000

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F

# Or change ports in docker-compose.yml
ports:
  - "3001:3000"  # Use 3001 instead of 3000
```

### Docker Not Starting

- Make sure Docker Desktop is running
- Restart Docker Desktop
- Check for Windows updates

### Build Fails

```powershell
# Clean everything and rebuild
docker-compose down -v
docker system prune -a
docker-compose up --build
```

### Can't Connect to Database

Check if Postgres is ready:
```powershell
docker-compose logs postgres
```

Wait for: `database system is ready to accept connections`

### React Not Loading

Check browser console for errors (F12)
Make sure API URL is correct in App.js

---

## 🎨 Customization

### Change Database Credentials

Edit `docker-compose.yml`:
```yaml
environment:
  POSTGRES_USER: myuser
  POSTGRES_PASSWORD: mypassword
  POSTGRES_DB: mydb
```

Also update in backend environment:
```yaml
DATABASE_URL: postgres://myuser:mypassword@postgres:5432/mydb
```

### Add More API Routes

Edit `backend/src/main.rs`:
```rust
.route("/api/posts", get(get_posts).post(create_post))
```

### Change Frontend Port

Edit `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Access on localhost:3001
```

---

## 🌟 Production Deployment

For production, use the production Dockerfile:

1. Rename `frontend_Dockerfile_prod` to `Dockerfile.prod`
2. Update `docker-compose.yml`:
   ```yaml
   frontend:
     build:
       context: ./frontend
       dockerfile: Dockerfile.prod
     ports:
       - "80:80"
   ```

---

## 📚 Additional Resources

- **Axum Documentation:** https://docs.rs/axum/
- **React Documentation:** https://react.dev/
- **Docker Documentation:** https://docs.docker.com/
- **PostgreSQL Documentation:** https://www.postgresql.org/docs/

---

## ✅ Quick Start Checklist

- [ ] Docker Desktop installed and running
- [ ] Project folder structure created
- [ ] All files copied to correct locations
- [ ] `docker-compose.yml` in root folder
- [ ] Run `docker-compose up`
- [ ] Wait for builds to complete
- [ ] Visit http://localhost:3000
- [ ] See your app running!

---

## 🎉 Success!

If you see the React app with users listed, congratulations! You now have:
- ✅ Postgres database running
- ✅ Axum backend API
- ✅ React frontend
- ✅ All services auto-starting with one command

**To stop:** Press `Ctrl+C` or run `docker-compose down`

**To start again:** Just run `docker-compose up`

Everything starts automatically every time! 🚀
