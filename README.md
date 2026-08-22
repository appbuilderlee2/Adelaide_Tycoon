# Adelaide Tycoon V0.6.2

A local multiplayer, pass-and-play PWA board game designed for one phone and 2–6 players.

## V0.6.2 QA hotfix

- Fixed a critical board-geometry bug: the game had 25 spaces but only 20 grid coordinates.
- Board now uses 25 unique positions on a 7×7 layout.
- Large dice button delegates to the original core dice button instead of replacing its handler.
- Added startup self-checks for board-space count, unique coordinates, and required core buttons.
- Added visible QA status on the start screen.
- Added runtime error surfacing instead of silent failures.
- Bumped PWA cache and asset query versions to `062`.

## Version history

- **V0.6.2** — full QA hotfix, 25-space board fix, startup self-checks, PWA refresh
- **V0.6.1** — dice delegation hotfix
- **V0.6** — refreshed UI and button feedback
- **V0.5** — larger dice area and animation upgrade
- **V0.4** — dice/card animations, sound, vibration, pass-the-phone privacy screen
- **V0.3** — colour groups, building rules, mortgage, auctions, upgraded trading
- **V0.2** — jail, event cards, bankruptcy and winner flow
- **V0.1** — basic dice, movement, buying property and rent

## Run

Publish the repository with GitHub Pages or open `index.html` locally.

For an installed iPhone PWA, open the GitHub Pages URL once in Safari after an update so the latest service worker can take control.
