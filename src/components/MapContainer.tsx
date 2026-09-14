import { useEffect, useRef, useState } from "react";
import AMapLoader from "@amap/amap-jsapi-loader";

interface MapViewProps {
  track: [number, number][]; // lat, lng
  currentLocation?: [number, number];
  waypoints: { lat: number; lng: number; title: string; subtitle?: string; type?: string }[];
}

export default function MapContainer({ track, currentLocation, waypoints }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [AMap, setAMap] = useState<any>(null);
  const polylineRef = useRef<any>(null);
  const plannedRouteRef = useRef<any>(null);
  const currentMarkerRef = useRef<any>(null);
  const waypointMarkersRef = useRef<any[]>([]);

  // 高德地图 2.0+ 要求的安全密钥
  window._AMapSecurityConfig = {
    securityJsCode: "b3cd9d1ddf0acb2a6513c8e029d57fd4",
  };

  useEffect(() => {
    AMapLoader.load({
      key: "163653640938c7580095eb67693390d5", // 您的专属 Web端 API Key
      version: "2.0",
      plugins: ["AMap.Scale", "AMap.ToolBar", "AMap.Weather"],
    })
      .then((AMapObj) => {
        setAMap(AMapObj);
        const mapInstance = new AMapObj.Map(mapRef.current, {
          zoom: 6,
          center: [100.25, 36.75], // lng, lat
          mapStyle: "amap://styles/dark",
        });
        setMap(mapInstance);
      })
      .catch((e) => {
        console.error("加载高德地图失败:", e);
      });

    return () => {
      if (map) map.destroy();
    };
  }, []);

  // 渲染途经点标记与天气
  useEffect(() => {
    if (!map || !AMap) return;

    // 清除旧的
    waypointMarkersRef.current.forEach(m => map.remove(m));
    waypointMarkersRef.current = [];

    const weather = new AMap.Weather();

    waypoints.forEach(wp => {
      const isCity = wp.type === 'city';
      
      // 创建自定义DOM节点作为Marker内容
      const contentDiv = document.createElement('div');
      contentDiv.style.cursor = 'pointer';
      
      if (isCity) {
        contentDiv.className = 'custom-city-marker';
        contentDiv.innerHTML = `
          <div style="background: rgba(20, 18, 16, 0.85); backdrop-filter: blur(8px); border: 1px solid rgba(200,150,62,0.5); border-radius: 8px; padding: 6px 10px; color: #f0e8d8; box-shadow: 0 4px 12px rgba(0,0,0,0.5); min-width: 80px; display: flex; flex-direction: column; align-items: center;">
            <div style="font-size: 14px; font-weight: bold; color: #c8963e;">${wp.title}</div>
            ${wp.subtitle ? `<div style="font-size: 10px; color: #9a8f82; margin-top: 2px;">${wp.subtitle}</div>` : ''}
            <div class="weather-container" style="font-size: 10px; color: #7ab87a; margin-top: 4px; display: none;"></div>
          </div>
          <div style="width: 2px; height: 16px; background: #c8963e; margin: 0 auto;"></div>
          <div style="width: 8px; height: 8px; background: #c8963e; border-radius: 50%; border: 2px solid #141210; margin: 0 auto;"></div>
        `;

        // 异步获取天气
        weather.getForecast(wp.title, (err: any, data: any) => {
          if (!err && data && data.forecasts && data.forecasts.length > 0) {
            const forecasts = data.forecasts.slice(0, 3);
            let weatherHtml = forecasts.map((f: any) => 
              `<div>${f.date.slice(5)}: ${f.dayWeather} ${f.nightTemp}°~${f.dayTemp}°</div>`
            ).join('');
            
            const weatherContainer = contentDiv.querySelector('.weather-container') as HTMLElement;
            if (weatherContainer) {
              weatherContainer.innerHTML = weatherHtml;
              weatherContainer.style.display = 'block';
            }
          }
        });
      } else {
        // 景点样式
        contentDiv.className = 'custom-spot-marker';
        contentDiv.innerHTML = `
          <div style="display: flex; align-items: center; gap: 6px; background: rgba(0,0,0,0.6); padding: 2px 6px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.15);">
            <div style="width: 6px; height: 6px; background: #4a9fa5; border-radius: 50%; box-shadow: 0 0 6px #4a9fa5;"></div>
            <div style="font-size: 11px; color: #d0c0b0;">${wp.title}</div>
          </div>
        `;
      }

      const marker = new AMap.Marker({
        position: new AMap.LngLat(wp.lng, wp.lat),
        content: contentDiv,
        offset: isCity ? new AMap.Pixel(-40, -50) : new AMap.Pixel(-10, -10),
        zIndex: isCity ? 100 : 50, // 城市层级更高
      });
      
      marker.on('click', () => {
        const navUrl = `https://uri.amap.com/navigation?to=${wp.lng},${wp.lat},${wp.title}&mode=car&policy=1&src=QingGanLoop`;
        window.open(navUrl, '_blank');
      });

      map.add(marker);
      waypointMarkersRef.current.push(marker);
    });
  }, [map, AMap, waypoints]);

  // 渲染计划路线和实际轨迹
  useEffect(() => {
    if (!map || !AMap) return;

    if (polylineRef.current) map.remove(polylineRef.current);
    if (plannedRouteRef.current) map.remove(plannedRouteRef.current);

    // 绘制计划路线 (基于 waypoints)
    if (waypoints.length > 0) {
      const plannedPath = waypoints.map(wp => new AMap.LngLat(wp.lng, wp.lat));
      // 闭环：终点回到起点
      plannedPath.push(plannedPath[0]);

      plannedRouteRef.current = new AMap.Polyline({
        path: plannedPath,
        strokeColor: "#4a9fa5",
        strokeWeight: 3,
        strokeOpacity: 0.6,
        strokeStyle: "dashed",
        strokeDasharray: [10, 10],
        lineJoin: 'round',
      });
      map.add(plannedRouteRef.current);
    }

    // 绘制实际轨迹 (基于上传的 GPX)
    if (track.length > 0) {
      const path = track.map(t => new AMap.LngLat(t[1], t[0]));
      polylineRef.current = new AMap.Polyline({
        path,
        strokeColor: "#c8963e",
        strokeWeight: 5,
        strokeOpacity: 0.8,
        lineJoin: 'round',
        lineCap: 'round',
        zIndex: 50, // 确保在计划路线之上
      });
      map.add(polylineRef.current);
      map.setFitView([polylineRef.current]);
    } else if (plannedRouteRef.current) {
      // 如果没有实际轨迹，则缩放视野以包围计划路线
      map.setFitView([plannedRouteRef.current]);
    }
  }, [map, AMap, track, waypoints]);

  // 更新当前位置（小摩托）
  useEffect(() => {
    if (!map || !AMap) return;

    if (!currentMarkerRef.current) {
      const icon = new AMap.Icon({
        size: new AMap.Size(25, 41),
        image: "https://webapi.amap.com/theme/v1.3/markers/n/mark_r.png",
        imageSize: new AMap.Size(19, 31)
      });
      currentMarkerRef.current = new AMap.Marker({
        icon: icon,
        offset: new AMap.Pixel(-9, -31),
        zIndex: 200,
      });
      map.add(currentMarkerRef.current);
    }

    if (currentLocation) {
      currentMarkerRef.current.show();
      const newPos = new AMap.LngLat(currentLocation[1], currentLocation[0]);
      currentMarkerRef.current.setPosition(newPos);
      
      if (track.length === 0) {
         map.setCenter(newPos);
         map.setZoom(14);
      }
    } else {
      currentMarkerRef.current.hide();
    }

  }, [map, AMap, currentLocation, track.length]);

  return <div ref={mapRef} style={{ width: "100%", height: "100%" }} />;
}
