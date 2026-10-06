import fs from 'fs';
import path from 'path';
import https from 'https';

const data = JSON.parse(fs.readFileSync('public/tracks.json', 'utf8'));
const pts = data.combined; // array of [lat, lng]

// Bounding box with padding
let minLat = 999, maxLat = -999, minLng = 999, maxLng = -999;
pts.forEach(([lat, lng]) => {
  if (lat < minLat) minLat = lat;
  if (lat > maxLat) maxLat = lat;
  if (lng < minLng) minLng = lng;
  if (lng > maxLng) maxLng = lng;
});

// Canvas dimensions for sharing poster (9:16 vertical poster, 1080 x 1920)
const width = 1080;
const height = 1920;

// Map area in the poster
const mapX = 44;
const mapY = 365;
const mapW = width - 88; // 992
const mapH = 950;

// Slightly adjust coordinates to frame nicely inside the map area
const padX = 0.05;
const padY = 0.06;
const latSpan = maxLat - minLat;
const lngSpan = maxLng - minLng;
const adjMinLat = minLat - latSpan * padY;
const adjMaxLat = maxLat + latSpan * padY;
const adjMinLng = minLng - lngSpan * padX;
const adjMaxLng = maxLng + lngSpan * padX;

// Mercator Projection helpers
function lon2x(lon, zoom) {
  return ((lon + 180) / 360) * Math.pow(2, zoom) * 256;
}
function lat2y(lat, zoom) {
  const sin = Math.sin((lat * Math.PI) / 180);
  return (
    (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) *
    Math.pow(2, zoom) *
    256
  );
}

// Convert track point to canvas coordinate
function project(lat, lng) {
  const minXPix = lon2x(adjMinLng, 7);
  const maxXPix = lon2x(adjMaxLng, 7);
  const minYPix = lat2y(adjMaxLat, 7);
  const maxYPix = lat2y(adjMinLat, 7);

  const curX = lon2x(lng, 7);
  const curY = lat2y(lat, 7);

  const xNorm = (curX - minXPix) / (maxXPix - minXPix);
  const yNorm = (curY - minYPix) / (maxYPix - minYPix);

  const x = mapX + xNorm * mapW;
  const y = mapY + yNorm * mapH;
  return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
}

// Generate SVG path string
let svgPath = '';
pts.forEach(([lat, lng], i) => {
  const [x, y] = project(lat, lng);
  if (i === 0) {
    svgPath += `M ${x} ${y}`;
  } else {
    svgPath += ` L ${x} ${y}`;
  }
});

// Download satellite tiles covering the region
function downloadTile(x, y, z) {
  return new Promise((resolve) => {
    const url = `https://webst01.is.autonavi.com/appmaptile?style=6&x=${x}&y=${y}&z=${z}`;
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        return resolve(null);
      }
      const chunks = [];
      res.on('data', (d) => chunks.push(d));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', () => resolve(null));
  });
}

async function buildSatelliteLayer() {
  const z = 7;
  const tileXStart = 97;
  const tileXEnd = 100; // 4 tiles across
  const tileYStart = 47;
  const tileYEnd = 50;  // 4 tiles down

  const minXPix = lon2x(adjMinLng, 7);
  const maxXPix = lon2x(adjMaxLng, 7);
  const minYPix = lat2y(adjMaxLat, 7);
  const maxYPix = lat2y(adjMinLat, 7);

  let tileSvgImages = '';

  for (let ty = tileYStart; ty <= tileYEnd; ty++) {
    for (let tx = tileXStart; tx <= tileXEnd; tx++) {
      const tileBuffer = await downloadTile(tx, ty, z);
      if (!tileBuffer) continue;

      const base64 = tileBuffer.toString('base64');
      const tilePixelLeft = tx * 256;
      const tilePixelTop = ty * 256;

      // Project tile bounding box to our map canvas coordinate
      const xNorm = (tilePixelLeft - minXPix) / (maxXPix - minXPix);
      const yNorm = (tilePixelTop - minYPix) / (maxYPix - minYPix);
      const wNorm = 256 / (maxXPix - minXPix);
      const hNorm = 256 / (maxYPix - minYPix);

      const destX = mapX + xNorm * mapW;
      const destY = mapY + yNorm * mapH;
      const destW = wNorm * mapW;
      const destH = hNorm * mapH;

      tileSvgImages += `
        <image x="${destX.toFixed(1)}" y="${destY.toFixed(1)}" width="${destW.toFixed(1)}" height="${destH.toFixed(1)}" href="data:image/jpeg;base64,${base64}" preserveAspectRatio="none" opacity="0.82" />
      `;
    }
  }

  return tileSvgImages;
}

// Waypoints to place on map
const waypoints = [
  { name: '西宁', en: 'XINING', lat: 36.62, lng: 101.78, type: 'start' },
  { name: '青海湖', en: 'QINGHAI LAKE', lat: 36.65, lng: 100.25, type: 'spot' },
  { name: '茶卡盐湖', en: 'CHAKA SALT LAKE', lat: 36.78, lng: 99.08, type: 'spot' },
  { name: '德令哈', en: 'DELINGHA', lat: 37.37, lng: 97.37, type: 'city' },
  { name: '大柴旦', en: 'DACHAIDAN', lat: 37.85, lng: 95.36, type: 'city' },
  { name: '水上雅丹', en: 'WATER YADAN', lat: 37.55, lng: 93.65, type: 'spot' },
  { name: '当金山口', en: 'DANGJIN PASS', lat: 39.32, lng: 94.62, type: 'pass' },
  { name: '敦煌', en: 'DUNHUANG', lat: 40.14, lng: 94.66, type: 'city' },
  { name: '瓜州', en: 'GUAZHOU', lat: 40.52, lng: 95.78, type: 'spot' },
  { name: '嘉峪关', en: 'JIAYUGUAN', lat: 39.77, lng: 98.28, type: 'city' },
  { name: '张掖', en: 'ZHANGYE', lat: 38.93, lng: 100.45, type: 'city' },
  { name: '扁都口', en: 'BIANDUKOU', lat: 38.25, lng: 100.95, type: 'pass' },
  { name: '祁连', en: 'QILIAN', lat: 38.17, lng: 100.25, type: 'city' },
  { name: '门源', en: 'MENYUAN', lat: 37.38, lng: 101.62, type: 'spot' },
  { name: '达坂山', en: 'DABANSHAN PASS', lat: 37.15, lng: 101.68, type: 'peak' },
];

let waypointsSvg = '';
waypoints.forEach(wp => {
  const [x, y] = project(wp.lat, wp.lng);
  const isKey = wp.type === 'start' || wp.type === 'city' || wp.type === 'peak';
  const color = wp.type === 'start' ? '#7ab87a' : wp.type === 'peak' ? '#ff5252' : '#f5d485';
  const r = isKey ? 5 : 3.5;
  
  let textAnchor = 'start';
  let dx = 10;
  let dy = 4;
  if (wp.name === '西宁') { dx = 12; dy = 4; }
  else if (wp.name === '敦煌') { dx = -12; textAnchor = 'end'; dy = 4; }
  else if (wp.name === '大柴旦') { dx = -10; textAnchor = 'end'; dy = -8; }
  else if (wp.name === '水上雅丹') { dx = -10; textAnchor = 'end'; dy = 14; }
  else if (wp.name === '当金山口') { dx = -12; textAnchor = 'end'; dy = 4; }
  else if (wp.name === '青海湖') { dx = 0; textAnchor = 'middle'; dy = 18; }
  else if (wp.name === '德令哈') { dx = -10; textAnchor = 'end'; dy = -6; }
  else if (wp.name === '张掖') { dx = 12; dy = -6; }
  else if (wp.name === '嘉峪关') { dx = 12; dy = -8; }
  else if (wp.name === '祁连') { dx = -10; textAnchor = 'end'; dy = 10; }
  else if (wp.name === '达坂山') { dx = 12; dy = -6; }
  else if (wp.name === '门源') { dx = 12; dy = 10; }
  else if (wp.name === '茶卡盐湖') { dx = -10; textAnchor = 'end'; dy = 12; }
  else if (wp.name === '扁都口') { dx = 12; dy = 4; }
  else if (wp.name === '瓜州') { dx = 10; dy = -6; }

  waypointsSvg += `
    <g class="wp-node">
      <circle cx="${x}" cy="${y}" r="${r * 2.2}" fill="${color}" opacity="0.3"/>
      <circle cx="${x}" cy="${y}" r="${r}" fill="${color}" stroke="#0e0d0b" stroke-width="1.5"/>
      <!-- Label with text halo for readability on satellite backdrop -->
      <text x="${x + dx}" y="${y + dy}" fill="#0e0d0b" stroke="#0e0d0b" stroke-width="3.5" stroke-linejoin="round" font-size="${isKey ? 13 : 11}" font-weight="${isKey ? '700' : '500'}" text-anchor="${textAnchor}" font-family="'PingFang SC', 'Microsoft YaHei', sans-serif">${wp.name}</text>
      <text x="${x + dx}" y="${y + dy}" fill="#f0e8d8" font-size="${isKey ? 13 : 11}" font-weight="${isKey ? '700' : '500'}" text-anchor="${textAnchor}" font-family="'PingFang SC', 'Microsoft YaHei', sans-serif">${wp.name}</text>
    </g>
  `;
});

async function main() {
  console.log('Downloading real satellite imagery tiles...');
  const satelliteSvg = await buildSatelliteLayer();
  console.log('Satellite tiles downloaded.');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <radialGradient id="bgGlow" cx="50%" cy="45%" r="60%">
      <stop offset="0%" stop-color="#181512" />
      <stop offset="60%" stop-color="#0e0d0b" />
      <stop offset="100%" stop-color="#070605" />
    </radialGradient>
    
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f5d485" />
      <stop offset="50%" stop-color="#c8963e" />
      <stop offset="100%" stop-color="#9a6e25" />
    </linearGradient>

    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1a1815" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#12100e" stop-opacity="0.95" />
    </linearGradient>

    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>

    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="2.5" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>

    <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(200, 150, 62, 0.04)" stroke-width="0.8"/>
      <circle cx="40" cy="40" r="0.8" fill="rgba(200, 150, 62, 0.15)"/>
    </pattern>

    <!-- Clip path to round corners of satellite imagery -->
    <clipPath id="mapClip">
      <rect x="${mapX}" y="${mapY}" width="${mapW}" height="${mapH}" rx="14" />
    </clipPath>
  </defs>

  <style>
    .font-serif { font-family: 'Fraunces', 'Noto Serif SC', 'Georgia', serif; }
    .font-sans { font-family: 'Work Sans', -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif; }
    .font-mono { font-family: 'JetBrains Mono', 'SF Pro Text', Menlo, monospace; }
  </style>

  <!-- Background Layer -->
  <rect width="${width}" height="${height}" fill="url(#bgGlow)" />
  <rect width="${width}" height="${height}" fill="url(#gridPattern)" />

  <!-- Outer Geometric Border -->
  <rect x="24" y="24" width="${width - 48}" height="${height - 48}" fill="none" stroke="rgba(200, 150, 62, 0.25)" stroke-width="1" />
  <rect x="30" y="30" width="${width - 60}" height="${height - 60}" fill="none" stroke="rgba(255, 255, 255, 0.05)" stroke-width="0.8" />
  
  <!-- Corner Ornaments -->
  <g stroke="#c8963e" stroke-width="1.5" fill="none">
    <path d="M 20 40 L 20 20 L 40 20" />
    <path d="M ${width - 20} 40 L ${width - 20} 20 L ${width - 40} 20" />
    <path d="M 20 ${height - 40} L 20 ${height - 20} L 40 ${height - 20}" />
    <path d="M ${width - 20} ${height - 40} L ${width - 20} ${height - 20} L ${width - 40} ${height - 20}" />
  </g>

  <!-- Top Badge / Header Tag -->
  <g transform="translate(60, 68)">
    <rect x="0" y="0" width="160" height="24" rx="4" fill="rgba(200, 150, 62, 0.15)" stroke="rgba(200, 150, 62, 0.4)" stroke-width="1" />
    <text x="80" y="16" fill="#c8963e" font-size="10.5" font-weight="600" text-anchor="middle" class="font-mono" letter-spacing="1.5">SATELLITE TELEMETRY</text>
  </g>

  <text x="${width - 60}" y="84" fill="#8a8075" font-size="12" text-anchor="end" class="font-mono">2026.09.25 - 10.04</text>

  <!-- Main Hero Title -->
  <g transform="translate(60, 140)">
    <text x="0" y="52" fill="#f0e8d8" font-size="52" font-weight="700" class="font-serif" letter-spacing="2">青甘大环线</text>
    <text x="0" y="86" fill="#c8963e" font-size="16" font-style="italic" class="font-serif" letter-spacing="1">Qinghai-Gansu Grand Loop · Satellite Map</text>
    <text x="0" y="114" fill="#a09485" font-size="13" class="font-sans" letter-spacing="0.5">两轮穿越高原盐湖、柴达木荒漠与河西走廊 · 真实卫星遥感底图</text>
  </g>

  <!-- Key Metrics Row (4 Glass Cards) -->
  <g transform="translate(60, 275)">
    <!-- Card 1: Total Distance -->
    <g transform="translate(0, 0)">
      <rect width="224" height="74" rx="8" fill="url(#cardGrad)" stroke="rgba(255, 255, 255, 0.08)" stroke-width="1" />
      <text x="16" y="24" fill="#8a8075" font-size="10" class="font-mono" letter-spacing="1">TOTAL DISTANCE</text>
      <text x="16" y="56" fill="#f0e8d8" font-size="28" font-weight="700" class="font-mono">3,000<tspan font-size="13" font-weight="400" fill="#c8963e"> km</tspan></text>
    </g>

    <!-- Card 2: Highest Pass -->
    <g transform="translate(244, 0)">
      <rect width="224" height="74" rx="8" fill="url(#cardGrad)" stroke="rgba(255, 255, 255, 0.08)" stroke-width="1" />
      <text x="16" y="24" fill="#8a8075" font-size="10" class="font-mono" letter-spacing="1">PEAK ELEVATION</text>
      <text x="16" y="56" fill="#f0e8d8" font-size="28" font-weight="700" class="font-mono">3,792<tspan font-size="13" font-weight="400" fill="#c8963e"> m</tspan></text>
      <text x="135" y="54" fill="#8a8075" font-size="10" class="font-sans">达坂山垭口</text>
    </g>

    <!-- Card 3: Days Completed -->
    <g transform="translate(488, 0)">
      <rect width="224" height="74" rx="8" fill="url(#cardGrad)" stroke="rgba(255, 255, 255, 0.08)" stroke-width="1" />
      <text x="16" y="24" fill="#8a8075" font-size="10" class="font-mono" letter-spacing="1">RIDING DURATION</text>
      <text x="16" y="56" fill="#f0e8d8" font-size="28" font-weight="700" class="font-mono">8+1<tspan font-size="13" font-weight="400" fill="#c8963e"> Days</tspan></text>
      <text x="135" y="54" fill="#8a8075" font-size="10" class="font-sans">完美闭环</text>
    </g>

    <!-- Card 4: GPS Points -->
    <g transform="translate(732, 0)">
      <rect width="228" height="74" rx="8" fill="url(#cardGrad)" stroke="rgba(255, 255, 255, 0.08)" stroke-width="1" />
      <text x="16" y="24" fill="#8a8075" font-size="10" class="font-mono" letter-spacing="1">GPS WAYPOINTS</text>
      <text x="16" y="56" fill="#f0e8d8" font-size="28" font-weight="700" class="font-mono">44,265<tspan font-size="12" font-weight="400" fill="#c8963e"> pts</tspan></text>
    </g>
  </g>

  <!-- Real Satellite Map Area with ClipPath -->
  <g clip-path="url(#mapClip)">
    <!-- Base dark background under tiles -->
    <rect x="${mapX}" y="${mapY}" width="${mapW}" height="${mapH}" fill="#14171a" />
    
    <!-- Rendered Satellite Tiles -->
    ${satelliteSvg}
    
    <!-- Subtle Vignette / Darkening overlay for aesthetics -->
    <rect x="${mapX}" y="${mapY}" width="${mapW}" height="${mapH}" fill="rgba(10, 12, 14, 0.15)" />
    
    <!-- Route Polyline (Gold Glow on Satellite) -->
    <g id="trackGroup">
      <!-- Shadow on terrain -->
      <path d="${svgPath}" fill="none" stroke="#000000" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" opacity="0.6"/>
      <!-- Outer Glow -->
      <path d="${svgPath}" fill="none" stroke="#f59e0b" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" opacity="0.4" filter="url(#glow)"/>
      <!-- Middle Bright Golden Stroke -->
      <path d="${svgPath}" fill="none" stroke="#f5d485" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.95" filter="url(#softGlow)"/>
      <!-- Core Solid Line -->
      <path d="${svgPath}" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" opacity="1"/>
    </g>

    <!-- Waypoints & Labels -->
    <g id="waypointsGroup">
      ${waypointsSvg}
    </g>

    <!-- Compass Rose Watermark -->
    <g transform="translate(110, 435)" opacity="0.75">
      <circle cx="0" cy="0" r="26" fill="rgba(14, 13, 11, 0.6)" stroke="#c8963e" stroke-width="0.8"/>
      <path d="M 0 -28 L 5 -9 L 0 -13 L -5 -9 Z" fill="#c8963e"/>
      <path d="M 0 28 L 5 9 L 0 13 L -5 9 Z" fill="#665335"/>
      <path d="M -28 0 L -9 -5 L -13 0 L -9 5 Z" fill="#665335"/>
      <path d="M 28 0 L 9 -5 L 13 0 L 9 5 Z" fill="#665335"/>
      <text x="0" y="-34" fill="#c8963e" font-size="11" font-weight="700" text-anchor="middle" class="font-mono">N</text>
    </g>

    <!-- Satellite Map Source Stamp -->
    <text x="${mapX + mapW - 14}" y="${mapY + mapH - 12}" fill="rgba(255,255,255,0.4)" font-size="10" text-anchor="end" class="font-mono">EARTH IMAGERY © 2026 GS(2021)6026 / AMAP</text>
  </g>

  <!-- Border around the map -->
  <rect x="${mapX}" y="${mapY}" width="${mapW}" height="${mapH}" rx="14" fill="none" stroke="rgba(200, 150, 62, 0.35)" stroke-width="1.2" />

  <!-- Daily Route Timeline / Itinerary Summary Table -->
  <g transform="translate(44, 1335)">
    <rect width="${width - 88}" height="350" rx="12" fill="url(#cardGrad)" stroke="rgba(255, 255, 255, 0.08)" stroke-width="1" />
    
    <g transform="translate(24, 28)">
      <text x="0" y="0" fill="#c8963e" font-size="13" font-weight="700" class="font-mono" letter-spacing="1">EXPEDITION ITINERARY &amp; DAILY ELEVATION</text>
      
      <!-- Column 1 (Day 1 - 5) -->
      <g transform="translate(0, 24)">
        <g transform="translate(0, 0)">
          <text x="0" y="16" fill="#c8963e" font-size="12" font-weight="700" class="font-mono">D1 09.25</text>
          <text x="68" y="16" fill="#f0e8d8" font-size="13" font-weight="500" class="font-sans">上海 ➔ 西宁</text>
          <text x="320" y="16" fill="#8a8075" font-size="11" class="font-mono" text-anchor="end">提车休整 · 2,288m</text>
          <line x1="0" y1="26" x2="330" y2="26" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
        </g>
        <g transform="translate(0, 36)">
          <text x="0" y="16" fill="#c8963e" font-size="12" font-weight="700" class="font-mono">D2 09.26</text>
          <text x="68" y="16" fill="#f0e8d8" font-size="13" font-weight="500" class="font-sans">西宁 ➔ 青海湖 ➔ 共和</text>
          <text x="320" y="16" fill="#8a8075" font-size="11" class="font-mono" text-anchor="end">295 km · 3,200m</text>
          <line x1="0" y1="26" x2="330" y2="26" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
        </g>
        <g transform="translate(0, 72)">
          <text x="0" y="16" fill="#c8963e" font-size="12" font-weight="700" class="font-mono">D3 09.27</text>
          <text x="68" y="16" fill="#f0e8d8" font-size="13" font-weight="500" class="font-sans">青海湖 ➔ 茶卡盐湖 ➔ 德令哈</text>
          <text x="320" y="16" fill="#8a8075" font-size="11" class="font-mono" text-anchor="end">281 km · 3,059m</text>
          <line x1="0" y1="26" x2="330" y2="26" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
        </g>
        <g transform="translate(0, 108)">
          <text x="0" y="16" fill="#c8963e" font-size="12" font-weight="700" class="font-mono">D4 09.28</text>
          <text x="68" y="16" fill="#f0e8d8" font-size="13" font-weight="500" class="font-sans">德令哈 ➔ 水上雅丹 ➔ 大柴旦</text>
          <text x="320" y="16" fill="#8a8075" font-size="11" class="font-mono" text-anchor="end">255 km · 3,174m</text>
          <line x1="0" y1="26" x2="330" y2="26" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
        </g>
        <g transform="translate(0, 144)">
          <text x="0" y="16" fill="#c8963e" font-size="12" font-weight="700" class="font-mono">D5 09.29</text>
          <text x="68" y="16" fill="#f0e8d8" font-size="13" font-weight="500" class="font-sans">大柴旦 ➔ 当金山 ➔ 敦煌</text>
          <text x="320" y="16" fill="#8a8075" font-size="11" class="font-mono" text-anchor="end">348 km · 3,648m</text>
          <line x1="0" y1="26" x2="330" y2="26" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
        </g>
      </g>

      <!-- Vertical divider -->
      <line x1="470" y1="24" x2="470" y2="210" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>

      <!-- Column 2 (Day 6 - 10) -->
      <g transform="translate(510, 24)">
        <g transform="translate(0, 0)">
          <text x="0" y="16" fill="#4a9fa5" font-size="12" font-weight="700" class="font-mono">D6 09.30</text>
          <text x="68" y="16" fill="#f0e8d8" font-size="13" font-weight="500" class="font-sans">敦煌 · 全天休整</text>
          <text x="430" y="16" fill="#8a8075" font-size="11" class="font-mono" text-anchor="end">莫高窟 · 鸣沙山</text>
          <line x1="0" y1="26" x2="440" y2="26" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
        </g>
        <g transform="translate(0, 36)">
          <text x="0" y="16" fill="#c8963e" font-size="12" font-weight="700" class="font-mono">D7 10.01</text>
          <text x="68" y="16" fill="#f0e8d8" font-size="13" font-weight="500" class="font-sans">敦煌 ➔ 瓜州 ➔ 嘉峪关</text>
          <text x="430" y="16" fill="#8a8075" font-size="11" class="font-mono" text-anchor="end">396 km · 1,600m</text>
          <line x1="0" y1="26" x2="440" y2="26" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
        </g>
        <g transform="translate(0, 72)">
          <text x="0" y="16" fill="#c8963e" font-size="12" font-weight="700" class="font-mono">D8 10.02</text>
          <text x="68" y="16" fill="#f0e8d8" font-size="13" font-weight="500" class="font-sans">嘉峪关 ➔ 张掖七彩丹霞</text>
          <text x="430" y="16" fill="#8a8075" font-size="11" class="font-mono" text-anchor="end">257 km · 1,480m</text>
          <line x1="0" y1="26" x2="440" y2="26" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
        </g>
        <g transform="translate(0, 108)">
          <text x="0" y="16" fill="#c8963e" font-size="12" font-weight="700" class="font-mono">D9 10.03</text>
          <text x="68" y="16" fill="#f0e8d8" font-size="13" font-weight="500" class="font-sans">张掖 ➔ 扁都口 ➔ 祁连山</text>
          <text x="430" y="16" fill="#8a8075" font-size="11" class="font-mono" text-anchor="end">246 km · 2,787m</text>
          <line x1="0" y1="26" x2="440" y2="26" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
        </g>
        <g transform="translate(0, 144)">
          <text x="0" y="16" fill="#7ab87a" font-size="12" font-weight="700" class="font-mono">D10 10.04</text>
          <text x="68" y="16" fill="#f0e8d8" font-size="13" font-weight="500" class="font-sans">祁连 ➔ 达坂山 ➔ 西宁 (闭环)</text>
          <text x="430" y="16" fill="#7ab87a" font-size="11" font-weight="600" class="font-mono" text-anchor="end">284 km · 3,792m 垭口</text>
          <line x1="0" y1="26" x2="440" y2="26" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
        </g>
      </g>

      <g transform="translate(0, 245)">
        <text x="0" y="16" fill="#a09485" font-size="12" font-style="italic" class="font-serif">“轮胎丈量旷野，风穿透胸膛。三千公里路，终在此处成环。”</text>
        <text x="${width - 136}" y="16" fill="#c8963e" font-size="12" font-weight="600" text-anchor="end" class="font-mono">MISSION ACCOMPLISHED</text>
      </g>
    </g>
  </g>

  <!-- Bottom Brand Footer -->
  <g transform="translate(60, 1720)">
    <line x1="0" y1="0" x2="${width - 120}" y2="0" stroke="rgba(200, 150, 62, 0.2)" stroke-width="1"/>
    
    <g transform="translate(0, 32)">
      <circle cx="16" cy="16" r="16" fill="rgba(200, 150, 62, 0.15)"/>
      <path d="M 16 7 L 22 23 L 16 19 L 10 23 Z" fill="#c8963e"/>
      
      <text x="44" y="14" fill="#f0e8d8" font-size="15" font-weight="600" class="font-sans">NESTOR MAO · MOTORCYCLE TOUR</text>
      <text x="44" y="32" fill="#8a8075" font-size="11" class="font-mono">tour.nestormao.com · GPS TELEMETRY &amp; GALLERY</text>

      <rect x="${width - 120 - 150}" y="4" width="150" height="26" rx="13" fill="rgba(122, 184, 122, 0.15)" stroke="#7ab87a" stroke-width="0.8"/>
      <circle cx="${width - 120 - 136}" cy="17" r="4" fill="#7ab87a"/>
      <text x="${width - 120 - 124}" y="21" fill="#7ab87a" font-size="11" font-weight="600" class="font-mono">100% LOOP CLOSED</text>
    </g>
  </g>
</svg>`;

  const outDir = path.resolve('public');
  fs.writeFileSync(path.join(outDir, 'tour-poster.svg'), svg);
  console.log('Saved tour-poster.svg with real satellite background successfully!');
}

main();
