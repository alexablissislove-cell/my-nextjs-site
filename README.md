This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Vercel deployment and telemetry

This Next.js app lives at the repository root. In Vercel, use the **Next.js**
framework preset, leave **Root Directory** empty, and leave build, output,
install, and development command overrides disabled.

The root layout mounts Web Analytics and Speed Insights once for all routes.
Enable those products on the Vercel project and deploy to serve their scripts
and collection endpoints. Dashboard metrics require real visits; a successful
build alone does not prove events have been received.

Open a pull request to verify a Preview deployment before merging to `main`.
Keep Preview environment variables separate from Production credentials.

Run the available checks with `npm run lint`, `npx tsc --noEmit`, and
`npm run build`.

The scoped npm override for `@typescript-eslint/typescript-estree` selects
`minimatch` 11.0.8 to address GHSA-g3hv-75wg-m249. It leaves legacy minimatch
consumers unchanged. Remove the override once TypeScript ESLint declares a
patched dependency; recheck lint and project-service glob matching when updating it.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
