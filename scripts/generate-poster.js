import fs from 'fs';
import path from 'path';

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

console.log('Bounding Box:', { minLat, maxLat, minLng, maxLng });

// Canvas dimensions for sharing poster (9:16 vertical poster, e.g. 1080 x 1920)
const width = 1080;
const height = 1920;

// Map area in the poster (from y = 380 to y = 1380, width 960)
const mapX = 60;
const mapY = 380;
const mapW = 960;
const mapH = 920;

const padRatio = 0.08;
const latSpan = maxLat - minLat;
const lngSpan = maxLng - minLng;
const adjMinLat = minLat - latSpan * padRatio;
const adjMaxLat = maxLat + latSpan * padRatio;
const adjMinLng = minLng - lngSpan * padRatio;
const adjMaxLng = maxLng + lngSpan * padRatio;

// Aspect ratio projection
function project(lat, lng) {
  // Mercator-like / equirectangular projection centered around 38N
  const cosLat = Math.cos((38.5 * Math.PI) / 180);
  const xNorm = (lng - adjMinLng) / (adjMaxLng - adjMinLng);
  // lat is inverted in screen coordinates (north is up)
  const yNorm = (adjMaxLat - lat) / (adjMaxLat - adjMinLat);

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

// Waypoints to place on map
const waypoints = [
  { name: '西宁', en: 'XINING', lat: 36.62, lng: 101.78, type: 'start', desc: '起点 / 终点 (2288m)' },
  { name: '青海湖', en: 'QINGHAI LAKE', lat: 36.65, lng: 100.25, type: 'spot', desc: '高原蓝宝石 (3200m)' },
  { name: '茶卡盐湖', en: 'CHAKA SALT LAKE', lat: 36.78, lng: 99.08, type: 'spot', desc: '天空之镜 (3059m)' },
  { name: '德令哈', en: 'DELINGHA', lat: 37.37, lng: 97.37, type: 'city', desc: '金色世界 (2980m)' },
  { name: '大柴旦', en: 'DACHAIDAN', lat: 37.85, lng: 95.36, type: 'city', desc: '柴达木北大门 (3174m)' },
  { name: '水上雅丹', en: 'WATER YADAN', lat: 37.55, lng: 93.65, type: 'spot', desc: '荒原奇迹 (2700m)' },
  { name: '当金山口', en: 'DANGJIN PASS', lat: 39.32, lng: 94.62, type: 'pass', desc: '阿尔金山垭口 (3648m)' },
  { name: '敦煌', en: 'DUNHUANG', lat: 40.14, lng: 94.66, type: 'city', desc: '千年莫高 (1138m)' },
  { name: '瓜州', en: 'GUAZHOU', lat: 40.52, lng: 95.78, type: 'spot', desc: '大地之子 (1180m)' },
  { name: '嘉峪关', en: 'JIAYUGUAN', lat: 39.77, lng: 98.28, type: 'city', desc: '天下第一雄关 (1600m)' },
  { name: '张掖', en: 'ZHANGYE', lat: 38.93, lng: 100.45, type: 'city', desc: '七彩丹霞 (1480m)' },
  { name: '扁都口', en: 'BIANDUKOU', lat: 38.25, lng: 100.95, type: 'pass', desc: '祁连峡谷 (2900m)' },
  { name: '祁连', en: 'QILIAN', lat: 38.17, lng: 100.25, type: 'city', desc: '东方瑞士 (2787m)' },
  { name: '门源', en: 'MENYUAN', lat: 37.38, lng: 101.62, type: 'spot', desc: '油菜花海 (2850m)' },
  { name: '达坂山', en: 'DABANSHAN PASS', lat: 37.15, lng: 101.68, type: 'peak', desc: '最高垭口 (3792m)' },
];

let waypointsSvg = '';
waypoints.forEach(wp => {
  const [x, y] = project(wp.lat, wp.lng);
  const isKey = wp.type === 'start' || wp.type === 'city' || wp.type === 'peak';
  const color = wp.type === 'start' ? '#7ab87a' : wp.type === 'peak' ? '#ff5252' : '#c8963e';
  const r = isKey ? 5 : 3.5;
  
  // label positioning offset to avoid collision
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
      <circle cx="${x}" cy="${y}" r="${r * 2.2}" fill="${color}" opacity="0.2"/>
      <circle cx="${x}" cy="${y}" r="${r}" fill="${color}" stroke="#0e0d0b" stroke-width="1.5"/>
      <text x="${x + dx}" y="${y + dy}" fill="#f0e8d8" font-size="${isKey ? 13 : 11}" font-weight="${isKey ? '600' : '400'}" text-anchor="${textAnchor}" font-family="'PingFang SC', 'Microsoft YaHei', sans-serif">${wp.name}</text>
    </g>
  `;
});

// Full SVG markup
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <!-- Background Gradients -->
    <radialGradient id="bgGlow" cx="50%" cy="45%" r="60%">
      <stop offset="0%" stop-color="#1c1915" />
      <stop offset="60%" stop-color="#0e0d0b" />
      <stop offset="100%" stop-color="#070605" />
    </radialGradient>
    
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f5d485" />
      <stop offset="50%" stop-color="#c8963e" />
      <stop offset="100%" stop-color="#9a6e25" />
    </linearGradient>

    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e1b17" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#141210" stop-opacity="0.9" />
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
    <rect x="0" y="0" width="146" height="24" rx="4" fill="rgba(200, 150, 62, 0.15)" stroke="rgba(200, 150, 62, 0.4)" stroke-width="1" />
    <text x="73" y="16" fill="#c8963e" font-size="11" font-weight="600" text-anchor="middle" class="font-mono" letter-spacing="1.5">CHIGEE GPS TRACK</text>
  </g>

  <text x="${width - 60}" y="84" fill="#8a8075" font-size="12" text-anchor="end" class="font-mono">2026.09.25 - 10.04</text>

  <!-- Main Hero Title -->
  <g transform="translate(60, 140)">
    <text x="0" y="52" fill="#f0e8d8" font-size="52" font-weight="700" class="font-serif" letter-spacing="2">青甘大环线</text>
    <text x="0" y="86" fill="#c8963e" font-size="16" font-style="italic" class="font-serif" letter-spacing="1">Qinghai-Gansu Grand Loop · Motorcycle Tour</text>
    <text x="0" y="114" fill="#a09485" font-size="13" class="font-sans" letter-spacing="0.5">两轮穿越高原盐湖、柴达木荒漠与河西走廊 · 3,000公里闭环实录</text>
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

  <!-- Map Frame Background Card -->
  <rect x="44" y="365" width="${width - 88}" height="950" rx="12" fill="rgba(14, 13, 11, 0.6)" stroke="rgba(200, 150, 62, 0.15)" stroke-width="1" />

  <!-- Compass Rose Watermark -->
  <g transform="translate(130, 450)" opacity="0.35">
    <circle cx="0" cy="0" r="32" fill="none" stroke="#c8963e" stroke-width="0.8" stroke-dasharray="3,3"/>
    <path d="M 0 -36 L 6 -12 L 0 -16 L -6 -12 Z" fill="#c8963e"/>
    <path d="M 0 36 L 6 12 L 0 16 L -6 12 Z" fill="#665335"/>
    <path d="M -36 0 L -12 -6 L -16 0 L -12 6 Z" fill="#665335"/>
    <path d="M 36 0 L 12 -6 L 16 0 L 12 6 Z" fill="#665335"/>
    <text x="0" y="-42" fill="#c8963e" font-size="11" font-weight="700" text-anchor="middle" class="font-mono">N</text>
  </g>

  <!-- Route Polyline (Glow + Line) -->
  <g id="trackGroup">
    <!-- Outer Glow -->
    <path d="${svgPath}" fill="none" stroke="#c8963e" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" opacity="0.18" filter="url(#glow)"/>
    <!-- Middle Bright Stroke -->
    <path d="${svgPath}" fill="none" stroke="#e6b450" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.85" filter="url(#softGlow)"/>
    <!-- Core Bright Line -->
    <path d="${svgPath}" fill="none" stroke="#fff3d1" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.95"/>
  </g>

  <!-- Waypoints & Labels -->
  <g id="waypointsGroup">
    ${waypointsSvg}
  </g>

  <!-- Daily Route Timeline / Itinerary Summary Table -->
  <g transform="translate(44, 1335)">
    <rect width="${width - 88}" height="350" rx="12" fill="url(#cardGrad)" stroke="rgba(255, 255, 255, 0.08)" stroke-width="1" />
    
    <g transform="translate(24, 28)">
      <text x="0" y="0" fill="#c8963e" font-size="13" font-weight="700" class="font-mono" letter-spacing="1">EXPEDITION ITINERARY &amp; DAILY ELEVATION</text>
      
      <!-- Timeline entries (2 columns of 4 days) -->
      <!-- Column 1 (Day 1 - 4) -->
      <g transform="translate(0, 24)">
        <!-- D1 -->
        <g transform="translate(0, 0)">
          <text x="0" y="16" fill="#c8963e" font-size="12" font-weight="700" class="font-mono">D1 09.25</text>
          <text x="68" y="16" fill="#f0e8d8" font-size="13" font-weight="500" class="font-sans">上海 ➔ 西宁</text>
          <text x="320" y="16" fill="#8a8075" font-size="11" class="font-mono" text-anchor="end">提车休整 · 2,288m</text>
          <line x1="0" y1="26" x2="330" y2="26" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
        </g>
        <!-- D2 -->
        <g transform="translate(0, 36)">
          <text x="0" y="16" fill="#c8963e" font-size="12" font-weight="700" class="font-mono">D2 09.26</text>
          <text x="68" y="16" fill="#f0e8d8" font-size="13" font-weight="500" class="font-sans">西宁 ➔ 青海湖 ➔ 共和</text>
          <text x="320" y="16" fill="#8a8075" font-size="11" class="font-mono" text-anchor="end">295 km · 3,200m</text>
          <line x1="0" y1="26" x2="330" y2="26" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
        </g>
        <!-- D3 -->
        <g transform="translate(0, 72)">
          <text x="0" y="16" fill="#c8963e" font-size="12" font-weight="700" class="font-mono">D3 09.27</text>
          <text x="68" y="16" fill="#f0e8d8" font-size="13" font-weight="500" class="font-sans">青海湖 ➔ 茶卡盐湖 ➔ 德令哈</text>
          <text x="320" y="16" fill="#8a8075" font-size="11" class="font-mono" text-anchor="end">281 km · 3,059m</text>
          <line x1="0" y1="26" x2="330" y2="26" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
        </g>
        <!-- D4 -->
        <g transform="translate(0, 108)">
          <text x="0" y="16" fill="#c8963e" font-size="12" font-weight="700" class="font-mono">D4 09.28</text>
          <text x="68" y="16" fill="#f0e8d8" font-size="13" font-weight="500" class="font-sans">德令哈 ➔ 水上雅丹 ➔ 大柴旦</text>
          <text x="320" y="16" fill="#8a8075" font-size="11" class="font-mono" text-anchor="end">255 km · 3,174m</text>
          <line x1="0" y1="26" x2="330" y2="26" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
        </g>
        <!-- D5 -->
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
        <!-- D6 -->
        <g transform="translate(0, 0)">
          <text x="0" y="16" fill="#4a9fa5" font-size="12" font-weight="700" class="font-mono">D6 09.30</text>
          <text x="68" y="16" fill="#f0e8d8" font-size="13" font-weight="500" class="font-sans">敦煌 · 全天休整</text>
          <text x="430" y="16" fill="#8a8075" font-size="11" class="font-mono" text-anchor="end">莫高窟 · 鸣沙山</text>
          <line x1="0" y1="26" x2="440" y2="26" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
        </g>
        <!-- D7 -->
        <g transform="translate(0, 36)">
          <text x="0" y="16" fill="#c8963e" font-size="12" font-weight="700" class="font-mono">D7 10.01</text>
          <text x="68" y="16" fill="#f0e8d8" font-size="13" font-weight="500" class="font-sans">敦煌 ➔ 瓜州 ➔ 嘉峪关</text>
          <text x="430" y="16" fill="#8a8075" font-size="11" class="font-mono" text-anchor="end">396 km · 1,600m</text>
          <line x1="0" y1="26" x2="440" y2="26" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
        </g>
        <!-- D8 -->
        <g transform="translate(0, 72)">
          <text x="0" y="16" fill="#c8963e" font-size="12" font-weight="700" class="font-mono">D8 10.02</text>
          <text x="68" y="16" fill="#f0e8d8" font-size="13" font-weight="500" class="font-sans">嘉峪关 ➔ 张掖七彩丹霞</text>
          <text x="430" y="16" fill="#8a8075" font-size="11" class="font-mono" text-anchor="end">257 km · 1,480m</text>
          <line x1="0" y1="26" x2="440" y2="26" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
        </g>
        <!-- D9 -->
        <g transform="translate(0, 108)">
          <text x="0" y="16" fill="#c8963e" font-size="12" font-weight="700" class="font-mono">D9 10.03</text>
          <text x="68" y="16" fill="#f0e8d8" font-size="13" font-weight="500" class="font-sans">张掖 ➔ 扁都口 ➔ 祁连山</text>
          <text x="430" y="16" fill="#8a8075" font-size="11" class="font-mono" text-anchor="end">246 km · 2,787m</text>
          <line x1="0" y1="26" x2="440" y2="26" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
        </g>
        <!-- D10 -->
        <g transform="translate(0, 144)">
          <text x="0" y="16" fill="#7ab87a" font-size="12" font-weight="700" class="font-mono">D10 10.04</text>
          <text x="68" y="16" fill="#f0e8d8" font-size="13" font-weight="500" class="font-sans">祁连 ➔ 达坂山 ➔ 西宁 (闭环)</text>
          <text x="430" y="16" fill="#7ab87a" font-size="11" font-weight="600" class="font-mono" text-anchor="end">284 km · 3,792m 垭口</text>
          <line x1="0" y1="26" x2="440" y2="26" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
        </g>
      </g>

      <!-- Bottom quote inside card -->
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

      <!-- Right Side Tag -->
      <rect x="${width - 120 - 150}" y="4" width="150" height="26" rx="13" fill="rgba(122, 184, 122, 0.15)" stroke="#7ab87a" stroke-width="0.8"/>
      <circle cx="${width - 120 - 136}" cy="17" r="4" fill="#7ab87a"/>
      <text x="${width - 120 - 124}" y="21" fill="#7ab87a" font-size="11" font-weight="600" class="font-mono">100% LOOP CLOSED</text>
    </g>
  </g>
</svg>`;

const outDir = path.resolve('public');
fs.writeFileSync(path.join(outDir, 'tour-poster.svg'), svg);
console.log('Saved tour-poster.svg successfully!');
