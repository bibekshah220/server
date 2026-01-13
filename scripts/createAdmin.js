require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const connectDB = require('../src/config/database');

/**
 * Script to create an admin user
 * Usage: node scripts/createAdmin.js
 */

const createAdmin = async () => {
    try {
        // Connect to database
        await connectDB();
        console.log('✅ Connected to MongoDB');

        // Admin user details
        const adminData = {
            name: 'Admin User',
            email: 'admin@pharmacy.com',
            mobile: '9841234567',
            password: 'admin123',
            role: 'admin',
            isMobileVerified: true, // Skip mobile verification
            isActive: true
        };

        // Check if admin already exists
        const existingAdmin = await User.findOne({ 
            $or: [
                { email: adminData.email },
                { mobile: adminData.mobile }
            ]
        });

        if (existingAdmin) {
            // Update existing user to admin
            existingAdmin.role = 'admin';
            existingAdmin.isMobileVerified = true;
            existingAdmin.isActive = true;
            await existingAdmin.save();
            console.log('✅ Updated existing user to admin');
            console.log(`   Email: ${adminData.email}`);
            console.log(`   Password: ${adminData.password}`);
        } else {
            // Create new admin user
            const admin = new User(adminData);
            await admin.save();
            console.log('✅ Admin user created successfully!');
            console.log(`   Email: ${adminData.email}`);
            console.log(`   Password: ${adminData.password}`);
            console.log(`   Mobile: ${adminData.mobile}`);
        }

        console.log('\n📝 Login Credentials:');
        console.log(`   Email: ${adminData.email}`);
        console.log(`   Password: ${adminData.password}`);
        console.log('\n🚀 You can now login at http://localhost:8080/auth');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin:', error);
        process.exit(1);
    }
};

// Run the script
createAdmin();

