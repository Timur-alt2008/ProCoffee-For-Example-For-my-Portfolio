# ProCoffee — For Example — For my Portfolio

**Example · coffee house & bakery** — a demo website for a fictional European-style coffee house in Podil, Kyiv, built for a web developer portfolio.

**Live site:** https://timur-alt2008.github.io/ProCoffee-For-Example-For-my-Portfolio/

## Concept

The site is built around the idea of “coffee in your hands”: warm, rounded shapes (arched windows, saucers, cups seen from above), a barista's handwritten notes in the margins, wooden pastry shelves and guest reviews on napkins. The character is cosy and gastronomic — a deliberate contrast to the strict, editorial Barbershop and the technical AutoServise projects.

- **Palette:** milk, cream, caramel, chocolate, coffee and natural wood
- **Type:** Yeseva One (headings), Golos Text (body), Caveat (handwritten notes)
- **Photos:** Unsplash, served at the right size and format (WebP/AVIF) via `srcset`

## Pages

| Page | What's inside |
| --- | --- |
| `index.html` | Hero, story teaser, “Anatomy of a cup”, signature drinks, desserts & bakery case, breakfast, atmosphere, reviews, offers, visit invitation |
| `menu.html` | Full menu: 9 categories, 38 items with photos and prices in UAH, search, extras |
| `story.html` | Timeline 2016–2024, “from bean to cup”, numbers, values |
| `gallery.html` | 16 photos with filters and a full-screen viewer |
| `visit.html` | Table booking on a floor plan, contacts, opening hours, map |
| `404.html` | The “empty cup” page |

## Features

- **Anatomy of a cup** — pick a drink and the glass fills with layers of espresso, water, milk and foam in real ratios
- **Signature drinks** — switching drinks changes the photo, price and flavour profile (sweetness, acidity, body, strength)
- **Breakfast** — a live timeline based on Kyiv time showing how long breakfast is still served
- **Atmosphere** — hotspots on a photo of the room with descriptions
- **Reviews** — a stack of notes you can flip with buttons, arrow keys or by dragging
- **Loyalty card** — interactive stamps; progress is saved in the browser
- **Menu** — accessible tabs (arrows, Home/End), deep links to categories (`menu.html#cold`), search across names, descriptions and tags
- **Gallery** — filters and a lightbox with keyboard, swipe and a counter
- **Booking** — guests, 14 days ahead, time slots based on opening hours (past times disabled), table selection on the floor plan with capacity and availability, a +380 phone mask, validation, a confirmation with a booking number, an `.ics` calendar file, a “Your bookings” list with cancellation, and an occasion preset from the link (`visit.html?occasion=birthday`)
- **Contacts** — today's hours highlighted, an “open / closed” status based on Kyiv time, a map that loads on click
- Mobile menu with a focus trap and Esc to close, smooth scroll-reveal animations, `prefers-reduced-motion` support
- SEO: unique titles and descriptions, Open Graph, canonical URLs, Schema.org `CafeOrCoffeeShop` markup, `sitemap.xml`, `robots.txt`

## Structure

```
├── index.html, menu.html, story.html, gallery.html, visit.html, 404.html
├── assets/
│   ├── css/
│   │   ├── tokens.css       — colours, fonts, sizes, shadows, motion
│   │   ├── base.css         — reset, typography, layout, reveal
│   │   ├── components.css   — header, menu, buttons, fields, footer
│   │   └── sections.css     — home page and inner page sections
│   └── js/
│       ├── core.js          — header, mobile menu, animations, Kyiv time
│       ├── home.js          — home page interactions
│       ├── menu.js          — tabs and search
│       ├── story.js         — timeline progress
│       ├── gallery.js       — filters and lightbox
│       ├── config.js        — settings (booking mode, contacts)
│       └── booking.js       — booking and contacts
├── server/booking-worker.js — example backend for real bookings
├── favicon.svg, site.webmanifest, sitemap.xml, robots.txt
```

No frameworks and no build step: plain HTML, CSS and JavaScript.

## Connecting real bookings

The form currently runs in **demo mode**: bookings are only stored in the visitor's browser. To send bookings to the café staff in Telegram:

1. Create a bot with [@BotFather](https://t.me/BotFather) and find the id of the chat that should receive bookings.
2. Create a free Worker on [Cloudflare](https://workers.cloudflare.com/) and paste in the code from `server/booking-worker.js`.
3. Add the environment variables `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` and `ALLOWED_ORIGIN`.
4. In `assets/js/config.js`, change `mode: 'demo'` to `mode: 'endpoint'` and set `endpoint` to your worker URL.

If the server is unavailable, the site shows an error message with the café's phone number.

## Running locally

Open `index.html` in a browser, or start a local server:

```bash
python3 -m http.server 8000
```

## Note

This is a demo project. The café name, address, phone number, prices, reviews and history are fictional. The social links point to the Instagram, Telegram and Facebook home pages — replace them with real accounts. Photos: [Unsplash](https://unsplash.com) (Unsplash License).
