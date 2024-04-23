# JS Horror Game

## Overview

This is a horror game written in pure JavaScript, utilizing a raycast-based lighting engine.

This results in a gameplay loop involving peeking around corners to illuminate rooms, using line-of-sight to illuminate enemies, and enhancing the horror aspect of the game.

## Todo

### Version 0.1

#### Lightmaps and Enemy Spawning

- [x] Generate lightmap from static light sources
- [x] Add dynamic light sources to lightmap (i.e. Player flashlight)
- [x] Spawn entity only in dark areas close to player

#### Layered Maps & Lighting

- [ ] Update player velocity in `move` function, then update position in `update` function
- [x] Implement multi-layered maps
  - [x] Treat background layers as not solid (for lighting engine and collision)
  - [x] Create lighting layer for sources of light
- [x] Store map metadata along with tile data in file
  - [x] Map height/width
  - [x] Initial zoom level
  - [x] Player size
- [x] Add other light sources to map
- [x] Allow placing light sources in map maker
- [x] Render point lights in-game
- [ ] Allow tweaking light settings in map maker
- [ ] Allow placing lights off-grid
- [x] Render lights realistically in map maker
  - Point light with `n` radius renders as that size, for example

#### Initial Engine (v0.1.0)

- [x] Fix player collision with width/height
  - Allows clipping when player is in multiple cells at once
- [x] Improve collisions efficiency
  - Don't include repeat cells
- [x] Illuminate walls based on flashlight (not proximity)
