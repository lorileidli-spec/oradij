# ÁrMűhely

ÁrMűhely is a responsive Hungarian financial calculator for solo salon owners, multi-person salons, owners planning their own pay, employers calculating a team member’s true cost, and businesses preparing a cost-based price increase.

## Features

- Five connected calculator views in one application
- Editable recurring costs with monthly, quarterly, half-yearly, and yearly periods
- Live hourly, daily, monthly, and annual calculations
- Renovation and equipment reserve planning
- Automatic per-person salon cost allocation
- Cost-based service price recommendation
- Copyable result summaries and complete mobile navigation

## Technology

- React 19
- TanStack Start and TanStack Router
- TypeScript
- Tailwind CSS 4 with a custom CSS design system
- Lucide React icons
- Netlify deployment integration

## Run Locally

```bash
pnpm install
pnpm dev
```

The development server uses the port configured by the project’s Vite setup. For Netlify platform emulation, use the Netlify CLI according to the local environment configuration.

## Production

```bash
pnpm build
```

Netlify uses the repository’s `netlify.toml` and Vite integration to build and publish the application.
