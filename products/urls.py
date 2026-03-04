from django.contrib import admin
from django.urls import path,include
from . import views


urlpatterns = [
  

    path('product_details/<slug:slug>',views.product_details,name='product_details'),

    # path('search/',views.search,name="search"),

    path('shop/<int:category_id>',views.shop,name='shop'),
    path('api/shop/<int:category_id>',views.shop_api,name='shop_api'),

    path('filter/<int:category_id>',views.filter,name='filter'),
    path('api/categories/', views.categories_api, name='categories_api'),
]