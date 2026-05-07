from django.shortcuts import render,get_object_or_404,redirect
from .models import *
from django.db.models import Q 
from django.db.models import Q, Min
from decimal import Decimal


from django.http import JsonResponse


# Create your views here.
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .serializers import VariantSerializer, CategorySerializer
def product_details(request,slug):

    variants= Variant.objects.all()
    cat_offer = Category_Offer.objects.all()
    
    for cat in cat_offer:
        for product in variants: 
            if product.product.category == cat.category and product.product_offer >=  0 and cat.discount >= 0 and cat.discount <= product.product_offer :
                off =  product.product_offer 
                if off <= 70 and off >= 0 :
                    
                    product.discount_price = product.price-(product.price*off/100)
                    product.offer_perc = product.product_offer
                    product.save()
                else: pass
            elif  product.product.category == cat.category and product.product_offer >= 0  and cat.discount >= 0  and cat.discount >= product.product_offer :
                if cat.discount <= 70 and cat.discount >= 0 :
                    product.discount_price = product.price-(product.price*cat.discount/100)

                    product.offer_perc = cat.discount
                    product.save()
            elif product.product.category != cat.category and product.product_offer > 0 :
                if product.product_offer > 0 and product.product_offer < 70 :
                    product.discount_price = product.price-(product.price*product.product_offer/100)
                    product.save()
            else:
                pass

    pro = Variant.objects.get(slug=slug)
    cat = pro.product.category 
    
    
    product = Products.objects.filter( category=cat).exclude(variant__slug=slug)
    

    pros = Variant.objects.get(slug=slug)

    context = {
        'pros':pros,
        'product':product,
        
               }
    
    return render(request,'products/products_details.html',context)

def shop(request, category_id):
    
    variants= Variant.objects.all()
    cat_offer = Category_Offer.objects.all()
    
    for cat in cat_offer:
        for product in variants: 
            if product.product.category == cat.category and product.product_offer >=  0 and cat.discount >= 0 and cat.discount <= product.product_offer :
                off =  product.product_offer 
                if off <= 70 and off >= 0 :
                    
                    product.offer_price = product.price-(product.price*off/100)
                    product.offer_perc = product.product_offer
                    product.save()
                else: pass
            elif  product.product.category == cat.category and product.product_offer >= 0  and cat.discount >= 0  and cat.discount >= product.product_offer :
                if cat.discount <= 70 and cat.discount >= 0 :
                    product.offer_price = product.price-(product.price*cat.discount/100)

                    product.offer_perc = cat.discount
                    product.save()
            elif product.product.category != cat.category and product.product_offer > 0 :
                if product.product_offer > 0 and product.product_offer < 70 :
                    product.offer_price = product.price-(product.price*product.product_offer/100)
                    product.save()
            else:
                pass

    if category_id == 0:
      
        variants =Variant.objects.all()
    else:
        category = get_object_or_404(Category, id=category_id)
        variants = Variant.objects.filter(product__category=category)
    colors = color.objects.all()
    categories = Category.objects.all()
    
    search_query = request.GET.get('search')
    price_filter = request.GET.get('price')
    color_filter = request.GET.get('color')
    sort_by = request.GET.get('sort')

    if search_query:
        variants = variants.filter(
            Q(product__name__icontains=search_query) | Q(product__descriptions__icontains=search_query)
        )

    if price_filter:
        if price_filter == '0-500':
            variants = variants.filter(discount_price__range=(Decimal('0.00'), Decimal('500.00')))
        elif price_filter == '500-1000':
            variants = variants.filter(discount_price__range=(Decimal('500.00'), Decimal('1000.00')))
        elif price_filter == '1000-2000':
            variants = variants.filter(discount_price__range=(Decimal('1000.00'), Decimal('2000.00')))
        elif price_filter == '2000-3000':
            variants = variants.filter(discount_price__range=(Decimal('2000.00'), Decimal('3000.00')))
        else:
            variants = variants.filter(discount_price__gte=Decimal('3000.00'))

    if color_filter and color_filter != 'all':
        variants = variants.filter(color__color=color_filter)

    if sort_by == 'popularity':
        variants = variants.order_by('-product__created_at')
    elif sort_by == 'newness':
        variants = variants.order_by('-product__created_at')
    elif sort_by == 'price_low_to_high':
        variants = variants.order_by('price')
    elif sort_by == 'price_high_to_low':
        variants = variants.order_by('-price')


            # Number of products to display per page
    items_per_page = 16

    page_number = request.GET.get('page')

    paginator = Paginator(variants, items_per_page)
    try:
        variants = paginator.page(page_number)
    except PageNotAnInteger:
        variants = paginator.page(1)
    except EmptyPage:
        variants = paginator.page(paginator.num_pages)
    
    context ={
        'colors': colors,
        'variants': variants,
        'cats': categories,
        'category_id': category_id,
    }

    return render(request, "products/category.html", context)

@api_view(['GET'])
def shop_api(request, category_id):
    """
    Enhanced API supporting search, sort, and price filters for the React frontend.
    """
    if category_id == 0:
        variants = Variant.objects.all()
    else:
        variants = Variant.objects.filter(product__category_id=category_id)
    
    # Get parameters from request
    search_query = request.GET.get('search')
    price_filter = request.GET.get('price')
    sort_by = request.GET.get('sort')

    # Apply Search
    if search_query:
        variants = variants.filter(
            Q(product__name__icontains=search_query) | 
            Q(product__descriptions__icontains=search_query) |
            Q(title__icontains=search_query)
        )

    # Apply Price Filter
    if price_filter and price_filter != 'all':
        if price_filter == '0-500':
            variants = variants.filter(price__range=(0, 500))
        elif price_filter == '500-1000':
            variants = variants.filter(price__range=(500, 1000))
        elif price_filter == '1000-2000':
            variants = variants.filter(price__range=(1000, 2000))
        elif price_filter == '2000-3000':
            variants = variants.filter(price__range=(2000, 3000))
        elif price_filter == '3000+':
            variants = variants.filter(price__gte=3000)

    # Apply Sorting
    if sort_by == 'newness':
        variants = variants.order_by('-product__created_at')
    elif sort_by == 'price_low_to_high':
        variants = variants.order_by('price')
    elif sort_by == 'price_high_to_low':
        variants = variants.order_by('-price')
    else:
        variants = variants.order_by('-id')
    
    serializer = VariantSerializer(variants, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def categories_api(request):
    """
    Returns all categories for the frontend.
    Can be expanded to fetch from external Subject Master API if needed.
    """
    categories = Category.objects.all()
    serializer = CategorySerializer(categories, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def product_details_api(request, slug):
    try:
        variant = Variant.objects.get(slug=slug)
        related_products_qs = Variant.objects.filter(
            product__category=variant.product.category
        ).exclude(product=variant.product)[:10]
        
        # Manual distinct by product for SQLite compatibility
        seen_products = set()
        unique_variants = []
        for v in related_products_qs:
            if v.product_id not in seen_products:
                unique_variants.append(v)
                seen_products.add(v.product_id)
            if len(unique_variants) >= 4:
                break
        related_products = unique_variants
        
        variant_data = VariantSerializer(variant).data
        related_data = VariantSerializer(related_products, many=True).data
        
        return Response({
            'variant': variant_data,
            'related': related_data
        })
    except Variant.DoesNotExist:
        return Response({'error': 'Product not found'}, status=404)

def filter(request, category_id):
    if category_id == 0:
        variants = Variant.objects.all()
    else:
        category = get_object_or_404(Category, id=category_id)
        variants = Variant.objects.filter(product__category=category)

    colors = color.objects.all()
    sizes = size.objects.all()
    catogeris = Category.objects.all()

    # Get selected color filters
    selected_colors = request.GET.getlist('color')

    # Get selected size filters
    selected_sizes = request.GET.getlist('size')

    # Get selected price filter
    selected_price = request.GET.get('price')

    # Get selected sort option
    selected_sort = request.GET.get('sort')

    # Apply the filters
    if 'all' not in selected_colors:
        variants = variants.filter(color__color__in=selected_colors)

    if 'all' not in selected_sizes:
        variants = variants.filter(size__size__in=selected_sizes)

    if selected_price:
        if selected_price == '0-50':
            variants = variants.filter(price__range=(Decimal('0.00'), Decimal('50.00')))
        elif selected_price == '50-100':
            variants = variants.filter(price__range=(Decimal('50.00'), Decimal('100.00')))
        elif selected_price == '100-150':
            variants = variants.filter(price__range=(Decimal('100.00'), Decimal('150.00')))
        elif selected_price == '150-200':
            variants = variants.filter(price__range=(Decimal('150.00'), Decimal('200.00')))
        else:
            variants = variants.filter(price__gte=Decimal('200.00'))

    if selected_sort == 'popularity':
        variants = variants.order_by('-product__created_at')
    elif selected_sort == 'newness':
        variants = variants.order_by('-product__created_at')
    elif selected_sort == 'price_low_to_high':
        variants = variants.order_by('price')
    elif selected_sort == 'price_high_to_low':
        variants = variants.order_by('-price')

    # Number of products to display per page
    items_per_page = 16
    page_number = request.GET.get('page')
    paginator = Paginator(variants, items_per_page)

    try:
        variants = paginator.page(page_number)
    except PageNotAnInteger:
        variants = paginator.page(1)
    except EmptyPage:
        variants = paginator.page(paginator.num_pages)

    context = {
        'colors': colors,
        'sizes': sizes,
        'variants': variants,
        'cats': catogeris,
        'selected_colors': selected_colors,
        'selected_sizes': selected_sizes,
        'selected_price': selected_price,
        'selected_sort': selected_sort,
    }

  
    return render(request, "products/filter_test.html", context)