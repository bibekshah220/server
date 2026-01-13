/**
 * Email verification template
 */
const emailVerificationTemplate = (name, verificationLink) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background: #4CAF50; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #777; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Pharmacy Management System</h1>
        </div>
        <div class="content">
          <h2>Hello ${name},</h2>
          <p>Thank you for registering with our Pharmacy Management System.</p>
          <p>Please verify your email address by clicking the button below:</p>
          <a href="${verificationLink}" class="button">Verify Email</a>
          <p>Or copy and paste this link in your browser:</p>
          <p>${verificationLink}</p>
          <p>If you did not register for this account, please ignore this email.</p>
          <p>This link will expire in 24 hours.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Pharmacy Management System. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Password reset template
 */
const passwordResetTemplate = (name, resetLink) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #FF9800; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background: #FF9800; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #777; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <h2>Hello ${name},</h2>
          <p>We received a request to reset your password.</p>
          <p>Click the button below to reset your password:</p>
          <a href="${resetLink}" class="button">Reset Password</a>
          <p>Or copy and paste this link in your browser:</p>
          <p>${resetLink}</p>
          <p>If you did not request a password reset, please ignore this email.</p>
          <p>This link will expire in 1 hour.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Pharmacy Management System. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Low stock alert template
 */
const lowStockAlertTemplate = (medicineName, currentStock, minimumStock) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #F44336; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .alert { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #777; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚠️ Low Stock Alert</h1>
        </div>
        <div class="content">
          <h2>Low Stock Warning</h2>
          <div class="alert">
            <p><strong>Medicine:</strong> ${medicineName}</p>
            <p><strong>Current Stock:</strong> ${currentStock}</p>
            <p><strong>Minimum Stock Level:</strong> ${minimumStock}</p>
          </div>
          <p>Please reorder this medicine as soon as possible to avoid stock-out situations.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Pharmacy Management System. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = {
    emailVerificationTemplate,
    passwordResetTemplate,
    lowStockAlertTemplate
};
