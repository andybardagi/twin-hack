# Design Style

## Theme

This starter uses the default shadcn/ui neutral theme: near-black primary actions, gray secondary surfaces, and achromatic structure in both light and dark mode.

Use semantic Tailwind tokens from `packages/ui/src/styles/globals.css` (`bg-primary`, `text-muted-foreground`, `border-border`, `ring-ring`, and related utilities). Do not hard-code color values in components.

## Color Usage

- Primary is near-black in light mode and near-white in dark mode (`--primary`). Use it for primary CTAs, active states, focus rings, selected indicators, and small emphasis.
- Primary foreground is the contrasting token (`text-primary-foreground`) on primary fills.
- Secondary is a light gray surface in light mode and a dark gray surface in dark mode (`--secondary`). Use it for secondary CTAs and supporting chrome.
- Structural chrome stays achromatic: white, near-white, neutral gray, and near-black.
- Destructive uses the `--destructive` token. Pair it with labels and component affordances so destructive actions stay clear.
- Charts should follow the token sequence `chart-1` through `chart-5` (grayscale ladder).

Do not introduce a competing brand hue (lime, teal, orange, pink, purple) in component code. If a product later needs categorical status colors, add dedicated semantic tokens in `globals.css` for both `:root` and `.dark` instead of hard-coding literals.

## Typography

- Headings and body use Geist through `font-sans` / `font-heading` as wired in `apps/web/app/layout.tsx`.
- Code and technical fragments use Geist Mono through `font-mono`.
- Keep copy sentence case in labels, controls, and app chrome.
- Use tight hierarchy, not decorative typography. Avoid condensed, script, or extra display faces.

## Layout

- Use an 8px base rhythm. Prefer token-aligned spacing utilities such as `gap-2`, `gap-4`, `p-6`, `px-8`, and section spacing around `4rem`.
- Prefer max-width content around `1200px` with `2rem` gutters for broad pages.
- App screens should be medium density: enough whitespace, but not a marketing-heavy layout by default.
- Keep primary moments sparse. A view should generally have one dominant primary CTA or active focal point.
- Sidebars should remain white or dark neutral depending on mode; active items can use primary accents or subtle token backgrounds.

## Surfaces, Elevation, And Shape

- Cards use `bg-card`, `text-card-foreground`, neutral borders, subtle shadows, and moderate radius.
- Buttons, inputs, and controls should feel clean and moderately rounded, around `rounded-lg`.
- Cards and large panels can use `rounded-xl`.
- Chips and compact controls can use `rounded-sm`, `rounded-md`, or `rounded-full` where appropriate.
- Keep elevation neutral. Do not use colored shadows.

## Component Guidance

- Primary button: near-black fill (inverted in dark mode) with contrasting text. Use for the main action only.
- Secondary button: gray fill with foreground text. Use for alternate actions.
- Outline and ghost controls: transparent or neutral backgrounds with foreground text and neutral borders.
- Inputs: background/card surfaces, neutral borders, and tokenized focus rings.
- Badges: primary for highlights, secondary/muted for supporting status.
- Prefer existing `@workspace/ui` components and variants before adding new component styles.

## Don'ts

- Do not warm the neutral palette into cream, sand, tan, or brown unless the product later replaces this theme.
- Do not use raw hex, RGB, HSL, or OKLCH literals in component code when a semantic token exists.
- Do not invent a parallel palette next to the tokens in `globals.css`.
- Both light and dark mode must keep working.
