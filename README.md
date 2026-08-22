# Adelaide Tycoon V0.9

A local multiplayer, pass-and-play PWA board game designed for one phone and 2–6 players.

## V0.9 highlights

- Commercial mobile-board-game style dice presentation with larger physical-feeling dice, result pop and haptics
- Stronger token travel feel while moving square-by-square
- Landing impact animation and board shockwave
- Property acquisition celebration with `OWNED!` banner and particles
- Rent payment banner plus cash-loss feedback
- House / landmark upgrade celebration and tile animation
- Stronger pass-the-phone turn reveal
- Respects `prefers-reduced-motion` and the existing fast-animation setting
- Animation lives in its own `v9.js` / `v9.css` layer so the core dice and game rules stay isolated
- Retains V0.8 turn phases, property deed card, cash flow, turn summary and jail bail action
- Retains V0.7.1 stability fixes, Quick Mode, House Rules, custom tokens and 25-space board QA
- PWA cache updated to `adelaide-tycoon-v09`

## Animation reference

V0.9 takes animation principles from current commercial digital MONOPOLY-style games: a living board, strong dice feedback, clear landing moments, animated construction and obvious reward / loss feedback. Adelaide Tycoon keeps original Adelaide branding, locations and UI assets rather than copying licensed artwork or characters.

## Version history

- **V0.9** — dice physics feel, token travel, landing impact, buy/rent/build celebration animations
- **V0.8** — turn phases, deed decision cards, cash animations, turn summary, jail bail action
- **V0.7.1** — stability fix for observer loop, Quick Mode ending and Free Parking Jackpot calculation
- **V0.7** — Quick Mode, House Rules, tokens, turn HUD and richer animation
- **V0.6.2** — 25-space board geometry fix and startup QA checks
- **V0.6.1** — dice hotfix
- **V0.6** — visual refresh and button handling improvements
- **V0.5** — large dice control and PWA refresh improvements
- **V0.4** — dice/card animations, sound, vibration, pass-the-phone privacy screen
- **V0.3** — colour groups, building rules, mortgage, auctions and upgraded trading
- **V0.2** — jail, event cards, bankruptcy and winner flow
- **V0.1** — basic dice, movement, buying property and rent

## Run

Open `index.html`, or publish the `main` branch using GitHub Pages.
