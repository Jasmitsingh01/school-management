# School Management System

A modern web application built with Next.js for managing school information, including details like school names, addresses, contact information, and images.

## Features

- Add new schools with comprehensive information
- View all registered schools
- Store school details (name, address, city, state, contact, email, image)
- MySQL database integration with connection pooling
- Image upload support
- Responsive design with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Database**: MySQL (Aiven Cloud)
- **Database Driver**: mysql2

## Getting Started

### Prerequisites
- Node.js 18+
- MySQL database
- npm or yarn

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file with database credentials:
   ```env
   DB_HOST=your-mysql-host
   DB_USER=your-username
   DB_PASSWORD=your-password
   DB_PORT=3306
   DB_NAME=your-database-name
   DB_CONNECTION_LIMIT=10
   DB_QUEUE_LIMIT=0
   DB_WAIT_FOR_CONNECTIONS=true
   ```

3. Run development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── addSchool/          # Add new school page
│   ├── showSchools/        # Display schools page
│   ├── api/                # API routes
│   └── layout.tsx          # Root layout
├── lib/
│   └── db.ts              # Database connection
└── types/
    └── index.ts            # TypeScript types
```

## Database Schema

```sql
CREATE TABLE schools (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  contact VARCHAR(15) NOT NULL,
  image TEXT NOT NULL,
  email_id VARCHAR(100) NOT NULL
);
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server

## API Endpoints

- `GET /api/schools` - Retrieve all schools
- `POST /api/schools` - Add a new school
- `POST /api/upload` - Upload school images

---

Built with Next.js and TypeScript
