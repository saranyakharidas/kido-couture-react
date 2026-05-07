# Deployment Guide for Kido Couture

This project consists of a **Django Backend** and a **React (Vite) Frontend**.

## Option 1: Monolithic Deployment (Easiest)
In this setup, Django serves the React build as static files. This is already configured in the project.

1.  **Build the Frontend**:
    ```bash
    cd frontend
    npm install
    npm run build
    ```
2.  **Configure Django**:
    - Ensure `DEBUG = False` in `ecom/settings.py`.
    - Add your domain to `ALLOWED_HOSTS`.
    - Run migrations and collect static files:
      ```bash
      python manage.py migrate
      python manage.py collectstatic
      ```
3.  **Host on a VPS**:
    - Use Gunicorn and Nginx to serve the site.

## Option 2: Decoupled Deployment (Recommended for Scale)
Host the frontend and backend on separate platforms.

### Frontend (Vercel/Netlify)
1.  Push the `frontend/` folder to a new Git repository OR deploy it as a subdirectory.
2.  Set `VITE_API_URL` environment variable to your Django API URL.
3.  Update the `vite.config.js` `outDir` to `dist` (default).

### Backend (Render/Railway/Railway)
1.  Deploy the Django project as an API.
2.  Install `django-cors-headers` (already installed) and add the frontend domain to `CORS_ALLOWED_ORIGINS`.

---

### Important Configs Used:
- **Environment Variable**: `VITE_API_URL` used in `App.jsx` for dynamic API calls.
- **Frontend Components**: Extracted `Navbar.jsx` and `ProductCard.jsx` for better modularity.
- **Styling**: Premium CSS variables and animations in `index.css`.
