# Kido Couture - Premium E-Commerce Platform

A full-stack, high-performance e-commerce application built with **React 19**, **Django Rest Framework**, and **Framer Motion**. This project demonstrates professional-grade web development practices, including RESTful API design, state-driven UI, and robust authentication.

## 🚀 Key Features

### 🛍️ Dynamic Shopping Experience
- **Advanced Filtering:** Real-time search, category filtering, and sorting (price, newness) powered by a custom Django API.
- **Product Variants:** Support for multiple sizes, colors, and images per product.
- **Interactive UI:** Smooth transitions and micro-animations using Framer Motion for a premium feel.

### 🔐 Secure Authentication
- **Two-Factor OTP Login:** Enhanced security for user accounts using email-based One-Time Passwords.
- **Email Verification:** Account activation via unique signed tokens.
- **Password Recovery:** Secure password reset workflow.

### 🛠️ Admin Powerhouse
- **Comprehensive Dashboard:** Real-time statistics on sales, orders, and customer activity.
- **Management Suite:** Full CRUD operations for products, categories, coupons, and banners.
- **Sales Analytics:** Detailed reporting tools for tracking business growth.

### 💳 Modern Checkout & Payments
- **Razorpay Integration:** Seamless and secure payment gateway integration.
- **Wallet & Referral System:** Built-in rewards program for user engagement.
- **Coupon Management:** Flexible discount system with usage tracking.

## 🛠️ Technical Stack

- **Frontend:** React 19, Vite, Framer Motion, Lucide Icons, Vanilla CSS
- **Backend:** Django 5.x, Django Rest Framework (DRF)
- **Database:** SQLite (Development) / PostgreSQL (Production ready)
- **Authentication:** Session-based with CSRF protection & OTP
- **Payments:** Razorpay SDK

## 📦 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd kido-couture-react
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # venv\Scripts\activate on Windows
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py runserver
   ```

3. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 📝 Configuration

Create a `.env` file in the root directory with the following:
```env
SECRET_KEY=your_django_secret_key
DEBUG=True
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password
RAZOR_KEY_ID=your_razorpay_key
RAZOR_KEY_SECRET=your_razorpay_secret
```

---
*Built with ❤️ for a professional portfolio.*