# Goto Platform Demo Template

This template provides a minimal setup for building a React application with TypeScript and Vite, designed to run on Cloudflare Workers. It features hot module replacement, ESLint integration, and the flexibility of Workers deployments.

<!-- dash-content-start -->

The Stack:

- [**React**](https://react.dev/) - A modern UI library for building interactive interfaces
- [**Vite**](https://vite.dev/) - Lightning-fast build tooling and development server
- [**Hono**](https://hono.dev/) - Ultralight, modern backend framework
- [**Cloudflare Workers**](https://developers.cloudflare.com/workers/) - Edge computing platform for global deployment

### Key Features

- Hot Module Replacement (HMR) for rapid development
- TypeScript support out of the box
- ESLint configuration included
- Zero-config deployment to Cloudflare's global network
- API routes with Hono's routing
- Full-stack development setup
- Built-in Observability to monitor your Worker

<!-- dash-content-end -->

## Getting Started

To start a new project with this template, run:

```bash

```

Push the repo to the Threekit organization on Github
```bash

```

## Development

Install dependencies:

```bash
npm install
```

Start the development server with:

```bash
npm run dev
```

Your application will be available at [http://localhost:5173](http://localhost:5173).

## Production

Build your project for production:

```bash
npm run build
```

Preview your build locally:

```bash
npm run preview
```

Deploy your project to Cloudflare Workers:

```bash
npm run build && npm run deploy
```

Monitor your workers:

```bash
npx wrangler tail
```

## Configure Goto Platform
### Set up the Domain
Set the domain to use in `./wrangler.toml`
```
[[routes]]
pattern = "YOUR_SUBDOMAIN.3kit.ai"
custom_domain = true
```

### Create a new Goto Platform Tenant

### Set your token 

### Load your data

## Additional Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Vite Documentation](https://vitejs.dev/guide/)
- [React Documentation](https://reactjs.org/)
- [Hono Documentation](https://hono.dev/)
