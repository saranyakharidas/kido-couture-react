import decimal
from decimal import Decimal
from django.http import HttpResponseRedirect, JsonResponse
from django.shortcuts import render, redirect
from .models import Cart, CartItems,wallet,GuestCart
from products.models import Variant
from coupon.models import Coupon , Usercoupon
from django.contrib import messages
from django.contrib.sessions.models import Session
from django.core.exceptions import ObjectDoesNotExist
from django.shortcuts import get_object_or_404
from django.views.decorators.cache import cache_control
from django.contrib.auth.decorators import login_required
from django.db.models import Sum
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .serializers import CartSerializer, CouponSerializer

@api_view(['GET'])
@login_required(login_url='signin')
def cart_view_api(request):
    cart, created = Cart.objects.get_or_create(user=request.user)
    available_coupons = Coupon.objects.filter(is_expired=False)
    
    serializer = CartSerializer(cart)
    coupon_serializer = CouponSerializer(available_coupons, many=True)
    
    return Response({
        'cart': serializer.data,
        'available_coupons': coupon_serializer.data
    })

@api_view(['POST'])
@login_required(login_url='signin')
def update_quantity_api(request):
    item_id = request.data.get('item_id')
    quantity = int(request.data.get('quantity'))
    
    try:
        item = CartItems.objects.get(id=item_id, cart__user=request.user)
        if item.product.stock >= quantity:
            item.quantity = quantity
            item.save()
            return Response({'success': True})
        else:
            return Response({'success': False, 'error': 'Not enough stock'}, status=400)
    except CartItems.DoesNotExist:
        return Response({'success': False, 'error': 'Item not found'}, status=404)

@api_view(['POST'])
@login_required(login_url='signin')
def remove_from_cart_api(request, item_id):
    try:
        item = CartItems.objects.get(id=item_id, cart__user=request.user)
        item.delete()
        return Response({'success': True})
    except CartItems.DoesNotExist:
        return Response({'success': False, 'error': 'Item not found'}, status=404)

@api_view(['POST'])
@login_required(login_url='signin')
def apply_coupon_api(request):
    coupon_code = request.data.get('coupon_code')
    cart = Cart.objects.get(user=request.user)
    try:
        coupon = Coupon.objects.get(coupon_code=coupon_code, is_expired=False)
        subtotal = cart.get_total_price()
        if subtotal >= coupon.mininum_amount:
            cart.coupons = coupon
            cart.save()
            return Response({'success': True})
        else:
            return Response({'success': False, 'error': f'Minimum amount {coupon.mininum_amount} not met'}, status=400)
    except Coupon.DoesNotExist:
        return Response({'success': False, 'error': 'Invalid coupon code'}, status=404)

@api_view(['POST'])
@login_required(login_url='signin')
def remove_coupon_api(request):
    cart = Cart.objects.get(user=request.user)
    cart.coupons = None
    cart.save()
    return Response({'success': True})



from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
@api_view(['POST'])
def add_to_cart_api(request, variant_id):
    if not request.user.is_authenticated:
        return Response({'success': False, 'error': 'Please login to add items to your cart.'}, status=403)
    try:
        variant = Variant.objects.get(id=variant_id)
        cart, created = Cart.objects.get_or_create(user=request.user)
        item = cart.cartitems_set.filter(product=variant).first()
        
        quantity = int(request.data.get('quantity', 1))

        if item:
            if variant.stock >= item.quantity + quantity:
                item.quantity += quantity
                item.save()
            else:
                return Response({'error': 'Not enough stock available'}, status=400)
        else:
            if variant.stock >= quantity:
                price_item = variant.discount_price if variant.discount_price else variant.price
                CartItems.objects.create(
                    cart=cart,
                    product=variant, 
                    quantity=quantity, 
                    price=price_item
                )
            else:
                return Response({'error': 'Not enough stock available'}, status=400)
        
        return Response({
            'success': True, 
            'message': 'Successfully added product to cart',
            'cart_count': cart.cartitems_set.aggregate(total=Sum('quantity'))['total'] or 0
        })
    except Variant.DoesNotExist:
        return Response({'error': 'Product variant not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

def add_to_cart(request, variant_id):
    variant = Variant.objects.get(id=variant_id)


    cart, created = Cart.objects.get_or_create(user=request.user)

    item = cart.cartitems_set.filter(product=variant).first()

    if item:
        if variant.stock > item.quantity :
            item.quantity += 1
            item.save()
        else:
            pass
    else:
        if variant.discount_price:
            price_item = variant.discount_price
        else:
            price_item = variant.price

        CartItems.objects.create(cart=cart,
                                product=variant, 
                                quantity=1, 
                                price=price_item)
        
    messages.success(request, "Successfullly added ptoduct to cart")
    return HttpResponseRedirect(request.META.get('HTTP_REFERER'))  # Redirect to the cart view

# def view_cart(request):


@cache_control(no_cache=True,must_revalidate=True,no_store=True)
@login_required(login_url='signin')
def view_cart(request):
    available_coupons = Coupon.objects.filter(is_expired=False, mininum_amount__lte= 1000)

    cart = get_object_or_404(Cart, user=request.user)
    cartitems = CartItems.objects.filter(cart = cart)
    if cartitems:

    

        # Calculate the total price before applying the coupon (subtotal)
        original_total_price = cart.get_total_price()
        if cart.cartitems_set.count() == 0:
            cart.coupons = None
        
            cart.save()

        if request.method == 'POST':
            coupon_code = request.POST.get('coupon')
            
            try:
                coupon = Coupon.objects.get(coupon_code=coupon_code)
                usercoupon = Usercoupon.objects.filter(coupon=coupon, user=request.user) 
                
                if not coupon.is_expired and original_total_price >= coupon.mininum_amount and not usercoupon.exists():
                    # Apply coupon discount to the total price
                
                
                    cart.coupons = coupon
                    cart.save()

                    messages.success(request, 'Coupon applied successfully.')
                else:
                    messages.error(request, 'Coupon already applied')

                # Redirect to a different URL after processing the POST data
                return redirect('cart')
                    
            except ObjectDoesNotExist:
                messages.error(request, 'Coupon does not exist.')

                # Redirect to a different URL after processing the POST data
                return redirect('cart')
        if cart.coupons:
            coupon=cart.coupons
            total_price =cart.get_total_price() 
            total_price -= coupon.discount_price  
        else:
            total_price=original_total_price
    

        context = {
            'cart': cart,
            'subtotal': original_total_price,
            'total_prices': total_price,
            'available_coupons': available_coupons
        }

        return render(request, 'cart/shop_cart.html', context)
    else:
    
        return redirect('shop',0)


def remove_from_cart(request,item_id):
    cart_item = CartItems.objects.get(id=item_id)
    cart_item.delete()
    messages.success(request, "Successfully removed product from cart")
    return redirect('cart')

def update_quantity(request):
     
    if request.method == 'POST' and request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        carts = Cart.objects.get(user=request.user)
        product_id = request.POST.get('product_id')
        quantity = request.POST.get('quantity')
        
        product = CartItems.objects.get(id=product_id)
        product.quantity = quantity
        if product.product.discount_price:
            product.price = product.product.discount_price * Decimal(product.quantity)
        else:
            product.price = product.product.price * Decimal(product.quantity)

        product.save()
        
        cart = product.cart
        cart.total_price = cart.get_total_price()
        cart.save()
        subtotal = cart.get_total_price()
        if carts.coupons :
            total_price = cart.total_price
            total_price -= carts.coupons.discount_price
        else:
            total_price = cart.total_price

        
        # Prepare the response data
        response_data = {
            'success': True,
            'message': 'Quantity updated successfully!',
            'price': product.price,
            'quantity': str(product.quantity),
            'total_price': total_price, 
            'subtotat':subtotal
            
        }

        return JsonResponse(response_data)
    
    response_data = {
        'success': False,
        'message': 'Invalid request',
    }
    
    return JsonResponse(response_data, status=400)

def remove_coupon(request):
    carts = Cart.objects.get(user =request.user)
    carts.coupons = None
    carts.save()
    return HttpResponseRedirect(request.META.get('HTTP_REFERER'))

@cache_control(no_cache=True,must_revalidate=True,no_store=True)
@login_required(login_url='signin')
def view_wallet(request):
    try:
        wallets = wallet.objects.get(user=request.user)
    except ObjectDoesNotExist:
        wallet.objects.create(user=request.user)
        wallets = wallet.objects.get(user=request.user)

    context ={
        'wallets':wallets
    }

    return render(request,"cart/wallet.html",context)


# def add_to_guest_cart(request, variant_id):
#     variant = Variant.objects.get(id=variant_id)

#     # Get or create the guest session key
#     session_key = request.session.session_key
#     if not session_key:
#         request.session.save()
#         session_key = request.session.session_key

#     # Retrieve the guest session using the session key
#     try:
#         session = Session.objects.get(session_key=session_key)
#     except Session.DoesNotExist:
#         session = None

#     # Create or update the guest cart item associated with the session
#     if session:
#         cart_item, created = GuestCart.objects.get_or_create(
#             session=session,
#             product=variant,
#             defaults={'price': variant.discount_price or variant.price}  # Set the price based on variant type
#         )
#       

#         if not created:
#             cart_item.quantity += 1
#             cart_item.save()

#     return redirect('guest_cart_view')


# def guest_cart_view(request):
#     session_key = request.session.session_key
#     if not session_key:
#         request.session.save()
#         session_key = request.session.session_key

#     try:
#         session = Session.objects.get(session_key=session_key)
#     except Session.DoesNotExist:
#         session = None

#     guest_cart_items = GuestCart.objects.filter(session=session)

#     total_amount = 0

#     if guest_cart_items:
#         for guest_cart_item in guest_cart_items:
#             total_amount += guest_cart_item.get_item_price()

#     context = {
#         'guest_cart_items': guest_cart_items,
#         'total_prices': total_amount
#     }

#     return render(request, 'cart/guest_cart.html', context)

# def remove_cart_item(request,carts_id):
#     cart_item = GuestCart.objects.get(id = carts_id)
#     cart_item.delete()
#     return HttpResponseRedirect(request.META.get('HTTP_REFERER'))
    


# def update_guestcart_quantity(request):
#     if request.method == 'POST' and request.headers.get('X-Requested-With') == 'XMLHttpRequest':
       
#         product_id = request.POST.get('product_id')
#         quantity = request.POST.get('quantity')
        
#         product = GuestCart.objects.get(id=product_id)
#         product.quantity = quantity
#         if product.product.discount_price:
#             product.price = product.product.discount_price * Decimal(product.quantity)
#         else:
#             product.price = product.product.price * Decimal(product.quantity)

#         product.save()
#         session_key = request.session.session_key
#         if not session_key:
#             request.session.save()
#             session_key = request.session.session_key
            
#         try:
#             session = Session.objects.get(session_key=session_key)
#         except Session.DoesNotExist:
#             session = None

#         guest_cart_items = GuestCart.objects.filter(session=session)

#         total_amount = 0

#         if guest_cart_items:
#             for guest_cart_item in guest_cart_items:
#                 total_amount += guest_cart_item.get_item_price()
        
#         # Prepare the response data
#         response_data = {
#             'success': True,
#             'message': 'Quantity updated successfully!',
#             'price': product.price,
#             'total_price':total_amount,
#             'quantity': str(product.quantity),
         
            
#         }

#         return JsonResponse(response_data)
    
#     response_data = {
#         'success': False,
#         'message': 'Invalid request',
#     }
    
#     return JsonResponse(response_data, status=400)
@api_view(['GET'])
def get_cart_counts(request):
    cart_count = 0
    wishlist_count = 0
    if request.user.is_authenticated:
        try:
            cart, created = Cart.objects.get_or_create(user=request.user)
            # Use Sum of quantities to show total items
            res = CartItems.objects.filter(cart=cart).aggregate(total=Sum('quantity'))
            cart_count = res['total'] if res['total'] else 0
        except Exception as e:
            print(f"Error in get_cart_counts: {e}")
            cart_count = 0
        
        from wishlist.models import Wishlist
        wishlist_count = Wishlist.objects.filter(user=request.user).exclude(product__id__isnull=True).count()
        
    # print(f"Counts for {request.user}: cart={cart_count}, wishlist={wishlist_count}")
    return Response({
        'cart_count': cart_count,
        'wishlist_count': wishlist_count
    })
