# High School Management System

This repository contains a comprehensive project structure for a High School Management System.

## Project Structure
```
zmi-system/
├── backend/
│   ├── config/
│   │   ├── env.example
│   │   ├── db.config.js
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middlewares/
│   ├── services/
│   ├── utils/
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── styles/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
├── database/
│   ├── schema.sql
│   └── README.md
└── README.md
```

## 1. Backend `package.json`
```json
{
  "name": "backend",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.17.1",
    "jsonwebtoken": "^8.5.1",
    "supabase": "^1.0.0",
    "pg": "^8.7.1",
    "cors": "^2.8.5",
    "dotenv": "^10.0.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.7"
  }
}
```

## 2. Frontend `package.json`
```json
{
  "name": "frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "serve": "vite preview"
  },
  "dependencies": {
    "react": "^17.0.2",
    "react-dom": "^17.0.2",
    "react-router-dom": "^5.3.0",
    "tailwindcss": "^2.2.19",
    "typescript": "^4.4.3"
  },
  "devDependencies": {
    "vite": "^2.6.5"
  }
}
```

## 3. Database Schema (`database/schema.sql`)
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    grade_level INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE teachers (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 4. Environment Configuration Files
- **Backend**: 
  - `backend/config/env.example`
    ```
    PORT=3000
    DATABASE_URL=your_supabase_database_url
    JWT_SECRET=your_jwt_secret
    ```

## 5. Setup Instructions
- **Frontend**:
  1. Navigate to the `frontend` folder.
  2. Run `npm install` to install dependencies.
  3. Start the development server with `npm run dev`.

- **Backend**:
  1. Navigate to the `backend` folder.
  2. Create a `.env` file from `env.example` and fill it with your database and JWT secret configurations.
  3. Run `npm install` to install dependencies.
  4. Start the server using `npm run dev`.

## Documentation
- This README.md in the root will contain overall project documentation and configuration details.
