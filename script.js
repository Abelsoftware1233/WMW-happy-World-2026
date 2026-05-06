// ============================================================
// MARIO MAKER JS — Complete Game Engine
// ============================================================

'use strict';

// ===== CONSTANTS =====
const TILE = 32;
const GRAVITY = 0.5;
const JUMP_FORCE = -12;
const MOVE_SPEED = 4;
const RUN_SPEED = 6.5;
const MAX_FALL = 14;
const LEVEL_WIDTH = 50; // tiles
const LEVEL_HEIGHT = 16; // tiles

// ===== TILE TYPES =====
const T = {
  EMPTY: 0,
  GROUND: 1,
  BRICK: 2,
  QUESTION: 3,
  PIPE_TOP_L: 4,
  PIPE_TOP_R: 5,
  PIPE_BODY_L: 6,
  PIPE_BODY_R: 7,
  COIN: 8,
  MUSHROOM: 9,
  GOOMBA: 10,
  KOOPA: 11,
  GOAL: 12,
  CLOUD_L: 13,
  CLOUD_M: 14,
  CLOUD_R: 15,
  PLATFORM: 16,
  SPIKE: 17,
  STAR_ITEM: 18,
  LAVA: 19,
  INVISIBLE_WALL: 20,
  ONE_WAY: 21,
};

// ===== COLORS / TILE RENDERERS =====
const TILE_COLORS = {
  [T.GROUND]:      '#7b4f2e',
  [T.BRICK]:       '#c84010',
  [T.QUESTION]:    '#f8d030',
  [T.PIPE_TOP_L]:  '#3ab54a',
  [T.PIPE_TOP_R]:  '#3ab54a',
  [T.PIPE_BODY_L]: '#228822',
  [T.PIPE_BODY_R]: '#228822',
  [T.PLATFORM]:    '#c8a000',
  [T.ONE_WAY]:     '#d4a040',
  [T.SPIKE]:       '#888',
  [T.LAVA]:        '#ff4400',
};

// ===== STATE =====
let gameState = 'menu';
let currentLevel = null;
let currentLevelIndex = 0;
let playerLives = 3;
let playerScore = 0;
let levelTimer = 300;
let timerInterval = null;
let keys = {};
let animFrame = null;

// Editor state
let editorTool = T.GROUND;
let editorScrollX = 0;
let editorGrid = null;
let editorPainting = false;
let editorErasing = false;

// Player
const player = {
  x: 64, y: 200, vx: 0, vy: 0,
  w: 24, h: 32,
  onGround: false,
  jumping: false,
  running: false,
  facing: 1,
  powered: false,
  starred: false,
  starTimer: 0,
  dead: false,
  deadTimer: 0,
  frame: 0,
  frameTimer: 0,
};

// Entities (enemies, coins, items)
let entities = [];
let particles = [];

// Camera
let camX = 0;
let camY = 0;
let canvas, ctx;
let edCanvas, edCtx;

// ===== LEVELS DATA =====
const BUILT_IN_LEVELS = [];

function makeLevelGrid(rows) {
  const grid = [];
  for (let y = 0; y < LEVEL_HEIGHT; y++) {
    grid.push([]);
    for (let x = 0; x < LEVEL_WIDTH; x++) {
      grid[y].push(0);
    }
  }
  if (rows) {
    for (const [y, x, t] of rows) {
      if (y >= 0 && y < LEVEL_HEIGHT && x >= 0 && x < LEVEL_WIDTH) {
        grid[y][x] = t;
      }
    }
  }
  return grid;
}

// ===== BUILD ALL 30 LEVELS =====
(function buildLevels() {

  // -------------------------------------------------------
  // Level 1: Tutorial
  // -------------------------------------------------------
  {
    const g = makeLevelGrid();
    for (let x = 0; x < 50; x++) g[15][x] = T.GROUND;
    for (let x = 0; x < 50; x++) g[14][x] = T.GROUND;
    for (let x = 5; x < 9; x++) g[11][x] = T.BRICK;
    g[10][7] = T.QUESTION;
    for (let x = 12; x < 16; x++) g[9][x] = T.PLATFORM;
    g[13][20] = T.PIPE_TOP_L; g[13][21] = T.PIPE_TOP_R;
    g[14][20] = T.PIPE_BODY_L; g[14][21] = T.PIPE_BODY_R;
    for (let x = 3; x < 7; x++) g[8][x] = T.COIN;
    g[12][15] = T.COIN; g[12][16] = T.COIN; g[12][17] = T.COIN;
    g[13][25] = T.GOOMBA; g[13][30] = T.GOOMBA;
    g[12][10] = T.MUSHROOM;
    g[13][47] = T.GOAL; g[12][47] = T.GOAL; g[11][47] = T.GOAL;
    BUILT_IN_LEVELS.push({ name: 'WORLD 1-1', grid: g, sky: '#5c94fc' });
  }

  // -------------------------------------------------------
  // Level 2: Sky World
  // -------------------------------------------------------
  {
    const g = makeLevelGrid();
    for (let x = 0; x < 50; x++) g[15][x] = T.GROUND;
    for (let x = 0; x < 50; x++) g[14][x] = T.GROUND;
    const pts = [[10,4,6],[9,8,10],[8,12,14],[9,16,18],[10,22,25],[9,28,31],[8,34,37],[10,40,43]];
    for (const [y,x1,x2] of pts) for (let x=x1; x<=x2; x++) g[y][x] = T.PLATFORM;
    g[7][5] = T.QUESTION; g[7][11] = T.QUESTION; g[7][23] = T.QUESTION;
    for (let x=4; x<=45; x+=3) if (g[12][x]===0) g[12][x] = T.COIN;
    g[13][10] = T.GOOMBA; g[13][20] = T.KOOPA; g[13][35] = T.GOOMBA;
    g[13][27] = T.SPIKE; g[13][28] = T.SPIKE; g[13][29] = T.SPIKE;
    g[13][47] = T.GOAL; g[12][47] = T.GOAL; g[11][47] = T.GOAL;
    BUILT_IN_LEVELS.push({ name: 'SKY WORLD', grid: g, sky: '#87ceeb' });
  }

  // -------------------------------------------------------
  // Level 3: Underground
  // -------------------------------------------------------
  {
    const g = makeLevelGrid();
    for (let x = 0; x < 50; x++) g[15][x] = T.GROUND;
    for (let x = 0; x < 50; x++) g[14][x] = T.GROUND;
    for (let x = 0; x < 50; x++) g[0][x] = T.BRICK;
    for (let x=2; x<48; x++) g[1][x] = T.BRICK;
    for (let y=2; y<14; y++) { g[y][3] = T.BRICK; g[y][4] = T.BRICK; }
    for (let y=2; y<10; y++) { g[y][20] = T.BRICK; g[y][21] = T.BRICK; }
    for (let y=5; y<14; y++) { g[y][36] = T.BRICK; g[y][37] = T.BRICK; }
    for (let x=6; x<14; x++) g[10][x] = T.BRICK;
    for (let x=22; x<30; x++) g[7][x] = T.BRICK;
    for (let x=8; x<15; x++) g[5][x] = T.BRICK;
    for (let x=6; x<14; x++) g[9][x] = T.COIN;
    for (let x=22; x<30; x++) g[6][x] = T.COIN;
    g[9][16] = T.QUESTION; g[6][32] = T.QUESTION; g[9][40] = T.QUESTION;
    g[13][8] = T.GOOMBA; g[13][25] = T.GOOMBA; g[13][40] = T.KOOPA;
    g[13][47] = T.GOAL; g[12][47] = T.GOAL; g[11][47] = T.GOAL;
    BUILT_IN_LEVELS.push({ name: 'UNDERGROUND', grid: g, sky: '#220066' });
  }

  // -------------------------------------------------------
  // Level 4: Lava Land
  // -------------------------------------------------------
  {
    const g = makeLevelGrid();
    for (let x = 0; x < 50; x++) g[15][x] = T.LAVA;
    for (let x = 0; x < 50; x++) g[14][x] = T.LAVA;
    const islands = [[12,0,6],[11,8,12],[12,14,18],[11,20,24],[10,26,30],[12,32,36],[11,38,44]];
    for (const [y,x1,x2] of islands) for (let x=x1; x<=x2; x++) g[y][x] = T.GROUND;
    for (let x=3; x<7; x++) g[9][x] = T.PLATFORM;
    for (let x=10; x<14; x++) g[8][x] = T.PLATFORM;
    for (let x=28; x<32; x++) g[8][x] = T.PLATFORM;
    for (let x=40; x<44; x++) g[7][x] = T.PLATFORM;
    g[11][9] = T.KOOPA; g[11][20] = T.KOOPA; g[11][38] = T.KOOPA;
    g[10][15] = T.MUSHROOM; g[8][28] = T.STAR_ITEM;
    for (let x=0; x<50; x+=4) if (g[7][x]===0) g[7][x] = T.COIN;
    g[11][5] = T.PIPE_TOP_L; g[11][6] = T.PIPE_TOP_R;
    g[12][5] = T.PIPE_BODY_L; g[12][6] = T.PIPE_BODY_R;
    g[11][47] = T.GOAL; g[10][47] = T.GOAL; g[9][47] = T.GOAL;
    BUILT_IN_LEVELS.push({ name: 'LAVA LAND', grid: g, sky: '#330000' });
  }

  // -------------------------------------------------------
  // Level 5: Zigzag
  // -------------------------------------------------------
  {
    const g = makeLevelGrid();
    for (let x = 0; x < 50; x++) g[15][x] = T.GROUND;
    for (let x = 0; x < 50; x++) g[14][x] = T.GROUND;
    for (let x=3; x<7; x++) g[12][x] = T.BRICK;
    for (let x=7; x<11; x++) g[10][x] = T.BRICK;
    for (let x=11; x<15; x++) g[8][x] = T.BRICK;
    for (let x=15; x<19; x++) g[10][x] = T.BRICK;
    for (let x=19; x<23; x++) g[12][x] = T.BRICK;
    for (let x=23; x<27; x++) g[10][x] = T.BRICK;
    for (let x=27; x<31; x++) g[8][x] = T.BRICK;
    for (let x=31; x<35; x++) g[10][x] = T.BRICK;
    for (let x=35; x<39; x++) g[12][x] = T.BRICK;
    for (let x=40; x<45; x++) g[11][x] = T.PLATFORM;
    for (let x=0; x<50; x+=5) g[6][x] = T.QUESTION;
    for (let x=3; x<40; x+=2) if (g[5][x]===0) g[5][x] = T.COIN;
    for (let x=8; x<45; x+=6) g[13][x] = T.GOOMBA;
    g[13][25] = T.KOOPA;
    g[13][45] = T.PIPE_TOP_L; g[13][46] = T.PIPE_TOP_R;
    g[13][47] = T.GOAL; g[12][47] = T.GOAL; g[11][47] = T.GOAL;
    BUILT_IN_LEVELS.push({ name: 'ZIGZAG', grid: g, sky: '#5c94fc' });
  }

  // -------------------------------------------------------
  // Level 6: Speed Run
  // -------------------------------------------------------
  {
    const g = makeLevelGrid();
    for (let x = 0; x < 50; x++) g[15][x] = T.GROUND;
    for (let x = 0; x < 50; x++) g[14][x] = T.GROUND;
    for (let x=5; x<8; x++) g[13][x] = T.SPIKE;
    for (let x=12; x<15; x++) g[13][x] = T.SPIKE;
    for (let x=20; x<24; x++) g[13][x] = T.SPIKE;
    for (let x=30; x<33; x++) g[13][x] = T.SPIKE;
    for (let x=38; x<42; x++) g[13][x] = T.SPIKE;
    for (let x=4; x<9; x++) g[11][x] = T.PLATFORM;
    for (let x=11; x<16; x++) g[10][x] = T.PLATFORM;
    for (let x=19; x<25; x++) g[9][x] = T.PLATFORM;
    for (let x=29; x<34; x++) g[11][x] = T.PLATFORM;
    for (let x=37; x<43; x++) g[10][x] = T.PLATFORM;
    for (let x=0; x<50; x++) if (g[8][x]===0) g[8][x] = T.COIN;
    g[13][2] = T.GOOMBA; g[13][18] = T.KOOPA; g[13][27] = T.GOOMBA; g[13][44] = T.KOOPA;
    g[11][25] = T.STAR_ITEM;
    g[13][47] = T.GOAL; g[12][47] = T.GOAL; g[11][47] = T.GOAL;
    BUILT_IN_LEVELS.push({ name: 'SPEED RUN', grid: g, sky: '#003366' });
  }

  // -------------------------------------------------------
  // Level 7: Coin Heaven
  // -------------------------------------------------------
  {
    const g = makeLevelGrid();
    for (let x = 0; x < 50; x++) g[15][x] = T.GROUND;
    for (let x = 0; x < 50; x++) g[14][x] = T.GROUND;
    for (let y=4; y<14; y++) for (let x=0; x<50; x++) {
      if ((y+x)%3===0) g[y][x] = T.COIN;
    }
    for (let y=5; y<14; y+=3) for (let x=2; x<48; x+=8) {
      g[y][x]=T.BRICK; g[y][x+1]=T.BRICK; g[y][x+2]=T.BRICK;
    }
    g[11][5]=T.QUESTION; g[8][15]=T.QUESTION; g[5][25]=T.QUESTION; g[8][35]=T.QUESTION;
    g[12][6]=T.GOOMBA; g[9][20]=T.GOOMBA; g[6][36]=T.GOOMBA;
    g[13][47]=T.GOAL; g[12][47]=T.GOAL; g[11][47]=T.GOAL;
    BUILT_IN_LEVELS.push({ name: 'COIN HEAVEN', grid: g, sky: '#ffcc00' });
  }

  // -------------------------------------------------------
  // Level 8: Enemy Rush
  // -------------------------------------------------------
  {
    const g = makeLevelGrid();
    for (let x = 0; x < 50; x++) g[15][x] = T.GROUND;
    for (let x = 0; x < 50; x++) g[14][x] = T.GROUND;
    for (let x=3; x<47; x+=4) g[13][x] = T.GOOMBA;
    for (let x=5; x<47; x+=6) g[13][x] = T.KOOPA;
    for (let x=0; x<48; x+=10) for (let i=0; i<4; i++) g[10][x+i] = T.BRICK;
    for (let x=5; x<48; x+=10) for (let i=0; i<4; i++) g[7][x+i] = T.BRICK;
    for (let x=2; x<48; x+=5) g[5][x] = T.QUESTION;
    g[9][20] = T.MUSHROOM; g[9][35] = T.STAR_ITEM;
    for (let x=0; x<50; x++) if (g[6][x]===0) g[6][x] = T.COIN;
    g[13][47]=T.GOAL; g[12][47]=T.GOAL; g[11][47]=T.GOAL;
    BUILT_IN_LEVELS.push({ name: 'ENEMY RUSH', grid: g, sky: '#4a0000' });
  }

  // -------------------------------------------------------
  // Level 9: Climb Up
  // -------------------------------------------------------
  {
    const g = makeLevelGrid();
    for (let y=0; y<16; y++) { g[y][0]=T.BRICK; g[y][49]=T.BRICK; }
    for (let x=0; x<50; x++) g[15][x]=T.GROUND;
    const vPlats = [
      [13,3,12],[11,7,16],[13,13,22],[11,17,26],[9,21,30],[13,27,36],[11,31,40],[9,35,44],[7,39,48]
    ];
    for (const [y,x1,x2] of vPlats) for (let x=x1; x<=x2; x++) g[y][x]=T.PLATFORM;
    for (let x=0; x<50; x++) g[14][x]=T.LAVA;
    for (const [y,x1,x2] of vPlats.slice(0,7)) g[y-1][Math.floor((x1+x2)/2)]=T.GOOMBA;
    for (const [y,x1,x2] of vPlats) for (let x=x1+1; x<x2; x+=2) if (g[y-1][x]===0) g[y-1][x]=T.COIN;
    g[6][5]=T.QUESTION; g[4][15]=T.QUESTION; g[2][25]=T.QUESTION; g[4][35]=T.QUESTION;
    g[6][47]=T.GOAL; g[5][47]=T.GOAL; g[4][47]=T.GOAL;
    BUILT_IN_LEVELS.push({ name: 'CLIMB UP', grid: g, sky: '#1a0044' });
  }

  // -------------------------------------------------------
  // Level 10: Final World
  // -------------------------------------------------------
  {
    const g = makeLevelGrid();
    for (let x=0; x<50; x++) g[15][x]=T.GROUND;
    for (let x=0; x<50; x++) g[14][x]=T.GROUND;
    for (let x=0; x<50; x++) g[0][x]=T.BRICK;
    for (let x=3; x<9; x++) g[11][x]=T.BRICK;
    g[10][5]=T.QUESTION; g[10][6]=T.QUESTION; g[10][7]=T.QUESTION;
    for (let x=10; x<16; x++) g[9][x]=T.BRICK;
    for (let x=17; x<23; x++) g[11][x]=T.BRICK;
    for (let x=17; x<23; x++) g[8][x]=T.BRICK;
    for (let x=24; x<30; x++) g[10][x]=T.BRICK;
    for (let x=24; x<30; x++) g[6][x]=T.BRICK;
    for (let x=31; x<37; x++) g[8][x]=T.BRICK;
    for (let x=38; x<44; x++) g[11][x]=T.BRICK;
    for (let x=38; x<44; x++) g[7][x]=T.BRICK;
    g[14][8]=T.LAVA; g[14][9]=T.LAVA; g[14][10]=T.LAVA;
    g[14][22]=T.LAVA; g[14][23]=T.LAVA; g[14][24]=T.LAVA; g[14][25]=T.LAVA;
    g[14][36]=T.LAVA; g[14][37]=T.LAVA; g[14][38]=T.LAVA;
    g[13][15]=T.PIPE_TOP_L; g[13][16]=T.PIPE_TOP_R;
    g[14][15]=T.PIPE_BODY_L; g[14][16]=T.PIPE_BODY_R;
    g[13][30]=T.PIPE_TOP_L; g[13][31]=T.PIPE_TOP_R;
    g[14][30]=T.PIPE_BODY_L; g[14][31]=T.PIPE_BODY_R;
    for (let x=5; x<48; x+=4) g[13][x]=T.GOOMBA;
    for (let x=7; x<48; x+=6) g[13][x]=T.KOOPA;
    g[13][19]=T.SPIKE; g[13][20]=T.SPIKE; g[13][21]=T.SPIKE;
    g[9][5]=T.MUSHROOM; g[7][20]=T.STAR_ITEM; g[5][35]=T.MUSHROOM;
    for (let x=0; x<50; x++) if (g[4][x]===0) g[4][x]=T.COIN;
    for (let x=0; x<50; x++) if (g[3][x]===0) g[3][x]=T.COIN;
    g[13][47]=T.GOAL; g[12][47]=T.GOAL; g[11][47]=T.GOAL; g[10][47]=T.GOAL;
    BUILT_IN_LEVELS.push({ name: 'FINAL WORLD', grid: g, sky: '#2d0030' });
  }

  // -------------------------------------------------------
  // Level 11: Desert Dunes
  // -------------------------------------------------------
  {
    const g = makeLevelGrid();
    for (let x=0; x<50; x++) g[15][x]=T.GROUND;
    for (let x=0; x<50; x++) g[14][x]=T.GROUND;
    // Sand dune bumps
    for (let x=2; x<=5;  x++) g[13][x]=T.GROUND;
    for (let x=3; x<=4;  x++) g[12][x]=T.GROUND;
    for (let x=10; x<=13; x++) g[13][x]=T.GROUND;
    for (let x=11; x<=12; x++) g[12][x]=T.GROUND;
    for (let x=20; x<=24; x++) g[13][x]=T.GROUND;
    for (let x=21; x<=23; x++) g[12][x]=T.GROUND;
    g[11][22]=T.GROUND;
    for (let x=33; x<=36; x++) g[13][x]=T.GROUND;
    for (let x=34; x<=35; x++) g[12][x]=T.GROUND;
    for (let x=42; x<=46; x++) g[13][x]=T.GROUND;
    for (let x=43; x<=45; x++) g[12][x]=T.GROUND;
    g[11][44]=T.GROUND;
    // Spike pits between dunes
    g[13][7]=T.SPIKE; g[13][8]=T.SPIKE; g[13][9]=T.SPIKE;
    g[13][16]=T.SPIKE; g[13][17]=T.SPIKE;
    g[13][27]=T.SPIKE; g[13][28]=T.SPIKE; g[13][29]=T.SPIKE;
    g[13][39]=T.SPIKE; g[13][40]=T.SPIKE;
    // Platforms to clear spikes
    for (let x=6; x<=10;  x++) g[10][x]=T.PLATFORM;
    for (let x=15; x<=19; x++) g[11][x]=T.PLATFORM;
    for (let x=26; x<=31; x++) g[10][x]=T.PLATFORM;
    for (let x=38; x<=42; x++) g[11][x]=T.PLATFORM;
    // Coins on platforms
    for (let x=6;  x<=10; x++) g[9][x]=T.COIN;
    for (let x=15; x<=19; x++) g[10][x]=T.COIN;
    for (let x=26; x<=31; x++) g[9][x]=T.COIN;
    // Question blocks
    g[8][3]=T.QUESTION; g[8][22]=T.QUESTION; g[8][44]=T.QUESTION;
    // Enemies
    g[13][6]=T.GOOMBA; g[13][18]=T.GOOMBA; g[13][30]=T.KOOPA; g[13][40]=T.GOOMBA;
    // Mushroom
    g[9][35]=T.MUSHROOM;
    // Goal
    g[13][47]=T.GOAL; g[12][47]=T.GOAL; g[11][47]=T.GOAL;
    BUILT_IN_LEVELS.push({ name: 'DESERT DUNES', grid: g, sky: '#f4a830' });
  }

  // -------------------------------------------------------
  // Level 12: Ice Slide
  // -------------------------------------------------------
  {
    const g = makeLevelGrid();
    for (let x=0; x<50; x++) g[15][x]=T.GROUND;
    for (let x=0; x<50; x++) g[14][x]=T.GROUND;
    // Staircase platforms going up then down (simulate sliding)
    const stairsUp1   = [[13,2],[12,4],[11,6],[10,8],[9,10]];
    const stairsDown1 = [[10,12],[11,14],[12,16],[13,18]];
    const stairsUp2   = [[13,20],[12,22],[11,24],[10,26],[9,28]];
    const stairsDown2 = [[10,30],[11,32],[12,34],[13,36]];
    const stairsUp3   = [[12,38],[11,40],[10,42],[9,44]];
    for (const [y,x] of [...stairsUp1,...stairsDown1,...stairsUp2,...stairsDown2,...stairsUp3]) {
      for (let i=0; i<3; i++) if (x+i < 50) g[y][x+i]=T.PLATFORM;
    }
    // Spike valleys
    g[13][18]=T.SPIKE; g[13][19]=T.SPIKE;
    g[13][36]=T.SPIKE; g[13][37]=T.SPIKE;
    // Coins along steps
    for (const [y,x] of [...stairsUp1,...stairsUp2,...stairsUp3]) g[y-1][x+1]=T.COIN;
    // Question blocks at peaks
    g[8][10]=T.QUESTION; g[8][28]=T.QUESTION; g[8][44]=T.QUESTION;
    // Enemies
    g[12][5]=T.GOOMBA; g[11][24]=T.GOOMBA; g[10][42]=T.KOOPA;
    // Star at mid peak
    g[8][28]=T.STAR_ITEM;
    // Goal
    g[13][47]=T.GOAL; g[12][47]=T.GOAL; g[11][47]=T.GOAL;
    BUILT_IN_LEVELS.push({ name: 'ICE SLIDE', grid: g, sky: '#aaddff' });
  }

  // -------------------------------------------------------
  // Level 13: Mushroom Kingdom
  // -------------------------------------------------------
  {
    const g = makeLevelGrid();
    for (let x=0; x<50; x++) g[15][x]=T.GROUND;
    for (let x=0; x<50; x++) g[14][x]=T.GROUND;
    // Mushroom-style platforms: cap + stem
    const mushroomDefs = [
      { cx: 4,  capY: 9,  capW: 5 },
      { cx: 12, capY: 7,  capW: 5 },
      { cx: 21, capY: 10, capW: 5 },
      { cx: 30, capY: 8,  capW: 5 },
      { cx: 39, capY: 9,  capW: 5 },
    ];
    for (const m of mushroomDefs) {
      // Stem (single column in center)
      const stemX = m.cx + Math.floor(m.capW/2);
      for (let y=m.capY+1; y<=13; y++) g[y][stemX]=T.BRICK;
      // Cap
      for (let x=m.cx; x<m.cx+m.capW; x++) g[m.capY][x]=T.PLATFORM;
      // Coins on cap
      for (let x=m.cx; x<m.cx+m.capW; x++) if (g[m.capY-1][x]===0) g[m.capY-1][x]=T.COIN;
    }
    // Enemies on caps
    g[mushroomDefs[0].capY-1][mushroomDefs[0].cx+2]=T.GOOMBA;
    g[mushroomDefs[2].capY-1][mushroomDefs[2].cx+2]=T.KOOPA;
    g[mushroomDefs[4].capY-1][mushroomDefs[4].cx+2]=T.GOOMBA;
    // Question blocks between mushrooms
    g[6][8]=T.QUESTION; g[5][18]=T.QUESTION; g[6][27]=T.QUESTION; g[5][36]=T.QUESTION;
    // Mushroom power-up
    g[8][25]=T.MUSHROOM;
    // Goal
    g[13][47]=T.GOAL; g[12][47]=T.GOAL; g[11][47]=T.GOAL;
    BUILT_IN_LEVELS.push({ name: 'MUSHROOM KINGDOM', grid: g, sky: '#66bb44' });
  }

  // -------------------------------------------------------
  // Level 14: Pipe Maze
  // -------------------------------------------------------
  {
    const g = makeLevelGrid();
    for (let x=0; x<50; x++) g[15][x]=T.GROUND;
    for (let x=0; x<50; x++) g[14][x]=T.GROUND;
    // Many pipes of varying heights
    const pipes = [
      { x:4,  topY:12 },
      { x:8,  topY:10 },
      { x:12, topY:11 },
      { x:16, topY:9  },
      { x:20, topY:12 },
      { x:24, topY:8  },
      { x:28, topY:11 },
      { x:32, topY:10 },
      { x:36, topY:9  },
      { x:40, topY:12 },
      { x:44, topY:10 },
    ];
    for (const p of pipes) {
      g[p.topY][p.x]   = T.PIPE_TOP_L;
      g[p.topY][p.x+1] = T.PIPE_TOP_R;
      for (let y=p.topY+1; y<=13; y++) {
        g[y][p.x]   = T.PIPE_BODY_L;
        g[y][p.x+1] = T.PIPE_BODY_R;
      }
    }
    // Coins floating above pipes
    for (const p of pipes) {
      if (g[p.topY-1][p.x]===0)   g[p.topY-1][p.x]=T.COIN;
      if (g[p.topY-1][p.x+1]===0) g[p.topY-1][p.x+1]=T.COIN;
    }
    // Platforms to hop between pipes
    for (let x=6; x<10; x++) g[8][x]=T.PLATFORM;
    for (let x=14; x<18; x++) g[7][x]=T.PLATFORM;
    for (let x=22; x<26; x++) g[6][x]=T.PLATFORM;
    for (let x=30; x<34; x++) g[7][x]=T.PLATFORM;
    for (let x=38; x<42; x++) g[8][x]=T.PLATFORM;
    // Enemies between pipes
    g[13][6]=T.GOOMBA; g[13][14]=T.KOOPA; g[13][22]=T.GOOMBA;
    g[13][30]=T.GOOMBA; g[13][38]=T.KOOPA;
    // Question blocks
    g[5][10]=T.QUESTION; g[5][26]=T.QUESTION; g[5][42]=T.QUESTION;
    // Mushroom
    g[7][22]=T.MUSHROOM;
    // Goal
    g[13][47]=T.GOAL; g[12][47]=T.GOAL; g[11][47]=T.GOAL;
    BUILT_IN_LEVELS.push({ name: 'PIPE MAZE', grid: g, sky: '#228833' });
  }

  // -------------------------------------------------------
  // Level 15: Sky Islands
  // -------------------------------------------------------
  {
    const g = makeLevelGrid();
    // No ground — floating islands only
    for (let x=0; x<50; x++) g[15][x]=T.LAVA;
    // Starting island
    for (let x=0; x<5; x++) { g[13][x]=T.GROUND; g[14][x]=T.GROUND; }
    // Floating islands
    const islands = [
      [11, 7,  1