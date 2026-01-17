# Database Structure

PostgreSQL database scripts and schemas for RescueChain platform.

## Directory Structure

### `/migrations`
Database migration scripts to create and modify database schema:
- Version-controlled schema changes
- Table creation and modification scripts
- Index and constraint definitions

### `/seeders`
Database seeding scripts for initial and demo data:
- `victims/` - Sample victim data
- `ngo/` - Sample NGO data
- `ddma/` - Sample DDMA data
- `sdma/` - Sample SDMA data

**Note**: Seeded data and live production data coexist in the same database tables.

### `/schemas`
Database schema definitions:
- ER diagrams
- Schema documentation
- Table relationship diagrams
- SQL DDL scripts for schema creation

## Key Tables

- **Users**: Victims (with OTP) and Organizations (NGO, DDMA, SDMA with credentials)
- **Rescue Operations**: Rescue requests and assignments
- **Payments**: Transaction records with UPI QR references
- **Photos**: Photo uploads for accountability
- **Audit Logs**: Audit trail data before blockchain hashing
- **Blockchain Hashes**: Polygon blockchain transaction hashes for audit records

## pgAdmin 4

Use pgAdmin 4 for database management, query execution, and schema visualization.
