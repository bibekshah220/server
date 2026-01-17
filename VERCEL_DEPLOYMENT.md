# Vercel Deployment Guide

This guide will help you deploy your Pharmacy Management System backend to Vercel.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. MongoDB database (MongoDB Atlas recommended for cloud hosting)
3. All environment variables configured

## Deployment Steps

### 1. Install Vercel CLI (Optional but Recommended)

```bash
npm install -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Set Environment Variables

Before deploying, you need to set all required environment variables in Vercel:

**Required Environment Variables:**
- `MONGO_URI` - Your MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRE` - JWT expiration time (e.g., "7d")
- `NODE_ENV` - Set to "production"
- `FRONTEND_URL` - **Your deployed frontend URL** (e.g., `https://your-frontend.vercel.app` or your custom domain)
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS` - Email configuration (if using email service)
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` - SMS configuration (if using SMS service)

**Important:** Since you already deployed your frontend, make sure to set `FRONTEND_URL` to your frontend's production URL. This ensures CORS works correctly between your frontend and backend.

**To set environment variables:**

**Option A: Via Vercel Dashboard**
1. Go to your project on Vercel
2. Navigate to Settings → Environment Variables
3. Add each variable with its value

**Option B: Via CLI**
```bash
vercel env add MONGO_URI
vercel env add JWT_SECRET
# ... repeat for each variable
```

### 4. Deploy to Vercel

**Option A: Deploy via CLI**
```bash
vercel
```

Follow the prompts:
- Set up and deploy? **Yes**
- Which scope? (Select your account)
- Link to existing project? **No** (for first deployment)
- Project name? (Enter a name or press Enter for default)
- Directory? (Press Enter for current directory)

**Option B: Deploy via GitHub Integration**
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Vercel will auto-detect the settings
6. Add environment variables in the project settings
7. Click "Deploy"

### 5. Verify Deployment

After deployment, Vercel will provide you with a URL like:
`https://your-project-name.vercel.app`

Test the health endpoint:
```bash
curl https://your-project-name.vercel.app/health
```

You should receive:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-..."
}
```

## Important Notes

### Database Connection
- Make sure your MongoDB Atlas (or other cloud database) allows connections from Vercel's IP addresses
- MongoDB Atlas: Go to Network Access → Add IP Address → Add "0.0.0.0/0" (for all IPs) or Vercel's specific IPs

### CORS Configuration
The app is already configured to accept requests from:
- Vercel preview deployments (`*.vercel.app`) - **Automatically allows all Vercel frontends**
- Your configured `FRONTEND_URL` - **Set this to your deployed frontend URL**
- Local development URLs

**Note:** If your frontend is also on Vercel, it will work automatically due to the `*.vercel.app` pattern. However, it's still recommended to set `FRONTEND_URL` explicitly for clarity and to support custom domains.

### Serverless Considerations
- Database connections are reused across function invocations
- Cold starts may occur on first request after inactivity
- Consider using MongoDB connection pooling (already configured)

### File Uploads
If you're using file uploads (multer), note that:
- Vercel has a 4.5MB request body limit on the Hobby plan
- Consider using external storage (AWS S3, Cloudinary, etc.) for larger files

## Troubleshooting

### Database Connection Issues
- Verify `MONGO_URI` is set correctly in Vercel environment variables
- Check MongoDB Atlas network access settings
- Review Vercel function logs for connection errors

### CORS Errors
- Ensure your frontend URL is added to `FRONTEND_URL` environment variable
- Check that CORS configuration in `src/app.js` includes your frontend domain

### Environment Variables Not Working
- Make sure variables are set for the correct environment (Production, Preview, Development)
- Redeploy after adding new environment variables

## Updating Deployment

After making changes to your code:

```bash
# Via CLI
vercel --prod

# Or push to GitHub (if using GitHub integration)
git push origin main
```

## Support

For more information, visit:
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Node.js Guide](https://vercel.com/docs/concepts/functions/serverless-functions/runtimes/node-js)

