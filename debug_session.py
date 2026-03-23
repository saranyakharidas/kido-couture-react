import requests

def test_api_with_login():
    session = requests.Session()
    # 1. Get signin page for CSRF
    login_url = 'http://localhost:8000/signin/'
    response = session.get(login_url)
    csrf_token = session.cookies.get('csrftoken')
    
    # 2. Login (This is hard because of OTP, but let's see if we can at least see if the session is created)
    # Actually, let's try to bypass or check if a known user exists.
    
    # Let's try to call the API directly without login first to see if it works with a session object
    api_url = 'http://localhost:8000/api/shop/0'
    api_resp = session.get(api_url)
    print(f"Status: {api_resp.status_code}")
    print(f"Data count: {len(api_resp.json()) if api_resp.status_code == 200 else 'N/A'}")
    
    # Check if there are any error messages in the HTML if we hit the non-api shop view
    shop_resp = session.get('http://localhost:8000/shop/0')
    print(f"Shop Page Status: {shop_resp.status_code}")
    if "No objects found" in shop_resp.text:
        print("Found 'No objects found' in page text")

if __name__ == '__main__':
    test_api_with_login()
