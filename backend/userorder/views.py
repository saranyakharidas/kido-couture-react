from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render,redirect,get_object_or_404
from userprofile.models import *
from cart.models import *
from userorder.models import*
import razorpay
from django.conf import settings
from django.http import JsonResponse
from coupon.models import Coupon,Usercoupon
from django.views.decorators.cache import cache_control
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.contrib import messages
from django.db.models import Sum
from django.views.decorators.csrf import csrf_exempt

from rest_framework.decorators import api_view
from rest_framework.response import Response
from .serializers import UserAddressSerializer, OrderSerializer
from cart.serializers import CartSerializer
import json

@api_view(['GET'])
@login_required(login_url='signin')
def ordertable_api(request):
    orders = Order.objects.filter(user=request.user).annotate(total_products=Sum('orderitem__quantity')).order_by('-order_date')
    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@login_required(login_url='signin')
def order_view_api(request, order_id):
    try:
        order = Order.objects.get(id=order_id, user=request.user)
        serializer = OrderSerializer(order)
        return Response(serializer.data)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=404)

@api_view(['POST'])
@login_required(login_url='signin')
def cancel_order_api(request, order_id):
    order = get_object_or_404(Order, id=order_id, user=request.user)

    if order.payment_status == 'PAID' and order.payment_method == 'RAZORPAY' and order.order_status != 'DELIVERED':
        client = razorpay.Client(auth=(settings.RAZOR_KEY_ID, settings.RAZOR_KEY_SECRET))
        try:
            refund_response = client.payment.refund(order.razor_pay_payment_id, {'amount': int(order.total_price * 100)})
            if refund_response['status'] == 'processed':
                order.payment_status = 'REFUNDED'
                buyer_wallet, _ = wallet.objects.get_or_create(user=order.user)
                buyer_wallet.Wallettotal += order.total_price
                buyer_wallet.save()
            else:
                return Response({'error': 'Razorpay refund failed'}, status=500)
        except Exception as e:
            return Response({'error': str(e)}, status=500)
    elif order.payment_status == 'PAID' and order.payment_method != 'RAZORPAY':
        buyer_wallet, _ = wallet.objects.get_or_create(user=order.user)
        buyer_wallet.Wallettotal += order.total_price
        buyer_wallet.save()

    order_items = OrderItem.objects.filter(order=order)
    for item in order_items:
        variant = item.product  
        variant.stock += item.quantity
        variant.save()
        
    order.payment_status = 'CANCELLED'
    order.order_status = 'CANCELLED'
    order.save()

    return Response({'success': True, 'message': 'Order successfully cancelled'})

@api_view(['GET'])
@login_required(login_url='signin')
def checkout_api(request):
    try:
        cart = Cart.objects.get(user=request.user)
        items = CartItems.objects.filter(cart=cart)
        if not items.exists():
            return Response({'error': 'Cart is empty'}, status=400)
            
        wallets, created = wallet.objects.get_or_create(user=request.user)
        addresses = UserAddress.objects.filter(user=request.user, is_active=True)
        
        subtotal = items.aggregate(total_price=Sum('price'))['total_price'] or 0
        total_price = subtotal
        
        if cart.coupons:
            coupon = cart.coupons
            total_price = max(0, subtotal - coupon.discount_price)

        cart_data = CartSerializer(cart).data
        address_data = UserAddressSerializer(addresses, many=True).data

        return Response({
            'cart': cart_data,
            'wallets': {'balance': wallets.Wallettotal},
            'addresses': address_data,
            'summary': {
                'subtotal': subtotal,
                'total_price': total_price,
                'discount': coupon.discount_price if cart.coupons else 0
            }
        })
    except Cart.DoesNotExist:
        return Response({'error': 'Cart not found'}, status=404)

@api_view(['POST'])
@login_required(login_url='signin')
def place_order_api(request):
    try:
        data = request.data
        address_id = data.get('address_id')
        payment_method = data.get('payment_method') # CASH_ON_DELIVERY or WALLET
        
        user_add = get_object_or_404(UserAddress, id=address_id, user=request.user)
        cart = Cart.objects.get(user=request.user)
        items = CartItems.objects.filter(cart=cart)
        
        if not items.exists():
            return Response({'error': 'Cart is empty'}, status=400)
            
        subtotal = items.aggregate(total_price=Sum('price'))['total_price'] or 0
        total_price = subtotal
        
        if cart.coupons:
            min_amount = cart.coupons.discount_price
            total_price = max(0, subtotal - min_amount)

        # Handle Wallet Payment
        payment_status = 'PENDING'
        if payment_method == 'WALLET':
            user_wallet = wallet.objects.get(user=request.user)
            if user_wallet.Wallettotal < total_price:
                return Response({'error': 'Insufficient wallet balance'}, status=400)
            with transaction.atomic():
                user_wallet.Wallettotal -= total_price
                user_wallet.save()
                payment_status = 'PAID'
        elif payment_method == 'CASH_ON_DELIVERY':
            payment_status = 'PENDING'
        else:
            return Response({'error': 'Invalid payment method'}, status=400)
            
        with transaction.atomic():
            order = Order.objects.create(
                user=request.user,
                address=user_add,
                total_price=total_price,
                order_status='ORDERED',
                payment_status=payment_status,
                payment_method=payment_method,
            )
            
            if cart.coupons:
                Usercoupon.objects.create(
                    user=request.user,
                    coupon=cart.coupons,
                    used=True,
                    total_price=total_price
                )
                cart.coupons = None
                cart.save()

            for cart_item in items:
                OrderItem.objects.create(
                    order=order,
                    product=cart_item.product,
                    price=cart_item.price,
                    quantity=cart_item.quantity
                )
                variant = cart_item.product
                variant.stock -= cart_item.quantity
                variant.save()
                
            items.delete()
            
            return Response({'success': True, 'order_id': order.id})

    except Exception as e:
        return Response({'error': str(e)}, status=500)
        
# Create your views here.
@cache_control(no_cache=True,must_revalidate=True,no_store=True)
@login_required(login_url='signin')
def checkout(request, address_id):
    cart = get_object_or_404(Cart, user=request.user)
    cartitems = CartItems.objects.filter(cart = cart)
    if cartitems:

        wallets = wallet.objects.get(user = request.user)
        user_add = get_object_or_404(UserAddress, id=address_id, user=request.user)
        try:
            cart = Cart.objects.get(user=request.user)
        except Cart.DoesNotExist:
            cart = None
        
        items = CartItems.objects.filter(cart=cart)
        subtotal = sum(item.price * item.quantity for item in items)
        total_price = float(subtotal)
        
        if cart.coupons:
            total_price = max(0, total_price - cart.coupons.discount_price)

        context = {
            'wallets':wallets,
            'cart':cart,
            'subtotal': subtotal,
            'user_add': user_add,
            'cart': cart,
            'total_price': total_price
        }

        return render(request, "order/checkout.html", context)
    
    return redirect('shop',0)



@cache_control(no_cache=True,must_revalidate=True,no_store=True)
@csrf_exempt
def online_payment_order(request, userId):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Please sign in to complete your order'}, status=401)
    
    if request.method == 'POST':
        payment_id = request.POST.getlist('payment_id')[0]
        orderId = request.POST.getlist('orderId')[0]
        signature = request.POST.getlist('signature')[0]
        user_adds = UserAddress.objects.get(id=userId, user=request.user)
        cartss = Cart.objects.get(user=request.user)
        items = CartItems.objects.filter(cart=cartss)
       
        subtotal = sum(item.price * item.quantity for item in items)
        total_price = float(subtotal)

        if cartss.coupons:
            total_price = max(0, total_price - cartss.coupons.discount_price)
    
        order = Order.objects.create(
            user=request.user,
            address=user_adds,
            total_price=total_price,
            payment_status='PAID',
            payment_method='RAZORPAY',
            order_status = 'ORDERED',
            razor_pay_payment_id=payment_id,
            razor_pay_payment_signature=signature,
            razor_pay_order_id = orderId,
        )
       
        if cartss.coupons:
            Usercoupon.objects.create(
                user=request.user,
                coupon=cartss.coupons,
                used=True,
                total_price=total_price
            )
            cartss.coupons = None
            cartss.save()
        else:
        # Add any additional logic that should be executed when no coupon is used
            pass

        for cart_item in items:
            OrderItem.objects.create(
                order=order,
                product=cart_item.product,
                price=cart_item.price,
                quantity=cart_item.quantity
            )
            variant = cart_item.product
            variant.stock -= cart_item.quantity
            variant.save()

        orderId = order.id
        items.delete()

        return JsonResponse({'message': 'Order placed successfully','orderId':orderId})
    else:
        # Handle invalid request method (GET, etc.)
        return JsonResponse({'error': 'Invalid request method'})
    



@cache_control(no_cache=True,must_revalidate=True,no_store=True)
@login_required(login_url='signin')
def place_order(request, userId):
    user_adds = UserAddress.objects.get(id=userId, user=request.user)
    cartss = Cart.objects.get(user=request.user)
    items = CartItems.objects.filter(cart=cartss)
    subtotal = sum(item.price * item.quantity for item in items)
    total_price = float(subtotal)
    
    if cartss.coupons:
        total_price = max(0, total_price - cartss.coupons.discount_price)
    
    order = Order.objects.create(
        user=request.user,
        address=user_adds,
        total_price=total_price,
        order_status='ORDERED',
        payment_status='PENDING',
        payment_method='CASH_ON_DELIVERY',
    )
    
    if cartss.coupons:
        Usercoupon.objects.create(
            user=request.user,
            coupon=cartss.coupons,
            used=True,
            total_price=total_price
        )
        cartss.coupons = None
        cartss.save()
    else:
        # Add any additional logic that should be executed when no coupon is used
        pass

    for cart_item in items:
        OrderItem.objects.create(
            order=order,
            product=cart_item.product,
            price=cart_item.price,
            quantity=cart_item.quantity
        )
      
        variant = cart_item.product
        variant.stock -= cart_item.quantity
        variant.save()

    items.delete()
    itemss = OrderItem.objects.filter(order=order)

    context = {
        'items': itemss,
        'total_price': total_price,
        'orders': order
    }
    return render(request, "order/order_success.html", context)


@cache_control(no_cache=True,must_revalidate=True,no_store=True)
@login_required(login_url='signin')
def pay_wallet(request, userId):
    user_adds = UserAddress.objects.get(id=userId, user=request.user)
    cartss = Cart.objects.get(user=request.user)
    items = CartItems.objects.filter(cart=cartss)
    subtotal = sum(item.price * item.quantity for item in items)
    total_price = float(subtotal)

    if cartss.coupons:
        total_price = max(0, total_price - cartss.coupons.discount_price)
    else:
        total_price = total_price

    # Get the user's wallet
    user_wallet = wallet.objects.get(user=request.user)

    # Check if the wallet balance is sufficient for payment
    wallet_balance = user_wallet.Wallettotal
 
    payment_status = 'PAID'
    wallet_balance -= total_price

    # Start a transaction to ensure data consistency
    with transaction.atomic():
        # Deduct the payment amount from the wallet if paid using the wallet
        if payment_status == 'PAID':
            user_wallet.Wallettotal = wallet_balance
            user_wallet.save()

        # Create the order
        order = Order.objects.create(
            user=request.user,
            address=user_adds,
            total_price=total_price,
            order_status='ORDERED',
            payment_status=payment_status,
            payment_method='WALLET' 
        )

        # Process the coupon if applicable
        if cartss.coupons:
            Usercoupon.objects.create(
                user=request.user,
                coupon=cartss.coupons,
                used=True,
                total_price=total_price
            )
            cartss.coupons = None
            cartss.save()

        # Create order items and update variant stock
        for cart_item in items:
            OrderItem.objects.create(
                order=order,
                product=cart_item.product,
                price=cart_item.price,
                quantity=cart_item.quantity
            )

            variant = cart_item.product
            variant.stock -= cart_item.quantity
            variant.save()

        items.delete()
        itemss = OrderItem.objects.filter(order=order)

    context = {
        'items': itemss,
        'total_price': total_price,
        'orders': order
    }
    return render(request, "order/order_success.html", context)

@cache_control(no_cache=True,must_revalidate=True,no_store=True)
@login_required(login_url='signin')
def ordertable(request):
    # Order the orders by the newest order first (based on the 'created_at' field)
    order = Order.objects.filter(user=request.user).annotate(total_products=Sum('orderitem__quantity')).order_by('-order_date')

    context = {
        'order': order
    }
    return render(request, 'order/ordertable.html', context)


@cache_control(no_cache=True,must_revalidate=True,no_store=True)
@login_required(login_url='signin')
def order_view(request,order_id):
    orders = Order.objects.get(id=order_id)
    items = OrderItem.objects.filter(order=orders)
    total_price = sum(item.price * item.quantity for item in items)

    context = {
        'orders':orders,
        'items':items,
        'total_price':total_price
    }
   

    return render(request,"order/order_view.html",context)

@cache_control(no_cache=True,must_revalidate=True,no_store=True)
@login_required(login_url='signin')
def cancel_orders(request, order_id):
    # Retrieve the order or show a 404 page if the order does not exist
    order = get_object_or_404(Order, id=order_id)

    if order.payment_status == 'PAID' and order.payment_method == 'RAZORPAY' and order.order_status != 'DELIVERED':
        # Refund the payment through Razorpay
        client = razorpay.Client(auth=(settings.RAZOR_KEY_ID, settings.RAZOR_KEY_SECRET))
        refund_response = client.payment.refund(order.razor_pay_payment_id, {'amount': int(order.total_price * 100)})
    
        # Refund successful
        order.payment_status = 'REFUNDED'  
        order.save()
        if refund_response['status'] == 'processed':
        
            buyer_wallet = wallet.objects.get(user=order.user)
            buyer_wallet.Wallettotal += order.total_price
            buyer_wallet.save()

            messages.success(request, "Order successfully cancelled. Refund processed to the wallet.")
        else:
            messages.error(request, "Unable to process the refund. Please try again later.")
            return redirect('order_all')

    # Update the payment status to 'CANCELLED' and order status to 'CANCELLED'
    order_items = OrderItem.objects.filter(order=order)
    for item in order_items:
        variant = item.product  
        variant.stock += item.quantity
        variant.save()
    if order.payment_status =='PAID' and order.payment_method != 'RAZORPAY':
        buyer_wallet = wallet.objects.get(user=order.user)
        buyer_wallet.Wallettotal += order.total_price
        buyer_wallet.save()

    # Set the payment and order status to 'CANCELLED'
    order.payment_status = 'CANCELLED'
    order.order_status = 'CANCELLED'
    order.save()

    messages.success(request, "Order successfully cancelled.")

    return HttpResponseRedirect(request.META.get('HTTP_REFERER'))

@cache_control(no_cache=True, must_revalidate=True, no_store=True)
@csrf_exempt
def initiate_payment(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Please sign in to complete your order'}, status=401)

    if request.method == 'POST':
        try:
            cartss = Cart.objects.get(user=request.user)
            items = CartItems.objects.filter(cart=cartss)
            
            if not items.exists():
                return JsonResponse({'error': 'Cart is empty'}, status=400)

            # Calculate subtotal using the sum of (price * quantity) if needed, 
            # but CartItems has a price field which usually represents unit price.
            # Looking at CartItems.get_item_price, it's price * quantity.
            
            subtotal = sum(item.price * item.quantity for item in items)
            total_price = float(subtotal)

            if cartss.coupons:
                total_price = max(0, total_price - cartss.coupons.discount_price)

            client = razorpay.Client(auth=(settings.RAZOR_KEY_ID, settings.RAZOR_KEY_SECRET))
            
            # Razorpay expects amount in paise (multiply by 100)
            razorpay_order = client.order.create({
                'amount': int(total_price * 100),
                'currency': 'INR',
                'payment_capture': 1
            })

            response_data = {
                'order_id': razorpay_order['id'],
                'amount': razorpay_order['amount'],
                'currency': razorpay_order['currency'],
                'key': settings.RAZOR_KEY_ID,
            }
            return JsonResponse(response_data)
        except Cart.DoesNotExist:
            return JsonResponse({'error': 'Cart not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Invalid request method'}, status=405)

@cache_control(no_cache=True,must_revalidate=True,no_store=True)
@login_required(login_url='signin')
def order_success(request,orderId):
    orders = Order.objects.get(id=orderId)
    items = OrderItem.objects.filter(order=orders)
    total_price = sum(item.price * item.quantity for item in items)

    context = {
        'orders':orders,
        'items':items,
        'total_price':total_price
    }


    return render(request,"order/order_success.html",context)

def order_pdf(request,order_id):
    order = Order.objects.get(id = order_id)
    items = OrderItem.objects.filter(order = order)
    for item in items:
        item.total_price = item.product.price * item.quantity
    context = {
        'item':items,
        'order':order
    }
    return render(request,"order/order_pdf.html",context)
 
def return_order(request,order_id):
    order = Order.objects.get(id = order_id)

    if order.payment_status == 'PAID' and order.payment_method == 'RAZORPAY' and order.order_status == 'DELIVERED':
        order.order_status ='PENDING'

    elif order.payment_status == 'PAID' and order.payment_method == 'WALLET' and order.order_status == 'DELIVERED':
        order.order_status ='PENDING'
    elif order.payment_status == 'PAID' and order.payment_method == 'CASH_ON_DELIVERY' and order.order_status == 'DELIVERED':
        order.order_status ='PENDING'
    order.save()

    return redirect('ordertable')
