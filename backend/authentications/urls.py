from django.contrib import admin
from django.urls import path
from . import views

urlpatterns = [
path('',views.home,name='home'),

path('signin/',views.signin,name='signin'),

path('signup/',views.signup,name='signup'),

path('activate/<uidb64>/<token>',views.activate,name='activate'),

path('verifyotp/', views.verifyotp, name='verifyotp'),

path('forget_password', views.forget_password, name='forget_password'),

path('update_password', views.update_password, name='update_password'),

path('reset_password/<uidb64>/<token>',views.reset_password,name='reset_password'),

path('logout_user/',views.logout_user,name='logout_user'),
path('api/user-status/', views.user_status, name='user_status'),
path('api/login/', views.api_login, name='api_login'),
path('api/signup/', views.api_signup, name='api_signup'),
path('api/verify-otp/', views.api_verify_otp, name='api_verify_otp'),
path('sendmail/',views.sendmail,name='sendmail'),
path('resend-activation/', views.resend_activation, name='resend_activation'),





]