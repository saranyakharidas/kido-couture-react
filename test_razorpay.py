import os
import django
import sys

# Set up Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecom.settings')
django.setup()

from django.conf import settings
import razorpay

def test_razorpay():
    print(f"Key ID: {settings.RAZOR_KEY_ID}")
    try:
        client = razorpay.Client(auth=(settings.RAZOR_KEY_ID, settings.RAZOR_KEY_SECRET))
        order = client.order.create({
            'amount': 100,  # 1 INR
            'currency': 'INR',
            'payment_capture': 1
        })
        print("Order created successfully!")
        print(f"Order ID: {order['id']}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_razorpay()
