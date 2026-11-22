# purps.ca

Every site under `purps.ca`, in one app.

| Site         | Address                                                |
| ------------ | ------------------------------------------------------ |
| Landing page | `purps.ca`, and any name which isn't a site of its own |
| osu! tools   | `osu.purps.ca`                                         |

The app picks a site by the name it was asked for.

## Working on it

```sh
just dev
```

Then open <http://localhost:5173> for the landing page, or <http://osu.localhost:5173> for the osu site. Any
`<site>.localhost` address works without setup, which is how a change is looked over before it is released.

```sh
just check     # types
just lint      # formatting and lint
just format    # fix formatting
just test      # tests
just build     # the production build, into build/
just preview   # serve that build, as it will run once released
```

## How it is laid out

- `src/lib/sites.ts` decides which site a name belongs to. Start here to add one.
- `src/routes/sites/<site>/` holds each site's pages.
- `src/lib/components/` holds what the sites share: the header, the tag, buttons, tool cards.
- `src/routes/layout.css` holds the shared fonts and colours. A site sets `--accent` and the shared pieces
  follow it.
- `src/lib/<site>/` holds what belongs to one site only.

### Adding a tool to the osu site

Add an entry to `src/lib/osu/tools.ts`, with its screenshot beside it. It gets a card, a link in the header
and a screen of its own.

### Adding a site

1. Add its name to `SUBDOMAINS` in `src/lib/sites.ts`.
2. Add its pages under `src/routes/sites/<name>/`.
3. Point `<name>.purps.ca` at the app in the reverse proxy.

## Releasing

Pushing to `main` runs the checks and nothing more. When what is there is ready to go out, tag it:

```sh
git tag -a v1.2.0 -m "What changed"
git push origin v1.2.0
```

That runs the checks again and then publishes the image as `ghcr.io/pvrps/purps.ca:latest` and `:1.2.0`. The
app listens on port 3000.
