# React Frontend Guidelines

This document defines best practices for the React frontend in `src/react-app/`.

## Component Patterns

### Functional Components Only

Always use functional components with hooks. Never use class components.

```tsx
// ✅ Good
function ProductCard({ product }: { product: Product }) {
  const [expanded, setExpanded] = useState(false);
  return <div>...</div>;
}

// ❌ Bad - class components
class ProductCard extends React.Component { ... }
```

### Component File Structure

Each component file should follow this order:

1. Imports (React, then external libs, then internal modules)
2. Type definitions (Props, local types)
3. Component function
4. Default export

```tsx
// 1. Imports
import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { api } from "../services/api";

// 2. Types
interface ProductCardProps {
  product: Product;
  onSelect?: (id: string) => void;
}

// 3. Component
function ProductCard({ product, onSelect }: ProductCardProps) {
  // hooks first
  const [loading, setLoading] = useState(false);

  // handlers
  const handleClick = useCallback(() => {
    onSelect?.(product.id);
  }, [product.id, onSelect]);

  // render
  return <div onClick={handleClick}>...</div>;
}

// 4. Export
export default ProductCard;
```

### Component Naming

- PascalCase for component names: `ProductCard`, `DiscoveryPanel`
- Filename matches component name: `ProductCard.tsx`
- Props interface: `ComponentNameProps`

## Hooks

### Hook Rules

1. Only call hooks at the top level of components
2. Only call hooks from React functions
3. Custom hooks must start with `use`

### State Management

Use local state (`useState`) for component-specific state. For shared state across components, lift state to the nearest common ancestor.

```tsx
// ✅ Good - state close to where it's used
function DiscoveryFlow() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  return (
    <StepIndicator current={step} />
    <Question onAnswer={(a) => setAnswers(prev => ({...prev, [step]: a}))} />
  );
}
```

### useEffect Guidelines

1. Always specify dependencies accurately
2. Avoid object/array literals in dependency arrays
3. Clean up side effects when needed

```tsx
// ✅ Good - stable dependencies, cleanup
useEffect(() => {
  const controller = new AbortController();

  api.products({ signal: controller.signal })
    .then(setProducts)
    .catch((e) => {
      if (e.name !== "AbortError") setError(e);
    });

  return () => controller.abort();
}, [categoryId]); // primitive dependency

// ❌ Bad - object in dependencies causes infinite loop
useEffect(() => {
  fetchData(options); // options = { page, limit } recreated each render
}, [options]);
```

### Custom Hooks

Extract reusable logic into custom hooks:

```tsx
function useProducts(categoryId: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    api.productsByCategory(categoryId)
      .then(setProducts)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [categoryId]);

  return { products, loading, error };
}
```

## API Integration

### Use the Services Layer

All API calls must go through `services/api.ts`. Never use `fetch` directly in components.

```tsx
// ✅ Good
import { api } from "./services/api";
const products = await api.products();

// ❌ Bad - direct fetch in component
const res = await fetch("/api/products");
```

### Adding New Endpoints

When the backend adds a new endpoint, update `services/api.ts`:

```tsx
export const api = {
  // existing endpoints...

  // Add new endpoint with typed response
  productDetails: (id: string) =>
    request<ProductDetails>(`/products/${id}`),

  // POST with body
  submitConfiguration: (config: ConfigPayload) =>
    request<ConfigResult>("/products/configure", {
      method: "POST",
      body: JSON.stringify(config),
    }),
};
```

### Error Handling

Handle API errors gracefully:

```tsx
function ProductList() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.products()
      .then(setProducts)
      .catch((e) => {
        if (e instanceof ApiError) {
          setError(e.status === 404 ? "No products found" : "Failed to load");
        } else {
          setError("Network error");
        }
      });
  }, []);

  if (error) return <ErrorMessage message={error} />;
  // ...
}
```

## TypeScript

### Strict Typing

- Never use `any`. Use `unknown` if type is truly unknown, then narrow.
- Define interfaces for all data structures.
- Props must be typed via interface or type alias.

```tsx
// ✅ Good
interface Product {
  id: string;
  name: string;
  price: number;
  attributes: Record<string, string>;
}

// ❌ Bad
const products: any[] = [];
```

### Event Handlers

Type event handlers explicitly when needed:

```tsx
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setValue(e.target.value);
};

const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  // ...
};
```

### Generic Components

Use generics for reusable components:

```tsx
interface SelectProps<T> {
  options: T[];
  value: T;
  onChange: (value: T) => void;
  getLabel: (item: T) => string;
}

function Select<T>({ options, value, onChange, getLabel }: SelectProps<T>) {
  // ...
}
```

## Styling

### CSS Approach

Use CSS modules or plain CSS files. Keep styles co-located with components when possible.

```
components/
  ProductCard/
    ProductCard.tsx
    ProductCard.css
```

### CSS Custom Properties

Use CSS custom properties for theming and consistent values:

```css
:root {
  --color-primary: #3b82f6;
  --color-surface: #ffffff;
  --spacing-md: 1rem;
  --radius-md: 0.5rem;
}

.card {
  background: var(--color-surface);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
}
```

### Responsive Design

Use mobile-first responsive design:

```css
.grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

## Accessibility

### Semantic HTML

Use semantic elements: `<button>`, `<nav>`, `<main>`, `<article>`, `<section>`.

```tsx
// ✅ Good
<button onClick={handleClick}>Add to Cart</button>

// ❌ Bad
<div onClick={handleClick}>Add to Cart</div>
```

### ARIA Labels

Add labels for interactive elements without visible text:

```tsx
<button aria-label="Close dialog" onClick={onClose}>
  <XIcon />
</button>

<input
  type="search"
  aria-label="Search products"
  placeholder="Search..."
/>
```

### Keyboard Navigation

Ensure all interactive elements are keyboard accessible:

```tsx
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") handleClick();
  }}
>
  Custom Button
</div>
```

### Focus Management

Manage focus for modals and dynamic content:

```tsx
function Modal({ isOpen, onClose, children }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) closeRef.current?.focus();
  }, [isOpen]);

  // ...
}
```

## Performance

### Memoization

Use `useMemo` and `useCallback` for expensive computations and stable references:

```tsx
// Memoize expensive computation
const sortedProducts = useMemo(
  () => products.slice().sort((a, b) => a.price - b.price),
  [products]
);

// Stable callback reference for child components
const handleSelect = useCallback((id: string) => {
  setSelected(id);
}, []);
```

### Lazy Loading

Lazy load heavy components:

```tsx
const ProductConfigurator = lazy(() => import("./ProductConfigurator"));

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <ProductConfigurator />
    </Suspense>
  );
}
```

### Image Optimization

Use appropriate image formats and sizes:

```tsx
<img
  src={product.image}
  alt={product.name}
  loading="lazy"
  width={300}
  height={200}
/>
```

## Testing Patterns

### Component Tests

Test behavior, not implementation:

```tsx
// ✅ Good - tests user behavior
test("adds product to cart when button clicked", async () => {
  render(<ProductCard product={mockProduct} />);
  await userEvent.click(screen.getByRole("button", { name: /add to cart/i }));
  expect(screen.getByText(/added/i)).toBeInTheDocument();
});

// ❌ Bad - tests implementation
test("sets state when clicked", () => {
  const { result } = renderHook(() => useState(false));
  // ...testing internal state
});
```

### Mock API Calls

Mock the services layer, not fetch:

```tsx
import { api } from "./services/api";

jest.mock("./services/api");

test("displays products from API", async () => {
  (api.products as jest.Mock).mockResolvedValue([
    { id: "1", name: "Chair", price: 299 }
  ]);

  render(<ProductList />);
  expect(await screen.findByText("Chair")).toBeInTheDocument();
});
```

## File Organization

```
src/react-app/
├── assets/              # Static assets (SVGs, images)
├── components/          # Reusable UI components
│   ├── Button/
│   │   ├── Button.tsx
│   │   └── Button.css
│   └── ...
├── features/            # Feature-specific components
│   ├── discovery/
│   ├── products/
│   └── configurator/
├── hooks/               # Custom hooks
├── services/            # API layer
│   └── api.ts
├── types/               # Shared TypeScript types
├── utils/               # Helper functions
├── App.tsx              # Root component
├── App.css              # Global styles
├── main.tsx             # Entry point
└── index.css            # Base styles
```
