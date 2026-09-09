import { useEffect, useRef, useState } from "react";
import AMapLoader from "@amap/amap-jsapi-loader";

interface MapViewProps {
  track: [number, number][]; // lat, lng
  currentLocation?: [number, number];
  waypoints: { lat: number; lng: number; title: string; subtitle?: string }[];
}

export default function MapContainer({ track, currentLocation, waypoints }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [AMap, setAMap] = useState<any>(null);
  const polylineRef = useRef<any>(null);
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
      plugins: ["AMap.Scale", "AMap.ToolBar"],
    })
      .then((AMapObj) => {
        setAMap(AMapObj);
        const mapInstance = new AMapObj.Map(mapRef.current, {
          zoom: 6,
          center: [100.25, 36.75], // lng, lat (高德坐标系经纬度顺序与Leaflet相反)
          mapStyle: "amap://styles/dark", // 使用暗色主题匹配您的网页 UI
        });
        setMap(mapInstance);
      })
      .catch((e) => {
        console.error("加载高德地图失败:", e);
      });

    return () => {
      // Cleanup
      if (map) {
        map.destroy();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 渲染途经点标记
  useEffect(() => {
    if (!map || !AMap) return;

    // 清除旧的
    waypointMarkersRef.current.forEach(m => map.remove(m));
    waypointMarkersRef.current = [];

    waypoints.forEach(wp => {
      const marker = new AMap.Marker({
        position: new AMap.LngLat(wp.lng, wp.lat), // 注意高德是 [lng, lat]
        title: wp.title,
        label: {
            content: `<div style="font-size: 11px; padding: 2px 4px; background: rgba(0,0,0,0.7); color: #c8963e; border: 1px solid #c8963e; border-radius: 4px; cursor: pointer;">${wp.title}</div>`,
            direction: 'bottom'
        }
      });
      
      // 添加点击事件，跳转到高德地图APP导航
      marker.on('click', () => {
        // 使用高德官方的 URI API，如果手机装了高德会自动唤醒APP导航，没装会打开网页版
        const navUrl = `https://uri.amap.com/navigation?to=${wp.lng},${wp.lat},${wp.title}&mode=car&policy=1&src=QingGanLoop`;
        window.open(navUrl, '_blank');
      });

      map.add(marker);
      waypointMarkersRef.current.push(marker);
    });
  }, [map, AMap, waypoints]);

  // 渲染行驶轨迹
  useEffect(() => {
    if (!map || !AMap) return;

    if (polylineRef.current) {
      map.remove(polylineRef.current);
    }

    if (track.length > 0) {
      // 转换坐标数组从 [lat, lng] 到 [lng, lat]
      const path = track.map(t => new AMap.LngLat(t[1], t[0]));
      const polyline = new AMap.Polyline({
        path,
        strokeColor: "#c8963e",
        strokeWeight: 5,
        strokeOpacity: 0.8,
        lineJoin: 'round',
        lineCap: 'round',
      });
      map.add(polyline);
      polylineRef.current = polyline;
      map.setFitView([polyline]); // 自动缩放视野以包围整条轨迹
    }
  }, [map, AMap, track]);

  // 更新当前位置（小摩托）
  useEffect(() => {
    if (!map || !AMap) return;

    if (!currentMarkerRef.current) {
      const icon = new AMap.Icon({
        size: new AMap.Size(25, 41),
        image: "https://webapi.amap.com/theme/v1.3/markers/n/mark_r.png", // 临时使用高德默认红点代替小摩托
        imageSize: new AMap.Size(19, 31)
      });
      currentMarkerRef.current = new AMap.Marker({
        icon: icon,
        offset: new AMap.Pixel(-9, -31)
      });
      map.add(currentMarkerRef.current);
    }

    if (currentLocation) {
      currentMarkerRef.current.show();
      const newPos = new AMap.LngLat(currentLocation[1], currentLocation[0]);
      currentMarkerRef.current.setPosition(new AMap.LngLat(currentLocation[1], currentLocation[0]));
      
      // 如果处于实时跟踪状态且没有加载静态全量轨迹，自动让地图中心跟随车辆
      if (track.length === 0) {
         map.setCenter(newPos);
         map.setZoom(14); // 聚焦时放大
      }
    } else {
      currentMarkerRef.current.hide();
    }

  }, [map, AMap, currentLocation, track.length]);

  return <div ref={mapRef} style={{ width: "100%", height: "100%" }} />;
}
