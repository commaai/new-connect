from utils.defaults import API_URL, ACCOUNT
from datetime import datetime
import requests

class API:
    def __init__(self, token=ACCOUNT):
        self.token = token

    def request(self, endpoint):
        response = requests.get(f'{API_URL}{endpoint}', headers={ 'Authorization': f'JWT {self.token}' })

        if response.status_code == 200:
            return response.json()
        else: 
            print(f'Response {response.text}, status code: {response.status_code}')
            return None

    def devices(self):
        response = self.request('/v1/me/devices')

        def _get_name(device):
            alias = device['alias']
            return alias if alias else f"comma {device['device_type']}"

        return { _get_name(device): device['dongle_id'] for device in response}
    
    def routes(self, dongleId):
        response = self.request(f'/v1/devices/{dongleId}/routes_segments?limit=1000')

        def _format_date(date):
            obj = datetime.fromisoformat(date)
            return obj.strftime("%B %d, %Y @ %I:%M %p")
        
        def _route_id(fullname):
            return fullname.split("|")[1]

        return { _format_date(route['start_time']): _route_id(route['fullname']) for route in response }