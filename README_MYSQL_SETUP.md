# MySQL Database Setup Guide

## Prerequisites

- MySQL 8.0 or higher installed
- Node.js 18+ installed
- Access to MySQL root user or user with CREATE DATABASE privileges

## Step 1: Create Database

```bash
mysql -u root -p
```

```sql
CREATE DATABASE service_marketplace CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'marketplace_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON service_marketplace.* TO 'marketplace_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## Step 2: Run Database Schema

```bash
mysql -u marketplace_user -p service_marketplace < scripts/setup-database.sql
```

## Step 3: Configure Environment Variables

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Edit `.env`:
```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=marketplace_user
MYSQL_PASSWORD=your_secure_password
MYSQL_DATABASE=service_marketplace

JWT_SECRET=your-secret-key-min-32-characters-change-in-production
```

## Step 4: Install Dependencies

```bash
npm install
```

## Step 5: Test Database Connection

Create a test script `scripts/test-connection.js`:

```javascript
const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'marketplace_user',
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE || 'service_marketplace',
    });

    console.log('✅ Database connection successful!');

    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM tenants');
    console.log(`✅ Tenants table accessible. Count: ${rows[0].count}`);

    await connection.end();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

testConnection();
```

Run test:
```bash
node scripts/test-connection.js
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Services
- `GET /api/services` - List services
- `GET /api/services/:id` - Get service details
- `POST /api/services` - Create service (provider only)
- `PUT /api/services/:id` - Update service (provider only)

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - List user bookings
- `GET /api/bookings/:id` - Get booking details
- `PUT /api/bookings/:id/status` - Update booking status

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark as read

## Multi-Tenancy

The system uses subdomain-based multi-tenancy. Each tenant has:
- Unique subdomain (e.g., `demo.example.com`)
- Isolated data through `tenant_id`
- Custom branding and settings

## Security Features

1. **JWT Authentication**: HTTP-only cookies with 7-day expiration
2. **Password Hashing**: bcrypt with salt rounds
3. **Role-Based Access Control (RBAC)**: customer, provider, admin, super_admin
4. **Tenant Isolation**: All queries filtered by tenant_id
5. **Audit Logging**: All sensitive operations logged
6. **SQL Injection Protection**: Parameterized queries

## Development

```bash
npm run dev
```

## Production

```bash
npm run build
npm start
```

## Troubleshooting

### Connection Refused
- Check MySQL is running: `sudo systemctl status mysql`
- Verify credentials in `.env`
- Check firewall rules

### Authentication Errors
- Verify JWT_SECRET is set in `.env`
- Check cookie settings in browser
- Clear browser cookies

### Tenant Not Found
- Verify tenant exists in database
- Check subdomain configuration
- Add `x-tenant-subdomain` header for API testing
