# Implementation Plan - Transition Cyber Othello to Cyber Chess

This plan details how we will transition the existing Cyber Othello Next.js application into a Cyber Chess application. We will preserve the premium neon cyberpunk aesthetic, Web Audio API synthesizers, 3D/2D perspectives, and automated AI self-learning dashboard (TD learning) by adapting chess logic onto the same structures.

## User Review Required

> [!IMPORTANT]
> - **Dependency Addition:** We will install `chess.js` to manage chess rules (valid moves, checkmate, stalemate, draws, castling, promotion).
> - **UI Interaction Change:** Othello requires a single click to place a piece. Chess requires two clicks (select piece, select destination). We will implement a smooth two-click interaction with glowing selector frames and pulse-hint overlays.
> - **Auto-Promotion:** To keep the UI fast and responsive, pawns will automatically promote to Queens when reaching the opposite rank.
> - **Reinforcement Learning Model:** We will preserve the 8x8 weight matrix ("reinforced brain") by using it as a tactical square value map (adding weights of occupied squares to the base board evaluation). This allows 100% of the visual self-training dashboard to function identically for Chess.

## Proposed Changes

### Dependencies

#### [MODIFY] [package.json](file:///Users/shun_ishii/Projects/04b_chess/netlify_chess_v2/package.json)
- Add `chess.js` to the list of dependencies. We will install it using `npm install chess.js`.

---

### Core Game Logic & Helpers

#### [MODIFY] [gameSetting.tsx](file:///Users/shun_ishii/Projects/04b_chess/netlify_chess_v2/utils/gameSetting.tsx)
- Define Chess-compatible board state types:
  ```typescript
  export interface ChessPiece {
      type: 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
      color: 'w' | 'b';
  }
  export type CellValue = ChessPiece | null;
  export type BoardState = CellValue[][];
  export type Player = 'white' | 'black'; // white is P1 (Cyan), black is P2 (Magenta)
  export type Winner = Player | 'draw' | null;
  ```
- Add utility helpers to convert between board coordinates `(row, col)` or indices `(0-63)` and algebraic chess squares (e.g. `'e2'`).
- Provide functions to translate `chess.js` state representation into our standard `BoardState` and active `Player`.

#### [MODIFY] [AILogic.tsx](file:///Users/shun_ishii/Projects/04b_chess/netlify_chess_v2/utils/AILogic.tsx)
- Rewrite AI heuristics for Chess:
  - **Easy:** Picks random legal moves (with a preference for captures if available).
  - **Normal:** Depth 1 Minimax search using Chess material values (Pawn=10, Knight/Bishop=30, Rook=50, Queen=90) and positional tables (e.g., center control).
  - **Hard:** Depth 3 Minimax search with Alpha-Beta pruning using material values and positional tables.
- Keep function signatures like `getBestMoveAlphaBeta` and `getBestMoveMobility` to limit refactoring in pages.

#### [MODIFY] [reinforcedBrain.ts](file:///Users/shun_ishii/Projects/04b_chess/netlify_chess_v2/utils/reinforcedBrain.ts)
- Update TD-learning board valuation to combine Chess material values with the 8x8 learned square weights matrix.
- Ensure the TD(0) weight updates apply correctly based on pieces occupying the squares.
- Symmetrize weights across the board to speed up convergence during AI self-play simulations.

---

### UI Components

#### [MODIFY] [Board.tsx](file:///Users/shun_ishii/Projects/04b_chess/netlify_chess_v2/components/Board.tsx)
- Accept `selectedCellIndex: number | null` to highlight the currently selected piece.
- Accept `canPutPositions: number[]` representing valid target squares for the selected piece, drawing neon pulse hints on those squares.

#### [MODIFY] [Cell.tsx](file:///Users/shun_ishii/Projects/04b_chess/netlify_chess_v2/components/Cell.tsx)
- Style alternating board squares (light vs dark cells) using translucent glassmorphism theme variables.
- Render chess pieces as glowing FontAwesome 6 icons (`fa-chess-king`, `fa-chess-queen`, etc.) placed inside the existing premium 3D radial-gradient cyber discs:
  - Cyan disc + primary neon glow for White pieces.
  - Magenta disc + secondary neon glow for Black pieces.
- Draw a glowing neon border around the cell when `isSelected` is true.

---

### Game Pages

#### [MODIFY] [page.tsx](file:///Users/shun_ishii/Projects/04b_chess/netlify_chess_v2/app/page.tsx)
- Rewrite Japanese text copy to refer to "Cyber Chess" (サイバー・チェス) instead of "Cyber Othello".

#### [MODIFY] [match/page.tsx](file:///Users/shun_ishii/Projects/04b_chess/netlify_chess_v2/app/match/page.tsx) (PvP Mode)
- Initialize game state using the `chess.js` FEN string.
- Implement the two-click move selection logic.
- Play synth audio sounds: `playPlace` on move execution, and `playError` on invalid selection.
- Update the score panel to display the count of remaining White/Black pieces.
- Integrate the undo history stack to pop FEN states.

#### [MODIFY] [vsAI/page.tsx](file:///Users/shun_ishii/Projects/04b_chess/netlify_chess_v2/app/vsAI/page.tsx) (PvE Mode)
- Adapt game loop for playing against the easy/normal/hard/reinforced Chess AI.
- Manage turn transitions, user clicks, and AI calculation latency.

#### [MODIFY] [AIvsAI/page.tsx](file:///Users/shun_ishii/Projects/04b_chess/netlify_chess_v2/app/AIvsAI/page.tsx) (EvE Simulator)
- Adapt the AI-vs-AI simulation loop using `chess.js` rules.
- Support automated background self-play training of the neural weight table for Chess.

#### [MODIFY] [Header.tsx](file:///Users/shun_ishii/Projects/04b_chess/netlify_chess_v2/components/Header.tsx) and [Footer.tsx](file:///Users/shun_ishii/Projects/04b_chess/netlify_chess_v2/components/Footer.tsx)
- Change header title to "CYBER CHESS".
- Update rules explanation modal and AI algorithm descriptions in the footer to explain Chess movements, checkmates, and evaluations.

---

## Verification Plan

### Automated Verification
- Verify compilation succeeds with `npm run build` after changes are made.
- Test `chess.js` integration rules inside the app.

### Manual Verification
- Open local development server using `npm run dev` and open in browser.
- **PvP Mode:** Verify piece selection, legal move hints, move executions, capture animations, castling, promotion, checkmate detection, and undo functionality.
- **PvE Mode:** Play against each level of AI (easy, normal, hard, reinforced). Verify AI makes valid moves and responds correctly.
- **EvE Mode:** Run the simulation. Verify the weights matrix maps update dynamically. Run a chunk of 100 fast training matches to verify weights converge and save to `localStorage`.
- **Aesthetic check:** Confirm the 3D tilted board view, glowing neon borders, scanlines, and audio synth effects behave smoothly and remain stunning.
