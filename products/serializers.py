from rest_framework import serializers
from .models import Category, Products, Variant

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'image']

class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    
    class Meta:
        model = Products
        fields = ['id', 'name', 'category', 'descriptions', 'slug', 'is_available']

class VariantSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    color_name = serializers.CharField(source='color.color', read_only=True)
    size_name = serializers.CharField(source='size.size', read_only=True)

    class Meta:
        model = Variant
        fields = [
            'id', 'title', 'product', 'size_name', 'color_name', 
            'variant_image', 'price', 'stock', 'slug', 
            'discount_price', 'offer_perc'
        ]
