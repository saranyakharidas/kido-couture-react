import requests
import json

try:
    response = requests.get('http://localhost:8000/api/shop/0')
    if response.status_code == 200:
        data = response.json()
        print(json.dumps(data[:1], indent=2))
    else:
        print(f"Error: {response.status_code}")
except Exception as e:
    print(f"Exception: {e}")
