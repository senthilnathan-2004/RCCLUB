# Production Deployment Guide

This project is configured for easy deployment to **GitHub** and **Render**.

## 1. Local Verification
Before pushing to GitHub, ensure your `.env` files are updated.
- **Backend:** The `backend/.env` has been updated with your MongoDB Atlas URI.
- **Frontend:** Ensure `frontend/.env` points to your backend URL once deployed.

## 2. GitHub Setup
1. Create a new repository on GitHub.
2. Initialize your local project as a git repo:
   ```bash
   git init
   git add .
   git commit -m "Prepare for production deployment"
   ```
3. Add your remote and push:
   ```bash
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

## 3. Render Deployment
Render will automatically detect the `render.yaml` file in your root directory.

1. Log in to [Render](https://render.com).
2. Click **New +** > **Blueprint**.
3. Connect your GitHub repository.
4. Render will scan the `render.yaml` and prompt you to create the services.

### Configuration Checklist:
Once deployed, you will need to update a few environment variables in the Render Dashboard:

#### Backend Service Variables:
- `MONGODB_URI`: Already set in `.env`, but can be updated in Render.
- `FRONTEND_URL`: Set to the URL of your frontend service (e.g., `https://rotaract-frontend.onrender.com`).
- `ALLOWED_ORIGINS`: Same as `FRONTEND_URL`.
- `JWT_SECRET`: Generate a random secure string.

#### Frontend Service Variables:
- `NEXT_PUBLIC_API_URL`: Set to your backend URL + `/api` (e.g., `https://rotaract-backend.onrender.com/api`).

## 4. Database Access
1. Go to your MongoDB Atlas dashboard.
2. Go to **Network Access**.
3. Add `0.0.0.0/0` (Allow access from anywhere) or look up Render's IP addresses if you want to be more secure.

## 5. File Uploads
The project uses **Cloudinary** for image uploads.
1. Sign up/Log in to [Cloudinary](https://cloudinary.com/).
2. Copy your Cloud Name, API Key, and API Secret to the Backend Environment variables in Render.
