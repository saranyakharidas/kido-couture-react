
from django import template
from cart.models import CartItems
from wishlist.models import Wishlist

register = template.Library()

@register.simple_tag(takes_context=True)
def cart_items_count(context):
    user = context['request'].user
    if user.is_authenticated:
        # Import sum locally to avoid conflicts if needed, but it's already in the model usually
        from cart.models import CartItems
        from django.db.models import Sum
        res = CartItems.objects.filter(cart__user=user).aggregate(total=Sum('quantity'))
        return res['total'] if res['total'] else 0
    return 0

@register.simple_tag(takes_context=True)
def wishlist_count(context):
    user = context['request'].user
    if user.is_authenticated:
        # Exclude items with no product (buggy leftover from account signals)
        return Wishlist.objects.filter(user=user).exclude(product__id__isnull=True).count()
    return 0

@register.filter
def in_wishlist(user, product_id):
    
    return Wishlist.objects.filter(user=user, product__id=product_id).exists()

@register.simple_tag(takes_context=True)
def is_active(context, url_name):
    # Get the current request object from the context
    request = context['request']
    
    # Check if the given URL name matches the view name of the current URL
    if request.resolver_match.view_name == url_name:
        return 'active'
    return ''