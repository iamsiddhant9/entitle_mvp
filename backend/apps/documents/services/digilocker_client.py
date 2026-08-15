import json
import base64
import requests
from django.conf import settings
from rest_framework.exceptions import APIException

class DigiLockerClient:
    """
    Handles OAuth and document fetching with DigiLocker API (Sandbox).
    """

    def __init__(self):
        self.client_id = getattr(settings, 'DIGILOCKER_CLIENT_ID', None)
        self.client_secret = getattr(settings, 'DIGILOCKER_CLIENT_SECRET', None)
        self.redirect_uri = getattr(settings, 'DIGILOCKER_REDIRECT_URI', None)
        self.base_url = getattr(settings, 'DIGILOCKER_BASE_URL', "https://api.digitallocker.gov.in/public/oauth2/1")
        self.api_base_url = "https://api.digitallocker.gov.in/public/oauth2/1/xml"

    def build_auth_url(self, citizen_id, doc_types):
        """
        Constructs the OAuth 2.0 authorization URL for DigiLocker.
        :param citizen_id: The ID of the citizen (used as the state parameter to prevent CSRF)
        :param doc_types: List of document URIs to request scope for
        """
        if not self.client_id:
            raise APIException("DigiLocker client credentials are not configured.")
        
        # State can be a JSON string combining citizen_id and requested doc types
        state = json.dumps({"citizen_id": str(citizen_id), "doc_types": doc_types})
        
        # Encode state in base64 to ensure URL safety
        state_encoded = base64.urlsafe_b64encode(state.encode()).decode().rstrip("=")

        url = f"{self.base_url}/authorize"
        params = [
            f"response_type=code",
            f"client_id={self.client_id}",
            f"state={state_encoded}",
            f"redirect_uri={self.redirect_uri}",
        ]
        return f"{url}?{'&'.join(params)}"

    def exchange_code(self, code):
        """
        Exchanges the OAuth 2.0 authorization code for an access token.
        :param code: The code received in the redirect callback
        :return: access_token string
        """
        url = f"{self.base_url}/token"
        
        payload = {
            "grant_type": "authorization_code",
            "code": code,
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "redirect_uri": self.redirect_uri,
        }
        
        # In a real environment, this makes an HTTP POST
        # response = requests.post(url, data=payload)
        # response.raise_for_status()
        # return response.json().get("access_token")
        
        # For MVP / Sandbox if credentials aren't provided, simulate a success
        if not self.client_id or self.client_id == "your-client-id":
            return "mock-access-token-12345"
            
        try:
            response = requests.post(url, data=payload, timeout=10)
            response.raise_for_status()
            return response.json().get("access_token")
        except requests.RequestException as e:
            raise APIException(f"Failed to exchange DigiLocker token: {str(e)}")

    def fetch_document(self, access_token, doc_uri):
        """
        Fetches the document from DigiLocker APIs using the access token.
        :param access_token: The temporary access token
        :param doc_uri: The URI of the document (e.g., in.gov.uidai.aadhaar-reg)
        :return: Raw bytes of the document (PDF or Image)
        """
        # For MVP / Sandbox if using mock token, return a dummy file byte string
        if access_token == "mock-access-token-12345":
            return b"MOCK_DIGILOCKER_DOCUMENT_BYTES_PDF_OR_IMAGE"

        url = f"{self.api_base_url}/{doc_uri}"
        headers = {
            "Authorization": f"Bearer {access_token}"
        }
        
        try:
            # DigiLocker fetch API
            response = requests.get(url, headers=headers, timeout=15)
            response.raise_for_status()
            
            # The API returns raw file bytes
            return response.content
        except requests.RequestException as e:
            raise APIException(f"Failed to fetch document from DigiLocker: {str(e)}")
