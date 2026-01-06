# External API Integration Guide

This guide provides instructions for connecting to the Discovery and Products Chat endpoints from an external project.

## For AI Agents

This API provides endpoints for product discovery, management, and conversational assistance:

1. **Products Endpoint** (`GET /api/catalog/products`) - Retrieve products with pagination and filtering
2. **Product Detail Endpoint** (`GET /api/catalog/products/:id`) - Get a single product by ID
3. **Discovery Endpoint** (`POST /api/discovery`) - Semantic search for products using vector embeddings
4. **Chat Endpoint** (`POST /api/products-chat`) - Conversational AI for product inquiries

**Prerequisites:**
- `BASE_URL`: Your deployed server URL
- `API_KEY`: API key with appropriate permissions
- `TENANT_ID`: Your tenant identifier

**All requests require these headers:**
- `x-api-key`: Your API key
- `x-tenant-id`: Your tenant ID
- `Content-Type`: application/json

See detailed endpoint specifications and code examples below.

## Table of Contents

- [Quick Start](#quick-start)
- [Authentication](#authentication)
- [Products Endpoint](#products-endpoint)
- [Discovery Endpoint](#discovery-endpoint)
- [Products Chat Endpoint](#products-chat-endpoint)
- [Code Examples](#code-examples)
- [Error Handling](#error-handling)
- [Rate Limits & Best Practices](#rate-limits--best-practices)

---

## Quick Start

### Base URL

All API requests should be made to your deployed server URL. The base URL format is:
```
https://your-server-domain.com
```

All API endpoints are prefixed with `/api/`:
```
https://your-server-domain.com/api/discovery
https://your-server-domain.com/api/products-chat
```

**Important:** Replace `your-server-domain.com` with your actual deployed server domain in all examples below.

### Configuration Variables

Before making API requests, you will need:

| Variable | Description | Example |
|----------|-------------|---------|
| `BASE_URL` | Your deployed server URL | `https://api.example.com` |
| `API_KEY` | Your API key from the goto platform | `tk_abc123...` |
| `TENANT_ID` | Your tenant identifier | `my-tenant-id` |

### Required Headers

All requests must include:

1. **Authentication**:
   - `x-api-key: {API_KEY}`

2. **Tenant ID**:
   - `x-tenant-id: {TENANT_ID}`

3. **Content Type** (for JSON requests):
   - `Content-Type: application/json`

---

## API Specification Summary

### Endpoints Overview

| Endpoint | Method | Purpose | Required Permission |
|----------|--------|---------|---------------------|
| `/api/catalog/products` | GET | List all products with pagination | `products.read` |
| `/api/catalog/products/:id` | GET | Get a single product by ID | `products.read` |
| `/api/discovery` | POST | Semantic product search with AI | `discovery.query` |
| `/api/products-chat` | POST | Conversational product assistance | `products-chat.chat` |
| `/api/products-chat/stream` | POST | Streaming conversational assistance | `products-chat.chat` |
| `/health` | GET | Health check (no auth required) | None |

### Request Format (All Endpoints)

**Headers:**
```
x-api-key: {API_KEY}
x-tenant-id: {TENANT_ID}
Content-Type: application/json
```

**Products Query Parameters:**
```
GET /api/catalog/products?page=1&limit=20&sort_by=name&sort_order=asc&search=door
```
- `page`: number (optional, default: 1, min: 1)
- `limit`: number (optional, default: 20, min: 1, max: 100)
- `sort_by`: string (optional, field name to sort by)
- `sort_order`: "asc" | "desc" (optional)
- `search`: string (optional, search term for product name/description)

**Product By ID:**
```
GET /api/catalog/products/{product-id}
```
- `product-id`: UUID of the product (in path)

**Discovery Request Body:**
```json
{
  "query": "string (required, min 1 char)",
  "filter": "object or array (optional)",
  "image": "string (optional, base64 data URL)",
  "chatHistory": "array (optional)",
  "context": "array (optional)",
  "top_n": "number (optional, default 10)",
  "includeConfidenceMessage": "boolean (optional, default true)"
}
```

**Chat Request Body:**
```json
{
  "message": "string (required, 1-2000 chars)"
}
```

**Chat Streaming Request Body:**
```json
{
  "message": "string (required, 1-2000 chars)",
  "sessionId": "string (required, 1-100 chars)",
  "chatHistory": "array (optional)",
  "userId": "string (optional)",
  "tenantId": "string (optional)",
  "includeProducts": "boolean (optional)",
  "productLimit": "number (optional, 1-20)"
}
```

---

## Authentication

### API Key Authentication

API keys are used for all external integrations and applications.

#### Creating an API Key

You must first create an API key through the goto platform. API keys have the format:
```
tk_<64-character-hex-string>
```

**Required Permissions:**
- Products: `products.read`
- Discovery: `discovery.query`
- Chat: `products-chat.chat`

#### Using an API Key

Include the API key in the `x-api-key` header:

```bash
curl -X POST {BASE_URL}/api/discovery \
  -H "x-api-key: {API_KEY}" \
  -H "x-tenant-id: {TENANT_ID}" \
  -H "Content-Type: application/json" \
  -d '{"query": "modern glass doors"}'
```

---

## Products Endpoint

The Products endpoint provides direct access to the product catalog with pagination, filtering, and search capabilities.

### Get All Products

```
GET /api/catalog/products
```

Retrieves a paginated list of products with optional filtering and sorting.

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | Page number (minimum: 1) |
| `limit` | number | No | 20 | Items per page (1-100) |
| `sort_by` | string | No | - | Field name to sort by (e.g., "name", "price", "created_at") |
| `sort_order` | string | No | - | Sort direction: "asc" or "desc" |
| `search` | string | No | - | Search term to filter products by name or description |

### Example Request

```bash
curl -X GET "{BASE_URL}/api/catalog/products?page=1&limit=20&sort_by=price&sort_order=asc&search=door" \
  -H "x-api-key: {API_KEY}" \
  -H "x-tenant-id: {TENANT_ID}"
```

### Example Response

```json
{
  "items": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Modern Glass Door",
      "sku": "MGD-001",
      "image_url": "https://example.com/images/door1.jpg",
      "description": "A sleek modern door with large glass panels",
      "price": 1299.99,
      "metadata": {
        "category": "exterior",
        "material": "fiberglass",
        "color": "black"
      },
      "created_at": "2025-01-10T10:00:00Z",
      "updated_at": "2025-01-15T14:30:00Z",
      "deleted_at": null
    },
    {
      "id": "223e4567-e89b-12d3-a456-426614174001",
      "name": "Contemporary Entry Door",
      "sku": "CED-002",
      "image_url": "https://example.com/images/door2.jpg",
      "description": "Contemporary entry door with frosted glass panels",
      "price": 1499.99,
      "metadata": {
        "category": "exterior",
        "material": "steel",
        "color": "bronze"
      },
      "created_at": "2025-01-12T11:00:00Z",
      "updated_at": "2025-01-15T15:00:00Z",
      "deleted_at": null
    }
  ],
  "pagination": {
    "total": 150,
    "pages": 8,
    "page": 1,
    "limit": 20,
    "has_more": true
  }
}
```

### Get Product By ID

```
GET /api/catalog/products/:id
```

Retrieves a single product by its unique identifier.

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Unique product identifier |

### Example Request

```bash
curl -X GET "{BASE_URL}/api/catalog/products/123e4567-e89b-12d3-a456-426614174000" \
  -H "x-api-key: {API_KEY}" \
  -H "x-tenant-id: {TENANT_ID}"
```

### Example Response

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Modern Glass Door",
  "sku": "MGD-001",
  "image_url": "https://example.com/images/door1.jpg",
  "description": "A sleek modern door with large glass panels",
  "price": 1299.99,
  "metadata": {
    "category": "exterior",
    "material": "fiberglass",
    "color": "black",
    "dimensions": {
      "width": 36,
      "height": 80,
      "depth": 1.75
    }
  },
  "created_at": "2025-01-10T10:00:00Z",
  "updated_at": "2025-01-15T14:30:00Z",
  "deleted_at": null
}
```

### Product Schema

All product objects contain the following fields:

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique product identifier |
| `name` | string | Product name |
| `sku` | string | Stock Keeping Unit (unique product code) |
| `image_url` | string \| null | URL to product image |
| `description` | string | Product description |
| `price` | number | Product price |
| `metadata` | object \| null | Additional product attributes (flexible schema) |
| `created_at` | datetime | Creation timestamp (ISO 8601) |
| `updated_at` | datetime | Last update timestamp (ISO 8601) |
| `deleted_at` | datetime \| null | Soft deletion timestamp (null if active) |

### Metadata Field

The `metadata` field is a flexible JSON object that can contain any product-specific attributes. Common examples:

```json
{
  "category": "exterior",
  "material": "fiberglass",
  "color": "black",
  "dimensions": {
    "width": 36,
    "height": 80,
    "depth": 1.75,
    "unit": "inches"
  },
  "features": ["insulated", "weatherproof", "energy-efficient"],
  "warranty_years": 10,
  "in_stock": true
}
```

---

## Discovery Endpoint

The Discovery endpoint provides AI-powered semantic search using vector embeddings to find relevant products.

### Endpoint

```
POST /api/discovery
```

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `query` | string | Yes | The search query (minimum 1 character) |
| `filter` | object/array | No | Filter conditions to narrow results |
| `image` | string | No | Base64-encoded image data URL for visual search |
| `chatHistory` | array | No | Previous conversation context |
| `context` | array | No | Additional context for the search |
| `top_n` | number | No | Number of results to return (default: 10) |
| `includeConfidenceMessage` | boolean | No | Include AI-generated confidence message (default: true) |

### Filter Format

Filters can be either:

**Simple Object Format:**
```json
{
  "category": "exterior",
  "in_stock": true
}
```

**Advanced Array Format:**
```json
[
  { "key": "price", "operator": "<=", "value": 2000 },
  { "key": "category", "operator": "in", "value": "exterior" }
]
```

Supported operators: `=`, `>`, `>=`, `<`, `<=`, `in`

### Example Request

```json
{
  "query": "Modern doors with glass panels",
  "filter": {
    "category": "exterior",
    "in_stock": true
  },
  "includeConfidenceMessage": true,
  "top_n": 5
}
```

### Example Response

```json
{
  "items": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Modern Elegance Door",
      "description": "A sleek modern door with large glass panels...",
      "price": 1299.99,
      "category": "exterior",
      "material": "fiberglass",
      "in_stock": true,
      "similarity": 0.92
    },
    {
      "id": "223e4567-e89b-12d3-a456-426614174001",
      "name": "Contemporary Glass Entry Door",
      "description": "Contemporary entry door with frosted glass panels...",
      "price": 1499.99,
      "category": "exterior",
      "material": "steel",
      "in_stock": true,
      "similarity": 0.89
    }
  ],
  "confidenceMessage": "Based on your interest in modern doors with glass panels, our Modern Elegance Door (position 1) would be perfect for your home. It features clean lines and large glass panels that bring in natural light while maintaining a sleek aesthetic."
}
```

### Image Search

To search with an image, include a base64-encoded data URL:

```json
{
  "query": "Find doors similar to this",
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "includeConfidenceMessage": true
}
```

Or use multipart/form-data to upload an image file directly (see examples below).

---

## Products Chat Endpoint

The Products Chat endpoint provides an AI-powered conversational interface for product inquiries using RAG (Retrieval-Augmented Generation).

### Endpoint (Standard)

```
POST /api/products-chat
```

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | Yes | User's chat message (1-2000 characters) |

### Example Request

```json
{
  "message": "What are the best exterior doors for cold climates?"
}
```

### Example Response

```json
"Based on our product catalog, I recommend fiberglass or steel insulated doors for cold climates. The Thermal Elite Series offers excellent insulation with R-values up to 15. These doors feature weatherstripping and thermal breaks to prevent heat loss..."
```

### Endpoint (Streaming)

For real-time streaming responses (Server-Sent Events):

```
POST /api/products-chat/stream
```

### Request Body (Streaming)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | Yes | User's chat message (1-2000 characters) |
| `sessionId` | string | Yes | Session identifier (1-100 characters) |
| `chatHistory` | array | No | Previous messages in the conversation |
| `userId` | string | No | User identifier |
| `tenantId` | string | No | Tenant identifier |
| `includeProducts` | boolean | No | Whether to include product recommendations |
| `productLimit` | number | No | Max products to return (1-20) |

### Example Streaming Request

```json
{
  "message": "What are the best exterior doors for cold climates?",
  "sessionId": "session-123",
  "chatHistory": [
    {
      "role": "user",
      "content": "I'm looking for a new door",
      "timestamp": "2025-01-15T10:00:00Z"
    },
    {
      "role": "assistant",
      "content": "I'd be happy to help! What type of door are you looking for?",
      "timestamp": "2025-01-15T10:00:05Z"
    }
  ]
}
```

### Streaming Response Format

The streaming endpoint returns Server-Sent Events (SSE) with the following event types:

```
data: {"type": "connected", "message": "SSE connection established"}

data: {"type": "response-chunk", "data": "Based on "}

data: {"type": "response-chunk", "data": "our product "}

data: {"type": "response-chunk", "data": "catalog..."}

data: {"type": "end"}
```

---

## Code Examples

### cURL

#### Products Endpoints

**Get All Products:**
```bash
curl -X GET "{BASE_URL}/api/catalog/products?page=1&limit=20&sort_by=price&sort_order=asc" \
  -H "x-api-key: {API_KEY}" \
  -H "x-tenant-id: {TENANT_ID}"
```

**Search Products:**
```bash
curl -X GET "{BASE_URL}/api/catalog/products?search=modern+door&limit=10" \
  -H "x-api-key: {API_KEY}" \
  -H "x-tenant-id: {TENANT_ID}"
```

**Get Product By ID:**
```bash
curl -X GET "{BASE_URL}/api/catalog/products/123e4567-e89b-12d3-a456-426614174000" \
  -H "x-api-key: {API_KEY}" \
  -H "x-tenant-id: {TENANT_ID}"
```

#### Discovery Endpoint

```bash
curl -X POST {BASE_URL}/api/discovery \
  -H "x-api-key: {API_KEY}" \
  -H "x-tenant-id: {TENANT_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "modern glass doors",
    "filter": {
      "category": "exterior"
    },
    "top_n": 5
  }'
```

#### Chat Endpoint

```bash
curl -X POST {BASE_URL}/api/products-chat \
  -H "x-api-key: {API_KEY}" \
  -H "x-tenant-id: {TENANT_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are the best doors for cold climates?"
  }'
```

### JavaScript (Node.js / Fetch API)

```javascript
// Configuration - set these from your environment
const BASE_URL = process.env.BASE_URL || 'https://your-server-domain.com';
const API_KEY = process.env.API_KEY;
const TENANT_ID = process.env.TENANT_ID;

// Products API - Get All Products
async function getProducts(params = {}) {
  const queryParams = new URLSearchParams({
    page: params.page || 1,
    limit: params.limit || 20,
    ...(params.sort_by && { sort_by: params.sort_by }),
    ...(params.sort_order && { sort_order: params.sort_order }),
    ...(params.search && { search: params.search }),
  });

  const response = await fetch(`${BASE_URL}/api/catalog/products?${queryParams}`, {
    method: 'GET',
    headers: {
      'x-api-key': API_KEY,
      'x-tenant-id': TENANT_ID,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

// Usage
getProducts({ page: 1, limit: 20, sort_by: 'price', sort_order: 'asc' })
  .then(result => {
    console.log(`Found ${result.pagination.total} products`);
    console.log('Products:', result.items);
  })
  .catch(error => console.error('Error:', error));

// Products API - Get Product By ID
async function getProductById(productId) {
  const response = await fetch(`${BASE_URL}/api/catalog/products/${productId}`, {
    method: 'GET',
    headers: {
      'x-api-key': API_KEY,
      'x-tenant-id': TENANT_ID,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

// Usage
getProductById('123e4567-e89b-12d3-a456-426614174000')
  .then(product => console.log('Product:', product))
  .catch(error => console.error('Error:', error));

// Discovery API
async function searchProducts(query, filters = {}) {
  const response = await fetch(`${BASE_URL}/api/discovery`, {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY,
      'x-tenant-id': TENANT_ID,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: query,
      filter: filters,
      includeConfidenceMessage: true,
      top_n: 10,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data;
}

// Usage
searchProducts('modern glass doors', { category: 'exterior' })
  .then(results => {
    console.log('Found products:', results.items);
    console.log('AI Message:', results.confidenceMessage);
  })
  .catch(error => console.error('Error:', error));

// Chat API
async function chatWithAssistant(message) {
  const response = await fetch(`${BASE_URL}/api/products-chat`, {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY,
      'x-tenant-id': TENANT_ID,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const answer = await response.json();
  return answer;
}

// Usage
chatWithAssistant('What doors work best in cold climates?')
  .then(answer => console.log('Assistant:', answer))
  .catch(error => console.error('Error:', error));
```

### JavaScript (Streaming Chat)

```javascript
// Configuration - set these from your environment
const BASE_URL = process.env.BASE_URL || 'https://your-server-domain.com';
const API_KEY = process.env.API_KEY;
const TENANT_ID = process.env.TENANT_ID;

async function streamChat(message, sessionId) {
  const response = await fetch(`${BASE_URL}/api/products-chat/stream`, {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY,
      'x-tenant-id': TENANT_ID,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: message,
      sessionId: sessionId,
    }),
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        
        if (data.type === 'response-chunk') {
          process.stdout.write(data.data);
        } else if (data.type === 'end') {
          console.log('\n[Stream ended]');
        } else if (data.type === 'error') {
          console.error('Error:', data.message);
        }
      }
    }
  }
}

// Usage
streamChat('What are the best doors for cold climates?', 'session-123');
```

### Python (requests)

```python
import requests
import json
import os

# Configuration - set these from your environment
BASE_URL = os.environ.get('BASE_URL', 'https://your-server-domain.com')
API_KEY = os.environ.get('API_KEY')
TENANT_ID = os.environ.get('TENANT_ID')

# Products API - Get All Products
def get_products(page=1, limit=20, sort_by=None, sort_order=None, search=None):
    url = f'{BASE_URL}/api/catalog/products'
    headers = {
        'x-api-key': API_KEY,
        'x-tenant-id': TENANT_ID
    }
    
    params = {
        'page': page,
        'limit': limit
    }
    
    if sort_by:
        params['sort_by'] = sort_by
    if sort_order:
        params['sort_order'] = sort_order
    if search:
        params['search'] = search
    
    response = requests.get(url, headers=headers, params=params)
    response.raise_for_status()
    
    return response.json()

# Usage
try:
    result = get_products(page=1, limit=20, sort_by='price', sort_order='asc')
    print(f"Found {result['pagination']['total']} products")
    print(f"Items on this page: {len(result['items'])}")
except requests.exceptions.RequestException as e:
    print(f'Error: {e}')

# Products API - Get Product By ID
def get_product_by_id(product_id):
    url = f'{BASE_URL}/api/catalog/products/{product_id}'
    headers = {
        'x-api-key': API_KEY,
        'x-tenant-id': TENANT_ID
    }
    
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    
    return response.json()

# Usage
try:
    product = get_product_by_id('123e4567-e89b-12d3-a456-426614174000')
    print(f"Product: {product['name']} - ${product['price']}")
except requests.exceptions.RequestException as e:
    print(f'Error: {e}')

# Discovery API
def search_products(query, filters=None):
    url = f'{BASE_URL}/api/discovery'
    headers = {
        'x-api-key': API_KEY,
        'x-tenant-id': TENANT_ID,
        'Content-Type': 'application/json'
    }
    
    payload = {
        'query': query,
        'includeConfidenceMessage': True,
        'top_n': 10
    }
    
    if filters:
        payload['filter'] = filters
    
    response = requests.post(url, headers=headers, json=payload)
    response.raise_for_status()
    
    return response.json()

# Usage
try:
    results = search_products(
        'modern glass doors',
        filters={'category': 'exterior'}
    )
    print('Found products:', len(results['items']))
    print('AI Message:', results['confidenceMessage'])
except requests.exceptions.RequestException as e:
    print(f'Error: {e}')

# Chat API
def chat_with_assistant(message):
    url = f'{BASE_URL}/api/products-chat'
    headers = {
        'x-api-key': API_KEY,
        'x-tenant-id': TENANT_ID,
        'Content-Type': 'application/json'
    }
    
    payload = {'message': message}
    
    response = requests.post(url, headers=headers, json=payload)
    response.raise_for_status()
    
    return response.json()

# Usage
try:
    answer = chat_with_assistant('What doors work best in cold climates?')
    print('Assistant:', answer)
except requests.exceptions.RequestException as e:
    print(f'Error: {e}')
```

### Python (Streaming Chat)

```python
import requests
import json
import os

# Configuration - set these from your environment
BASE_URL = os.environ.get('BASE_URL', 'https://your-server-domain.com')
API_KEY = os.environ.get('API_KEY')
TENANT_ID = os.environ.get('TENANT_ID')

def stream_chat(message, session_id):
    url = f'{BASE_URL}/api/products-chat/stream'
    headers = {
        'x-api-key': API_KEY,
        'x-tenant-id': TENANT_ID,
        'Content-Type': 'application/json'
    }
    
    payload = {
        'message': message,
        'sessionId': session_id
    }
    
    response = requests.post(url, headers=headers, json=payload, stream=True)
    response.raise_for_status()
    
    for line in response.iter_lines():
        if line:
            decoded = line.decode('utf-8')
            if decoded.startswith('data: '):
                data = json.loads(decoded[6:])
                
                if data['type'] == 'response-chunk':
                    print(data['data'], end='', flush=True)
                elif data['type'] == 'end':
                    print('\n[Stream ended]')
                elif data['type'] == 'error':
                    print(f"\nError: {data['message']}")

# Usage
stream_chat('What are the best doors for cold climates?', 'session-123')
```

### Image Upload with Discovery (cURL)

```bash
# Upload image file with multipart/form-data
curl -X POST {BASE_URL}/api/discovery \
  -H "x-api-key: {API_KEY}" \
  -H "x-tenant-id: {TENANT_ID}" \
  -F "query=Find similar doors" \
  -F "image=@/path/to/door-image.jpg" \
  -F "includeConfidenceMessage=true"
```

### Image Upload with Discovery (JavaScript)

```javascript
// Configuration - set these from your environment
const BASE_URL = process.env.BASE_URL || 'https://your-server-domain.com';
const API_KEY = process.env.API_KEY;
const TENANT_ID = process.env.TENANT_ID;

async function searchWithImage(query, imageFile) {
  const formData = new FormData();
  formData.append('query', query);
  formData.append('image', imageFile);
  formData.append('includeConfidenceMessage', 'true');

  const response = await fetch(`${BASE_URL}/api/discovery`, {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY,
      'x-tenant-id': TENANT_ID,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

// Usage in browser
document.getElementById('imageInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  const results = await searchWithImage('Find similar doors', file);
  console.log(results);
});
```

---

## Error Handling

All endpoints return standard error responses:

### Error Response Format

```json
{
  "error": "Descriptive error message"
}
```

### Common HTTP Status Codes

| Code | Description | Common Causes |
|------|-------------|---------------|
| `400` | Bad Request | Missing required fields, invalid data format |
| `401` | Unauthorized | Missing or invalid API key |
| `403` | Forbidden | Insufficient permissions for the requested action |
| `404` | Not Found | Endpoint or resource doesn't exist |
| `500` | Internal Server Error | Database errors, LLM API failures, server issues |

### Example Error Responses

**Missing Authentication:**
```json
{
  "error": {
    "status": 401,
    "code": "auth/no-auth-header",
    "message": "No API key provided"
  }
}
```

**Insufficient Permissions:**
```json
{
  "error": {
    "status": 403,
    "code": "authorization/forbidden",
    "message": "User does not have required permissions: discovery.query"
  }
}
```

**Invalid Request:**
```json
{
  "error": "Query is required and must be a non-empty string"
}
```

### Error Handling Best Practices

1. **Always check response status** before parsing the response body
2. **Implement retry logic** for 500-level errors with exponential backoff
3. **Log errors** with context (request ID, timestamp, user ID) for debugging
4. **Validate input** on the client side before sending requests
5. **Handle rate limits** gracefully (if implemented)

---

## Rate Limits & Best Practices

### Best Practices

1. **Cache Results**: Cache discovery results for common queries to reduce API calls
2. **Batch Requests**: Group multiple related queries when possible
3. **Reuse Sessions**: For chat, maintain session IDs across conversations
4. **Handle Timeouts**: Set reasonable timeouts (30-60 seconds for standard, 120+ for streaming)
5. **Implement Retries**: Use exponential backoff for transient failures
6. **Monitor Usage**: Track your API usage and error rates
7. **Secure API Keys**: 
   - Never commit API keys to version control
   - Rotate keys periodically
   - Use environment variables
   - Restrict key permissions to only what's needed

### Security Checklist

- ✅ Store API keys in environment variables
- ✅ Use HTTPS in production
- ✅ Validate and sanitize user input
- ✅ Implement request timeouts
- ✅ Log API usage for auditing
- ✅ Rotate API keys regularly
- ✅ Use least-privilege permissions
- ✅ Implement rate limiting on your end

---

## Environment Setup

### Client Environment Variables

Set these environment variables in your application:

```bash
# API Configuration
BASE_URL=https://your-server-domain.com
API_KEY=tk_your_api_key_here
TENANT_ID=your-tenant-id
```

### Quick Test

Test your connection with a simple health check:

```bash
curl {BASE_URL}/health
```

Expected response:
```json
{"status": "ok"}
```

Example with actual URL:
```bash
curl https://your-server-domain.com/health
```

---

## Support & Troubleshooting

### Common Issues

**Issue: "No API key provided"**
- Solution: Ensure you're including the `x-api-key` header with a valid API key

**Issue: "User does not have required permissions"**
- Solution: Check that your API key has `discovery.query` or `products-chat.chat` permissions

**Issue: "Database connection failed"**
- Solution: Verify `DATABASE_URL` environment variable is set correctly on the server

**Issue: Timeout errors**
- Solution: Increase request timeout, check server logs, verify LLM API connectivity

**Issue: Empty results**
- Solution: Ensure product embeddings are populated in the database

### Getting Help

- Check server logs for detailed error messages
- Verify all required environment variables are set
- Test with the provided cURL examples first
- Review the AUTHORIZATION.md file for permission details

---

## Implementation Guide for AI Agents

### Step-by-Step Integration

**Step 1: Configure Environment Variables**
```
BASE_URL=https://your-server-domain.com
API_KEY=tk_your_api_key_here
TENANT_ID=your-tenant-id
```

**Step 2: Verify Connection**
```bash
curl {BASE_URL}/health
# Expected: {"status": "ok"}
```

**Step 3: Test Products Endpoint**
```bash
curl -X GET "{BASE_URL}/api/catalog/products?limit=5" \
  -H "x-api-key: {API_KEY}" \
  -H "x-tenant-id: {TENANT_ID}"
```

**Step 4: Test Discovery Endpoint**
```bash
curl -X POST {BASE_URL}/api/discovery \
  -H "x-api-key: {API_KEY}" \
  -H "x-tenant-id: {TENANT_ID}" \
  -H "Content-Type: application/json" \
  -d '{"query": "test query", "top_n": 5}'
```

**Step 5: Test Chat Endpoint**
```bash
curl -X POST {BASE_URL}/api/products-chat \
  -H "x-api-key: {API_KEY}" \
  -H "x-tenant-id: {TENANT_ID}" \
  -H "Content-Type: application/json" \
  -d '{"message": "test message"}'
```

### Common Integration Patterns

**Pattern 1: Get Products List**
```
GET /api/catalog/products?page=1&limit=20
```

**Pattern 2: Search Products**
```
GET /api/catalog/products?search=modern door&limit=10
```

**Pattern 3: Get Product Details**
```
GET /api/catalog/products/{product-id}
```

**Pattern 4: Paginated Products with Sorting**
```
GET /api/catalog/products?page=2&limit=50&sort_by=price&sort_order=desc
```

**Pattern 5: Simple Semantic Search**
```json
POST /api/discovery
{
  "query": "modern glass doors",
  "top_n": 10,
  "includeConfidenceMessage": true
}
```

**Pattern 6: Filtered Product Search**
```json
POST /api/discovery
{
  "query": "exterior doors",
  "filter": {
    "category": "exterior",
    "price": 1500
  },
  "top_n": 10
}
```

**Pattern 7: Advanced Filtered Search**
```json
POST /api/discovery
{
  "query": "affordable doors",
  "filter": [
    {"key": "price", "operator": "<=", "value": 2000},
    {"key": "category", "operator": "=", "value": "exterior"}
  ],
  "top_n": 10
}
```

**Pattern 8: Image-Based Search**
```json
POST /api/discovery
{
  "query": "Find similar doors",
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "top_n": 10
}
```

**Pattern 9: Conversational Chat**
```json
POST /api/products-chat
{
  "message": "What are the best doors for cold climates?"
}
```

**Pattern 10: Streaming Chat with History**
```json
POST /api/products-chat/stream
{
  "message": "What about price range?",
  "sessionId": "session-123",
  "chatHistory": [
    {
      "role": "user",
      "content": "What are the best doors for cold climates?",
      "timestamp": "2025-01-15T10:00:00Z"
    },
    {
      "role": "assistant",
      "content": "For cold climates, I recommend insulated doors...",
      "timestamp": "2025-01-15T10:00:05Z"
    }
  ]
}
```

### Response Parsing Guide

**Products List Response Structure:**
```json
{
  "items": [
    {
      "id": "product-uuid",
      "name": "Product Name",
      "sku": "SKU-001",
      "image_url": "https://...",
      "description": "Product description",
      "price": 1299.99,
      "metadata": { /* flexible object */ },
      "created_at": "2025-01-15T10:00:00Z",
      "updated_at": "2025-01-15T10:00:00Z",
      "deleted_at": null
    }
  ],
  "pagination": {
    "total": 150,
    "pages": 8,
    "page": 1,
    "limit": 20,
    "has_more": true
  }
}
```

**Single Product Response Structure:**
```json
{
  "id": "product-uuid",
  "name": "Product Name",
  "sku": "SKU-001",
  "image_url": "https://...",
  "description": "Product description",
  "price": 1299.99,
  "metadata": { /* flexible object */ },
  "created_at": "2025-01-15T10:00:00Z",
  "updated_at": "2025-01-15T10:00:00Z",
  "deleted_at": null
}
```

**Discovery Response Structure:**
```json
{
  "items": [
    {
      "id": "product-uuid",
      "name": "Product Name",
      "description": "Product description",
      "price": 1299.99,
      "similarity": 0.92,
      // ... other product fields
    }
  ],
  "confidenceMessage": "AI-generated guidance message"
}
```

**Chat Response Structure:**
```json
"AI-generated response text as a string"
```

**Streaming Chat Response Structure:**
```
data: {"type": "connected", "message": "SSE connection established"}

data: {"type": "response-chunk", "data": "text chunk"}

data: {"type": "end"}
```

### Error Handling Template

```javascript
async function makeRequest(endpoint, body) {
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'x-api-key': API_KEY,
          'x-tenant-id': TENANT_ID,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      if (!response.ok) {
        if (response.status >= 500) {
          // Server error - retry with exponential backoff
          attempt++;
          await sleep(Math.pow(2, attempt) * 1000);
          continue;
        } else if (response.status === 401 || response.status === 403) {
          // Auth error - don't retry
          throw new Error('Authentication failed');
        } else {
          // Client error - don't retry
          const error = await response.json();
          throw new Error(error.error || 'Request failed');
        }
      }
      
      return await response.json();
    } catch (error) {
      if (attempt >= maxRetries - 1) throw error;
      attempt++;
      await sleep(Math.pow(2, attempt) * 1000);
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### Integration Checklist

- [ ] Environment variables configured (BASE_URL, API_KEY, TENANT_ID)
- [ ] Health check endpoint verified
- [ ] API key permissions confirmed (products.read, discovery.query, products-chat.chat)
- [ ] Products list endpoint tested (GET /api/catalog/products)
- [ ] Product detail endpoint tested (GET /api/catalog/products/:id)
- [ ] Discovery endpoint tested with simple query
- [ ] Chat endpoint tested with simple message
- [ ] Error handling implemented with retry logic
- [ ] Request timeouts configured (30-60s standard, 120s+ streaming)
- [ ] Response parsing implemented for both endpoints
- [ ] HTTPS used for all requests (production)
- [ ] API keys stored securely in environment variables
- [ ] Logging implemented for debugging


