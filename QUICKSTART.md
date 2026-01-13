# Quick Start Guide - Pharmacy Management System

## 🚀 Get Started in 5 Minutes

### Prerequisites Check
- ✅ Node.js installed (v14+)
- ✅ MongoDB installed and running
- ✅ npm dependencies installed

### Step 1: Configure Environment Variables

**Option A: Use defaults (Development)**
```bash
# Create .env file with development defaults
cp .env.example .env
```

The default `.env.example` is already configured for local development with:
- MongoDB: `mongodb://localhost:27017/pharmacy_management`
- Port: `5000`
- JWT secrets (change in production!)
- VAT rate: 13%

**Note**: Email and SMS will log to console in development mode without credentials.

---

### Step 2: Start MongoDB

**Windows:**
```bash
# If MongoDB is installed as a service
net start MongoDB

# Or run manually
mongod
```

**macOS/Linux:**
```bash
sudo systemctl start mongod
# or
brew services start mongodb-community
```

**Docker:**
```bash
docker run -d -p 27017:27017 --name pharmacy-mongo mongo:latest
```

---

### Step 3: Start the Application

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

You should see:
```
✅ MongoDB Connected: localhost
✅ Email server is ready to send messages (or warning in dev mode)
🚀 Server running in development mode on port 5000
```

---

### Step 4: Test the API

**Health Check:**
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-11T01:00:00.000Z"
}
```

---

### Step 5: Create Your First User

**Register:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@pharmacy.com",
    "mobile": "9841234567",
    "password": "admin123",
    "role": "admin"
  }'
```

**Check Console for:**
- Email verification link (token in console)
- Mobile OTP (6-digit code in console)

**Verify Email:**
```bash
curl "http://localhost:5000/api/auth/verify-email?token=<TOKEN_FROM_CONSOLE>"
```

**Verify Mobile:**
```bash
curl -X POST http://localhost:5000/api/auth/verify-mobile \
  -H "Content-Type: application/json" \
  -d '{
    "mobile": "9841234567",
    "otp": "<OTP_FROM_CONSOLE>"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@pharmacy.com",
    "password": "admin123"
  }'
```

**Save the accessToken** from the response!

---

### Step 6: Test Protected Endpoints

**Create a Medicine:**
```bash
curl -X POST http://localhost:5000/api/medicines \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>" \
  -d '{
    "name": "Paracetamol 500mg",
    "genericName": "Paracetamol",
    "manufacturer": "Nepal Pharmaceuticals",
    "category": "tablet",
    "dosageForm": "Tablet",
    "strength": "500mg",
    "unitPrice": 2.5,
    "minimumStockLevel": 100,
    "prescriptionRequired": false
  }'
```

**View All Medicines:**
```bash
curl http://localhost:5000/api/medicines \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>"
```

---

## 📊 Testing Complete Workflow

### 1. Add Medicine to Inventory
```bash
# Get medicine ID from previous step, then:
curl -X POST http://localhost:5000/api/inventory \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>" \
  -d '{
    "medicine": "<MEDICINE_ID>",
    "batchNumber": "BATCH001",
    "expiryDate": "2025-12-31",
    "quantity": 500,
    "purchasePrice": 1.5,
    "sellingPrice": 2.5
  }'
```

### 2. Create a Sale
```bash
curl -X POST http://localhost:5000/api/sales \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>" \
  -d '{
    "items": [{
      "medicine": "<MEDICINE_ID>",
      "quantity": 10
    }],
    "customerName": "John Doe",
    "customerMobile": "9841234567",
    "paymentMethod": "cash",
    "amountPaid": 100
  }'
```

The system will:
- ✅ Use FIFO to select the batch
- ✅ Calculate 13% VAT automatically
- ✅ Reduce inventory
- ✅ Create audit log
- ✅ Generate invoice number

### 3. View Reports
```bash
# Daily sales
curl "http://localhost:5000/api/reports/daily-sales?date=2024-01-11" \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>"

# Inventory valuation
curl http://localhost:5000/api/reports/inventory-valuation \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>"

# Low stock alerts
curl http://localhost:5000/api/inventory/alerts/low-stock \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>"
```

---

## 🐳 Alternative: Docker Quick Start

**Single Command:**
```bash
docker-compose up -d
```

This starts:
- MongoDB on port 27017
- App on port 5000

**View logs:**
```bash
docker-compose logs -f app
```

**Stop:**
```bash
docker-compose down
```

---

## 🔧 Configuration Notes

### Email Configuration (Optional for Development)
To enable actual email sending, update `.env`:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password  # Generate from Google Account
```

### SMS Configuration (Optional for Development)
To enable actual SMS sending, update `.env`:
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

**Without these, the system will:**
- ✅ Still work in development
- ✅ Log verification tokens/OTPs to console
- ⚠️ Not send actual emails/SMS

---

## 📱 API Testing Tools

### Option 1: cURL (Command Line)
Examples provided above

### Option 2: Postman
1. Import `POSTMAN_COLLECTION.json` (when created)
2. Set environment variable `baseUrl` = `http://localhost:5000`
3. Set environment variable `accessToken` after login

### Option 3: VS Code REST Client
Create a `.http` file:
```http
### Health Check
GET http://localhost:5000/health

### Register
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@example.com",
  "mobile": "9841234567",
  "password": "password123",
  "role": "pharmacist"
}
```

---

## 🎯 What's Next?

1. **Explore the API**: Try all endpoints from README.md
2. **Create Test Data**: Add medicines, suppliers, inventory
3. **Test Business Flows**: Complete purchase → inventory → sale flow
4. **Check Reports**: View sales and inventory reports
5. **Customize**: Modify according to your needs

---

## 🆘 Common Issues

**Port 5000 already in use:**
```bash
# Change PORT in .env
PORT=3000
```

**MongoDB connection error:**
```bash
# Make sure MongoDB is running
mongo --version
# Check connection string in .env
```

**Module not found:**
```bash
# Reinstall dependencies
npm install
```

**Permission denied (uploads folder):**
```bash
# Create uploads directory
mkdir -p uploads/prescriptions
```

---

## 📚 Full Documentation

- **Complete API Reference**: See [README.md](./README.md)
- **Implementation Details**: See walkthrough.md artifact
- **Environment Variables**: See [.env.example](./.env.example)

---

## ✅ Success Checklist

After following this guide, you should have:
- [x] Server running on port 5000
- [x] MongoDB connected
- [x] Test user created and verified
- [x] Successfully logged in and received JWT
- [x] Created at least one medicine
- [x] Added inventory
- [x] Created a test sale
- [x] Viewed reports

**Your pharmacy management system is now ready!** 🎉
