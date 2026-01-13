# Pharmacy Management System - Backend API

A production-ready, Nepal-compliant Pharmacy Management System built with Node.js, Express, and MongoDB.

## Features

✅ **Authentication & Authorization**
- JWT-based authentication (access + refresh tokens)
- Role-Based Access Control (RBAC) - Admin, Manager, Pharmacist, Cashier
- Email verification
- Mobile OTP verification
- Password encryption with bcrypt

✅ **Inventory Management**
- Batch tracking with expiry dates
- FIFO (First In, First Out) stock management
- Low stock alerts
- Expired medicine tracking
- Stock adjustments with audit logs

✅ **Billing & Sales**
- Invoice generation with 13% VAT (Nepal compliant)
- Barcode-based medicine search
- Discount and promotion handling
- Multi-payment support (Cash, Card, Mobile Payment, Credit)
- Refund processing

✅ **Prescription Management**
- PDF/image prescription upload
- Prescription validation
- Doctor registration number tracking
- Dispensing history

✅ **Supplier & Purchase Management**
- Supplier CRUD operations
- Purchase order creation
- Stock receiving with inventory update
- Damaged/expired stock handling

✅ **Reports & Analytics**
- Daily/monthly sales reports
- Inventory valuation
- Expired stock reports
- Profit & loss summary
- User activity audit logs

✅ **Security Features**
- Input validation with express-validator
- Rate limiting
- Centralized error handling
- Comprehensive audit logging
- Winston logging with file rotation

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Email**: Nodemailer
- **SMS**: Twilio
- **File Upload**: Multer
- **Validation**: express-validator
- **Logging**: Winston + Morgan

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd Pharmacy
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Server
NODE_ENV=development
PORT=5000
BASE_URL=http://localhost:5000

# Database
MONGO_URI=mongodb://localhost:27017/pharmacy_management

# JWT
JWT_ACCESS_SECRET=your-super-secret-access-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# VAT (Nepal)
VAT_RATE=13

# Email (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=Pharmacy System <noreply@pharmacy.com>

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# OTP
OTP_EXPIRY_MINUTES=10
OTP_LENGTH=6
```

### 4. Start MongoDB
Ensure MongoDB is running:
```bash
# Using MongoDB service
sudo systemctl start mongod

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 5. Run the application

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:5000`

## Project Structure

```
Pharmacy/
├── src/
│   ├── config/           # Configuration files (database, jwt, email, sms)
│   ├── controllers/      # Request handlers
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API routes
│   ├── middlewares/     # Custom middleware (auth, rbac, error handling)
│   ├── services/        # Business logic (email, sms, inventory, invoice)
│   ├── validators/      # Input validation rules
│   ├── utils/           # Utility functions (logger, email templates, tokens)
│   ├── logs/            # Log files (auto-generated)
│   └── app.js           # Express app setup
├── uploads/             # Uploaded files (prescriptions)
├── server.js            # Entry point
├── package.json
├── .env.example
├── .gitignore
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `GET /api/auth/verify-email?token=xxx` - Verify email
- `POST /api/auth/verify-mobile` - Verify mobile OTP
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/resend-otp` - Resend OTP

### Users (Admin Only)
- `GET /api/users` - Get all users
- `GET /api/users/me` - Get current user profile
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Medicines
- `GET /api/medicines` - Get all medicines
- `GET /api/medicines/:id` - Get medicine by ID
- `GET /api/medicines/barcode/:barcode` - Search by barcode
- `POST /api/medicines` - Create medicine (Pharmacist+)
- `PUT /api/medicines/:id` - Update medicine (Pharmacist+)
- `DELETE /api/medicines/:id` - Delete medicine (Admin)

### Inventory
- `GET /api/inventory` - Get all inventory
- `GET /api/inventory/:id` - Get inventory item
- `GET /api/inventory/alerts/expired` - Get expired medicines
- `GET /api/inventory/alerts/nearing-expiry` - Get medicines nearing expiry
- `GET /api/inventory/alerts/low-stock` - Get low stock medicines
- `POST /api/inventory` - Add inventory (Pharmacist+)
- `PUT /api/inventory/:id` - Update inventory (Pharmacist+)
- `POST /api/inventory/:id/adjust` - Stock adjustment (Pharmacist+)

### Prescriptions
- `GET /api/prescriptions` - Get all prescriptions
- `GET /api/prescriptions/:id` - Get prescription by ID
- `GET /api/prescriptions/:id/validate` - Validate prescription
- `POST /api/prescriptions` - Upload prescription (with file)
- `PUT /api/prescriptions/:id/dispense` - Mark as dispensed (Pharmacist)

### Sales
- `GET /api/sales` - Get all sales
- `GET /api/sales/:id` - Get sale by ID
- `GET /api/sales/reports/date-range` - Sales by date range
- `POST /api/sales` - Create sale (Cashier+)
- `POST /api/sales/:id/refund` - Process refund (Manager+)

### Suppliers
- `GET /api/suppliers` - Get all suppliers
- `GET /api/suppliers/:id` - Get supplier by ID
- `POST /api/suppliers` - Create supplier (Manager+)
- `PUT /api/suppliers/:id` - Update supplier (Manager+)
- `DELETE /api/suppliers/:id` - Delete supplier (Admin)

### Purchase Orders
- `GET /api/purchases` - Get all purchase orders
- `GET /api/purchases/:id` - Get purchase order by ID
- `POST /api/purchases` - Create purchase order (Manager+)
- `POST /api/purchases/:id/receive` - Receive purchase order (Pharmacist+)
- `PUT /api/purchases/:id/cancel` - Cancel purchase order (Manager+)

### Reports (Manager/Admin Only)
- `GET /api/reports/daily-sales` - Daily sales report
- `GET /api/reports/monthly-sales` - Monthly sales report
- `GET /api/reports/inventory-valuation` - Inventory valuation
- `GET /api/reports/expired-stock` - Expired stock report
- `GET /api/reports/profit-loss` - Profit & loss summary
- `GET /api/reports/audit-logs` - Audit logs (Admin only)

## User Roles & Permissions

| Role | Permissions |
|------|------------|
| **Admin** | Full system access - all operations |
| **Manager** | Sales, inventory, suppliers, purchase orders, reports |
| **Pharmacist** | Sales, inventory, prescriptions, medicine management |
| **Cashier** | Sales, view inventory, view medicines |

## Email Configuration

### Gmail Setup
1. Enable 2-Factor Authentication
2. Generate an App Password
3. Use the app password in `.env` as `EMAIL_PASSWORD`

### Other SMTP Providers
- **SendGrid**: Set `EMAIL_HOST=smtp.sendgrid.net`, port 587
- **Mailgun**: Set `EMAIL_HOST=smtp.mailgun.org`, port 587

## SMS Configuration (Twilio)

1. Sign up at [Twilio](https://www.twilio.com/)
2. Get Account SID and Auth Token
3. Purchase a phone number
4. Add credentials to `.env`

**Note**: In development mode without Twilio credentials, OTPs are logged to console.

## Testing with Postman

Import `POSTMAN_COLLECTION.json` into Postman for pre-configured API requests.

### Typical Test Flow:
1. **Register** a user
2. **Verify email** using link from email
3. **Verify mobile** using OTP from SMS/console
4. **Login** to get access token
5. Use token in Authorization header: `Bearer <token>`
6. Test other endpoints based on user role

## Docker Deployment

### Build and run with Docker Compose:
```bash
docker-compose up -d
```

This will start:
- Node.js application on port 5000
- MongoDB on port 27017

### Build Docker image manually:
```bash
docker build -t pharmacy-backend .
docker run -p 5000:5000 --env-file .env pharmacy-backend
```

## Production Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong JWT secrets
- [ ] Configure production MongoDB (MongoDB Atlas recommended)
- [ ] Set up SSL/TLS certificates
- [ ] Configure proper CORS origins
- [ ] Set up email service (SendGrid, AWS SES)
- [ ] Set up SMS service (Twilio, or Nepal-based provider)
- [ ] Configure reverse proxy (Nginx)
- [ ] Set up monitoring and logging
- [ ] Regular database backups
- [ ] Rate limiting configuration
- [ ] Security headers (Helmet.js)

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check `MONGO_URI` in `.env`
- Verify network connectivity

### Email Not Sending
- Check SMTP credentials
- Verify email service is not blocking
- Check logs in `src/logs/error.log`

### OTP Not Received
- Check Twilio credentials
- Verify phone number format
- Check console logs in development mode

## License

ISC

## Support

For issues and questions, please create an issue in the repository.
