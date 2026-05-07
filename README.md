# 🎓 Smart Campus — Faculty Room Allocation System

A full-stack web application that allows faculty to schedule lectures and automatically allocate classrooms based on capacity and time slots — with conflict detection to prevent double-booking.

---

## 📸 Features

- 🔐 **JWT Authentication** — Secure register & login with hashed passwords
- 📅 **Lecture Scheduling** — Add lecture requests with name, class, student count, time, and duration
- ⚡ **Smart Room Allocation** — Auto-assigns the smallest suitable room, respecting time conflicts
- 🏫 **Room Management** — View all available rooms and their capacities
- 📋 **Request Management** — View, filter, sort, and delete lecture requests
- 📊 **Allocation Results** — Table view with success/failure status per lecture
- 🌙 **Dark UI** — Clean, modern dark-themed dashboard

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js |
| Backend | Node.js, Express.js |
| Database | MySQL |
| Auth | JWT + bcryptjs |
| Styling | Inline CSS (no external library) |

---

## 📁 Project Structure

```
smart-campus/
├── src/
│   └── App.jsx          # React frontend
├── server.js            # Express backend
├── schema.sql           # MySQL database schema
├── .gitignore
└── README.md
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js (v16+)
- MySQL (v8+)
- npm

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/smart_campus.git
cd smart_campus
```

### 2. Set up the database
Open **MySQL Workbench**, paste and run the contents of `schema.sql`. This will:
- Create the `smart_campus` database
- Create `users`, `rooms`, and `lecture_requests` tables
- Seed 5 default rooms

### 3. Install backend dependencies
```bash
npm install express mysql2 cors bcryptjs jsonwebtoken
```

### 4. Configure environment (optional)
Create a `.env` file in the root folder:
```env
DB_HOST=localhost
DB_USER=root
DB_PASS=your_mysql_password
DB_NAME=smart_campus
JWT_SECRET=your_secret_key
```
If you skip this, the app uses the default values in `server.js`.

### 5. Start the backend server
```bash
node server.js
```
You should see:
```
✅  Server running on http://localhost:5000
✅  MySQL connected
```

### 6. Install frontend dependencies & start React app
```bash
npm install
npm start
```

The app will open at **http://localhost:5173**

---

## 🔌 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | ❌ | Register a new user |
| POST | `/login` | ❌ | Login and get JWT token |
| GET | `/rooms` | ✅ | Get all available rooms |
| GET | `/requests` | ✅ | Get all lecture requests |
| POST | `/requests` | ✅ | Add a new lecture request |
| DELETE | `/requests/:id` | ✅ | Delete a lecture request |
| GET | `/allocate` | ✅ | Run room allocation algorithm |
| GET | `/health` | ❌ | Server health check |

---

## 🧠 Room Allocation Algorithm

1. All requests are sorted by lecture time
2. For each request, the algorithm finds the **smallest room** with:
   - Capacity ≥ number of students
   - No time conflict with already-allocated lectures (using duration)
3. If no room is available → marked as **unallocated**

This ensures optimal room usage and prevents double-booking.

---

## 🗄️ Database Schema

```sql
users              → id, username, password (hashed), created_at
rooms              → room_id, room_name, capacity
lecture_requests   → request_id, lecture_name, class_name,
                     students, lecture_time, duration,
                     created_by, created_at

---

## 🚀 Deployment Notes

- Move JWT secret to an environment variable before deploying
- Use a production MySQL instance (e.g. PlanetScale, Railway, AWS RDS)
- Host the backend on Railway, Render, or any Node.js host
- Host the frontend on Vercel or Netlify

---
## 📸 Screenshots

### Login Page
![Login](assets/login.png)

### Dashboard
![Dashboard](assets/dashboard.png)

### Lecture Requests
![Requests](assets/requests.png)

### Allocation Results
![Results](assets/results.png)

## 👨‍💻 Author

**Varun** — Built as part of a Smart Campus Hackathon project

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
