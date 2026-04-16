from django.shortcuts import render,redirect,get_object_or_404
from django.urls import reverse
from django.views.decorators.cache import cache_control

from django.contrib.auth import authenticate,login,logout
from django.contrib.auth.decorators import user_passes_test, login_required
from products.models import *
from userorder.models import *
from django.contrib.auth.models import User
from django.http import HttpResponseRedirect
from django.core.exceptions import ObjectDoesNotExist
from datetime import datetime
from django.db.models.functions import TruncDate
from django.db.models import Count
from django.conf import settings
from django.contrib import messages
from django.db.models import Sum
from userprofile.models import *
from cart.models import *
from banners.models import *
import razorpay


# Create your views here.
def is_superuser(user):
    return user.is_superuser

DEFAULT_VARIANT_SIZES = [
    '0-1 Years',
    '1-2 Years',
    '2-3 Years',
    '4-5 Years',
    '6-7 Years',
    '8-9 Years',
    '10-12 Years',
]

DEFAULT_VARIANT_COLORS = [
    'Pink',
    'Lavender',
    'Blue',
    'Dark Blue',
    'Maroon',
    'White',
    'Peach',
    'Cream',
]


def ensure_variant_options():
    for size_name in DEFAULT_VARIANT_SIZES:
        size.objects.get_or_create(size=size_name)

    for color_name in DEFAULT_VARIANT_COLORS:
        color.objects.get_or_create(color=color_name)

@cache_control(no_cache=True,must_revalidate=True,no_store=True)
def admin_signin(request):
   if request.user.is_authenticated and request.user.is_superuser:
       return redirect('admin_home')
   
   if request.method == 'POST':
      username = request.POST["username"]
     
      pass1 = request.POST['pass1']
    
      user = authenticate(username = username, password = pass1)

      if user is not None and user.is_superuser :
        
          login(request,user)
          return redirect('admin_home')
      else:
          return redirect('admin_signin')
      
   return render(request,'admin/signin.html')

@cache_control(no_cache=True,must_revalidate=True,no_store=True)
@login_required(login_url='admin_signin')  # This ensures that the user is logged in before accessing the view.
@user_passes_test(is_superuser, login_url='admin_signin') 
def adminpage(request):
    if request.user.is_superuser :
        products = Products.objects.all()
        return render(request,'admin/dashboard.html',{"products":products})
    else:
        return redirect('admin_signin')
    
@cache_control(no_cache=True,must_revalidate=True,no_store=True)
@login_required(login_url='admin_signin')  # This ensures that the user is logged in before accessing the view.
@user_passes_test(is_superuser, login_url='admin_signin')  # This restricts access to superusers only.
def admin_home(request):
    # Get the total order count and total price for all orders
    order_count = Order.objects.exclude(order_status='CANCELLED').count()
    total_price = Order.objects.exclude(order_status='CANCELLED').aggregate(total=Sum('total_price'))['total']
    total_customers = User.objects.filter(is_superuser=False, is_staff=False).count()
    categories = Category.objects.all()


    data = []

    for category in categories:
        product_count = Products.objects.filter(category=category).count()
        data.append(product_count)

    today = timezone.now().date()
    today_orders = Order.objects.filter(order_date__date=today)
    order_count_today = today_orders.count()
    total_price_today = sum(order.total_price for order in today_orders)
    
    recent_orders = Order.objects.order_by('-order_date')[:5]
    
    start_date = request.GET.get('start_date')
    
    end_date = request.GET.get('end_date')
    pending_order_count = Order.objects.filter(payment_status='PENDING').count()

    # Get the count of delivered orders
    delivered_order_count = Order.objects.filter(payment_status='PAID').count()
    
    context = {
            'pending_order_count': pending_order_count,
            'delivered_order_count': delivered_order_count,
            'categories': categories,
                'data': data,
            'start_date': start_date,
            'end_date': end_date,
            'recent_orders':recent_orders,
            'order_count': order_count,
            'total_price': total_price,
            'order_count_today': order_count_today,
            'total_price_today': total_price_today,
        }
    # # Filter orders based on the provided date range
    if not start_date and not end_date:
            # Calculate the current date
            current_date = timezone.now().date()

            # Calculate the date 30 days back from the current date
            default_start_date = current_date - timedelta(days=30)
            default_end_date = current_date

            # Convert to string format (YYYY-MM-DD)
            start_date = default_start_date.strftime('%Y-%m-%d')
            end_date = default_end_date.strftime('%Y-%m-%d')
    if start_date and end_date:
        start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
        end_date = datetime.strptime(end_date, "%Y-%m-%d").date()

    #     # Query the Order model and annotate the total price per date within the specified date range
        daily_totals = Order.objects.exclude(order_status='CANCELLED').filter(
            order_date__date__range=[start_date, end_date]
        ).annotate(date=TruncDate('order_date')).values('date').annotate(total=Sum('total_price')).order_by('date')

        top_product = Variant.objects.filter(orderitem__order__order_date__date__range=[start_date, end_date]).annotate(
            sale_count=Count('orderitem')
        ).order_by('-sale_count')[:3]
        orders_within_period = Order.objects.filter(
        order_date__date__range=[start_date, end_date]
    )

    # Get the count of pending orders within the date range
        pending_order_count = orders_within_period.filter(payment_status='PENDING').count()

    # Get the count of delivered orders within the date range
        delivered_order_count = orders_within_period.filter(payment_status='PAID').count() 
        # Pass the start and end dates to the template
        context = {
            'pending_order_count': pending_order_count,
            'delivered_order_count': delivered_order_count,
            'top_product':top_product,
            'categories': categories,
            'data': data,
            'start_date': start_date,
            'end_date': end_date,
            'daily_totals': daily_totals,
            'recent_orders':recent_orders,
            'order_count': order_count,
            'total_price': total_price,
            'order_count_today': order_count_today,
            'total_price_today': total_price_today,
            'total_customers': total_customers,
        }
        return render(request, 'admin/admin_home.html', context)


    return render(request, 'admin/admin_home.html', context)


def admin_logout(request):
    logout(request)
    return redirect('admin_signin')

@login_required(login_url='admin_signin')  # This ensures that the user is logged in before accessing the view.
@user_passes_test(is_superuser, login_url='admin_signin') 
def category(request):
    cat =Category.objects.all()
    context = {
        'cat':cat
    }
    return render(request,'admin/category.html',context)

@login_required(login_url='admin_signin')  # This ensures that the user is logged in before accessing the view.
@user_passes_test(is_superuser, login_url='admin_signin') 
def category_add(request):
    if request.method == 'POST':
        name = request.POST.get('name')
        image = request.FILES.get('image')
        if name and image:
            category = Category(name=name, image=image)
            category.slug = slugify(category.name)
            category.save()
            return redirect('category')

    return render(request, 'admin/category_add.html')

@login_required(login_url='admin_signin')  # This ensures that the user is logged in before accessing the view.
@user_passes_test(is_superuser, login_url='admin_signin') 
def addproduct(request):

    if request.method == 'POST':
        # Retrieve form data from the request
        product_name = request.POST.get('product_name')
        description = request.POST.get('description')
        category_id = request.POST.get('category')

        # Create the product
        category = Category.objects.get(id=category_id)
        product = Products.objects.create(
            name=product_name,
            descriptions=description,
            category=category
        )

        return redirect('adminpage')  # Redirect to the product list page after successful submission

    # Retrieve categories for the form
    categories = Category.objects.all()

    context = {
        'categories': categories,
    }

    return render(request, 'admin/productadd.html', context)

@cache_control(no_cache=True,must_revalidate=True,no_store=True)
@login_required(login_url='admin_signin')  # This ensures that the user is logged in before accessing the view.
@user_passes_test(is_superuser, login_url='admin_signin') 
def userlist(request):
    print("DEBUG: CUSTOMERS PAGE VIEW REACHED")
    userlist = User.objects.all()

    return render(request,'admin/userlist.html',{'userlist':userlist})

def block_user(request, user_id):
    user = get_object_or_404(User, id=user_id)
    user.is_active = False
    user.save()
    return HttpResponseRedirect(reverse('userlist'))  # Redirect to user list page after blocking

def unblock_user(request, user_id):
    pro = get_object_or_404(User, id=user_id)
    pro.is_active = True
    pro.save()
    return HttpResponseRedirect(reverse('userlist'))  # Redirect to user list page after unblocking

@login_required(login_url='admin_signin')  # This ensures that the user is logged in before accessing the view.
@user_passes_test(is_superuser, login_url='admin_signin') 
def category_delete(request,category_id):
    categorys = get_object_or_404(Category,id = category_id)
    categorys.delete()
     
    return redirect('category') 

def edit_category(request, category_id):
    category = get_object_or_404(Category, id=category_id)

    if request.method == 'POST':
        
        name = request.POST.get('name')
        image = request.FILES.get('image')

        category.name = name
        if image:
            category.image = image
        category.slug = slugify(category.name)
        category.save()

        # Redirect to the category list view or any other appropriate view
        return redirect('category')

    return render(request, 'admin/category_edit.html', {'category': category})

@cache_control(no_cache=True,must_revalidate=True,no_store=True)
@login_required(login_url='admin_signin')  # This ensures that the user is logged in before accessing the view.
@user_passes_test(is_superuser, login_url='admin_signin') 
def delete_product(request, product_id):
    product = get_object_or_404(Products, id=product_id)
    
    # Soft delete logic
    product. is_available = False
    product.save()

    return redirect('adminpage') 

@cache_control(no_cache=True,must_revalidate=True,no_store=True)
@login_required(login_url='admin_signin')  # This ensures that the user is logged in before accessing the view.
@user_passes_test(is_superuser, login_url='admin_signin') 
def activate_product(request, product_id):
    product = get_object_or_404(Products, id=product_id)
    
    # Soft delete logic
    product. is_available = True
    product.save()

    return redirect('adminpage') 

@cache_control(no_cache=True,must_revalidate=True,no_store=True)
@login_required(login_url='admin_signin')  # This ensures that the user is logged in before accessing the view.
@user_passes_test(is_superuser, login_url='admin_signin')            
def product_view(request,product_id):
    product = Variant.objects.filter(product=product_id)
    pro = Products.objects.get(id=product_id)
    context ={

        'product':product,
        'pro':pro
    }
    return render(request,'admin/product_view.html',context)

@login_required(login_url='admin_signin')  # This ensures that the user is logged in before accessing the view.
@user_passes_test(is_superuser, login_url='admin_signin') 
def variant_edit(request, variant_id):
    variant = get_object_or_404(Variant, id=variant_id)

    if request.method == 'POST':
        # Retrieve form data from the request
        variant_titles = request.POST.get('variant_title')
        colors = request.POST.get('colors')
        sizess = request.POST.get('sizes')
        price = request.POST.get('price')
        discount_price = request.POST.get('discount_price')
        stock = request.POST.get('stock')
        display_image = request.FILES.get('display_image')
        images = request.FILES.getlist('images')
        colorss = get_object_or_404(color, id=colors)
        sizes = get_object_or_404(size, id=sizess)
        if discount_price:
            pass
        else:
            discount_price = None

        variant.title = variant_titles
        variant.color = colorss
        variant.size = sizes
        variant.price = price
        variant.discount_price = discount_price
        variant.stock = stock

        if display_image:
            variant.variant_image = display_image

        variant.save()

        # Update or create product images
        for image in images:
            product_image.objects.create(product=variant, image=image)

        return redirect('product_view', product_id=variant.product.id)  # Redirect to the product view page after successful update
    ensure_variant_options()
    colors = color.objects.all()
    sizes = size.objects.all()

    context = {
        'variant': variant,
        'colors': colors,
        'sizes': sizes
    }

    return render(request, 'admin/variant_edit.html', context)

@login_required(login_url='admin_signin')  # This ensures that the user is logged in before accessing the view.
@user_passes_test(is_superuser, login_url='admin_signin') 
def variant_add(request,product_id):
    if request.method == 'POST':
        # Retrieve form data from the request
        variant_titles = request.POST.get('variant_title')
    
        colors = request.POST.get('colors')
        sizes = request.POST.get('sizes')
        price = request.POST.get('price')
        discount_price = request.POST.get('discount_price')
        stock = request.POST.get('stock')
        display_image = request.FILES.get('display_image')
        images = request.FILES.getlist('images')
        color_name = request.POST.get('custom_color')  # Get the selected or custom color

        if discount_price:
            pass
        else:
            discount_price = None
        product = Products.objects.get(id=product_id)

        if colors == 'other' and color_name:
            # Create a new color if it doesn't exist
            color_obj, _ = color.objects.get_or_create(color=color_name)
        else:
            color_obj = get_object_or_404(color, id=colors)

        size_slt = get_object_or_404(size, id=sizes)
        variant = Variant.objects.create(
            title=variant_titles,
            product=product,
            color=color_obj,
            size=size_slt,
            price=price,
            discount_price = discount_price,
            stock=stock,
            variant_image=display_image
        )

        # Create product images
        for image in images:
            product_image.objects.create(product=variant, image=image)

        return redirect('product_view',product_id=product_id)  # Redirect to the admin page after successful submission

    # Retrieve products, colors, and sizes for the form
    ensure_variant_options()
    products = Products.objects.all()
    colors = color.objects.all()
    sizes = size.objects.all()

    context = {
        'products': products,
        'colors': colors,
        'sizes': sizes
    }

    return render(request, 'admin/variant_add.html', context)

def delete_image(request,image_id):
    variant_image = product_image.objects.get(id=image_id)

    variant_image.delete()

    return HttpResponseRedirect(request.META.get('HTTP_REFERER'))

def delete_variant(request, variant_id):
    variant = get_object_or_404(Variant, id=variant_id)
    variant.delete()
    return redirect('product_view')

def add_custom_color(request):

    if request.method == 'POST':
        new_color = request.POST.get('customColor')
        if new_color:
            color.objects.get_or_create(color=new_color)
    colors = color.objects.all()
    context = {
        'colors': colors # Use 'colors' as the key in the context dictionary
    }

    return render(request, 'admin/add_custom_color.html', context)

@cache_control(no_cache=True,must_revalidate=True,no_store=True)
@login_required(login_url='admin_signin')  # This ensures that the user is logged in before accessing the view.
@user_passes_test(is_superuser, login_url='admin_signin') 
def sales_report(request):
    # Get the current date and time
    current_datetime = timezone.now()

    # Monthly Sales Report
    monthly_sales = Order.objects.filter(order_date__year=current_datetime.year).values('order_date__month').annotate(total_sales=Sum('total_price'))
    
    # Weekly Sales Report
    week_start_date = current_datetime - timedelta(days=current_datetime.weekday())
    week_end_date = week_start_date + timedelta(days=6)
    weekly_sales = Order.objects.filter(order_date__range=[week_start_date, week_end_date]).aggregate(total_sales=Sum('total_price'))
    
    # Top Selling Products
    top_selling_products = OrderItem.objects.values('product__title').annotate(total_sales=Sum('price')).order_by('-total_sales')[:5]
    
    # Daily Sales for the last 7 days
    daily_sales = Order.objects.filter(order_date__date__gte=current_datetime.date() - timedelta(days=7)).values('order_date__date').annotate(total_sales=Sum('total_price'))

    # Number of orders in the last 7 days
    orders_last_7_days = Order.objects.filter(order_date__date__gte=current_datetime.date() - timedelta(days=7)).count()

    # Number of orders in the last one month
    orders_last_30_days = Order.objects.filter(order_date__date__gte=current_datetime.date() - timedelta(days=30)).count()

    # Number of pending orders for today
    pending_orders_today = Order.objects.filter(order_date__date=current_datetime.date(), payment_status='PENDING').count()

    # Number of delivered orders for today
    delivered_orders_today = Order.objects.filter(order_date__date=current_datetime.date(), order_status='DELIVERED').count()

    context = {
        'monthly_sales': monthly_sales,
        'weekly_sales': weekly_sales,
        'top_selling_products': top_selling_products,
        'daily_sales': daily_sales,
        'orders_last_7_days': orders_last_7_days,
        'orders_last_30_days': orders_last_30_days,
        'pending_orders_today': pending_orders_today,
        'delivered_orders_today': delivered_orders_today,
    }

    return render(request, 'admin/sales_report.html', context)

@cache_control(no_cache=True,must_revalidate=True,no_store=True)
@login_required(login_url='admin_signin')  # This ensures that the user is logged in before accessing the view.
@user_passes_test(is_superuser, login_url='admin_signin') 
def order_all(request, status):
    order=Order.objects.all()
    if status == 'all':
        orders = order.all().order_by('-order_date')
    elif status == 'PAID':
        orders= order.filter(payment_status=status).order_by('-order_date')
    elif status == 'PENDING':
        orders= order.filter(payment_status=status).order_by('-order_date')
    elif status == 'CANCELLED':
        orders= order.filter(payment_status=status).order_by('-order_date')
    elif status == 'REFUNDED':
        orders= order.filter(payment_status=status).order_by('-order_date')
    
    context ={
        'order':orders,
    }
    return render(request,'admin/all_orders.html',context)


@cache_control(no_cache=True,must_revalidate=True,no_store=True)
@login_required(login_url='admin_signin')  # This ensures that the user is logged in before accessing the view.
@user_passes_test(is_superuser, login_url='admin_signin') 
def order_views(request,order_id):
    orders = Order.objects.get(id=order_id)
    status = Order.PAYMENT_STATUS_CHOICES
    user = orders.user
  
    order = Order.ORDER_STATUS_CHOICES
    items = OrderItem.objects.filter(order=orders)
    total_price = sum(item.price * item.quantity for item in items)
    if request.method == 'POST':
        
        order_status = request.POST.get('order_status')
        orders.order_status = order_status
        money = 180
        walletss = 100

        if orders.order_status == "DELIVERED":
            orders.payment_status = "PAID"
            
            has_completed_order = Order.objects.filter(user=request.user, order_status='DELIVERED').exists()
            if not has_completed_order:
             
                buyer_wallet = wallet.objects.get(user=user)
                try:
                    referral = Referral.objects.get(user=user)
                    
                    if referral.referred_by :
                        referral_wallet = wallet.objects.get(user=referral.referred_by)
                        referral_wallet.Wallettotal += walletss
                        referral_wallet.save()  # Save changes to referral_wallet
                        buyer_wallet.Wallettotal += money
                        buyer_wallet.save()  # Save changes to buyer_wallet

                    else: 
                        messages.error(request, "Invalid referral code.")
                  
                except Referral.DoesNotExist:
                    messages.error(request, "Invalid referral code.")

        orders.save()      

    context = {
        'order':order,
        'status':status,
        'orders':orders,
        'items':items,
        'total_price':total_price
    }
    return render(request,'admin/order_views.html',context)

@login_required(login_url='admin_signin')  # This ensures that the user is logged in before accessing the view.
@user_passes_test(is_superuser, login_url='admin_signin') 
def cancel_order(request, order_id):
    order = get_object_or_404(Order, id=order_id)

    if order.payment_status != 'PAID' and order.payment_status != 'CANCELLED':
        # Update the payment status to 'CANCELLED'
        order_items = OrderItem.objects.filter(order=order)
        for item in order_items:
            variant = item.product  
            variant.stock += item.quantity
            variant.save()

        order.payment_status = 'CANCELLED'
        order.order_status = 'CANCELLED'
        order.save()

    return redirect('order_all')

@cache_control(no_cache=True,must_revalidate=True,no_store=True)
@login_required(login_url='admin_signin')  # This ensures that the user is logged in before accessing the view.
@user_passes_test(is_superuser, login_url='admin_signin') 
def banner_view(request):
    banner = Banner.objects.all()
    variant = Variant.objects.all()
    if request.method == 'POST':
        banner_name = request.POST.get('banner_name')
        # variant_id = request.POST.get('varaints')
        banner_image = request.FILES.get('banner_image')
        
        is_active = request.POST.get('is_active')
        # Retrieve the Category instance based on the selected category_id

        # variants = Variant.objects.get(id=variant_id)
        # Create the Banner object with the correct category assignment
        banner = Banner.objects.create(
            name=banner_name,
            # variants = variants,
            banner_image=banner_image,
            is_active=bool(is_active),
        )

        # Redirect to a success page or any other appropriate view
        return HttpResponseRedirect(request.META.get('HTTP_REFERER'))
    
    context ={
        'variant':variant,
        'banner':banner
        }
    return render(request,"admin/banner.html",context)

def return_orders(request):
    orders = Order.objects.filter(order_status = 'PENDING')

    context = {
        'order':orders
    }
    return render(request,'admin/return_orders.html',context)

def refund(request,order_id):

    order = Order.objects.get(id = order_id)

    if order.order_status == 'PENDING' and order.payment_method == 'RAZORPAY' and order.payment_status == 'PAID':
        client = razorpay.Client(auth=(settings.RAZOR_KEY_ID, settings.RAZOR_KEY_SECRET))
        refund_response = client.payment.refund(order.razor_pay_payment_id, {'amount': int(order.total_price * 100)})

        # Refund successful
        
        order.payment_status = 'REFUNDED'  
    
        if refund_response['status'] == 'processed':
        
            buyer_wallet = wallet.objects.get(user=order.user)
            buyer_wallet.Wallettotal += order.total_price
            buyer_wallet.save()
            order.order_status = 'RETURNED'
            order.save()
            messages.success(request, "Order successfully cancelled. Refund processed to the wallet.")
        else:
            messages.error(request, "Unable to process the refund. Please try again later.")
            return redirect('return_orders')

    order_items = OrderItem.objects.filter(order=order)
    for item in order_items:
        variant = item.product  
        variant.stock += item.quantity
        variant.save()
    if order.payment_status =='PAID' and order.payment_method != 'RAZORPAY':
        buyer_wallet = wallet.objects.get(user=order.user)
        buyer_wallet.Wallettotal += order.total_price
        buyer_wallet.save()
        order.payment_status = 'REFUNDED'
        order.order_status = 'RETURNED'
    order.save()

    messages.success(request, "Order successfully cancelled.")

    return redirect('return_orders')

@cache_control(no_cache=True,must_revalidate=True,no_store=True)
@login_required(login_url='admin_signin')  # This ensures that the user is logged in before accessing the view.
@user_passes_test(is_superuser, login_url='admin_signin') 
def coupon_view(request):
    coupon = Coupon.objects.all()
    if request.method == 'POST':
        coupon_code = request.POST.get('coupon')
        discount_price = request.POST.get('discount_amount')
        minimum_amount = request.POST.get('minimum_amount')
        is_expired = 'is_expired' in request.POST

        # Create a new Coupon object
        coupon = Coupon.objects.create(
            coupon_code=coupon_code,
            discount_price=discount_price,
            mininum_amount=minimum_amount,
            is_expired=is_expired
        )
        return HttpResponseRedirect(request.META.get('HTTP_REFERER'))
    context ={
        'coupon':coupon
    }

    return render(request,"admin/coupon.html",context)

def banner_block(request,banner_id):
    banner = Banner.objects.get(id=banner_id)
    banner.is_active = False
    banner.save()
    return HttpResponseRedirect(request.META.get('HTTP_REFERER'))

def banner_active(request,banner_id):
    banner = Banner.objects.get(id=banner_id)
    banner.is_active = True
    banner.save()
    return HttpResponseRedirect(request.META.get('HTTP_REFERER'))

def banner_remove(request,banner_id):
    banner = Banner.objects.get(id=banner_id)
    banner.delete()
    return HttpResponseRedirect(request.META.get('HTTP_REFERER'))

@cache_control(no_cache=True,must_revalidate=True,no_store=True)
@login_required(login_url='admin_signin')  # This ensures that the user is logged in before accessing the view.
@user_passes_test(is_superuser, login_url='admin_signin') 
def edit_banner(request, banner_id):
    # Retrieve the banner you want to edit from the database
    banner = get_object_or_404(Banner, id=banner_id)

    if request.method == 'POST':
        banner_name = request.POST.get('banner_name')
        # variant_id = request.POST.get('variants')
        banner_image = request.FILES.get('banner_image')
        is_active = request.POST.get('is_active')
        # variants = Variant.objects.get(id=variant_id)
        banner.name = banner_name
        # banner.variants = variants
        if banner_image:
            banner.banner_image = banner_image
        banner.is_active = bool(is_active)
        banner.save()

        return redirect('banner_view')

    variants = Variant.objects.all()
    context={'banner': banner, 'variants': variants}

    return render(request, 'admin/edit_banner.html',context )

def coupon_expired(request,coupon_id):
    coupon = Coupon.objects.get(id = coupon_id)
    coupon.is_expired = True
    coupon.save()

    return HttpResponseRedirect(request.META.get('HTTP_REFERER'))\

def coupon_activate(request,coupon_id):
    coupon = Coupon.objects.get(id = coupon_id)
    coupon.is_expired = False
    coupon.save()
    
    return HttpResponseRedirect(request.META.get('HTTP_REFERER'))

@login_required(login_url='admin_signin')
def offer_management(request):
    return render(request,'admin/offer_management.html')

@login_required(login_url='admin_signin')
def category_offer(request):
    context = Category.objects.all()

    return render(request,'admin/category_offer.html',{'categories': context })

@login_required(login_url='admin_signin')
def category_offer_disable(request,id):
    cat_off = Category_Offer.objects.get(id=id)
    if cat_off.active == True:
        cat_of = Category_Offer.objects.filter(id=id)
        cat_of.update(active = False, discount=0)
    elif cat_off.active == False:
        cat_of = Category_Offer.objects.filter(id=id)
        cat = cat_of.update(active = True,discount=0)
    return redirect('category_offer')

@login_required(login_url='admin_signin')
def product_offer(request):
    if request.method == 'POST':
        search = request.POST["product_search"] 
        context = Products.objects.filter(name__icontains = search)
        return render(request,'admin/product_offer.html',{'products': context })
    product= Products.objects.all()
    variants=Variant.objects.all()
    context={
        'products':product,
        'variants': variants
    }
    return render( request,'admin/product_offer.html',context)
   
@login_required(login_url='admin_signin')
def product_offer_disable(request,id):
    product_off = Products.objects.get(id=id)
   
    if product_off.Is_offer_active == True:
        product_of = Products.objects.filter(id=id)
     
        product_of.update(Is_offer_active = False, product_offer = 0)
    elif product_off.Is_offer_active == False:
        product_of = Products.objects.filter(id=id)
        product_of.update(Is_offer_active = True, product_offer = 0)
    return redirect('product_offer')

@login_required(login_url='admin_signin')
def product_offer_edit(request,id):
    product = Variant.objects.get(id=id)
    val = request.POST.get('offer')
    
    if request.method == "POST":
        if Variant.objects.filter(id=id).exists():
            offr = Variant.objects.filter(id=id)
            offer = request.POST['offers']
            if len(offer) == 0:
                offer = 0
            if int(offer) <= 71 and int(offer) >= 0 :
                offr.update(product_offer=offer)
                return redirect('product_offer')
            else :
                messages.error(request,"Offer must be between 0% to 70%")
                return render(request,'admin/product_offer_edit.html',{'product':product, 'id':id})
        else:
            return redirect('product_offer')
    else:
        return render(request,'admin/product_offer_edit.html',{'product':product, 'id':id})
    
@login_required(login_url='admin_signin')
def add_edit_catoffer(request,id):
    cat_id =id
    val = request.POST.get("offer")
    category = Category.objects.get(id = cat_id)
    if request.method == "POST":
        if Category_Offer.objects.filter(category_id=cat_id).exists():
            offr = Category_Offer.objects.filter(category_id=cat_id)
            offer = request.POST['offers']
            if len(offer) == 0:
                offer = 0
            if int(offer) <= 71 and int(offer) >= 0 :
                category = val
                offr.update(discount = offer)
                
                return redirect('category_offer')
            else :
                messages.error(request,"Offer must be between 0% to 70%")
                offr = Category_Offer.objects.get(category_id=cat_id)
                discount = offr.discount

                return render(request,'admin/add_edit_catoffer.html',{'cat_id':cat_id , 'category':category ,'discount':discount})

        else:
            offer = request.POST['offers']
            category = val
            offr = Category_Offer.objects.create(category_id=cat_id,category=val,discount = offer)
            offr.save()
            return redirect('category_offer')
    
    if Category_Offer.objects.filter(category_id=cat_id).exists():
        offr = Category_Offer.objects.get(category_id=cat_id)
        discount = offr.discount
      
        return render(request,'admin/add_edit_catoffer.html',{'cat_id':cat_id , 'category':category ,'discount':discount})
    else:
        return render(request,'admin/add_edit_catoffer.html',{'cat_id':cat_id , 'category':category })
