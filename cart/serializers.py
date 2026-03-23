from rest_framework import serializers
from .models import Cart, CartItems
from products.serializers import VariantSerializer
from coupon.models import Coupon

class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = ['id', 'coupon_code', 'discount_price', 'mininum_amount', 'is_expired']

class CartItemSerializer(serializers.ModelSerializer):
    product = VariantSerializer(read_only=True)
    item_total = serializers.DecimalField(source='get_item_price', max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = CartItems
        fields = ['id', 'product', 'quantity', 'price', 'item_total']

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(source='cartitems_set', many=True, read_only=True)
    subtotal = serializers.DecimalField(source='get_total_price', max_digits=10, decimal_places=2, read_only=True)
    applied_coupon = CouponSerializer(source='coupons', read_only=True)
    
    class Meta:
        model = Cart
        fields = ['id', 'items', 'subtotal', 'applied_coupon']
