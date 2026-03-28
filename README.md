# Claw Pong

Modern arcade brick-breaker built with Vite and vanilla JavaScript.

## Concept

Claw Pong mixes paddle control with a glowing energy ball in space:
- guide the disk/paddle left and right
- bounce the orb upward
- destroy every floating block
- earn score for each collision
- win when the last block disappears

## Controls

- `Left / Right Arrow` or `A / D` — move paddle
- `Space` — launch ball / restart after win or loss
- `Mouse` — optional paddle movement

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Next steps

This first pass sets up:
- project structure
- playable game loop
- scoring, lives, and win/lose states
- modern neon visual style

Future improvements can add sound, power-ups, levels, particle bursts, and mobile touch controls.
