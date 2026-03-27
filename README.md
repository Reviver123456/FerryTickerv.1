## Running the code

Install dependencies with `pnpm install` or `npm install`.

Run `pnpm dev` or `npm run dev` to start the development server.

## API Proxy And CORS

This project now proxies browser requests through Next route handlers under `/api/*`.

The proxy forwards to `https://api-ferryticket.onrender.com` by default, or to `FERRY_API_BASE_URL` when that env var is set.

This change avoids browser-side CORS errors when the frontend runs on `http://localhost:3000`.

## Deployment Note

Because the app now uses Next route handlers for the API proxy, it should be deployed to a Node-capable Next.js platform such as Vercel or Render instead of static GitHub Pages export.
