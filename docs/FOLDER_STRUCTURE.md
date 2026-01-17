# RescueChain Folder Structure

Complete folder structure overview for the RescueChain project.

```
RescueChain-7/
├── frontend/                    # React + Vite frontend application
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── auth/           # Authentication components
│   │   │   ├── victims/        # Victim-specific components
│   │   │   ├── ngo/            # NGO components
│   │   │   ├── ddma/           # DDMA components
│   │   │   ├── sdma/           # SDMA components
│   │   │   ├── payments/       # Payment/UPI QR components
│   │   │   ├── rescue/         # Rescue operation components
│   │   │   └── common/         # Shared components
│   │   ├── pages/              # Page-level components
│   │   │   ├── victim/         # Victim portal pages
│   │   │   ├── ngo/            # NGO portal pages
│   │   │   ├── ddma/           # DDMA portal pages
│   │   │   ├── sdma/           # SDMA portal pages
│   │   │   └── auth/           # Authentication pages
│   │   ├── services/           # API and business logic services
│   │   │   ├── api/            # REST API client
│   │   │   └── auth/           # Authentication service
│   │   ├── utils/              # Utility functions
│   │   │   └── validation/     # Form validation utilities
│   │   ├── hooks/              # Custom React hooks
│   │   ├── context/            # React Context providers
│   │   └── assets/             # Static assets
│   │       ├── images/         # Image files
│   │       └── styles/         # CSS and styling
│   ├── public/                 # Public static assets
│   └── README.md               # Frontend documentation
│
├── backend/                    # Node.js + Express backend API
│   ├── src/
│   │   ├── controllers/        # Request handlers
│   │   │   ├── auth/          # Authentication controllers
│   │   │   ├── victims/       # Victim management controllers
│   │   │   ├── ngo/           # NGO controllers
│   │   │   ├── ddma/          # DDMA controllers
│   │   │   ├── sdma/          # SDMA controllers
│   │   │   ├── payments/      # Payment controllers
│   │   │   ├── rescue/        # Rescue operation controllers
│   │   │   └── audit/         # Audit/blockchain controllers
│   │   ├── models/            # Database models
│   │   ├── routes/            # API route definitions
│   │   │   └── api/           # Versioned API routes
│   │   ├── middleware/        # Express middleware
│   │   │   ├── auth/          # Authentication middleware
│   │   │   ├── validation/    # Validation middleware
│   │   │   └── upload/        # File upload middleware
│   │   ├── services/          # Business logic services
│   │   │   ├── auth/          # Authentication service
│   │   │   ├── otp/           # OTP generation (Demo OTP for victims)
│   │   │   ├── payment/       # Payment processing
│   │   │   ├── photo/         # Photo upload service
│   │   │   └── polygon/       # Polygon blockchain integration
│   │   ├── utils/             # Utility functions
│   │   ├── config/            # Configuration files
│   │   ├── migrations/        # Database migrations
│   │   └── seeders/           # Database seeders
│   └── README.md              # Backend documentation
│
├── database/                   # PostgreSQL database scripts
│   ├── migrations/            # Schema migration scripts
│   ├── seeders/              # Database seeding scripts
│   │   ├── victims/          # Victim seed data
│   │   ├── ngo/              # NGO seed data
│   │   ├── ddma/             # DDMA seed data
│   │   └── sdma/             # SDMA seed data
│   ├── schemas/              # Database schema definitions
│   └── README.md             # Database documentation
│
├── docs/                      # Project documentation
│   └── FOLDER_STRUCTURE.md   # This file
│
├── scripts/                   # Utility scripts (deployment, setup, etc.)
├── README.md                  # Main project README
└── .gitignore                # Git ignore rules
```

## Key Architecture Points

1. **Authentication**:
   - Victims use Demo OTP (handled in `frontend/src/services/auth` and `backend/src/services/otp`)
   - NGO/DDMA/SDMA use credential-based login (handled in `backend/src/services/auth`)

2. **Payments**:
   - Single common UPI QR (managed in `backend/src/controllers/payments` and `frontend/src/components/payments`)

3. **Accountability**:
   - Photo-backed verification (handled in `backend/src/services/photo` and `backend/src/middleware/upload`)

4. **Blockchain**:
   - Polygon used only for audit hashes (handled in `backend/src/services/polygon` and `backend/src/controllers/audit`)

5. **Data Management**:
   - Seeded data and live data coexist (seeders in `database/seeders/` and `backend/src/seeders/`)
