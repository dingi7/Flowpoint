Flowpoint multi-tenant landing pages built with Next.js.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Landing pages are served on subdomains. For local development you can visit:

- `http://<slug>.localhost:3000` (e.g. `http://firstclass.localhost:3000`)

You can start editing the tenant layout by modifying `src/templates/`.

## Environment Variables

Set the following env vars in Vercel (and locally if needed):

```
ROOT_DOMAIN=flowpoint.services
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
