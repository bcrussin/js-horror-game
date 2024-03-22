# JS Horror Game

## Overview

## Todo

### Engine v1

- [x] Fix player collision with width/height
  - Allows clipping when player is in multiple cells at once
- [x] Improve collisions efficiency
  - Don't include repeat cells
- [ ] Update player velocity in `move` function, then update position in `update` function
- [ ] Illuminate walls based on flashlight (not proximity)