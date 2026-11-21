

# 🌾 AgriHire – Agricultural Equipment Rental Platform

AgriHire is a web-based agricultural equipment rental platform designed to connect farmers with equipment owners. It allows farmers to find and rent agricultural machinery, while equipment owners can list their equipment and manage booking requests.

The main goal of AgriHire is to make agricultural equipment more accessible to farmers without requiring them to purchase expensive machinery.

## 🚀 Features

### 👨‍🌾 For Farmers
- Create an account and log in.
- Browse available agricultural equipment.
- Search and filter equipment by category and location.
- View equipment details and rental prices.
- Book equipment for different rental durations.
- View booking history and booking status.
- Post equipment requirements.

### 🚜 For Equipment Owners
- Register as an equipment owner.
- List agricultural equipment for rent.
- Add equipment details, images and rental prices.
- Manage incoming booking requests.
- Approve or reject booking requests.
- View listed equipment.

### 🔐 Authentication
- User registration and login.
- Password hashing using bcrypt.
- Session-based authentication.
- Role-based access for farmers and equipment owners.

### 📊 Admin Dashboard
- View platform statistics.
- Monitor equipment listings and bookings.
- View booking statuses and revenue information.
- Monitor registered users.

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| HTML5 | Website structure |
| CSS3 | Styling and responsive design |
| JavaScript | Frontend functionality |
| Node.js | Backend runtime |
| Express.js | Backend framework and API routes |
| MongoDB Atlas | Database |
| Mongoose | MongoDB object modeling |
| bcryptjs | Password hashing |
| express-session | Session management |
| Multer | Image uploads |

## 📁 Project Structure

```text
AgriHire/
│
├── client/
│   ├── index.html
│   ├── pages/
│   ├── css/
│   ├── js/
│   ├── assets/
│   └── images/
│
├── config/
│   └── db.js
│
├── models/
│   ├── User.js
│   ├── Equipment.js
│   ├── Booking.js
│   ├── Requirement.js
│   └── RequirementResponse.js
│
├── routes/
│   └── equipmentRoutes.js
│
├── server.js
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

## ⚙️ Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/harshitjaincodes/AgriHire.git
```

### 2. Open the project

```bash
cd AgriHire
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create a `.env` file in the project root directory.

```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
SESSION_SECRET=your_session_secret
```

Replace the placeholder values with your own credentials.

### 5. Start the server

```bash
node server.js
```

### 6. Open the application

Visit:

```text
http://localhost:3000
```

## 🔗 API Endpoints

Some of the main backend API endpoints include:

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/signup` | Register a new user |
| POST | `/api/login` | User login |
| GET | `/api/equipment` | Fetch available equipment |
| POST | `/api/bookings` | Create a booking request |
| GET | `/api/bookings/mine` | View farmer bookings |
| GET | `/api/bookings/owner` | View owner bookings |
| PATCH | `/api/bookings/:id/status` | Update booking status |

## 🗄️ Database

AgriHire uses MongoDB Atlas to store application data.

The main collections include:

- **users** – Stores user registration and account details.
- **equipment** – Stores agricultural equipment listings.
- **bookings** – Stores equipment booking requests and their status.
- **requirements** – Stores equipment requirements posted by farmers.
- **requirementresponses** – Stores owner responses to farmer requirements.

## 🔄 How It Works

1. Users register or log in to the platform.
2. Farmers browse available agricultural equipment.
3. Farmers select equipment and submit a booking request.
4. The frontend sends data to the backend through API requests.
5. Express.js processes the request and Mongoose communicates with MongoDB.
6. The equipment owner receives the booking request.
7. The owner can approve or reject the request.

## 🎯 Project Objective

AgriHire aims to provide a simple digital platform that helps farmers access agricultural machinery through rentals and allows equipment owners to make their machinery available to other farmers.

---

**Developed as a Web Development academic project at BML Munjal University.**
