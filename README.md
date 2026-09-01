# Rotaract Club Management System

A powerful full-stack platform built to digitize and streamline operations for college Rotaract clubs. It provides a secure, centralized environment for managing members, tracking complex finances, and organizing events with ease.

---

## Features

- Secure Role-Based Access Control (RBAC)
- Two-Factor Authentication (2FA) & JWT-based auth
- Real-time expense submission & approval workflow
- Automated financial reporting & analytics
- Event & Board management modules
- Year-wise archival system for records
- Dynamic CMS (update logos, content & sections)
- Advanced filtering with pagination
- Production-ready security protocols
- Fully responsive admin dashboard

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js |
| Backend | Node.js, Express.js |
| Database | MongoDB |
| Security | JWT, 2FA |
| API | RESTful API Architecture |
| Deployment | Vercel |

## Project Structure

RCCLUB/
├── backend/ # Express.js API, models, routes, auth logic
├── frontend/ # React.js client application
├── deployment/ # Deployment configs
├── render.yaml # Render deployment config
└── package.json


## Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. Clone the repository
```bash
   git clone https://github.com/senthilnathan-2004/RCCLUB.git
   cd RCCLUB
```

2. Install backend dependencies
```bash
   cd backend
   npm install
```

3. Install frontend dependencies
```bash
   cd ../frontend
   npm install
```

4. Set up environment variables

   Create a `.env` file inside `backend/` with values like:
```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
```

5. Run the backend
```bash
   cd backend
   npm run dev
```

6. Run the frontend
```bash
   cd frontend
   npm start
```

7. Open http://localhost:3000 in your browser


## Best For

- Rotaract & NGO management
- College club administration
- Organization resource planning (ERP)
- Financial & membership tracking
- Secure member-based portals

## Contributing

Contributions, issues, and feature requests are welcome. Feel free to open an issue or submit a pull request.

## Author

Senthilnathan
GitHub: https://github.com/senthilnathan-2004



