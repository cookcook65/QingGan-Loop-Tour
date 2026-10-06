import fs from 'fs';
import path from 'path';

const gpxDir = 'F:\\QingGanLoop\\GPX';
const files = fs.readdirSync(gpxDir).filter(f => f.endsWith('.gpx')).sort();

console.log('Found GPX files:', files);

function getSqDist(p1, p2) {
  const dx = p1[0] - p2[0];
  const dy = p1[1] - p2[1];
  return dx * dx + dy * dy;
}

function getSqSegDist(p, p1, p2) {
  let x = p1[0], y = p1[1];
  let dx = p2[0] - x, dy = p2[1] - y;

  if (dx !== 0 || dy !== 0) {
    const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) {
      x = p2[0];
      y = p2[1];
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }

  dx = p[0] - x;
  dy = p[1] - y;
  return dx * dx + dy * dy;
}

function simplifyRadialDist(points, sqTolerance) {
  let prevPoint = points[0];
  const newPoints = [prevPoint];
  let point;

  for (let i = 1, len = points.length; i < len; i++) {
    point = points[i];
    if (getSqDist(point, prevPoint) > sqTolerance) {
      newPoints.push(point);
      prevPoint = point;
    }
  }

  if (prevPoint !== point && point) {
    newPoints.push(point);
  }

  return newPoints;
}

function simplifyDPStep(points, first, last, sqTolerance, simplified) {
  let maxSqDist = sqTolerance;
  let index = -1;

  for (let i = first + 1; i < last; i++) {
    const sqDist = getSqSegDist(points[i], points[first], points[last]);
    if (sqDist > maxSqDist) {
      index = i;
      maxSqDist = sqDist;
    }
  }

  if (maxSqDist > sqTolerance) {
    if (index - first > 1) simplifyDPStep(points, first, index, sqTolerance, simplified);
    simplified.push(points[index]);
    if (last - index > 1) simplifyDPStep(points, index, last, sqTolerance, simplified);
  }
}

function simplifyDouglasPeucker(points, sqTolerance) {
  if (points.length <= 2) return points;
  const last = points.length - 1;
  const simplified = [points[0]];
  simplifyDPStep(points, 0, last, sqTolerance, simplified);
  simplified.push(points[last]);
  return simplified;
}

function simplify(points, tolerance = 0.00003) {
  if (points.length <= 2) return points;
  const sqTolerance = tolerance * tolerance;
  const pointsRadial = simplifyRadialDist(points, sqTolerance);
  return simplifyDouglasPeucker(pointsRadial, sqTolerance);
}

// WGS-84 to GCJ-02 (China Mars coordinates) transformation for AMap
const a = 6378245.0;
const ee = 0.00669342162296594323;

function transformLat(x, y) {
  let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
  ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0;
  ret += (20.0 * Math.sin(y * Math.PI) + 40.0 * Math.sin(y / 3.0 * Math.PI)) * 2.0 / 3.0;
  ret += (160.0 * Math.sin(y / 12.0 * Math.PI) + 320 * Math.sin(y * Math.PI / 30.0)) * 2.0 / 3.0;
  return ret;
}

function transformLon(x, y) {
  let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0;
  ret += (20.0 * Math.sin(x * Math.PI) + 40.0 * Math.sin(x / 3.0 * Math.PI)) * 2.0 / 3.0;
  ret += (150.0 * Math.sin(x / 12.0 * Math.PI) + 300.0 * Math.sin(x / 30.0 * Math.PI)) * 2.0 / 3.0;
  return ret;
}

function wgs84ToGcj02(lat, lon) {
  let dLat = transformLat(lon - 105.0, lat - 35.0);
  let dLon = transformLon(lon - 105.0, lat - 35.0);
  const radLat = (lat / 180.0) * Math.PI;
  let magic = Math.sin(radLat);
  magic = 1 - ee * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180.0) / (((a * (1 - ee)) / (magic * sqrtMagic)) * Math.PI);
  dLon = (dLon * 180.0) / ((a / sqrtMagic) * Math.cos(radLat) * Math.PI);
  return [lat + dLat, lon + dLon];
}

const allTracks = {};
let totalRawPoints = 0;
let totalSimplifiedPoints = 0;
const combinedTrack = [];

for (const file of files) {
  const content = fs.readFileSync(path.join(gpxDir, file), 'utf-8');
  const dateMatch = file.match(/\d{4}-\d{2}-\d{2}/);
  const dateStr = dateMatch ? dateMatch[0] : file;

  const regex = /<trkpt\s+lat="([\d.-]+)"\s+lon="([\d.-]+)"/g;
  let match;
  const points = [];
  while ((match = regex.exec(content)) !== null) {
    const rawLat = parseFloat(match[1]);
    const rawLon = parseFloat(match[2]);
    const [gcjLat, gcjLon] = wgs84ToGcj02(rawLat, rawLon);
    points.push([Math.round(gcjLat * 100000) / 100000, Math.round(gcjLon * 100000) / 100000]);
  }

  console.log(`${file} (${dateStr}): ${points.length} raw points`);
  totalRawPoints += points.length;

  const simplified = simplify(points, 0.00003);
  console.log(`  -> simplified to ${simplified.length} points`);
  totalSimplifiedPoints += simplified.length;

  allTracks[dateStr] = simplified;
  combinedTrack.push(...simplified);
}

console.log(`Total raw points: ${totalRawPoints}, Total simplified: ${totalSimplifiedPoints}`);

const output = {
  combined: combinedTrack,
  daily: allTracks
};

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const outputPath = path.join(publicDir, 'tracks.json');
fs.writeFileSync(outputPath, JSON.stringify(output));
const stats = fs.statSync(outputPath);
console.log(`Written to ${outputPath}: ${(stats.size / 1024).toFixed(1)} KB`);
