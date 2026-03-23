from rest_framework import serializers
from .models import Category, Products, Variant, product_image

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'image']

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = product_image
        fields = ['id', 'image']

class SimpleVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Variant
        fields = ['id', 'title', 'slug', 'variant_image', 'price', 'discount_price']

class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    all_variants = SimpleVariantSerializer(source='variant_set', many=True, read_only=True)
    
    class Meta:
        model = Products
        fields = ['id', 'name', 'category', 'descriptions', 'slug', 'is_available', 'all_variants']

class VariantSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    color_name = serializers.CharField(source='color.color', read_only=True)
    size_name = serializers.CharField(source='size.size', read_only=True)
    additional_images = ProductImageSerializer(source='product_image_set', many=True, read_only=True)

    class Meta:
        model = Variant
        fields = [
            'id', 'title', 'product', 'size_name', 'color_name', 
            'variant_image', 'price', 'stock', 'slug', 
            'discount_price', 'offer_perc', 'additional_images'
        ]
