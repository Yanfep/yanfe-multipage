# Yanfe Portfolio — multi-page version

Real static pages, no hash-routing:

- `index.html` — Home
- `order-history.html` — Order History case study (built, but not yet linked from the home grid — that tile is hidden for now)
- `adirun.html` — adiRun case study
- `post-sales-ds.html` — Post-sales DS refactor case study
- `about.html` — About page
- `styles.css` — all shared styles
- `script.js` — custom cursor + YanfeLLM chat panel (shared by every page)

## Run locally
    npx serve .

or just open `index.html` directly.

## Notes
- Every page loads `styles.css` and `script.js`, so edit those once and it
  applies everywhere — no more copy-pasting a change into six places.
- The chat panel markup (`#chatPanel`, `#chatBody`, etc.) is duplicated at
  the top of every page's `<body>`, since each page loads independently now.
- YanfeLLM on GitHub Pages needs the Cloudflare Worker in `workers/yanfellm.js`.
  Paste that file into a Worker, add the `ANTHROPIC_API_KEY` secret, then put
  the Worker URL in `YANFELLM_URL` inside `script.js`. Until that URL is set,
  the chat still uses Claude's preview `sample` API when it exists.
- Post-sales DS refactor page is scaffolded; copy still to be filled in.
- Order Detail Page, "Where is my refund?", and Design system tiles were
  removed from the home grid; their content was never fully built out,
  so there was nothing to carry over into a page.
