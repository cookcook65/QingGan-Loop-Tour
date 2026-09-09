import { useState, useRef } from "react";
import { Upload, File } from "lucide-react";
import { gpx } from "@tmcw/togeojson";

interface UploaderProps {
  onDataParsed: (track: [number, number][]) => void;
}

export default function Uploader({ onDataParsed }: UploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) {
          try {
            // Parse GPX
            const dom = new DOMParser().parseFromString(text, "text/xml");
            const geojson = gpx(dom);
            
            // Extract coordinates
            let coordinates: [number, number][] = [];
            
            // togeojson usually outputs a FeatureCollection where tracks are LineString or MultiLineString
            geojson.features.forEach((feature: any) => {
              if (feature.geometry.type === "LineString") {
                // GeoJSON uses [lng, lat], Leaflet uses [lat, lng]
                coordinates = feature.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]);
              } else if (feature.geometry.type === "MultiLineString") {
                // Flatten
                const flatCoords = feature.geometry.coordinates.flat(1);
                coordinates = flatCoords.map((coord: number[]) => [coord[1], coord[0]]);
              }
            });
            
            if (coordinates.length > 0) {
              onDataParsed(coordinates);
            } else {
              alert("未能在文件中找到有效的轨迹数据。请确保上传的是标准 GPX 文件。");
            }
          } catch (err) {
            console.error("解析文件失败:", err);
            alert("解析失败，可能不是合法的 GPX 格式。");
          }
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div 
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
        isDragging ? "border-[#c8963e] bg-[#c8963e11]" : "border-[#3a3530] hover:border-[#5a5048]"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
      }}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".gpx"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <Upload className="mx-auto h-8 w-8 text-[#c8963e] mb-3 opacity-80" />
      <p className="text-sm" style={{ color: "#b8a880" }}>
        {fileName ? `已选择: ${fileName}` : "点击或拖拽上传 Chigee 导出的 GPX 轨迹文件"}
      </p>
    </div>
  );
}
