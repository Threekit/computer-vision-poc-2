# Cloudflare Worker Guidelines

This document defines best practices for the Hono-based Cloudflare Worker backend in `src/worker/`.

## Hono Framework Patterns

### Route File Structure

Each route file should be a self-contained Hono app:

```tsx
import { Hono } from "hono";

// Type the app with Env bindings
const app = new Hono<{ Bindings: Env }>();

// Define routes
app.get("/", (c) => c.json({ message: "Products endpoint" }));
app.get("/:id", (c) => c.json({ id: c.req.param("id") }));

// Always export default
export default app;
```

### Route Organization

Keep routes modular. One file per domain/feature:

```
src/worker/
├── index.ts         # Main entry, mounts all routes
├── products.ts      # /api/products/* routes
├── discovery.ts     # /api/discovery/* routes
├── chat.ts          # /api/chat/* routes
└── middleware/      # Shared middleware
```

### Mounting Routes

Mount route files in `index.ts` with clear prefixes:

```tsx
import { Hono } from "hono";
import products from "./products";
import discovery from "./discovery";

const app = new Hono<{ Bindings: Env }>();

// Mount with trailing slashes for consistency
app.route("/api/products/", products);
app.route("/api/discovery/", discovery);

// Root API info
app.get("/api/", (c) => c.json({ name: "Goto Demo API", version: "1.0" }));

export default app;
```

## Request Handling

### Path Parameters

Access path parameters via `c.req.param()`:

```tsx
app.get("/:productId", (c) => {
  const productId = c.req.param("productId");
  return c.json({ id: productId });
});

// Multiple params
app.get("/:category/:id", (c) => {
  const { category, id } = c.req.param();
  return c.json({ category, id });
});
```

### Query Parameters

Access query params via `c.req.query()`:

```tsx
app.get("/search", (c) => {
  const query = c.req.query("q");
  const page = parseInt(c.req.query("page") || "1", 10);
  const limit = parseInt(c.req.query("limit") || "20", 10);

  return c.json({ query, page, limit });
});
```

### Request Body

Parse JSON bodies with type safety:

```tsx
interface ConfigureRequest {
  productId: string;
  options: Record<string, string>;
}

app.post("/configure", async (c) => {
  const body = await c.req.json<ConfigureRequest>();

  // Validate required fields
  if (!body.productId) {
    return c.json({ error: "productId required" }, 400);
  }

  return c.json({ configured: true, ...body });
});
```

### Form Data

Handle form submissions:

```tsx
app.post("/upload", async (c) => {
  const formData = await c.req.formData();
  const file = formData.get("file");
  const name = formData.get("name");

  // Process...
  return c.json({ success: true });
});
```

## Response Patterns

### JSON Responses

Always use `c.json()` for JSON responses:

```tsx
// Simple response
app.get("/", (c) => c.json({ status: "ok" }));

// With status code
app.post("/create", (c) => c.json({ id: "123" }, 201));

// Error response
app.get("/error", (c) => c.json({ error: "Not found" }, 404));
```

### Typed Responses

Define response types for documentation and frontend sync:

```tsx
interface ProductResponse {
  id: string;
  name: string;
  price: number;
  attributes: Record<string, string>;
}

interface ProductListResponse {
  products: ProductResponse[];
  total: number;
  page: number;
}

app.get("/", (c) => {
  const response: ProductListResponse = {
    products: [],
    total: 0,
    page: 1,
  };
  return c.json(response);
});
```

### Response Headers

Set custom headers when needed:

```tsx
app.get("/data", (c) => {
  c.header("Cache-Control", "public, max-age=3600");
  c.header("X-Custom-Header", "value");
  return c.json({ data: [] });
});
```

## Cloudflare Bindings

### Environment Variables

Access secrets and config via `c.env`:

```tsx
app.get("/external", async (c) => {
  const apiKey = c.env.EXTERNAL_API_KEY;

  const res = await fetch("https://api.example.com/data", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  return c.json(await res.json());
});
```

### KV Storage

Use KV for caching and simple data:

```tsx
app.get("/cached/:key", async (c) => {
  const key = c.req.param("key");

  // Check cache
  const cached = await c.env.CACHE_KV.get(key, "json");
  if (cached) {
    return c.json({ data: cached, cached: true });
  }

  // Fetch fresh data
  const data = await fetchExpensiveData(key);

  // Cache for 1 hour
  await c.env.CACHE_KV.put(key, JSON.stringify(data), {
    expirationTtl: 3600,
  });

  return c.json({ data, cached: false });
});
```

### D1 Database

Use D1 for relational data:

```tsx
app.get("/users", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT id, name, email FROM users WHERE active = ?"
  )
    .bind(1)
    .all();

  return c.json({ users: results });
});

app.get("/users/:id", async (c) => {
  const id = c.req.param("id");

  const user = await c.env.DB.prepare(
    "SELECT * FROM users WHERE id = ?"
  )
    .bind(id)
    .first();

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json({ user });
});
```

### R2 Storage

Use R2 for file storage:

```tsx
app.get("/files/:key", async (c) => {
  const key = c.req.param("key");
  const object = await c.env.ASSETS_BUCKET.get(key);

  if (!object) {
    return c.json({ error: "File not found" }, 404);
  }

  c.header("Content-Type", object.httpMetadata?.contentType || "application/octet-stream");
  return c.body(object.body);
});

app.put("/files/:key", async (c) => {
  const key = c.req.param("key");
  const body = await c.req.arrayBuffer();

  await c.env.ASSETS_BUCKET.put(key, body, {
    httpMetadata: {
      contentType: c.req.header("Content-Type") || "application/octet-stream",
    },
  });

  return c.json({ success: true, key });
});
```

### AI Bindings

Use Workers AI for ML tasks:

```tsx
app.post("/chat", async (c) => {
  const { message } = await c.req.json<{ message: string }>();

  const response = await c.env.AI.run("@cf/meta/llama-2-7b-chat-int8", {
    messages: [
      { role: "system", content: "You are a helpful product assistant." },
      { role: "user", content: message },
    ],
  });

  return c.json({ response: response.response });
});
```

## Middleware

### Logger Middleware

Always include logging in production:

```tsx
import { logger } from "hono/logger";

const app = new Hono<{ Bindings: Env }>();
app.use("*", logger());
```

### CORS Middleware

Configure CORS for browser requests:

```tsx
import { cors } from "hono/cors";

app.use("/api/*", cors({
  origin: ["https://example.com", "http://localhost:5173"],
  allowMethods: ["GET", "POST", "PUT", "DELETE"],
  allowHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400,
}));
```

### Authentication Middleware

Protect routes with auth checks:

```tsx
import { HTTPException } from "hono/http-exception";

const authMiddleware = async (c, next) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  // Validate token (implement your logic)
  const user = await validateToken(token, c.env);

  if (!user) {
    throw new HTTPException(401, { message: "Invalid token" });
  }

  c.set("user", user);
  await next();
};

// Apply to protected routes
app.use("/api/protected/*", authMiddleware);
```

### Custom Middleware

Create reusable middleware:

```tsx
// Rate limiting middleware
const rateLimiter = (limit: number, window: number) => {
  return async (c, next) => {
    const ip = c.req.header("CF-Connecting-IP") || "unknown";
    const key = `rate:${ip}`;

    const current = parseInt(await c.env.CACHE_KV.get(key) || "0", 10);

    if (current >= limit) {
      return c.json({ error: "Rate limit exceeded" }, 429);
    }

    await c.env.CACHE_KV.put(key, String(current + 1), {
      expirationTtl: window,
    });

    await next();
  };
};

app.use("/api/*", rateLimiter(100, 60)); // 100 requests per minute
```

## Error Handling

### HTTP Exceptions

Use Hono's HTTPException for typed errors:

```tsx
import { HTTPException } from "hono/http-exception";

app.get("/products/:id", async (c) => {
  const id = c.req.param("id");
  const product = await getProduct(id);

  if (!product) {
    throw new HTTPException(404, { message: "Product not found" });
  }

  return c.json(product);
});
```

### Global Error Handler

Add a global error handler:

```tsx
app.onError((err, c) => {
  console.error(`Error: ${err.message}`, err.stack);

  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }

  // Don't expose internal errors
  return c.json({ error: "Internal server error" }, 500);
});
```

### Not Found Handler

Handle 404s gracefully:

```tsx
app.notFound((c) => {
  return c.json({
    error: "Not found",
    path: c.req.path,
  }, 404);
});
```

## Edge Runtime Constraints

### No Node.js APIs

Workers run in a V8 isolate, not Node.js:

```tsx
// ❌ Not available
const fs = require("fs");
const path = require("path");
process.env.API_KEY;

// ✅ Use Web APIs and Cloudflare bindings
c.env.API_KEY;
await c.env.KV.get("key");
```

### CPU Time Limits

Workers have CPU time limits (50ms for free, 30s for paid). Avoid blocking operations:

```tsx
// ❌ Bad - blocks CPU
function expensiveSync() {
  for (let i = 0; i < 1e9; i++) { /* computation */ }
}

// ✅ Good - use async, stream large data
async function processStream(c) {
  const stream = await c.env.BUCKET.get("large-file");
  return c.body(stream.body);
}
```

### Subrequest Limits

Workers can make up to 50 subrequests (1000 for Enterprise):

```tsx
// ❌ Bad - unbounded subrequests
for (const id of allIds) {
  await fetch(`https://api.example.com/item/${id}`);
}

// ✅ Good - batch or limit
const batch = allIds.slice(0, 10);
const results = await Promise.all(
  batch.map(id => fetch(`https://api.example.com/item/${id}`))
);
```

### Memory Limits

Workers have 128MB memory limit:

```tsx
// ❌ Bad - loading entire large file into memory
const data = await c.env.BUCKET.get("huge.json");
const parsed = JSON.parse(await data.text());

// ✅ Good - stream processing
const object = await c.env.BUCKET.get("huge.json");
return new Response(object.body, {
  headers: { "Content-Type": "application/json" },
});
```

## TypeScript

### Env Type Definition

Define your bindings in `worker-configuration.d.ts` or run `npm run cf-typegen`:

```tsx
interface Env {
  // Secrets
  API_KEY: string;

  // KV Namespaces
  CACHE_KV: KVNamespace;

  // D1 Databases
  DB: D1Database;

  // R2 Buckets
  ASSETS_BUCKET: R2Bucket;

  // AI
  AI: Ai;

  // Variables
  ENVIRONMENT: "development" | "staging" | "production";
}
```

### Type Safety

Type all request/response shapes:

```tsx
// Request body types
interface CreateProductRequest {
  name: string;
  price: number;
  category: string;
}

// Response types
interface ApiResponse<T> {
  data: T;
  meta?: {
    page: number;
    total: number;
  };
}

interface ErrorResponse {
  error: string;
  code?: string;
}
```

## Testing

### Unit Tests

Test route handlers in isolation:

```tsx
import { Hono } from "hono";
import products from "./products";

describe("Products API", () => {
  const app = new Hono();
  app.route("/products", products);

  it("returns product list", async () => {
    const res = await app.request("/products");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty("products");
  });

  it("returns 404 for unknown product", async () => {
    const res = await app.request("/products/unknown-id");
    expect(res.status).toBe(404);
  });
});
```

### Mocking Bindings

Mock Cloudflare bindings in tests:

```tsx
const mockEnv = {
  CACHE_KV: {
    get: jest.fn().mockResolvedValue(null),
    put: jest.fn().mockResolvedValue(undefined),
  },
  DB: {
    prepare: jest.fn().mockReturnValue({
      bind: jest.fn().mockReturnThis(),
      all: jest.fn().mockResolvedValue({ results: [] }),
      first: jest.fn().mockResolvedValue(null),
    }),
  },
};

const app = new Hono<{ Bindings: typeof mockEnv }>();
// ... test with mockEnv
```

## Security

### Input Validation

Always validate and sanitize input:

```tsx
import { z } from "zod";

const ProductSchema = z.object({
  name: z.string().min(1).max(200),
  price: z.number().positive(),
  category: z.enum(["furniture", "lighting", "accessories"]),
});

app.post("/products", async (c) => {
  const body = await c.req.json();
  const result = ProductSchema.safeParse(body);

  if (!result.success) {
    return c.json({ error: "Invalid input", details: result.error.issues }, 400);
  }

  // Use result.data (typed and validated)
  return c.json({ created: result.data });
});
```

### SQL Injection Prevention

Always use parameterized queries with D1:

```tsx
// ✅ Good - parameterized query
const user = await c.env.DB.prepare(
  "SELECT * FROM users WHERE id = ?"
)
  .bind(userId)
  .first();

// ❌ Bad - SQL injection risk
const user = await c.env.DB.prepare(
  `SELECT * FROM users WHERE id = '${userId}'`
).first();
```

### Secrets Management

Never log or expose secrets:

```tsx
// ❌ Bad
console.log("API Key:", c.env.API_KEY);
return c.json({ key: c.env.API_KEY });

// ✅ Good
console.log("Making authenticated request...");
const res = await fetch(url, {
  headers: { Authorization: `Bearer ${c.env.API_KEY}` },
});
```
