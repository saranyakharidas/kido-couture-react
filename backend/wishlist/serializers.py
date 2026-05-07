from rest_framework import serializers
from .models import Wishlist
from products.serializers import VariantSerializer

class WishlistSerializer(serializers.ModelSerializer):
    product = VariantSerializer(read_only=True)
    class Meta:
        model = Wishlist
        fields = ['id', 'user', 'product', 'date_added']
