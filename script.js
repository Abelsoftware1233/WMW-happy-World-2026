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
  powered: false, // mushroom
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

// Build built-in levels
(function buildLevels() {
  // Level 1: Tutorial
  {
    const g = makeLevelGrid();
    // Ground
    for (let x = 0; x < 50; x++) g[15][x] = T.GROUND;
    for (let x = 0; x < 50; x++) g[14][x] = T.GROUND;
    // Platforms
    for (let x = 5; x < 9; x++) g[11][x] = T.BRICK;
    g[10][7] = T.QUESTION;
    for (let x = 12; x < 16; x++) g[9][x] = T.PLATFORM;
    // Pipe
    g[13][20] = T.PIPE_TOP_L; g[13][21] = T.PIPE_TOP_R;
    g[14][20] = T.PIPE_BODY_L; g[14][21] = T.PIPE_BODY_R;
    // Coins
    for (let x = 3; x < 7; x++) g[8][x] = T.COIN;
    g[12][15] = T.COIN; g[12][16] = T.COIN; g[12][17] = T.COIN;
    // Goomba
    g[13][25] = T.GOOMBA; g[13][30] = T.GOOMBA;
    // Mushroom
    g[12][10] = T.MUSHROOM;
    // Goal
    g[13][47] = T.GOAL; g[12][47] = T.GOAL; g[11][47] = T.GOAL;
    BUILT_IN_LEVELS.push({ name: 'WORLD 1-1', grid: g, sky: '#5c94fc' });
  }
  // Level 2: Platformer
  {
    const g = makeLevelGrid();
    for (let x = 0; x < 50; x++) g[15][x] = T.GROUND;
    for (let x = 0; x < 50; x++) g[14][x] = T.GROUND;
    // Floating platforms
    const pts = [[10,4,6],[9,8,10],[8,12,14],[9,16,18],[10,22,25],[9,28,31],[8,34,37],[10,40,43]];
    for (const [y,x1,x2] of pts) for (let x=x1; x<=x2; x++) g[y][x] = T.PLATFORM;
    // Question blocks
    g[7][5] = T.QUESTION; g[7][11] = T.QUESTION; g[7][23] = T.QUESTION;
    // Coins
    for (let x=4; x<=45; x+=3) if (g[12][x]===0) g[12][x] = T.COIN;
    // Enemies
    g[13][10] = T.GOOMBA; g[13][20] = T.KOOPA; g[13][35] = T.GOOMBA;
    // Spikes
    g[13][27] = T.SPIKE; g[13][28] = T.SPIKE; g[13][29] = T.SPIKE;
    g[13][47] = T.GOAL; g[12][47] = T.GOAL; g[11][47] = T.GOAL;
    BUILT_IN_LEVELS.push({ name: 'SKY WORLD', grid: g, sky: '#87ceeb' });
  }
  // Level 3: Underground
  {
    const g = makeLevelGrid();
    for (let x = 0; x < 50; x++) g[15][x] = T.GROUND;
    for (let x = 0; x < 50; x++) g[14][x] = T.GROUND;
    for (let x = 0; x < 50; x++) g[0][x] = T.BRICK;
    // Brick ceiling blocks
    for (let x=2; x<48; x++) g[1][x] = T.BRICK;
    // Passages
    for (let y=2; y<14; y++) { g[y][3] = T.BRICK; g[y][4] = T.BRICK; }
    for (let y=2; y<10; y++) { g[y][20] = T.BRICK; g[y][21] = T.BRICK; }
    for (let y=5; y<14; y++) { g[y][36] = T.BRICK; g[y][37] = T.BRICK; }
    // Platforms inside
    for (let x=6; x<14; x++) g[10][x] = T.BRICK;
    for (let x=22; x<30; x++) g[7][x] = T.BRICK;
    for (let x=8; x<15; x++) g[5][x] = T.BRICK;
    // Coins
    for (let x=6; x<14; x++) g[9][x] = T.COIN;
    for (let x=22; x<30; x++) g[6][x] = T.COIN;
    // Questions
    g[9][16] = T.QUESTION; g[6][32] = T.QUESTION; g[9][40] = T.QUESTION;
    // Enemies
    g[13][8] = T.GOOMBA; g[13][25] = T.GOOMBA; g[13][40] = T.KOOPA;
    // Goal
    g[13][47] = T.GOAL; g[12][47] = T.GOAL; g[11][47] = T.GOAL;
    BUILT_IN_LEVELS.push({ name: 'UNDERGROUND', grid: g, sky: '#220066' });
  }
  // Level 4: Lava World
  {
    const g = makeLevelGrid();
    for (let x = 0; x < 50; x++) g[15][x] = T.LAVA;
    for (let x = 0; x < 50; x++) g[14][x] = T.LAVA;
    // Islands above lava
    const islands = [[12,0,6],[11,8,12],[12,14,18],[11,20,24],[10,26,30],[12,32,36],[11,38,44]];
    for (const [y,x1,x2] of islands) for (let x=x1; x<=x2; x++) g[y][x] = T.GROUND;
    // Higher platforms
    for (let x=3; x<7; x++) g[9][x] = T.PLATFORM;
    for (let x=10; x<14; x++) g[8][x] = T.PLATFORM;
    for (let x=28; x<32; x++) g[8][x] = T.PLATFORM;
    for (let x=40; x<44; x++) g[7][x] = T.PLATFORM;
    // Koopas
    g[11][9] = T.KOOPA; g[11][20] = T.KOOPA; g[11][38] = T.KOOPA;
    // Mushroom & star
    g[10][15] = T.MUSHROOM; g[8][28] = T.STAR_ITEM;
    // Coins
    for (let x=0; x<50; x+=4) if (g[7][x]===0) g[7][x] = T.COIN;
    // Pipes (decorative)
    g[11][5] = T.PIPE_TOP_L; g[11][6] = T.PIPE_TOP_R;
    g[12][5] = T.PIPE_BODY_L; g[12][6] = T.PIPE_BODY_R;
    // Goal
    g[11][47] = T.GOAL; g[10][47] = T.GOAL; g[9][47] = T.GOAL;
    BUILT_IN_LEVELS.push({ name: 'LAVA LAND', grid: g, sky: '#330000' });
  }
  // Level 5
  {
    const g = makeLevelGrid();
    for (let x = 0; x < 50; x++) g[15][x] = T.GROUND;
    for (let x = 0; x < 50; x++) g[14][x] = T.GROUND;
    // Zigzag platforms
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
    // Questions
    for (let x=0; x<50; x+=5) g[6][x] = T.QUESTION;
    // Coins above bricks
    for (let x=3; x<40; x+=2) if (g[5][x]===0) g[5][x] = T.COIN;
    // Enemies
    for (let x=8; x<45; x+=6) g[13][x] = T.GOOMBA;
    g[13][25] = T.KOOPA;
    // Pipes
    g[13][45] = T.PIPE_TOP_L; g[13][46] = T.PIPE_TOP_R;
    // Goal
    g[13][47] = T.GOAL; g[12][47] = T.GOAL; g[11][47] = T.GOAL;
    BUILT_IN_LEVELS.push({ name: 'ZIGZAG', grid: g, sky: '#5c94fc' });
  }
  // Level 6: Speed run
  {
    const g = makeLevelGrid();
    for (let x = 0; x < 50; x++) g[15][x] = T.GROUND;
    for (let x = 0; x < 50; x++) g[14][x] = T.GROUND;
    // Long road with obstacles
    for (let x=5; x<8; x++) { g[13][x] = T.SPIKE; }
    for (let x=12; x<15; x++) { g[13][x] = T.SPIKE; }
    for (let x=20; x<24; x++) { g[13][x] = T.SPIKE; }
    for (let x=30; x<33; x++) { g[13][x] = T.SPIKE; }
    for (let x=38; x<42; x++) { g[13][x] = T.SPIKE; }
    // Platforms over spikes
    for (let x=4; x<9; x++) g[11][x] = T.PLATFORM;
    for (let x=11; x<16; x++) g[10][x] = T.PLATFORM;
    for (let x=19; x<25; x++) g[9][x] = T.PLATFORM;
    for (let x=29; x<34; x++) g[11][x] = T.PLATFORM;
    for (let x=37; x<43; x++) g[10][x] = T.PLATFORM;
    // Coins
    for (let x=0; x<50; x++) if (g[8][x]===0) g[8][x] = T.COIN;
    // Enemies
    g[13][2] = T.GOOMBA; g[13][18] = T.KOOPA; g[13][27] = T.GOOMBA; g[13][44] = T.KOOPA;
    // Star
    g[11][25] = T.STAR_ITEM;
    // Goal
    g[13][47] = T.GOAL; g[12][47] = T.GOAL; g[11][47] = T.GOAL;
    BUILT_IN_LEVELS.push({ name: 'SPEED RUN', grid: g, sky: '#003366' });
  }
  // Level 7: Coin heaven
  {
    const g = makeLevelGrid();
    for (let x = 0; x < 50; x++) g[15][x] = T.GROUND;
    for (let x = 0; x < 50; x++) g[14][x] = T.GROUND;
    // Dense coin maze
    for (let y=4; y<14; y++) for (let x=0; x<50; x++) {
      if ((y+x)%3===0) g[y][x] = T.COIN;
    }
    // Platforms
    for (let y=5; y<14; y+=3) for (let x=2; x<48; x+=8) {
      g[y][x]=T.BRICK; g[y][x+1]=T.BRICK; g[y][x+2]=T.BRICK;
    }
    // Clear some coin positions for platforms
    for (let y=5; y<14; y+=3) for (let x=2; x<48; x+=8) {
      g[y][x]=T.BRICK; g[y][x+1]=T.BRICK; g[y][x+2]=T.BRICK;
    }
    // Questions
    g[11][5]=T.QUESTION; g[8][15]=T.QUESTION; g[5][25]=T.QUESTION; g[8][35]=T.QUESTION;
    // Enemies on platforms
    g[12][6]=T.GOOMBA; g[9][20]=T.GOOMBA; g[6][36]=T.GOOMBA;
    // Goal
    g[13][47]=T.GOAL; g[12][47]=T.GOAL; g[11][47]=T.GOAL;
    BUILT_IN_LEVELS.push({ name: 'COIN HEAVEN', grid: g, sky: '#ffcc00' });
  }
  // Level 8: Enemy rush
  {
    const g = makeLevelGrid();
    for (let x = 0; x < 50; x++) g[15][x] = T.GROUND;
    for (let x = 0; x < 50; x++) g[14][x] = T.GROUND;
    for (let x=3; x<47; x+=4) g[13][x] = T.GOOMBA;
    for (let x=5; x<47; x+=6) g[13][x] = T.KOOPA;
    // Platforms to dodge
    for (let x=0; x<48; x+=10) { for (let i=0; i<4; i++) g[10][x+i] = T.BRICK; }
    for (let x=5; x<48; x+=10) { for (let i=0; i<4; i++) g[7][x+i] = T.BRICK; }
    // Question blocks
    for (let x=2; x<48; x+=5) g[5][x] = T.QUESTION;
    // Mushroom
    g[9][20] = T.MUSHROOM; g[9][35] = T.STAR_ITEM;
    // Coins
    for (let x=0; x<50; x++) if (g[6][x]===0) g[6][x] = T.COIN;
    // Goal
    g[13][47]=T.GOAL; g[12][47]=T.GOAL; g[11][47]=T.GOAL;
    BUILT_IN_LEVELS.push({ name: 'ENEMY RUSH', grid: g, sky: '#4a0000' });
  }
  // Level 9: Vertical
  {
    const g = makeLevelGrid();
    // Left/right walls
    for (let y=0; y<16; y++) { g[y][0]=T.BRICK; g[y][49]=T.BRICK; }
    // Ground
    for (let x=0; x<50; x++) g[15][x]=T.GROUND;
    // Vertical platforms
    const vPlats = [
      [13,3,12],[11,7,16],[13,13,22],[11,17,26],[9,21,30],[13,27,36],[11,31,40],[9,35,44],[7,39,48]
    ];
    for (const [y,x1,x2] of vPlats) for (let x=x1; x<=x2; x++) g[y][x]=T.PLATFORM;
    // Gaps filled with lava
    for (let x=0; x<50; x++) g[14][x]=T.LAVA;
    // Enemies on platforms
    for (const [y,x1,x2] of vPlats.slice(0,7)) g[y-1][Math.floor((x1+x2)/2)]=T.GOOMBA;
    // Coins
    for (const [y,x1,x2] of vPlats) for (let x=x1+1; x<x2; x+=2) if (g[y-1][x]===0) g[y-1][x]=T.COIN;
    // Questions
    g[6][5]=T.QUESTION; g[4][15]=T.QUESTION; g[2][25]=T.QUESTION; g[4][35]=T.QUESTION;
    // Goal near top-right
    g[6][47]=T.GOAL; g[5][47]=T.GOAL; g[4][47]=T.GOAL;
    BUILT_IN_LEVELS.push({ name: 'CLIMB UP', grid: g, sky: '#1a0044' });
  }
  // Level 10: Final boss level
  {
    const g = makeLevelGrid();
    for (let x=0; x<50; x++) g[15][x]=T.GROUND;
    for (let x=0; x<50; x++) g[14][x]=T.GROUND;
    for (let x=0; x<50; x++) g[0][x]=T.BRICK;
    // Complex layout
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
    // Lava pits
    g[14][8]=T.LAVA; g[14][9]=T.LAVA; g[14][10]=T.LAVA;
    g[14][22]=T.LAVA; g[14][23]=T.LAVA; g[14][24]=T.LAVA; g[14][25]=T.LAVA;
    g[14][36]=T.LAVA; g[14][37]=T.LAVA; g[14][38]=T.LAVA;
    // Pipes
    g[13][15]=T.PIPE_TOP_L; g[13][16]=T.PIPE_TOP_R;
    g[14][15]=T.PIPE_BODY_L; g[14][16]=T.PIPE_BODY_R;
    g[13][30]=T.PIPE_TOP_L; g[13][31]=T.PIPE_TOP_R;
    g[14][30]=T.PIPE_BODY_L; g[14][31]=T.PIPE_BODY_R;
    // Lots of enemies
    for (let x=5; x<48; x+=4) g[13][x]=T.GOOMBA;
    for (let x=7; x<48; x+=6) g[13][x]=T.KOOPA;
    // Spikes
    g[13][19]=T.SPIKE; g[13][20]=T.SPIKE; g[13][21]=T.SPIKE;
    // Power-ups
    g[9][5]=T.MUSHROOM; g[7][20]=T.STAR_ITEM; g[5][35]=T.MUSHROOM;
    // Many coins
    for (let x=0; x<50; x++) if (g[4][x]===0) g[4][x]=T.COIN;
    for (let x=0; x<50; x++) if (g[3][x]===0) g[3][x]=T.COIN;
    // Goal
    g[13][47]=T.GOAL; g[12][47]=T.GOAL; g[11][47]=T.GOAL; g[10][47]=T.GOAL;
    BUILT_IN_LEVELS.push({ name: 'FINAL WORLD', grid: g, sky: '#2d0030' });
  }
})();

// ===== SAVED LEVELS =====
function getSavedLevels() {
  try { return JSON.parse(localStorage.getItem('marioLevels') || '[]'); }
  catch(e) { return []; }
}
function saveLevel(name, grid) {
  const levels = getSavedLevels();
  levels.push({ name, grid, date: Date.now() });
  localStorage.setItem('marioLevels', JSON.stringify(levels));
}
function deleteSavedLevel(idx) {
  const levels = getSavedLevels();
  levels.splice(idx, 1);
  localStorage.setItem('marioLevels', JSON.stringify(levels));
}

// ===== SCREEN MANAGER =====
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const s = document.getElementById('screen-' + id);
  if (s) s.classList.add('active');
  gameState = id;
}

// ===== CANVAS SETUP =====
function setupGameCanvas() {
  canvas = document.getElementById('game-canvas');
  ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  resizeGameCanvas();
}
function resizeGameCanvas() {
  if (!canvas) return;
  const cont = canvas.parentElement;
  canvas.width = cont.clientWidth;
  canvas.height = cont.clientHeight;
}

function setupEditorCanvas() {
  edCanvas = document.getElementById('editor-canvas');
  edCtx = edCanvas.getContext('2d');
  edCtx.imageSmoothingEnabled = false;
  resizeEditorCanvas();
}
function resizeEditorCanvas() {
  if (!edCanvas) return;
  const wrap = edCanvas.parentElement;
  edCanvas.width = wrap.clientWidth;
  edCanvas.height = wrap.clientHeight;
}

// ===== TILE DRAWING =====
function drawTile(ctx2, tileType, px, py, scale) {
  const s = scale || 1;
  const sz = TILE * s;
  switch(tileType) {
    case T.GROUND:
      ctx2.fillStyle = '#7b4f2e';
      ctx2.fillRect(px, py, sz, sz);
      ctx2.fillStyle = '#5a3510';
      ctx2.fillRect(px, py, sz, 4*s);
      ctx2.fillStyle = '#9a6040';
      ctx2.fillRect(px+2*s, py+2*s, 4*s, 2*s);
      ctx2.fillRect(px+sz-8*s, py+2*s, 4*s, 2*s);
      // Top green
      ctx2.fillStyle = '#3ab54a';
      ctx2.fillRect(px, py, sz, 4*s);
      break;
    case T.BRICK:
      ctx2.fillStyle = '#c84010';
      ctx2.fillRect(px, py, sz, sz);
      ctx2.fillStyle = '#a03010';
      ctx2.fillRect(px, py+sz/2, sz, 2*s);
      ctx2.fillRect(px, py, 2*s, sz);
      ctx2.fillRect(px+sz/2+2*s, py, 2*s, sz/2);
      ctx2.fillRect(px+4*s, py+sz/2, 2*s, sz/2);
      ctx2.fillStyle = '#e05020';
      ctx2.fillRect(px+2*s, py+2*s, sz/2-4*s, sz/2-4*s);
      ctx2.fillRect(px+sz/2+4*s, py+sz/2+2*s, sz/2-6*s, sz/2-4*s);
      break;
    case T.QUESTION:
      ctx2.fillStyle = '#f8d030';
      ctx2.fillRect(px, py, sz, sz);
      ctx2.fillStyle = '#a06000';
      ctx2.fillRect(px, py, sz, 2*s);
      ctx2.fillRect(px, py+sz-2*s, sz, 2*s);
      ctx2.fillRect(px, py, 2*s, sz);
      ctx2.fillRect(px+sz-2*s, py, 2*s, sz);
      ctx2.fillStyle = '#fff';
      ctx2.font = `bold ${14*s}px monospace`;
      ctx2.textAlign = 'center';
      ctx2.fillText('?', px+sz/2, py+sz*0.72);
      break;
    case T.PIPE_TOP_L:
      ctx2.fillStyle = '#3ab54a';
      ctx2.fillRect(px-4*s, py, sz+4*s, sz);
      ctx2.fillStyle = '#1a8a2a';
      ctx2.fillRect(px-4*s, py, sz+4*s, 4*s);
      ctx2.fillRect(px-4*s, py, 3*s, sz);
      break;
    case T.PIPE_TOP_R:
      ctx2.fillStyle = '#3ab54a';
      ctx2.fillRect(px, py, sz+4*s, sz);
      ctx2.fillStyle = '#1a8a2a';
      ctx2.fillRect(px, py, sz+4*s, 4*s);
      ctx2.fillRect(px+sz+1*s, py, 3*s, sz);
      break;
    case T.PIPE_BODY_L:
      ctx2.fillStyle = '#228822';
      ctx2.fillRect(px, py, sz, sz);
      ctx2.fillStyle = '#1a5a1a';
      ctx2.fillRect(px, py, 3*s, sz);
      ctx2.fillStyle = '#3ab54a';
      ctx2.fillRect(px+6*s, py, 4*s, sz);
      break;
    case T.PIPE_BODY_R:
      ctx2.fillStyle = '#228822';
      ctx2.fillRect(px, py, sz, sz);
      ctx2.fillStyle = '#1a5a1a';
      ctx2.fillRect(px+sz-3*s, py, 3*s, sz);
      ctx2.fillStyle = '#3ab54a';
      ctx2.fillRect(px+sz-10*s, py, 4*s, sz);
      break;
    case T.COIN:
      ctx2.fillStyle = '#f8d030';
      ctx2.beginPath();
      ctx2.arc(px+sz/2, py+sz/2, sz/3, 0, Math.PI*2);
      ctx2.fill();
      ctx2.fillStyle = '#fff';
      ctx2.beginPath();
      ctx2.arc(px+sz/2-2*s, py+sz/2-2*s, sz/8, 0, Math.PI*2);
      ctx2.fill();
      ctx2.strokeStyle = '#a06000';
      ctx2.lineWidth = 2*s;
      ctx2.beginPath();
      ctx2.arc(px+sz/2, py+sz/2, sz/3, 0, Math.PI*2);
      ctx2.stroke();
      break;
    case T.PLATFORM:
      ctx2.fillStyle = '#c8a000';
      ctx2.fillRect(px, py, sz, sz*0.5);
      ctx2.fillStyle = '#a07000';
      ctx2.fillRect(px, py+sz*0.5-2*s, sz, 2*s);
      break;
    case T.ONE_WAY:
      ctx2.fillStyle = '#d4a040';
      ctx2.fillRect(px, py, sz, 6*s);
      break;
    case T.SPIKE:
      ctx2.fillStyle = '#aaaaaa';
      ctx2.beginPath();
      ctx2.moveTo(px, py+sz);
      ctx2.lineTo(px+sz/2, py+2*s);
      ctx2.lineTo(px+sz, py+sz);
      ctx2.closePath();
      ctx2.fill();
      ctx2.fillStyle = '#cccccc';
      ctx2.beginPath();
      ctx2.moveTo(px+4*s, py+sz);
      ctx2.lineTo(px+sz/2, py+6*s);
      ctx2.lineTo(px+sz-4*s, py+sz);
      ctx2.closePath();
      ctx2.fill();
      break;
    case T.LAVA:
      ctx2.fillStyle = '#ff4400';
      ctx2.fillRect(px, py, sz, sz);
      ctx2.fillStyle = '#ff7700';
      for (let i=0; i<4; i++) {
        const wave = Math.sin(Date.now()*0.003 + px*0.1 + i*2) * 3*s;
        ctx2.fillRect(px+i*(sz/4), py+wave, sz/4, 4*s);
      }
      ctx2.fillStyle = '#ffaa00';
      ctx2.fillRect(px+4*s, py+4*s, sz-8*s, 4*s);
      break;
    case T.STAR_ITEM:
      drawStar(ctx2, px+sz/2, py+sz/2, sz*0.35, '#ffe000', 5);
      break;
    case T.MUSHROOM:
      // Stem
      ctx2.fillStyle = '#e8d0a0';
      ctx2.fillRect(px+sz*0.3, py+sz*0.55, sz*0.4, sz*0.45);
      // Cap
      ctx2.fillStyle = '#e52521';
      ctx2.beginPath();
      ctx2.arc(px+sz/2, py+sz*0.45, sz*0.4, Math.PI, 0);
      ctx2.closePath();
      ctx2.fill();
      // Spots
      ctx2.fillStyle = '#fff';
      ctx2.beginPath(); ctx2.arc(px+sz*0.3, py+sz*0.35, sz*0.08, 0, Math.PI*2); ctx2.fill();
      ctx2.beginPath(); ctx2.arc(px+sz*0.65, py+sz*0.3, sz*0.07, 0, Math.PI*2); ctx2.fill();
      break;
    case T.GOAL:
      ctx2.fillStyle = '#ff0000';
      ctx2.fillRect(px+sz/2-2*s, py, 4*s, sz);
      ctx2.fillStyle = '#ff4444';
      ctx2.fillRect(px+sz/2-2*s, py, 16*s, 8*s);
      break;
    case T.GOOMBA:
    case T.KOOPA:
      // Drawn separately as entities
      break;
    default:
      break;
  }
}

function drawStar(ctx2, cx, cy, r, color, points) {
  ctx2.fillStyle = color;
  ctx2.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const radius = i % 2 === 0 ? r : r * 0.45;
    if (i === 0) ctx2.moveTo(cx + Math.cos(angle)*radius, cy + Math.sin(angle)*radius);
    else ctx2.lineTo(cx + Math.cos(angle)*radius, cy + Math.sin(angle)*radius);
  }
  ctx2.closePath();
  ctx2.fill();
  ctx2.fillStyle = '#fff';
  ctx2.beginPath();
  ctx2.arc(cx - r*0.15, cy - r*0.2, r*0.15, 0, Math.PI*2);
  ctx2.fill();
}

// ===== SOLID TILE CHECK =====
function isSolid(grid, tx, ty) {
  if (ty < 0) return false;
  if (ty >= LEVEL_HEIGHT) return true;
  if (tx < 0 || tx >= LEVEL_WIDTH) return true;
  const t = grid[ty][tx];
  return t === T.GROUND || t === T.BRICK || t === T.QUESTION ||
         t === T.PIPE_TOP_L || t === T.PIPE_TOP_R ||
         t === T.PIPE_BODY_L || t === T.PIPE_BODY_R;
}
function isPlatform(grid, tx, ty) {
  if (ty < 0 || ty >= LEVEL_HEIGHT || tx < 0 || tx >= LEVEL_WIDTH) return false;
  const t = grid[ty][tx];
  return t === T.PLATFORM || t === T.ONE_WAY;
}
function isDeadly(grid, tx, ty) {
  if (ty < 0 || ty >= LEVEL_HEIGHT || tx < 0 || tx >= LEVEL_WIDTH) return false;
  const t = grid[ty][tx];
  return t === T.LAVA || t === T.SPIKE;
}

// ===== ENTITY INIT =====
function spawnEntities(grid) {
  entities = [];
  for (let y = 0; y < LEVEL_HEIGHT; y++) {
    for (let x = 0; x < LEVEL_WIDTH; x++) {
      const t = grid[y][x];
      if (t === T.GOOMBA) {
        entities.push({ type:'goomba', x: x*TILE, y: y*TILE, vx:-1.5, vy:0, w:28, h:28, alive:true, frame:0, ft:0 });
      } else if (t === T.KOOPA) {
        entities.push({ type:'koopa', x: x*TILE, y: y*TILE, vx:-1.5, vy:0, w:28, h:36, alive:true, shell:false, shellVx:0, frame:0, ft:0 });
      } else if (t === T.COIN) {
        entities.push({ type:'coin', x: x*TILE+4, y: y*TILE+4, w:24, h:24, collected:false, frame:0, ft:0 });
      } else if (t === T.MUSHROOM) {
        entities.push({ type:'mushroom', x: x*TILE+4, y: y*TILE+4, vx:1.5, vy:0, w:24, h:24, collected:false });
      } else if (t === T.STAR_ITEM) {
        entities.push({ type:'star', x: x*TILE+4, y: y*TILE, vx:2, vy:-3, w:24, h:24, collected:false, bouncing:true });
      }
    }
  }
}

// ===== GAME START =====
function startLevel(levelData, levelIdx) {
  currentLevel = levelData;
  currentLevelIndex = levelIdx;
  // Reset player
  player.x = 64; player.y = 100;
  player.vx = 0; player.vy = 0;
  player.onGround = false;
  player.dead = false; player.deadTimer = 0;
  player.powered = false; player.starred = false; player.starTimer = 0;
  player.frame = 0; player.frameTimer = 0;
  // Spawn entities
  spawnEntities(levelData.grid);
  particles = [];
  camX = 0; camY = 0;
  levelTimer = 300;
  playerScore = 0;
  document.getElementById('hud-level-name').textContent = levelData.name;
  document.getElementById('hud-lives').textContent = playerLives;
  document.getElementById('hud-score').textContent = playerScore;
  document.getElementById('hud-time').textContent = Math.ceil(levelTimer);
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (gameState !== 'game') return;
    levelTimer -= 1;
    document.getElementById('hud-time').textContent = Math.ceil(levelTimer);
    if (levelTimer <= 0) killPlayer();
  }, 1000);
  showScreen('game');
  resizeGameCanvas();
  if (animFrame) cancelAnimationFrame(animFrame);
  gameLoop();
}

// ===== PHYSICS =====
function moveEntity(ent, grid, dt) {
  ent.vy += GRAVITY;
  if (ent.vy > MAX_FALL) ent.vy = MAX_FALL;

  // Horizontal
  ent.x += ent.vx;
  const ex1 = Math.floor(ent.x / TILE);
  const ex2 = Math.floor((ent.x + ent.w - 1) / TILE);
  const ey1 = Math.floor(ent.y / TILE);
  const ey2 = Math.floor((ent.y + ent.h - 1) / TILE);

  if (ent.vx < 0) {
    for (let ty = ey1; ty <= ey2; ty++) {
      if (isSolid(grid, ex1, ty)) {
        ent.x = (ex1 + 1) * TILE;
        ent.vx *= -1;
        break;
      }
    }
  } else if (ent.vx > 0) {
    for (let ty = ey1; ty <= ey2; ty++) {
      if (isSolid(grid, ex2, ty)) {
        ent.x = ex2 * TILE - ent.w;
        ent.vx *= -1;
        break;
      }
    }
  }

  // Vertical
  ent.y += ent.vy;
  const ex1b = Math.floor(ent.x / TILE);
  const ex2b = Math.floor((ent.x + ent.w - 1) / TILE);
  const ey1b = Math.floor(ent.y / TILE);
  const ey2b = Math.floor((ent.y + ent.h - 1) / TILE);

  if (ent.vy < 0) {
    for (let tx = ex1b; tx <= ex2b; tx++) {
      if (isSolid(grid, tx, ey1b)) {
        ent.y = (ey1b + 1) * TILE;
        ent.vy = 0;
        // Hit question block from below?
        if (grid[ey1b][tx] === T.QUESTION) {
          hitQuestionBlock(tx, ey1b, grid);
        }
        break;
      }
    }
  } else if (ent.vy >= 0) {
    let landed = false;
    for (let tx = ex1b; tx <= ex2b; tx++) {
      if (isSolid(grid, tx, ey2b)) {
        ent.y = ey2b * TILE - ent.h;
        ent.vy = 0;
        ent.onGround = true;
        landed = true;
        break;
      }
    }
    if (!landed) {
      // Check platform
      const ey_prev = Math.floor((ent.y - ent.vy + ent.h - 1) / TILE);
      for (let tx = ex1b; tx <= ex2b; tx++) {
        if (isPlatform(grid, tx, ey2b) && ey_prev <= ey2b * TILE - 1 && ent.vy >= 0) {
          const platformY = ey2b * TILE;
          if (ent.y + ent.h >= platformY && ent.y + ent.h - ent.vy <= platformY + 4) {
            ent.y = platformY - ent.h;
            ent.vy = 0;
            ent.onGround = true;
            landed = true;
            break;
          }
        }
      }
      if (!landed) ent.onGround = false;
    }
    // Deadly tiles
    for (let tx = ex1b; tx <= ex2b; tx++) {
      if (isDeadly(grid, tx, ey2b)) {
        if (ent === player) killPlayer();
        else if (ent.alive !== undefined) ent.alive = false;
        break;
      }
    }
  }

  // Fall out of world
  if (ent.y > LEVEL_HEIGHT * TILE + 100) {
    if (ent === player) killPlayer();
    else ent.alive = false;
  }
  // Left wall
  if (ent.x < 0) {
    ent.x = 0;
    if (ent !== player) ent.vx *= -1;
  }
  // Right wall
  if (ent.x + ent.w > LEVEL_WIDTH * TILE) {
    ent.x = LEVEL_WIDTH * TILE - ent.w;
    if (ent !== player) ent.vx *= -1;
  }
}

// ===== QUESTION BLOCK HIT =====
const hitBlocks = new Set();
function hitQuestionBlock(tx, ty, grid) {
  const key = `${tx},${ty}`;
  if (hitBlocks.has(key)) return;
  hitBlocks.add(key);
  grid[ty][tx] = T.BRICK; // depleted
  // Spawn coin above
  spawnCoinParticle(tx * TILE + 8, ty * TILE);
  addScore(100, tx*TILE, ty*TILE);
}

function spawnCoinParticle(x, y) {
  particles.push({ type:'coin', x, y, vy:-6, life:1.0, color:'#f8d030' });
  playerScore += 200;
  document.getElementById('hud-score').textContent = playerScore;
}

function addScore(pts, x, y) {
  playerScore += pts;
  document.getElementById('hud-score').textContent = playerScore;
  // Floating text
  const div = document.createElement('div');
  div.className = 'score-popup';
  div.textContent = '+' + pts;
  div.style.left = (x - camX) + 'px';
  div.style.top = (y - camY + canvas.getBoundingClientRect().top) + 'px';
  document.querySelector('.game-container').appendChild(div);
  setTimeout(() => div.remove(), 1000);
}

// ===== PLAYER MOVEMENT =====
function updatePlayer(dt) {
  if (player.dead) {
    player.deadTimer += dt;
    player.vy += GRAVITY * 0.8;
    player.y += player.vy;
    if (player.deadTimer > 120) {
      loseLife();
    }
    return;
  }

  // Horizontal
  const speed = (keys['ShiftLeft'] || keys['ShiftRight'] || mobileKeys.run) ? RUN_SPEED : MOVE_SPEED;
  player.running = speed > MOVE_SPEED;
  if (keys['ArrowLeft'] || keys['KeyA'] || mobileKeys.left) {
    player.vx = -speed;
    player.facing = -1;
  } else if (keys['ArrowRight'] || keys['KeyD'] || mobileKeys.right) {
    player.vx = speed;
    player.facing = 1;
  } else {
    player.vx *= 0.8;
    if (Math.abs(player.vx) < 0.5) player.vx = 0;
  }

  // Jump
  if ((keys['Space'] || keys['ArrowUp'] || keys['KeyW'] || mobileKeys.jump) && player.onGround && !player.jumping) {
    player.vy = JUMP_FORCE - (Math.abs(player.vx) * 0.1);
    player.onGround = false;
    player.jumping = true;
  }
  if (!(keys['Space'] || keys['ArrowUp'] || keys['KeyW'] || mobileKeys.jump)) {
    player.jumping = false;
    if (player.vy < -6) player.vy = -6; // Variable jump height
  }

  // Star power
  if (player.starred) {
    player.starTimer--;
    if (player.starTimer <= 0) { player.starred = false; }
  }

  moveEntity(player, currentLevel.grid, dt);

  // Animation
  player.frameTimer++;
  if (player.vx !== 0 && player.onGround) {
    if (player.frameTimer % 6 === 0) player.frame = (player.frame + 1) % 4;
  } else if (!player.onGround) {
    player.frame = 2;
  } else {
    player.frame = 0;
  }

  // Camera
  const targetX = player.x - canvas.width / 2 + player.w / 2;
  const maxCamX = LEVEL_WIDTH * TILE - canvas.width;
  camX = Math.max(0, Math.min(maxCamX, targetX));
  camY = 0;

  // Check goal
  const px1 = Math.floor(player.x / TILE);
  const px2 = Math.floor((player.x + player.w - 1) / TILE);
  const py1 = Math.floor(player.y / TILE);
  const py2 = Math.floor((player.y + player.h - 1) / TILE);
  for (let tx = px1; tx <= px2; tx++) {
    for (let ty = py1; ty <= py2; ty++) {
      if (ty >= 0 && ty < LEVEL_HEIGHT && tx >= 0 && tx < LEVEL_WIDTH) {
        if (currentLevel.grid[ty][tx] === T.GOAL) {
          levelComplete();
          return;
        }
      }
    }
  }
}

// ===== ENTITY UPDATE =====
function updateEntities(dt) {
  for (const ent of entities) {
    if (ent.type === 'coin') {
      if (!ent.collected) {
        // Animate
        ent.ft++;
        ent.frame = Math.floor(ent.ft / 8) % 4;
        // Collision with player
        if (rectsOverlap(player, ent)) {
          ent.collected = true;
          addScore(200, ent.x, ent.y);
          particles.push({ type:'coin', x:ent.x+12, y:ent.y, vy:-5, life:1.0 });
        }
      }
      continue;
    }
    if (ent.type === 'mushroom') {
      if (!ent.collected) {
        moveEntity(ent, currentLevel.grid, dt);
        if (rectsOverlap(player, ent)) {
          ent.collected = true;
          player.powered = true;
          player.h = 48;
          addScore(1000, ent.x, ent.y);
          particles.push({ type:'mushroom', x:ent.x+12, y:ent.y, vy:-4, life:1.0 });
        }
      }
      continue;
    }
    if (ent.type === 'star') {
      if (!ent.collected) {
        ent.vy += GRAVITY * 0.6;
        ent.x += ent.vx;
        ent.y += ent.vy;
        if (ent.onGround || ent.y + ent.h > (LEVEL_HEIGHT-2)*TILE) {
          ent.vy = JUMP_FORCE * 0.7;
          ent.onGround = false;
        }
        // Simple floor bounce
        const sy = Math.floor((ent.y + ent.h) / TILE);
        if (isSolid(currentLevel.grid, Math.floor(ent.x/TILE), sy) ||
            isSolid(currentLevel.grid, Math.floor((ent.x+ent.w-1)/TILE), sy)) {
          ent.y = sy * TILE - ent.h;
          ent.vy = JUMP_FORCE * 0.7;
        }
        if (rectsOverlap(player, ent)) {
          ent.collected = true;
          player.starred = true;
          player.starTimer = 600;
          addScore(1000, ent.x, ent.y);
        }
      }
      continue;
    }
    if ((ent.type === 'goomba' || ent.type === 'koopa') && ent.alive) {
      ent.ft++;
      // Physics
      ent.vy += GRAVITY;
      if (ent.vy > MAX_FALL) ent.vy = MAX_FALL;
      // Horizontal
      ent.x += ent.vx;
      // Wall bounce
      const ex1 = Math.floor(ent.x / TILE);
      const ex2 = Math.floor((ent.x + ent.w - 1) / TILE);
      const ey = Math.floor((ent.y + ent.h/2) / TILE);
      if (isSolid(currentLevel.grid, ex1, ey) || ent.x < 0) { ent.vx = Math.abs(ent.vx); ent.x += 2; }
      if (isSolid(currentLevel.grid, ex2, ey) || ent.x + ent.w > LEVEL_WIDTH*TILE) { ent.vx = -Math.abs(ent.vx); ent.x -= 2; }
      // Vertical
      ent.y += ent.vy;
      const ey2 = Math.floor((ent.y + ent.h - 1) / TILE);
      let onGnd = false;
      for (let tx = Math.floor(ent.x/TILE); tx <= Math.floor((ent.x+ent.w-1)/TILE); tx++) {
        if (isSolid(currentLevel.grid, tx, ey2)) {
          ent.y = ey2 * TILE - ent.h;
          ent.vy = 0;
          onGnd = true;
          break;
        }
        if (isPlatform(currentLevel.grid, tx, ey2) && ent.vy >= 0) {
          ent.y = ey2 * TILE - ent.h;
          ent.vy = 0;
          onGnd = true;
          break;
        }
      }
      // Turn at platform edges (don't walk off)
      if (onGnd && ent.vx !== 0) {
        const edgeTx = ent.vx < 0 ? Math.floor(ent.x / TILE) : Math.floor((ent.x+ent.w) / TILE);
        const floorTy = Math.floor((ent.y + ent.h) / TILE);
        if (!isSolid(currentLevel.grid, edgeTx, floorTy) && !isPlatform(currentLevel.grid, edgeTx, floorTy)) {
          ent.vx *= -1;
        }
      }
      if (ent.y > (LEVEL_HEIGHT+1)*TILE) ent.alive = false;

      // Player collision
      if (!player.dead && rectsOverlap(player, ent)) {
        const playerBottom = player.y + player.h;
        const entTop = ent.y + 4;
        if (playerBottom - player.vy <= entTop && player.vy > 0) {
          // Stomp
          if (ent.type === 'koopa' && !ent.shell) {
            ent.shell = true;
            ent.vx = 0;
            ent.h = 24;
            player.vy = JUMP_FORCE * 0.6;
            addScore(500, ent.x, ent.y);
          } else {
            ent.alive = false;
            player.vy = JUMP_FORCE * 0.6;
            addScore(200, ent.x, ent.y);
            particles.push({ type:'stomp', x:ent.x+14, y:ent.y, vy:-3, life:1.0 });
          }
        } else {
          // Hurt player
          if (player.starred) {
            ent.alive = false;
            addScore(200, ent.x, ent.y);
          } else if (player.powered) {
            player.powered = false;
            player.h = 32;
            player.starTimer = 120; // Brief invincibility
            player.starred = true;
          } else {
            killPlayer();
          }
        }
      }
    }
  }

  // Koopa shell kick
  for (const ent of entities) {
    if (ent.type === 'koopa' && ent.shell && ent.alive) {
      if (rectsOverlap(player, ent)) {
        if (ent.vx === 0) {
          ent.vx = player.facing > 0 ? 7 : -7;
        } else {
          killPlayer();
        }
      }
      // Shell kills goombas
      for (const other of entities) {
        if (other !== ent && other.alive && rectsOverlap(ent, other)) {
          other.alive = false;
          addScore(200, other.x, other.y);
        }
      }
    }
  }
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

// ===== PARTICLES =====
function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.y += p.vy;
    p.vy += 0.2;
    p.life -= 0.025;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function drawParticles(ctx2) {
  for (const p of particles) {
    ctx2.globalAlpha = p.life;
    if (p.type === 'coin') {
      ctx2.fillStyle = '#f8d030';
      ctx2.fillRect(p.x - camX, p.y - camY, 12, 12);
    } else if (p.type === 'stomp') {
      ctx2.fillStyle = '#ff8800';
      ctx2.fillRect(p.x - camX - 4, p.y - camY, 8, 8);
    } else if (p.type === 'mushroom') {
      ctx2.fillStyle = '#e52521';
      ctx2.fillRect(p.x - camX - 6, p.y - camY, 12, 12);
    }
    ctx2.globalAlpha = 1;
  }
}

// ===== PLAYER DEATH =====
function killPlayer() {
  if (player.dead) return;
  player.dead = true;
  player.vy = JUMP_FORCE;
  player.vx = 0;
  player.deadTimer = 0;
  clearInterval(timerInterval);
}

function loseLife() {
  playerLives--;
  document.getElementById('hud-lives').textContent = playerLives;
  if (playerLives <= 0) {
    showGameOver(false);
  } else {
    // Restart level
    startLevel(currentLevel, currentLevelIndex);
  }
}

// ===== LEVEL COMPLETE =====
function levelComplete() {
  clearInterval(timerInterval);
  addScore(levelTimer * 10, player.x, player.y);
  const isCustom = currentLevelIndex >= 1000;
  if (!isCustom && currentLevelIndex < BUILT_IN_LEVELS.length - 1) {
    showGameOver(true, 'LEVEL VOLTOOID!', `Score: ${playerScore}\nGa naar niveau ${currentLevelIndex + 2}!`);
  } else {
    showGameOver(true, '🎉 GEWELDIG!', `Score: ${playerScore}\nJe hebt het spel uitgespeeld!`);
  }
}

function showGameOver(win, title, msg) {
  clearInterval(timerInterval);
  document.getElementById('gameover-title').textContent = title || (win ? '🏆 GEWONNEN!' : '💀 GAME OVER');
  document.getElementById('gameover-msg').textContent = msg || `Score: ${playerScore}`;
  document.getElementById('btn-gameover-retry').textContent = win ? (currentLevelIndex < BUILT_IN_LEVELS.length-1 && currentLevelIndex < 1000 ? '⏭ VOLGEND LEVEL' : '🔄 OPNIEUW') : '🔄 OPNIEUW';
  showScreen('gameover');
  if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }
}

// ===== DRAWING =====
function drawGame() {
  const sky = currentLevel.sky || '#5c94fc';
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Background stars for dark levels
  if (sky.startsWith('#1') || sky.startsWith('#2') || sky.startsWith('#3') || sky === '#220066' || sky === '#2d0030') {
    drawStars(ctx);
  }

  // Draw grid tiles
  const startX = Math.floor(camX / TILE);
  const endX = Math.min(LEVEL_WIDTH, startX + Math.ceil(canvas.width / TILE) + 2);
  const startY = Math.floor(camY / TILE);
  const endY = Math.min(LEVEL_HEIGHT, startY + Math.ceil(canvas.height / TILE) + 2);

  const grid = currentLevel.grid;
  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const t = grid[y][x];
      if (t === T.EMPTY || t === T.GOOMBA || t === T.KOOPA || t === T.COIN ||
          t === T.MUSHROOM || t === T.STAR_ITEM || t === T.GOAL) continue;
      if (t === T.LAVA) {
        drawTile(ctx, t, x*TILE - camX, y*TILE - camY, 1);
        continue;
      }
      drawTile(ctx, t, x*TILE - camX, y*TILE - camY, 1);
    }
  }

  // Draw goal flag
  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      if (grid[y][x] === T.GOAL) {
        drawTile(ctx, T.GOAL, x*TILE - camX, y*TILE - camY, 1);
      }
    }
  }

  // Draw entities
  for (const ent of entities) {
    if (ent.x + ent.w < camX || ent.x > camX + canvas.width) continue;
    drawEntity(ctx, ent);
  }

  // Draw particles
  drawParticles(ctx);

  // Draw player
  drawPlayer(ctx);

  // HUD overlays
  if (player.starred && player.starTimer > 0) {
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#ffe000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
  }
}

let starBg = [];
function drawStars(ctx2) {
  if (starBg.length === 0) {
    for (let i=0; i<60; i++) {
      starBg.push({ x: Math.random()*LEVEL_WIDTH*TILE, y: Math.random()*canvas.height, r: Math.random()*2+0.5 });
    }
  }
  ctx2.fillStyle = '#fff';
  for (const s of starBg) {
    const sx = ((s.x - camX) % canvas.width + canvas.width) % canvas.width;
    ctx2.beginPath();
    ctx2.arc(sx, s.y, s.r, 0, Math.PI*2);
    ctx2.fill();
  }
}

function drawEntity(ctx2, ent) {
  const ex = ent.x - camX;
  const ey = ent.y - camY;
  if (!ent.alive && ent.type !== 'coin' && ent.type !== 'mushroom' && ent.type !== 'star') return;
  if (ent.collected) return;

  if (ent.type === 'goomba') {
    // Body
    ctx2.fillStyle = '#c84010';
    ctx2.fillRect(ex+2, ey+4, 24, 22);
    // Head
    ctx2.fillStyle = '#c84010';
    ctx2.beginPath();
    ctx2.arc(ex+14, ey+10, 12, 0, Math.PI*2);
    ctx2.fill();
    // Eyes
    ctx2.fillStyle = '#fff';
    ctx2.fillRect(ex+5, ey+4, 7, 6);
    ctx2.fillRect(ex+16, ey+4, 7, 6);
    ctx2.fillStyle = '#000';
    const eyeOff = Math.floor(ent.ft/15)%2===0 ? 0 : 1;
    ctx2.fillRect(ex+7+eyeOff, ey+5, 3, 4);
    ctx2.fillRect(ex+18-eyeOff, ey+5, 3, 4);
    // Feet
    ctx2.fillStyle = '#5a1a00';
    const walkOff = Math.floor(ent.ft/8)%2===0 ? -2 : 2;
    ctx2.fillRect(ex+2, ey+22, 10, 6);
    ctx2.fillRect(ex+16+walkOff, ey+22, 10, 6);
  }
  else if (ent.type === 'koopa') {
    if (ent.shell) {
      // Shell mode
      ctx2.fillStyle = '#3ab54a';
      ctx2.beginPath();
      ctx2.ellipse(ex+14, ey+14, 13, 11, 0, 0, Math.PI*2);
      ctx2.fill();
      ctx2.fillStyle = '#f8d030';
      ctx2.beginPath();
      ctx2.ellipse(ex+14, ey+14, 8, 7, 0, 0, Math.PI*2);
      ctx2.fill();
    } else {
      // Shell
      ctx2.fillStyle = '#3ab54a';
      ctx2.fillRect(ex+4, ey+10, 20, 20);
      ctx2.beginPath();
      ctx2.ellipse(ex+14, ey+18, 11, 11, 0, 0, Math.PI*2);
      ctx2.fill();
      // Head
      ctx2.fillStyle = '#f0e030';
      ctx2.beginPath();
      ctx2.arc(ex+14, ey+6, 10, 0, Math.PI*2);
      ctx2.fill();
      // Eyes
      ctx2.fillStyle = '#000';
      ctx2.fillRect(ex+9, ey+3, 3, 4);
      ctx2.fillRect(ex+16, ey+3, 3, 4);
      // Feet
      ctx2.fillStyle = '#f0e030';
      const walkOff = Math.floor(ent.ft/8)%2===0 ? -2 : 2;
      ctx2.fillRect(ex+2, ey+26, 8, 8);
      ctx2.fillRect(ex+18+walkOff, ey+26, 8, 8);
    }
  }
  else if (ent.type === 'coin') {
    const bounce = Math.sin(Date.now()*0.005 + ent.x*0.05) * 3;
    drawTile(ctx2, T.COIN, ex, ey + bounce, 1);
  }
  else if (ent.type === 'mushroom') {
    drawTile(ctx2, T.MUSHROOM, ex, ey, 1);
  }
  else if (ent.type === 'star') {
    const t = Date.now()*0.005;
    drawStar(ctx2, ex+12, ey+12, 12, `hsl(${t*100%360},100%,60%)`, 5);
  }
}

function drawPlayer(ctx2) {
  const px = Math.round(player.x - camX);
  const py = Math.round(player.y - camY);
  const pw = player.w;
  const ph = player.h;

  // Dead animation
  if (player.dead) {
    ctx2.fillStyle = '#e52521';
    ctx2.fillRect(px, py, pw, ph);
    ctx2.fillStyle = '#f8a060';
    ctx2.fillRect(px+4, py, pw-8, 10);
    ctx2.fillStyle = '#e52521';
    ctx2.fillRect(px+2, py-8, pw-4, 10);
    return;
  }

  // Star flicker
  if (player.starred && player.starTimer > 0) {
    const colors = ['#ff4400','#ffee00','#00aaff','#ff00aa','#00ff66'];
    const ci = Math.floor(Date.now()/80) % colors.length;
    if (Math.floor(Date.now()/40)%2===0) {
      ctx2.globalAlpha = 0.7;
    }
    drawMarioSprite(ctx2, px, py, pw, ph, colors[ci]);
    ctx2.globalAlpha = 1;
  } else {
    drawMarioSprite(ctx2, px, py, pw, ph, null);
  }
}

function drawMarioSprite(ctx2, px, py, pw, ph, overrideColor) {
  const flip = player.facing < 0;
  ctx2.save();
  if (flip) {
    ctx2.translate(px + pw/2, py);
    ctx2.scale(-1, 1);
    ctx2.translate(-pw/2, 0);
  } else {
    ctx2.translate(px, py);
  }

  const bc = overrideColor || '#e52521'; // Body/hat color
  const sc = overrideColor || '#f8a060'; // Skin
  const oc = overrideColor || '#0066cc'; // Overall

  // Hat
  ctx2.fillStyle = bc;
  ctx2.fillRect(2, 0, pw-4, 8);
  ctx2.fillRect(0, 6, pw, 4);
  // Hair/Face
  ctx2.fillStyle = sc;
  ctx2.fillRect(2, 8, pw-4, 10);
  // Mustache
  ctx2.fillStyle = '#5a2a00';
  ctx2.fillRect(4, 14, pw-8, 4);
  // Eyes
  ctx2.fillStyle = '#000';
  ctx2.fillRect(pw-9, 9, 4, 4);
  // Body (overalls)
  ctx2.fillStyle = oc;
  ctx2.fillRect(0, 18, pw, ph-18-8);
  // Buttons
  ctx2.fillStyle = '#ffff00';
  ctx2.fillRect(pw/2-3, 22, 3, 3);
  // Arms
  ctx2.fillStyle = bc;
  const armOff = player.running ? Math.sin(Date.now()*0.02)*4 : 0;
  ctx2.fillRect(-4, 20+armOff, 6, 8);
  ctx2.fillRect(pw-2, 20-armOff, 6, 8);
  // Hands
  ctx2.fillStyle = sc;
  ctx2.fillRect(-5, 28+armOff, 7, 6);
  ctx2.fillRect(pw-2, 28-armOff, 7, 6);
  // Legs
  ctx2.fillStyle = bc;
  const legOff = player.onGround && player.vx !== 0 ? Math.sin(Date.now()*0.02)*3 : 0;
  ctx2.fillRect(2, ph-12, pw/2-3, 10);
  ctx2.fillRect(pw/2+1, ph-12, pw/2-3, 10);
  // Shoes
  ctx2.fillStyle = '#3a2000';
  ctx2.fillRect(0, ph-5+legOff, pw/2, 5);
  ctx2.fillRect(pw/2+1, ph-5-legOff, pw/2, 5);

  ctx2.restore();
}

// ===== GAME LOOP =====
let lastTime = 0;
function gameLoop(ts) {
  animFrame = requestAnimationFrame(gameLoop);
  if (!currentLevel || gameState !== 'game') return;
  const dt = 1;
  updatePlayer(dt);
  updateEntities(dt);
  updateParticles();
  drawGame();
}

// ===== MOBILE KEYS =====
const mobileKeys = { left:false, right:false, jump:false, run:false };

function setupMobileControls() {
  const setupBtn = (id, key) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    const press = (e) => { e.preventDefault(); mobileKeys[key] = true; btn.classList.add('pressed'); };
    const release = (e) => { e.preventDefault(); mobileKeys[key] = false; btn.classList.remove('pressed'); };
    btn.addEventListener('touchstart', press, { passive:false });
    btn.addEventListener('touchend', release, { passive:false });
    btn.addEventListener('touchcancel', release, { passive:false });
    btn.addEventListener('mousedown', press);
    btn.addEventListener('mouseup', release);
    btn.addEventListener('mouseleave', release);
  };
  setupBtn('btn-left', 'left');
  setupBtn('btn-right', 'right');
  setupBtn('btn-jump', 'jump');
  setupBtn('btn-run', 'run');
}

// ===== KEYBOARD =====
document.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (e.code === 'Space') e.preventDefault();
});
document.addEventListener('keyup', e => { keys[e.code] = false; });

// ===== EDITOR =====
const EDITOR_TOOLS = [
  { type: T.GROUND,      emoji: '🟫', label: 'Grond' },
  { type: T.BRICK,       emoji: '🧱', label: 'Steen' },
  { type: T.QUESTION,    emoji: '❓', label: 'Vraag' },
  { type: T.PLATFORM,    emoji: '🟨', label: 'Platform' },
  { type: T.PIPE_TOP_L,  emoji: '🟢', label: 'Pijp' },
  { type: T.COIN,        emoji: '🪙', label: 'Munt' },
  { type: T.MUSHROOM,    emoji: '🍄', label: 'Paddenstoel' },
  { type: T.STAR_ITEM,   emoji: '⭐', label: 'Ster' },
  { type: T.GOOMBA,      emoji: '👾', label: 'Goomba' },
  { type: T.KOOPA,       emoji: '🐢', label: 'Koopa' },
  { type: T.SPIKE,       emoji: '⚠️', label: 'Stekel' },
  { type: T.LAVA,        emoji: '🔥', label: 'Lava' },
  { type: T.GOAL,        emoji: '🚩', label: 'Doel' },
  { type: T.EMPTY,       emoji: '🗑', label: 'Wis', erase: true },
];

function setupEditor() {
  editorGrid = makeLevelGrid();
  // Default floor
  for (let x = 0; x < LEVEL_WIDTH; x++) {
    editorGrid[15][x] = T.GROUND;
    editorGrid[14][x] = T.GROUND;
  }
  // Spawn point marker (no tile, just start)
  editorScrollX = 0;

  // Build tool buttons
  const toolsEl = document.getElementById('editor-tools');
  toolsEl.innerHTML = '';
  for (const tool of EDITOR_TOOLS) {
    const btn = document.createElement('button');
    btn.className = 'tool-btn' + (tool.erase ? ' erase-tool' : '');
    btn.textContent = tool.emoji;
    btn.title = tool.label;
    if (tool.type === editorTool && !tool.erase) btn.classList.add('active');
    btn.addEventListener('click', () => {
      editorTool = tool.type;
      document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
    toolsEl.appendChild(btn);
  }

  setupEditorCanvas();
  editorDraw();
  setupEditorInteraction();
}

function setupEditorInteraction() {
  const getGridPos = (e) => {
    const rect = edCanvas.getBoundingClientRect();
    let cx, cy;
    if (e.touches) {
      cx = e.touches[0].clientX - rect.left;
      cy = e.touches[0].clientY - rect.top;
    } else {
      cx = e.clientX - rect.left;
      cy = e.clientY - rect.top;
    }
    const tx = Math.floor((cx + editorScrollX) / TILE);
    const ty = Math.floor(cy / TILE);
    return { tx, ty };
  };

  const paint = (e) => {
    const { tx, ty } = getGridPos(e);
    if (tx < 0 || tx >= LEVEL_WIDTH || ty < 0 || ty >= LEVEL_HEIGHT) return;
    if (editorErasing || editorTool === T.EMPTY) {
      editorGrid[ty][tx] = T.EMPTY;
    } else {
      // Pipe logic: place both halves
      if (editorTool === T.PIPE_TOP_L) {
        if (tx + 1 < LEVEL_WIDTH) {
          editorGrid[ty][tx] = T.PIPE_TOP_L;
          editorGrid[ty][tx+1] = T.PIPE_TOP_R;
          if (ty + 1 < LEVEL_HEIGHT) {
            editorGrid[ty+1][tx] = T.PIPE_BODY_L;
            editorGrid[ty+1][tx+1] = T.PIPE_BODY_R;
          }
        }
      } else {
        editorGrid[ty][tx] = editorTool;
      }
    }
    editorDraw();
  };

  edCanvas.addEventListener('mousedown', e => { editorPainting = true; editorErasing = e.button === 2; paint(e); });
  edCanvas.addEventListener('mousemove', e => { if (editorPainting) paint(e); });
  edCanvas.addEventListener('mouseup', () => editorPainting = false);
  edCanvas.addEventListener('mouseleave', () => editorPainting = false);
  edCanvas.addEventListener('contextmenu', e => e.preventDefault());
  edCanvas.addEventListener('touchstart', e => { e.preventDefault(); editorPainting = true; editorErasing = false; paint(e); }, { passive:false });
  edCanvas.addEventListener('touchmove', e => { e.preventDefault(); if (editorPainting) paint(e); }, { passive:false });
  edCanvas.addEventListener('touchend', () => editorPainting = false);

  // Scroll
  document.getElementById('scroll-left').addEventListener('click', () => {
    editorScrollX = Math.max(0, editorScrollX - TILE * 5);
    editorDraw();
  });
  document.getElementById('scroll-right').addEventListener('click', () => {
    editorScrollX = Math.min((LEVEL_WIDTH - Math.floor(edCanvas.width/TILE)) * TILE, editorScrollX + TILE * 5);
    editorDraw();
  });
}

function editorDraw() {
  if (!edCtx) return;
  edCtx.fillStyle = '#5c94fc';
  edCtx.fillRect(0, 0, edCanvas.width, edCanvas.height);

  // Grid
  const startX = Math.floor(editorScrollX / TILE);
  const endX = Math.min(LEVEL_WIDTH, startX + Math.ceil(edCanvas.width / TILE) + 2);

  for (let y = 0; y < LEVEL_HEIGHT; y++) {
    for (let x = startX; x < endX; x++) {
      const t = editorGrid[y][x];
      const px = x * TILE - editorScrollX;
      const py = y * TILE;
      if (t !== T.EMPTY) {
        if (t === T.GOOMBA) {
          edCtx.fillStyle = '#c84010';
          edCtx.fillRect(px+2, py+4, 28, 26);
          edCtx.fillStyle = '#fff';
          edCtx.font = '20px serif';
          edCtx.textAlign = 'center';
          edCtx.fillText('👾', px+16, py+24);
        } else if (t === T.KOOPA) {
          edCtx.fillStyle = '#3ab54a';
          edCtx.fillRect(px+2, py+2, 28, 30);
          edCtx.font = '20px serif';
          edCtx.textAlign = 'center';
          edCtx.fillText('🐢', px+16, py+24);
        } else {
          drawTile(edCtx, t, px, py, 1);
        }
      }
      // Grid lines
      edCtx.strokeStyle = 'rgba(255,255,255,0.15)';
      edCtx.strokeRect(px, py, TILE, TILE);
    }
  }

  // Spawn marker
  edCtx.fillStyle = '#0f0';
  edCtx.font = '20px serif';
  edCtx.fillText('🧍', 64 - editorScrollX, 14 * TILE);

  // Scroll indicator
  const totalW = LEVEL_WIDTH * TILE;
  const barW = edCanvas.width;
  const scrollRatio = editorScrollX / (totalW - edCanvas.width);
  const thumbW = (edCanvas.width / totalW) * barW;
  const thumbX = scrollRatio * (barW - thumbW);
  edCtx.fillStyle = 'rgba(0,0,0,0.4)';
  edCtx.fillRect(0, edCanvas.height - 6, barW, 6);
  edCtx.fillStyle = '#f8d030';
  edCtx.fillRect(thumbX, edCanvas.height - 6, thumbW, 6);
}

// ===== LEVEL SELECT =====
function buildLevelGrid() {
  const container = document.getElementById('level-grid');
  container.innerHTML = '';
  for (let i = 0; i < BUILT_IN_LEVELS.length; i++) {
    const lvl = BUILT_IN_LEVELS[i];
    const card = document.createElement('div');
    card.className = 'level-card';
    card.innerHTML = `<span class="level-num">${i+1}</span><div class="level-title">${lvl.name}</div><div class="level-stars">⭐⭐⭐</div>`;
    card.addEventListener('click', () => {
      playerLives = 3;
      hitBlocks.clear();
      startLevel(lvl, i);
    });
    container.appendChild(card);
  }
}

function buildCustomLevelGrid() {
  const container = document.getElementById('custom-level-grid');
  const msg = document.getElementById('no-levels-msg');
  container.innerHTML = '';
  const saved = getSavedLevels();
  if (saved.length === 0) {
    msg.style.display = 'block';
  } else {
    msg.style.display = 'none';
    saved.forEach((lvl, i) => {
      const card = document.createElement('div');
      card.className = 'level-card';
      card.innerHTML = `
        <span class="level-num">🔧</span>
        <div class="level-title">${lvl.name || 'Mijn Level'}</div>
        <div class="level-stars">🎮 Spelen</div>
        <button class="level-delete" data-idx="${i}">🗑 Verwijderen</button>
      `;
      card.querySelector('div').addEventListener('click', () => {
        playerLives = 3;
        hitBlocks.clear();
        startLevel({ name: lvl.name || 'Mijn Level', grid: lvl.grid, sky: '#5c94fc' }, 1000 + i);
      });
      card.querySelector('.level-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Level verwijderen?')) {
          deleteSavedLevel(i);
          buildCustomLevelGrid();
        }
      });
      container.appendChild(card);
    });
  }
}

// ===== SERVICE WORKER =====
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

// ===== INIT =====
window.addEventListener('load', () => {
  setupGameCanvas();
  setupMobileControls();

  // Menu buttons
  document.getElementById('btn-play').addEventListener('click', () => {
    buildLevelGrid();
    showScreen('level-select');
  });
  document.getElementById('btn-editor').addEventListener('click', () => {
    setupEditor();
    showScreen('editor');
  });
  document.getElementById('btn-custom').addEventListener('click', () => {
    buildCustomLevelGrid();
    showScreen('custom-levels');
  });

  // Back buttons
  document.getElementById('back-from-select').addEventListener('click', () => showScreen('menu'));
  document.getElementById('back-from-editor').addEventListener('click', () => showScreen('menu'));
  document.getElementById('back-from-custom').addEventListener('click', () => showScreen('menu'));

  // Pause
  document.getElementById('btn-pause').addEventListener('click', () => {
    clearInterval(timerInterval);
    showScreen('pause');
  });
  document.getElementById('btn-resume').addEventListener('click', () => {
    showScreen('game');
    gameState = 'game';
    timerInterval = setInterval(() => {
      if (gameState !== 'game') return;
      levelTimer--;
      document.getElementById('hud-time').textContent = Math.ceil(levelTimer);
      if (levelTimer <= 0) killPlayer();
    }, 1000);
    if (!animFrame) gameLoop();
  });
  document.getElementById('btn-restart').addEventListener('click', () => {
    hitBlocks.clear();
    startLevel(currentLevel, currentLevelIndex);
  });
  document.getElementById('btn-quit').addEventListener('click', () => {
    clearInterval(timerInterval);
    if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }
    showScreen('menu');
  });

  // Game over
  document.getElementById('btn-gameover-retry').addEventListener('click', () => {
    const isWin = document.getElementById('gameover-title').textContent.includes('VOLTOOID') ||
                  document.getElementById('gameover-title').textContent.includes('GEWELDIG') ||
                  document.getElementById('gameover-title').textContent.includes('GEWONNEN');
    if (isWin && currentLevelIndex < BUILT_IN_LEVELS.length - 1 && currentLevelIndex < 1000) {
      playerLives = 3;
      hitBlocks.clear();
      startLevel(BUILT_IN_LEVELS[currentLevelIndex + 1], currentLevelIndex + 1);
    } else {
      playerLives = 3;
      hitBlocks.clear();
      startLevel(currentLevel, currentLevelIndex);
    }
  });
  document.getElementById('btn-gameover-menu').addEventListener('click', () => {
    if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }
    showScreen('menu');
  });

  // Editor save
  document.getElementById('btn-save-level').addEventListener('click', () => {
    const name = document.getElementById('level-name-input').value.trim() || 'Mijn Level';
    // Validate: must have goal
    let hasGoal = false;
    for (let y = 0; y < LEVEL_HEIGHT; y++) for (let x = 0; x < LEVEL_WIDTH; x++) {
      if (editorGrid[y][x] === T.GOAL) hasGoal = true;
    }
    if (!hasGoal) { alert('Voeg een doel (🚩) toe aan je level!'); return; }
    saveLevel(name, editorGrid);
    alert('Level opgeslagen! Je kunt het vinden onder "Mijn Levels".');
  });

  document.getElementById('btn-test-level').addEventListener('click', () => {
    const name = document.getElementById('level-name-input').value.trim() || 'Test Level';
    playerLives = 3;
    hitBlocks.clear();
    // Deep copy grid
    const testGrid = editorGrid.map(row => [...row]);
    startLevel({ name, grid: testGrid, sky: '#5c94fc' }, 999);
  });

  document.getElementById('btn-clear-level').addEventListener('click', () => {
    if (confirm('Level leegmaken?')) {
      editorGrid = makeLevelGrid();
      for (let x = 0; x < LEVEL_WIDTH; x++) {
        editorGrid[15][x] = T.GROUND;
        editorGrid[14][x] = T.GROUND;
      }
      editorDraw();
    }
  });

  // Resize
  window.addEventListener('resize', () => {
    resizeGameCanvas();
    resizeEditorCanvas();
    editorDraw();
  });

  // Show menu
  showScreen('menu');
});
