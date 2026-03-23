from rest_framework import serializers
from .models import Order, OrderItem
from userprofile.models import UserAddress
from products.serializers import VariantSerializer

class UserAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAddress
        fields = [
            'id', 'first_name', 'last_name', 'phone_number', 
            'address_line_1', 'address_line_2', 'email', 
            'city', 'state', 'postal_code', 'country'
        ]

class OrderItemSerializer(serializers.ModelSerializer):
    product = VariantSerializer(read_only=True)
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'price', 'quantity']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(source='orderitem_set', many=True, read_only=True)
    address = UserAddressSerializer(read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'address', 'total_price', 'payment_status', 
            'payment_method', 'order_status', 'order_date', 
            'tracking_no', 'items'
        ]
