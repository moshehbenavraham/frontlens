# Visual Landing Page

AI video production landing page for MOJJU, with a cinematic hero, featured work, awards, services, team profiles, and a lead capture form.

## Tech Stack

- Vite
- React
- TypeScript
- Tailwind CSS (with class-based dark mode)
- Framer Motion
- Lucide React

## Getting Started

```sh
npm install
npm run dev
```

The development server starts on port 8080 by default.

## Scripts

- `npm run dev` - start the local Vite server
- `npm run build` - create a production build
- `npm run lint` - run ESLint
- `npm run preview` - preview the production build locally

## Project Structure

- `src/components` - landing page sections and reusable visual components
- `src/hooks` - shared React hooks (theme, etc.)
- `src/assets` - local portfolio, awards, storyboard, and team images
- `public` - static metadata assets, favicon, robots file, and social preview

## Theming

Dark mode is wired up through a hand-rolled hook (`src/hooks/useTheme.ts`) plus
an inline anti-FOUC bootstrap script in `index.html`. Both honour the same
`mojju-theme` `localStorage` key and fall back to the visitor's
`prefers-color-scheme`. The toggle (`src/components/ThemeToggle.tsx`) cycles
through `light → dark → system` and is mounted in the Hero navigation bar
(plus a labelled variant inside the mobile menu).

When changing theming behaviour, keep the bootstrap script and the hook in
sync — the bootstrap is what paints the correct theme *before* React mounts,
so any drift between the two causes a first-paint flicker.

## Deployment

Run `npm run build` and deploy the generated `dist` directory to any static hosting provider.
