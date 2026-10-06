import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
        
        // 创建真实卫星图层与标准矢量图层
        const satelliteLayer = new AMapObj.TileLayer.Satellite();
        const roadNetLayer = new AMapObj.TileLayer.RoadNet();
        
        const mapInstance = new AMapObj.Map(mapRef.current, {
          zoom: 6,
          center: [100.25, 36.75], // lng, lat
          layers: [satelliteLayer, roadNetLayer], // 默认启用真实卫星航拍底图 + 路网
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
          <div class="city-badge" style="background: rgba(14, 20, 24, 0.88); backdrop-filter: blur(10px); border: 1.5px solid #38bdf8; border-radius: 8px; padding: 6px 12px; color: #f0e8d8; box-shadow: 0 4px 16px rgba(0,0,0,0.6), 0 0 10px rgba(56, 189, 248, 0.25); min-width: 80px; display: flex; flex-direction: column; align-items: center; transition: all 0.2s;">
            <div style="font-size: 14px; font-weight: bold; color: #38bdf8; display: flex; align-items: center; gap: 4px;">
              <span>${wp.title}</span>
              <span class="weather-toggle-icon" style="font-size: 10px; color: #38bdf8; opacity: 0.8;">⛅</span>
            </div>
            ${wp.subtitle ? `<div style="font-size: 10px; color: #94a3b8; margin-top: 1px;">${wp.subtitle}</div>` : ''}
            
            <!-- 天气折叠容器：默认隐藏，点击城市标签展开/收起 -->
            <div class="weather-container" style="display: none; font-size: 10px; color: #7dd3fc; margin-top: 6px; padding-top: 5px; border-top: 1px dashed rgba(56,189,248,0.3); width: 100%; text-align: center; line-height: 1.4;">
              <span class="weather-loading" style="color: #94a3b8;">获取天气中...</span>
            </div>
          </div>
          <div style="width: 2px; height: 14px; background: #38bdf8; margin: 0 auto; box-shadow: 0 0 6px #38bdf8;"></div>
          <div style="width: 8px; height: 8px; background: #38bdf8; border-radius: 50%; border: 2px solid #0e1418; margin: 0 auto; box-shadow: 0 0 8px #38bdf8;"></div>
        `;

        // 绑定点击事件：点击展开/收起近3日天气
        let weatherLoaded = false;
        contentDiv.addEventListener('click', (e) => {
          e.stopPropagation();
          const weatherContainer = contentDiv.querySelector('.weather-container') as HTMLElement;
          if (!weatherContainer) return;

          const isVisible = weatherContainer.style.display === 'block';
          if (isVisible) {
            weatherContainer.style.display = 'none';
          } else {
            weatherContainer.style.display = 'block';
            if (!weatherLoaded) {
              weather.getForecast(wp.title, (err: any, data: any) => {
                if (!err && data && data.forecasts && data.forecasts.length > 0) {
                  const forecasts = data.forecasts.slice(0, 3);
                  const weatherHtml = forecasts.map((f: any) => 
                    `<div style="margin: 2px 0;">${f.date.slice(5)}: ${f.dayWeather} ${f.nightTemp}°~${f.dayTemp}°</div>`
                  ).join('');
                  weatherContainer.innerHTML = weatherHtml;
                  weatherLoaded = true;
                } else {
                  weatherContainer.innerHTML = '<span>暂无天气数据</span>';
                }
              });
            }
          }
        });
      } else {
        // 景点样式
        contentDiv.className = 'custom-spot-marker';
        contentDiv.innerHTML = `
          <div style="display: flex; align-items: center; gap: 6px; background: rgba(10,18,24,0.75); padding: 3px 8px; border-radius: 12px; border: 1px solid rgba(56,189,248,0.3); backdrop-filter: blur(4px);">
            <div style="width: 6px; height: 6px; background: #38bdf8; border-radius: 50%; box-shadow: 0 0 8px #38bdf8;"></div>
            <div style="font-size: 11px; color: #e0f2fe;">${wp.title}</div>
          </div>
        `;

        contentDiv.addEventListener('click', (e) => {
          e.stopPropagation();
          const navUrl = `https://uri.amap.com/navigation?to=${wp.lng},${wp.lat},${wp.title}&mode=car&policy=1&src=QingGanLoop`;
          window.open(navUrl, '_blank');
        });
      }

      const marker = new AMap.Marker({
        position: new AMap.LngLat(wp.lng, wp.lat),
        content: contentDiv,
        offset: isCity ? new AMap.Pixel(-45, -55) : new AMap.Pixel(-10, -10),
        zIndex: isCity ? 100 : 50,
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
      plannedPath.push(plannedPath[0]);

      plannedRouteRef.current = new AMap.Polyline({
        path: plannedPath,
        strokeColor: "#0284c7",
        strokeWeight: 2,
        strokeOpacity: track.length > 0 ? 0.25 : 0.6,
        strokeStyle: "dashed",
        strokeDasharray: [8, 8],
        lineJoin: 'round',
      });
      map.add(plannedRouteRef.current);
    }

    // 绘制实际轨迹 (亮眼湖蓝色高亮轨迹)
    if (track.length > 0) {
      const path = track.map(t => new AMap.LngLat(t[1], t[0]));
      polylineRef.current = new AMap.Polyline({
        path,
        strokeColor: "#00d2ff", // 亮眼湖蓝色 (Cyan / Lake Blue)
        strokeWeight: 4.5,
        strokeOpacity: 0.95,
        lineJoin: 'round',
        lineCap: 'round',
        zIndex: 50,
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

  // 存储相册组及当前查看的索引
  const [albumData, setAlbumData] = useState<{ photos: any[], currentIndex: number } | null>(null);

  // 获取并渲染照片图集
  useEffect(() => {
    fetch('https://mqtt.nestormao.com/api/photos')
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data) || !map || !AMap) return;
        
        // 按照经纬度（近似 500米范围）将照片聚合成组
        const groups: { lat: number; lng: number; photos: any[] }[] = [];
        data.forEach((photo: any) => {
          let added = false;
          for (let g of groups) {
            // 0.005 度大约相当于 500 米
            if (Math.abs(g.lat - photo.lat) < 0.005 && Math.abs(g.lng - photo.lng) < 0.005) {
              g.photos.push(photo);
              added = true;
              break;
            }
          }
          if (!added) {
            groups.push({ lat: photo.lat, lng: photo.lng, photos: [photo] });
          }
        });

        groups.forEach((group: any) => {
          const contentDiv = document.createElement('div');
          contentDiv.className = 'custom-photo-marker';
          
          const coverPhoto = group.photos[0];
          const isVideo = coverPhoto.url.match(/\.(mp4|mov|webm|qt)$/i);
          const thumbUrl = isVideo 
            ? `${coverPhoto.url}?x-oss-process=video/snapshot,t_0,f_jpg,w_100,h_100` 
            : `${coverPhoto.url}?x-oss-process=image/resize,m_fill,w_100,h_100/format,jpg`;

          // 如果该坐标有多张照片，显示右上角的角标
          const badgeHtml = group.photos.length > 1 
            ? `<div style="position: absolute; top: -8px; right: -8px; background: #e74c3c; color: white; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.3); z-index: 10;">${group.photos.length}</div>` 
            : '';

          contentDiv.innerHTML = `
            <div style="background: #fff; padding: 3px; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); cursor: pointer; transition: transform 0.2s; position: relative;">
              ${badgeHtml}
              <div style="width: 48px; height: 48px; background-image: url('${thumbUrl}'); background-size: cover; background-position: center; border-radius: 2px;"></div>
              ${isVideo ? '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 20px; height: 20px; background: rgba(0,0,0,0.5); border-radius: 50%; display: flex; align-items: center; justify-content: center;"><div style="width: 0; height: 0; border-top: 5px solid transparent; border-bottom: 5px solid transparent; border-left: 8px solid white; margin-left: 2px;"></div></div>' : ''}
            </div>
            <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid #fff; margin: 0 auto;"></div>
          `;
          
          contentDiv.onmouseenter = () => contentDiv.style.transform = 'scale(1.1)';
          contentDiv.onmouseleave = () => contentDiv.style.transform = 'scale(1)';

          const marker = new AMap.Marker({
            position: new AMap.LngLat(group.lng, group.lat),
            content: contentDiv,
            offset: new AMap.Pixel(-27, -60),
            zIndex: 80,
          });

          marker.on('click', () => {
             setAlbumData({ photos: group.photos, currentIndex: 0 });
          });

          map.add(marker);
        });
      })
      .catch(err => console.error("获取图集失败:", err));
  }, [map, AMap]);

  const [mapMode, setMapMode] = useState<"satellite" | "standard">("satellite");
  const satelliteLayersRef = useRef<any[]>([]);

  // 切换卫星底图 / 暗色矢量底图
  const toggleMapMode = () => {
    if (!map || !AMap) return;
    const nextMode = mapMode === "satellite" ? "standard" : "satellite";
    setMapMode(nextMode);

    if (nextMode === "satellite") {
      map.setMapStyle("amap://styles/normal");
      if (satelliteLayersRef.current.length === 0) {
        satelliteLayersRef.current = [new AMap.TileLayer.Satellite(), new AMap.TileLayer.RoadNet()];
      }
      map.setLayers(satelliteLayersRef.current);
    } else {
      map.setLayers([AMap.createDefaultLayer()]);
      map.setMapStyle("amap://styles/dark");
    }
  };

  return (
    <>
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
      
      {/* 卫星图 / 矢量图 切换按钮 */}
      <button
        onClick={toggleMapMode}
        style={{
          position: "absolute",
          top: "16px",
          right: "16px",
          zIndex: 100,
          background: "rgba(20, 18, 16, 0.85)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(200, 150, 62, 0.4)",
          color: "#f0e8d8",
          padding: "6px 12px",
          borderRadius: "8px",
          fontSize: "12px",
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
        }}
      >
        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: mapMode === "satellite" ? "#7ab87a" : "#c8963e" }}></span>
        <span>{mapMode === "satellite" ? "🛰️ 真实卫星航拍" : "🗺️ 暗黑科技地图"}</span>
      </button>
      
      {/* 相册弹窗模块 (支持多图切换和防下载) */}
      {albumData && createPortal(
        <div 
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.9)', zIndex: 9999,
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)'
          }}
          onClick={() => setAlbumData(null)}
        >
          {/* 左切换按钮 */}
          {albumData.currentIndex > 0 && (
            <button 
              onClick={(e) => { e.stopPropagation(); setAlbumData({ ...albumData, currentIndex: albumData.currentIndex - 1 }); }}
              style={{ position: 'absolute', left: '20px', color: 'white', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '50px', height: '50px', fontSize: '24px', cursor: 'pointer', zIndex: 10001, backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
            >
              &#10094;
            </button>
          )}

          {/* 阻止右键菜单 */}
          <div 
            style={{ position: 'relative', maxWidth: '85%', maxHeight: '90%' }} 
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
          >
            {/* 关闭按钮 */}
            <button 
              onClick={() => setAlbumData(null)}
              style={{
                position: 'absolute', top: '-40px', right: 0, color: 'white',
                background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer'
              }}
            >
              &times;
            </button>
            
            {(() => {
              const currentPhoto = albumData.photos[albumData.currentIndex];
              const isVideo = currentPhoto.url.match(/\.(mp4|mov|webm|qt)$/i);
              
              if (isVideo) {
                return (
                  <video 
                    src={currentPhoto.url} 
                    controls 
                    autoPlay 
                    controlsList="nodownload" 
                    disablePictureInPicture
                    style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '8px', pointerEvents: 'auto' }}
                  />
                );
              } else {
                return (
                  <div style={{ position: 'relative' }}>
                    <img 
                      src={`${currentPhoto.url}?x-oss-process=image/resize,w_1920/quality,q_85/format,jpg`} 
                      alt="Trip Memory" 
                      style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '8px', userSelect: 'none', pointerEvents: 'none' }}
                      draggable="false"
                    />
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10 }}></div>
                  </div>
                );
              }
            })()}
            
            <div style={{ color: '#aaa', textAlign: 'center', marginTop: '12px', fontSize: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>拍摄于大环线 · {new Date(albumData.photos[albumData.currentIndex].timestamp).toLocaleString()}</span>
              {albumData.photos.length > 1 && (
                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '12px', color: '#fff' }}>
                  {albumData.currentIndex + 1} / {albumData.photos.length}
                </span>
              )}
            </div>
          </div>

          {/* 右切换按钮 */}
          {albumData.currentIndex < albumData.photos.length - 1 && (
            <button 
              onClick={(e) => { e.stopPropagation(); setAlbumData({ ...albumData, currentIndex: albumData.currentIndex + 1 }); }}
              style={{ position: 'absolute', right: '20px', color: 'white', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '50px', height: '50px', fontSize: '24px', cursor: 'pointer', zIndex: 10001, backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
            >
              &#10095;
            </button>
          )}
        </div>,
        document.body
      )}
    </>
  );
}
