# Authorization

In order to access the Cosmo Cargo Shipments API, you must authenticate your requests using an API
key. The API uses header-based authentication.

## Getting Your API Key

To obtain an API key, sign up for an account at
[Cosmo Cargo](https://cosmo-cargo.example.com/signup). After signing in, navigate to the API Keys
section in your dashboard and generate a new key.

**Keep your API key secret.** Do not share or expose it in client-side code or public repositories.

## Using the API Key

Include your API key in the `Authorization` header using the `Bearer` schema for every API request:

```http
GET /api-shipments/shipments HTTP/1.1
Host: api.cosmo-cargo.example.com
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

### Example using `curl`

```bash
curl -X GET "https://api.cosmo-cargo.example.com/api-shipments/shipments" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json"
```

### Invalid or Missing API Key

If your API key is missing or invalid, the API will respond with a `401 Unauthorized` error:

```json
{
  "error": "Unauthorized",

```
