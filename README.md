# Adelaide Tycoon V1.1

A local multiplayer, pass-and-play PWA board game designed for one phone and 2–6 players.

## V1.1 One-Screen Mode

- Gameplay is locked to one phone viewport using `100dvh` and compact responsive sizing.
- The full play state is visible without scrolling on normal portrait phones: player strip, current-turn HUD, phase indicator, board, contextual property controls, message and bottom dock.
- Player cards are reduced to a single horizontal strip.
- The four-cell status strip is hidden during play because its key information is already represented in the HUD and board state.
- The board automatically uses the remaining viewport height and stays square without being clipped.
- Property information becomes a compact one-line action strip below the board.
- The game message becomes a single-line status bar; tap it to open the full game log in a modal.
- The permanent game-log panel is hidden during gameplay to preserve board space.
- Bottom roll / assets / trade / players dock is shortened while keeping Roll as the dominant action.
- Includes an extra compact layout for phones shorter than 740px.
- Retains V1.0 mobile-game UI, V0.9 animation layer, V0.8 turn experience and all existing game rules.
- PWA cache updated to `adelaide-tycoon-v11`.

## Version history

- **V1.1** — one-screen gameplay layout; no scrolling required on normal portrait phones
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
