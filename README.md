# RescueChain

A full-stack disaster rescue management system with blockchain audit trail and IPFS-style photo storage.

## Project Structure

```
RescueChain/
├── frontend/              # React + Vite frontend application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API service layer
│   │   ├── utils/        # Utility functions
│   │   ├── hooks/        # Custom React hooks
│   │   └── styles/       # Global styles and themes
│   └── public/           # Static assets
│
├── backend/              # Node.js + Express backend
│   ├── src/
│   │   ├── controllers/  # Request handlers
│   │   ├── models/       # Database models
│   │   ├── routes/       # API route definitions
│   │   ├── middleware/   # Custom middleware
│   │   ├── services/     # Business logic services
│   │   ├── utils/        # Utility functions
│   │   └── config/       # Configuration files
│   ├── migrations/       # Database migrations
│   └── seeds/            # Database seed data
│
├── database/             # PostgreSQL database files
│   ├── schema/           # Database schema definitions
│   └── seeds/            # Seed data scripts
│
└── docs/                 # Project documentation
```

## Features

- **Victim Authentication**: OTP-based authentication for disaster victims
- **Organization Login**: Credential-based authentication for NGOs, DDMA, and SDMA
- **Blockchain Audit**: Polygon blockchain integration for audit hash storage
- **Photo Storage**: IPFS-style abstraction layer for photo storage
- **Demo Mode**: Seeded data and live demo capabilities

## Tech Stack

- **Frontend**: React 18, Vite, TypeScript
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL (managed via pgAdmin 4)
- **Blockchain**: Polygon (for audit hashes)
- **Storage**: IPFS-style abstraction

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- pgAdmin 4
- npm or yarn

### Installation

1. Install frontend dependencies:
```bash
cd frontend
npm install
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Set up PostgreSQL database using pgAdmin 4

4. Configure environment variables (see `.env.example` files)

5. Run database migrations:
```bash
cd backend
npm run migrate
```

6. Seed database:
```bash
cd backend
npm run seed
```

### Running the Application

**Frontend:**
```bash
cd frontend
npm run dev
```

**Backend:**
```bash
cd backend
npm run dev
```

## Environment Variables

See `.env.example` files in frontend and backend directories for required environment variables.



