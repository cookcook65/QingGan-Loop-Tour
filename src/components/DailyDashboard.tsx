import { useMemo } from "react";
import { Navigation2, Clock, MapPin, Gauge, Mountain } from "lucide-react";

interface DayData {
  day: number;
  date: string;
  route: string;
  km: number;
  highlights: string[];
  hotel: string;
}

interface LocationData {
  lat: number;
  lng: number;
  vel?: number;
  alt?: number;
  tst?: number;
}

interface Props {
  dayData: DayData;
  locationData?: LocationData;
}

export default function DailyDashboard({ dayData, locationData }: Props) {
  const formatTime = (tst?: number) => {
    if (!tst) return "等待数据...";
    return new Date(tst * 1000).toLocaleTimeString('zh-CN', { hour12: false });
  };

  const formattedSpeed = useMemo(() => {
    if (!locationData || locationData.vel === undefined) return "--";
    return Math.round(locationData.vel);
  }, [locationData]);

  const formattedAlt = useMemo(() => {
    if (!locationData || locationData.alt === undefined) return "--";
    return Math.round(locationData.alt);
  }, [locationData]);

  return (
    <div 
      className="absolute top-6 right-6 w-80 rounded-xl overflow-hidden shadow-2xl z-20"
      style={{
        backgroundColor: "rgba(20, 18, 16, 0.85)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255, 255, 255, 0.1)"
      }}
    >
      <div className="bg-[#c8963e] px-4 py-3 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-[#141210] uppercase tracking-wider block mb-0.5">
            当日行程 - Day {dayData.day}
          </span>
          <h2 className="text-[#0e0d0b] font-display font-bold text-lg leading-tight">
            {dayData.route}
          </h2>
        </div>
        <Navigation2 className="text-[#141210] w-6 h-6 opacity-80" />
      </div>

      <div className="p-4 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 bg-[#1c1a17] rounded-lg p-3 border border-[#2a2520]">
            <div className="flex items-center gap-1.5 mb-1 text-[#7a7068]">
              <Gauge className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase font-mono tracking-wider">实时时速</span>
            </div>
            <div className="flex items-end gap-1">
              <span className="text-2xl font-mono font-medium text-[#f0e8d8] leading-none">
                {formattedSpeed}
              </span>
              <span className="text-[10px] text-[#7a7068] mb-0.5">km/h</span>
            </div>
          </div>
          
          <div className="flex-1 bg-[#1c1a17] rounded-lg p-3 border border-[#2a2520]">
            <div className="flex items-center gap-1.5 mb-1 text-[#7a7068]">
              <Mountain className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase font-mono tracking-wider">当前海拔</span>
            </div>
            <div className="flex items-end gap-1">
              <span className="text-2xl font-mono font-medium text-[#f0e8d8] leading-none">
                {formattedAlt}
              </span>
              <span className="text-[10px] text-[#7a7068] mb-0.5">m</span>
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-2 border-t border-[#2a2520]">
          <div className="flex items-start gap-3">
            <Clock className="w-4 h-4 text-[#c8963e] mt-0.5 shrink-0" />
            <div>
              <div className="text-xs text-[#7a7068] mb-0.5">坐标更新时间</div>
              <div className="text-sm text-[#d0c0b0] font-mono">
                {formatTime(locationData?.tst)}
              </div>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-[#4a9fa5] mt-0.5 shrink-0" />
            <div>
              <div className="text-xs text-[#7a7068] mb-0.5">今日目的地住宿</div>
              <div className="text-sm text-[#d0c0b0]">{dayData.hotel}</div>
            </div>
          </div>
        </div>

        {dayData.highlights.length > 0 && (
          <div className="pt-3 border-t border-[#2a2520]">
            <div className="text-xs text-[#7a7068] mb-2">途径高光点</div>
            <ul className="space-y-1.5">
              {dayData.highlights.slice(0, 3).map((h, i) => (
                <li key={i} className="text-[13px] text-[#b0a090] flex gap-2">
                  <span className="text-[#c8963e]">•</span>
                  <span className="line-clamp-1">{h}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
