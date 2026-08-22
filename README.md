# Adelaide Tycoon V1.0

A local multiplayer, pass-and-play PWA board game designed for one phone and 2–6 players.

## V1.0 mobile game UI redesign

- Board-first gameplay layout: the large landing hero is hidden once a game starts so the board becomes the primary surface.
- Compact sticky game header for title, settings and new game.
- Current players are shown as horizontal compact chips instead of large stacked cards.
- Current-player HUD remains directly above the board.
- Status information is compressed into a small four-cell strip.
- Bottom navigation is redesigned as a mobile-game dock.
- Dice is the dominant central action, raised above Assets / Trade / Players.
- Property actions are consolidated below the board as contextual controls.
- Buy and End Turn become full-width primary actions when relevant.
- Safe-area spacing is included for iPhone Home Screen / PWA use.
- Existing V0.9 animation layer remains intact.
- Existing V0.8 turn phases, deed card, money feedback and turn summary remain intact.
- Existing V0.7.1 stability fixes, Quick Mode, House Rules, custom tokens and 25-space board QA remain intact.
- PWA cache updated to `adelaide-tycoon-v10`.

## Design reference

V1.0 takes layout principles from current commercial digital MONOPOLY-style mobile games: the board dominates the play surface, the roll action has the highest visual priority, secondary actions live in a compact bottom dock, and property decisions appear contextually near the board. Adelaide Tycoon keeps its own Adelaide branding, locations and original UI rather than copying licensed artwork or characters.

## Version history

- **V1.0** — board-first mobile UI, compact HUD, central dice button, bottom action dock, contextual property actions
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
