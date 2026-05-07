from django.contrib import admin
from django.urls import path,include
from . import views

urlpatterns = [
    
    path('adminpage/',views.adminpage,name='adminpage'),
    path('admin_home',views.admin_home,name='admin_home'),
    path('admin_signin',views.admin_signin,name='admin_signin'),
    path('admin_logout/',views.admin_logout,name="admin_logout"),

    path('category/',views.category, name='category'),
    path('category_add/',views.category_add, name='category_add'),
    path('category_delete/<int:category_id>', views.category_delete, name='category_delete'),
    path('edit_category/<int:category_id>/', views.edit_category, name='edit_category'),

    path('addproduct/',views.addproduct, name='addproduct'),
    path('delete_product/<int:product_id>', views.delete_product, name='delete_product'),
    path('activate_product/<int:product_id>', views.activate_product, name='activate_product'),
    path('product_view/<int:product_id>', views.product_view, name='product_view'),

    path('admin_userlist/',views.userlist,name='userlist'),

    path('block/<int:user_id>/', views.block_user, name='block_user'),
    path('unblock/<int:user_id>/', views.unblock_user, name='unblock_user'),
    
    path(' variant_edit/<int:variant_id>',views.variant_edit,name='variant_edit'),
    path('variant_add/<int:product_id>',views.variant_add,name='variant_add'),
    path('delete_variant/<int:variant_id>', views.delete_variant, name='delete_variant'),

    path('delete_image/<int:image_id>',views.delete_image,name='delete_image'),

    path('add_custom_color/', views.add_custom_color, name='add_custom_color'),

    path('sales_report/', views.sales_report, name='sales_report'),
    
    path('order_all/<str:status>/',views.order_all,name='order_all'),
    path('order_views/<int:order_id>',views.order_views,name='order_views'),
    path('cancel_order/<int:order_id>/', views.cancel_order, name='cancel_order'),
    path('return_orders/',views.return_orders, name="return_orders"),
    path('refund/<int:order_id>',views.refund,name='refund'),

    path('banner_view/',views.banner_view, name="banner_view"),
    path('banner_block/<int:banner_id>',views.banner_block,name='banner_block'),
    path('banner_active/<int:banner_id>',views.banner_active,name='banner_active'),
    path('banner_remove/<int:banner_id>',views.banner_remove,name='banner_remove'),
    path('edit_banner/<int:banner_id>',views.edit_banner,name='edit_banner'),

    path('coupon/',views.coupon_view,name="coupons"),
    path('coupon_expired/<int:coupon_id>',views.coupon_expired,name='coupon_expired'),
    path('coupon_activate/<int:coupon_id>',views.coupon_activate,name='coupon_activate'),

    # offer management
    path('offer_management',views.offer_management,name='offer_management'),

    path('category_offer',views.category_offer,name='category_offer'),
    path('category_offer_disable/<int:id>',views.category_offer_disable,name='category_offer_disable'),
    path('add_edit_catoffer/<int:id>',views.add_edit_catoffer,name='add_edit_catoffer'),

    path('product_offer',views.product_offer,name='product_offer'),
    path('product_offer_disable/<int:id>',views.product_offer_disable,name='product_offer_disable'),
    path('product_offer_edit/<int:id>',views.product_offer_edit,name='product_offer_edit'),
]