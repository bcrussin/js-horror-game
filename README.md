# JS Horror Game

## Overview

This is a horror game written in pure JavaScript, utilizing a raycast-based lighting engine.

This results in a gameplay loop involving peeking around corners to illuminate rooms, using line-of-sight to illuminate enemies, and enhancing the horror aspect of the game.

## Todo

### Version 0.1

#### Tile Metadata (v0.1.1)

- [ ] Update player velocity in `move` function, then update position in `update` function
- [ ] Implement tile metadata
  - [ ] Mark tiles as solid or not solid (for lighting engine and collision)
  - [ ] Update map with non-solid tiles to act as floor
- [ ] Store map metadata along with tile data in file
  - Map height/weight, etc.
- [ ] Add other light sources to map

#### Initial Engine (v0.1.0)

- [x] Fix player collision with width/height
  - Allows clipping when player is in multiple cells at once
- [x] Improve collisions efficiency
  - Don't include repeat cells
- [x] Illuminate walls based on flashlight (not proximity)