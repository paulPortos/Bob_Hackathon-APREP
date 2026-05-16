# APREP Render Deployment Guide

Complete guide for deploying APREP (Agent PRompt Evaluation Platform) to Render with PostgreSQL database.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [PostgreSQL Database Setup](#postgresql-database-setup)
3. [Web Service Configuration](#web-service-configuration)
4. [Environment Variables](#environment-variables)
5. [Deployment Process](#deployment-process)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Troubleshooting](#troubleshooting)
8. [Monitoring & Maintenance](#monitoring--maintenance)
9. [CI/CD Setup](#cicd-setup)
10. [Security Best Practices](#security-best-practices)

---

## Prerequisites

Before deploying to Render, ensure you have:

- ✅ **Render Account**: Sign up at [render.com](https://render.com)
- ✅ **GitHub Repository**: Your APREP code pushed to GitHub
- ✅ **Ollama Cloud API Key**: Get from [Ollama Cloud](https://ollama.com) (if using cloud)
- ✅ **Local Testing**: Application runs successfully locally

### Estimated Deployment Time
- **First-time setup**: 20-30 minutes
- **Subsequent deployments**: 5-10 minutes (automatic)

---

## PostgreSQL Database Setup

### Step 1: Create PostgreSQL Database

1. **Log in to Render Dashboard**
   - Go to [dashboard.render.com](https://dashboard.render.com)

2. **Create New PostgreSQL Database**
   - Click **"New +"** button
   - Select **"PostgreSQL"**

3. **Configure Database**
   ```
   Name: aprep-db (or your preferred name)
   Database: aprep_db
   User: aprep_user
   Region: Choose closest to your users (e.g., Oregon, Frankfurt, Singapore)
   PostgreSQL Version: 15 (recommended)
   ```

4. **Choose Instance Type**
   - **Free**: Good for testing (expires after 90 days)
   - **Starter ($7/month)**: Recommended for production
   - **Standard**: For high-traffic applications

5. **Create Database**
   - Click **"Create Database"**
   - Wait 2-3 minutes for provisioning

### Step 2: Get Database Connection String

1. **Navigate to Database Dashboard**
   - Click on your newly created database

2. **Copy Internal Database URL**
   - Scroll to **"Connections"** section
   - Copy the **"Internal Database URL"**
   - Format: `postgresql://user:password@host:5432/database`
   - ⚠️ **Important**: Use Internal URL (faster, free bandwidth within Render)

3. **Save for Later**
   - You'll need this URL for environment variables
   - Keep it secure - it contains credentials

---

## Web Service Configuration

### Step 1: Create Web Service

1. **From Render Dashboard**
   - Click **"New +"** button
   - Select **"Web Service"**

2. **Connect GitHub Repository**
   - Click **"Connect account"** if first time
   - Select your APREP repository
   - Click **"Connect"**

### Step 2: Configure Build Settings

```yaml
Name: aprep-api (or your preferred name)
Region: Same as your database (important for performance)
Branch: main (or your production branch)
Root Directory: server
Runtime: Python 3
```

### Step 3: Build & Start Commands

**Build Command:**
```bash
pip install -r requirements.txt
```

**Start Command:**
```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

⚠️ **Note**: `$PORT` is automatically provided by Render - don't change it!

### Step 4: Choose Instance Type

- **Free**: Good for testing (spins down after inactivity)
- **Starter ($7/month)**: Recommended for production (always on)
- **Standard**: For high-traffic applications

### Step 5: Advanced Settings (Optional)

```yaml
Health Check Path: /health
Auto-Deploy: Yes (recommended)
```

---

## Environment Variables

### Step 1: Add Environment Variables

In the Render Web Service dashboard, scroll to **"Environment Variables"** section and add:

### Required Variables

```bash
# Database (from PostgreSQL service)
DATABASE_URL=postgresql://user:password@host/database
```
👆 **Paste the Internal Database URL you copied earlier**

```bash
# Security Keys (generate these!)
ENCRYPTION_KEY=<generate-with-command-below>
JWT_SECRET_KEY=<generate-with-command-below>
```

```bash
# Ollama Configuration (Cloud by default)
OLLAMA_BASE_URL=
OLLAMA_API_KEY=<your-ollama-cloud-api-key>
OLLAMA_DEFAULT_MODEL=llama3.1
```

```bash
# Application Settings (optional, uses defaults if not set)
MAX_QUESTIONS_PER_SLOT=10
MAX_TRAIT_TESTS=10
DEFAULT_TIMEOUT_SECONDS=30
JWT_ALGORITHM=HS256
JWT_EXPIRATION_DAYS=7
```

```bash
# Keep-Alive Settings (IMPORTANT for Free Tier!)
BASE_URL=https://your-app-name.onrender.com
KEEP_ALIVE_ENABLED=true
KEEP_ALIVE_INTERVAL_MINUTES=14
```

### Step 2: Generate Security Keys

**Generate Encryption Key:**
```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```
Output example: `gAAAAABhkL9x...` (copy this)

**Generate JWT Secret:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```
Output example: `xK9mP2nQ...` (copy this)

### Step 3: Ollama Configuration

**Option A: Use Ollama Cloud (Recommended for Production)**
```bash
OLLAMA_BASE_URL=          # Leave empty for cloud
OLLAMA_API_KEY=sk-xxx     # Your Ollama cloud API key
```

**Option B: Use Custom Ollama Endpoint**
```bash
OLLAMA_BASE_URL=https://your-ollama-instance.com
OLLAMA_API_KEY=your-key   # If required
```

**Option C: Local Ollama (Not recommended for Render)**
```bash
OLLAMA_BASE_URL=http://localhost:11434
# Won't work on Render - use cloud instead
```

---

## Deployment Process

### Step 1: Review Configuration

Double-check:
- ✅ All environment variables are set
- ✅ Database URL is correct (Internal URL)
- ✅ Build and start commands are correct
- ✅ Root directory is set to `server`

### Step 2: Create Web Service

1. Click **"Create Web Service"** button
2. Render will start building your application

### Step 3: Monitor Build

Watch the build logs in real-time:
```
==> Cloning from GitHub...
==> Installing dependencies...
==> Build successful!
==> Starting service...
```

**Expected build time**: 3-5 minutes

### Step 4: Wait for Deployment

- Status will change from "Building" → "Live"
- You'll see a green checkmark when ready
- Your app URL: `https://your-app-name.onrender.com`

### Step 5: Automatic Database Migration

On first startup, the application will:
1. Connect to PostgreSQL database
2. Create all tables automatically
3. Print: `✓ Database initialized`

No manual migration needed! 🎉

---

## Post-Deployment Verification

### Step 1: Check Health Endpoint

Visit: `https://your-app-name.onrender.com/health`

**Expected Response:**
```json
{
  "status": "healthy",
  "database": "healthy",
  "ollama": "available"
}
```

### Step 2: Access API Documentation

Visit: `https://your-app-name.onrender.com/docs`

You should see the interactive Swagger UI with all API endpoints.

### Step 3: Test User Registration

**Using curl:**
```bash
curl -X POST https://your-app-name.onrender.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123"
  }'
```

**Expected Response:**
```json
{
  "id": "uuid-here",
  "email": "test@example.com",
  "created_at": "2024-01-01T00:00:00"
}
```

### Step 4: Test Authentication

**Login:**
```bash
curl -X POST https://your-app-name.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123"
  }'
```

**Expected Response:**
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer"
}
```

### Step 5: Verification Checklist

- [ ] Health endpoint returns "healthy"
- [ ] API docs are accessible
- [ ] User registration works
- [ ] Login returns valid token
- [ ] Database connection is stable
- [ ] Ollama is available (if configured)

---

## Troubleshooting

### Build Failures

**Problem**: Build fails with "No module named 'app'"

**Solution**:
- Check that Root Directory is set to `server`
- Verify `requirements.txt` is in the `server/` directory

---

**Problem**: Build fails with dependency errors

**Solution**:
```bash
# Locally, regenerate requirements.txt
pip freeze > requirements.txt

# Commit and push
git add requirements.txt
git commit -m "Update dependencies"
git push
```

---

### Database Connection Errors

**Problem**: "could not connect to server"

**Solution**:
1. Verify DATABASE_URL is the **Internal Database URL**
2. Check database is in the same region as web service
3. Ensure database status is "Available"

---

**Problem**: "password authentication failed"

**Solution**:
1. Copy DATABASE_URL again from database dashboard
2. Update environment variable in web service
3. Redeploy

---

### Application Errors

**Problem**: "ENCRYPTION_KEY not set"

**Solution**:
1. Generate encryption key (see Environment Variables section)
2. Add to environment variables
3. Redeploy

---

**Problem**: Application starts but crashes immediately

**Solution**:
1. Check logs: Click "Logs" tab in Render dashboard
2. Look for error messages
3. Common issues:
   - Missing environment variables
   - Database connection failed
   - Port binding issues (ensure using `$PORT`)

---

### Ollama Connection Issues

**Problem**: "Ollama is not available"

**Solution**:
1. If using cloud: Verify OLLAMA_API_KEY is correct
2. If OLLAMA_BASE_URL is empty, it should use cloud
3. Test API key locally first
4. Check Ollama cloud service status

---

**Problem**: Evaluations fail with Ollama errors

**Solution**:
- Application will fallback to heuristic scoring
- Check logs for specific Ollama error messages
- Verify model name is correct (e.g., `llama3.1`)

---

### Performance Issues

**Problem**: Slow response times

**Solution**:
1. Upgrade to Starter or Standard instance (Free tier spins down)
2. Ensure database and web service are in same region
3. Check database connection pool settings
4. Monitor database performance in Render dashboard

---

**Problem**: Application spins down (Free tier)

**Solution**:
- Free tier spins down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds
- **Use Keep-Alive System** (see below) to prevent spin-down
- Or upgrade to Starter ($7/month) for always-on service

### Keep-Alive System (Free Tier Solution)

**Problem**: Free tier spins down, causing cold starts

**Solution**: Enable the built-in keep-alive system!

**Setup:**
1. Add environment variables in Render:
   ```bash
   BASE_URL=https://your-app-name.onrender.com
   KEEP_ALIVE_ENABLED=true
   KEEP_ALIVE_INTERVAL_MINUTES=14
   ```

2. Deploy your application

3. Verify in logs:
   ```
   ✓ Keep-alive scheduler started - pinging https://your-app-name.onrender.com/ping every 14 minutes
   ```

**How it works:**
- Application pings itself every 14 minutes
- Prevents Render from spinning down (15-minute timeout)
- Uses lightweight `/ping` endpoint (no database queries)
- Minimal resource consumption

**For detailed instructions**, see [`KEEP_ALIVE_GUIDE.md`](./KEEP_ALIVE_GUIDE.md)

---

## Monitoring & Maintenance

### Viewing Logs

**Real-time Logs:**
1. Go to your web service dashboard
2. Click **"Logs"** tab
3. See live application logs

**Search Logs:**
- Use search box to filter logs
- Look for errors, warnings, or specific events

### Database Backups

**Automatic Backups (Paid plans):**
- Daily backups included with Starter plan and above
- Retained for 7 days (Starter) or 30 days (Standard)

**Manual Backup:**
```bash
# From Render dashboard
1. Go to PostgreSQL database
2. Click "Backups" tab
3. Click "Create Backup"
```

### Monitoring Database Performance

**Check Database Metrics:**
1. Go to PostgreSQL database dashboard
2. View metrics:
   - Connection count
   - Query performance
   - Storage usage
   - CPU usage

**Set Up Alerts:**
- Configure email alerts for high CPU/memory usage
- Monitor connection limits

### Scaling Options

**Vertical Scaling (Upgrade Instance):**
- Free → Starter: Always-on, better performance
- Starter → Standard: More CPU/RAM, better for production
- Standard → Pro: High-traffic applications

**Horizontal Scaling:**
- Not directly supported on Render free/starter
- Consider load balancer for multiple instances (Pro plan)

### Cost Optimization

**Tips to reduce costs:**
1. Use Free tier for development/testing
2. Upgrade to Starter only for production
3. Use Internal Database URL (free bandwidth)
4. Monitor and optimize database queries
5. Set appropriate timeout values

**Estimated Monthly Costs:**
- **Development**: $0 (Free tier)
- **Small Production**: $14/month (Starter web + Starter DB)
- **Medium Production**: $32/month (Standard instances)

---

## CI/CD Setup

### Automatic Deployments

**Enable Auto-Deploy:**
1. In web service settings
2. Enable **"Auto-Deploy"**
3. Select branch (e.g., `main`)

**How it works:**
```
git push origin main
  ↓
GitHub webhook triggers Render
  ↓
Render builds and deploys automatically
  ↓
Live in 3-5 minutes
```

### Deploy Hooks

**Manual Deploy via API:**
```bash
curl -X POST https://api.render.com/deploy/srv-xxx?key=xxx
```

Get deploy hook URL from:
1. Web service settings
2. Scroll to "Deploy Hook"
3. Copy URL

### Branch Configuration

**Multiple Environments:**

**Production:**
- Branch: `main`
- Auto-deploy: Yes
- URL: `https://aprep-api.onrender.com`

**Staging:**
- Branch: `develop`
- Auto-deploy: Yes
- URL: `https://aprep-api-staging.onrender.com`

### Rollback Procedures

**Rollback to Previous Version:**
1. Go to web service dashboard
2. Click "Events" tab
3. Find previous successful deploy
4. Click "Rollback to this version"

**Manual Rollback:**
```bash
# Revert commit locally
git revert HEAD

# Push to trigger redeploy
git push origin main
```

---

## Security Best Practices

### Environment Variable Management

**Do's:**
- ✅ Use Render's environment variables (encrypted at rest)
- ✅ Rotate keys regularly (every 90 days)
- ✅ Use different keys for staging/production
- ✅ Never commit secrets to Git

**Don'ts:**
- ❌ Don't hardcode secrets in code
- ❌ Don't share environment variables publicly
- ❌ Don't use same keys across environments

### Database Security

**Best Practices:**
1. **Use Internal Database URL** (not external)
2. **Enable SSL** (automatic on Render)
3. **Regular backups** (enable automatic backups)
4. **Monitor access logs** (check for suspicious activity)
5. **Limit connections** (set max connections appropriately)

### API Key Rotation

**Rotate JWT Secret:**
```bash
# Generate new secret
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Update in Render environment variables
# All users will need to re-login
```

**Rotate Encryption Key:**
⚠️ **Warning**: Rotating encryption key will invalidate all encrypted tokens in database

```bash
# Generate new key
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# Update in Render
# Existing encrypted data will need re-encryption
```

### CORS Configuration

**For Production:**

Update `app/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-frontend.com",
        "https://www.your-frontend.com"
    ],  # Specify actual origins
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)
```

**Don't use `allow_origins=["*"]` in production!**

### Rate Limiting

**Consider adding rate limiting:**
```bash
pip install slowapi
```

Protects against:
- Brute force attacks
- API abuse
- DDoS attempts

### HTTPS

- ✅ Automatic on Render (free SSL certificate)
- ✅ All traffic encrypted
- ✅ Certificate auto-renewal

---

## Quick Reference

### Essential URLs

```
Dashboard: https://dashboard.render.com
Your API: https://your-app-name.onrender.com
API Docs: https://your-app-name.onrender.com/docs
Health Check: https://your-app-name.onrender.com/health
Ping (Keep-Alive): https://your-app-name.onrender.com/ping
```

### Common Commands

**Generate Encryption Key:**
```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

**Generate JWT Secret:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Test Health Endpoint:**
```bash
curl https://your-app-name.onrender.com/health
```

**Test Ping Endpoint:**
```bash
curl https://your-app-name.onrender.com/ping
```

**Manual Deploy:**
```bash
git push origin main
```

### Support Resources

- **Render Docs**: https://render.com/docs
- **Render Status**: https://status.render.com
- **Community Forum**: https://community.render.com
- **Support**: support@render.com

---

## Deployment Checklist

### Pre-Deployment
- [ ] Code tested locally
- [ ] All tests passing
- [ ] Environment variables documented
- [ ] Database schema finalized
- [ ] Security keys generated

### During Deployment
- [ ] PostgreSQL database created
- [ ] Internal Database URL copied
- [ ] Web service configured
- [ ] All environment variables set
- [ ] Build successful
- [ ] Application started

### Post-Deployment
- [ ] Health check passes
- [ ] Ping endpoint works (`/ping`)
- [ ] API docs accessible
- [ ] User registration works
- [ ] Authentication works
- [ ] Database queries successful
- [ ] Ollama connection verified
- [ ] Keep-alive system enabled (if using free tier)
- [ ] Logs reviewed for errors

### Production Readiness
- [ ] Upgraded to paid tier (Starter minimum)
- [ ] Auto-deploy enabled
- [ ] Backups configured
- [ ] Monitoring set up
- [ ] CORS configured properly
- [ ] Rate limiting added
- [ ] Documentation updated

---

## Next Steps

After successful deployment:

1. **Set up monitoring** - Configure alerts for errors
2. **Document API** - Share API docs with team
3. **Test thoroughly** - Run full evaluation tests
4. **Monitor performance** - Check logs and metrics
5. **Plan scaling** - Monitor usage and upgrade as needed

---

## Need Help?

**Common Issues:**
- Check [Troubleshooting](#troubleshooting) section
- Review Render logs for error messages
- Verify all environment variables are set

**Still stuck?**
- Render Community: https://community.render.com
- GitHub Issues: Create issue in your repository
- Render Support: support@render.com (paid plans)

---

**Made with ❤️ for APREP**

*Last updated: 2024*