# Vercel Deployment Guide for APREP Client

This guide will help you deploy the APREP frontend client to Vercel.

## Prerequisites

- A [Vercel account](https://vercel.com/signup)
- Your backend API deployed and accessible (see `server/RENDER_DEPLOYMENT.md`)
- Git repository with your code

## Deployment Steps

### 1. Prepare Your Project

Ensure your `.env.example` file is up to date:

```bash
NEXT_PUBLIC_API_URL=https://your-backend-api.onrender.com/api
NEXT_PUBLIC_OPERATOR_NAME=APREP Demo Operator
NEXT_PUBLIC_PRIVACY_CONTACT=privacy@example.com
```

### 2. Deploy to Vercel

#### Option A: Deploy via Vercel Dashboard (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your Git repository
4. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

5. Add Environment Variables:
   - Click **"Environment Variables"**
   - Add: `NEXT_PUBLIC_API_URL` = `https://your-backend-api.onrender.com/api`
   - Add: `NEXT_PUBLIC_OPERATOR_NAME` = the person or organization operating the demo
   - Add: `NEXT_PUBLIC_PRIVACY_CONTACT` = the email used for privacy and deletion requests
   - Make sure to replace with your actual backend URL

6. Click **"Deploy"**

#### Option B: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Navigate to the client directory:
```bash
cd client
```

3. Login to Vercel:
```bash
vercel login
```

4. Deploy:
```bash
vercel
```

5. Follow the prompts:
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N**
   - What's your project's name? **aprep-client** (or your preferred name)
   - In which directory is your code located? **.**
   - Want to override the settings? **N**

6. Set environment variables:
```bash
vercel env add NEXT_PUBLIC_API_URL production
vercel env add NEXT_PUBLIC_OPERATOR_NAME production
vercel env add NEXT_PUBLIC_PRIVACY_CONTACT production
```
Enter each production value when prompted.

7. Deploy to production:
```bash
vercel --prod
```

### 3. Configure Custom Domain (Optional)

1. Go to your project in Vercel Dashboard
2. Navigate to **Settings** → **Domains**
3. Add your custom domain
4. Follow Vercel's instructions to configure DNS

### 4. Verify Deployment

1. Visit your deployed URL (e.g., `https://aprep-client.vercel.app`)
2. Test the following:
   - Registration and login work
   - API calls to your backend succeed
   - All pages load correctly
   - No console errors

## Environment Variables

Required environment variables for production:

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `https://your-api.onrender.com/api` |
| `NEXT_PUBLIC_OPERATOR_NAME` | Public identity of the demo operator | `APREP Demo Operator` |
| `NEXT_PUBLIC_PRIVACY_CONTACT` | Public privacy-request email | `privacy@example.com` |

## Automatic Deployments

Vercel automatically deploys:
- **Production**: When you push to your main/master branch
- **Preview**: When you create a pull request

## Troubleshooting

### API Connection Issues

If the frontend can't connect to the backend:

1. Check that `NEXT_PUBLIC_API_URL` is set correctly
2. Verify your backend is running and accessible
3. Check CORS settings in your backend (should allow your Vercel domain)
4. Check browser console for specific error messages

### Build Failures

If the build fails:

1. Check the build logs in Vercel Dashboard
2. Ensure all dependencies are in `package.json`
3. Test the build locally:
```bash
npm run build
```
4. Check for TypeScript errors

### Environment Variables Not Working

1. Ensure variables start with `NEXT_PUBLIC_` for client-side access
2. Redeploy after adding/changing environment variables
3. Clear cache and redeploy if needed

## Performance Optimization

Vercel automatically optimizes your Next.js app:
- ✅ Automatic code splitting
- ✅ Image optimization
- ✅ Edge caching
- ✅ Serverless functions
- ✅ Automatic HTTPS

## Monitoring

Monitor your deployment:
1. Go to your project in Vercel Dashboard
2. Check **Analytics** for usage stats
3. Check **Logs** for runtime errors
4. Set up **Integrations** for monitoring tools

## Updating Your Deployment

To update your deployment:

1. Push changes to your Git repository
2. Vercel automatically rebuilds and deploys
3. Or manually trigger a redeploy in the Vercel Dashboard

## Rollback

If you need to rollback:

1. Go to **Deployments** in Vercel Dashboard
2. Find the previous working deployment
3. Click **"..."** → **"Promote to Production"**

## Cost

- **Hobby Plan**: Free for personal projects
  - Unlimited deployments
  - 100GB bandwidth/month
  - Automatic HTTPS
  
- **Pro Plan**: $20/month for commercial projects
  - Everything in Hobby
  - Advanced analytics
  - Team collaboration

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Community](https://github.com/vercel/vercel/discussions)

## Security Checklist

Before going to production:

- [ ] Environment variables are set correctly
- [ ] Backend CORS is configured for your domain
- [ ] API endpoints are using HTTPS
- [ ] No sensitive data in client-side code
- [ ] Authentication tokens are handled securely
- [ ] Error messages don't expose sensitive information

## Next Steps

After deployment:
1. Test all features thoroughly
2. Set up monitoring and alerts
3. Configure custom domain (if needed)
4. Share your app with users!

---

**Need Help?** Check the main [README.md](./README.md) or [QUICK_START.md](./QUICK_START.md) for more information.
