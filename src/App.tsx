import { useState, useEffect } from "react";

type DayTag = "landmark" | "rest" | "finish" | "transit";

interface DayData {
  day: number;
  date: string;
  dateEn: string;
  route: string;
  routeEn: string;
  subtitle?: string;
  km: number;
  kmApprox?: boolean;
  kmNote?: string;
  time?: string;
  highlights: string[];
  hotel: string;
  hotelStrategy: string;
  hotelLat?: number;
  hotelLng?: number;
  tag: DayTag;
  photo?: string;
  photoAlt?: string;
}

const TAG_COLOR: Record<DayTag, string> = {
  landmark: "#c8963e",
  rest: "#4a9fa5",
  finish: "#7ab87a",
  transit: "#2a2520",
};

const TAG_LABEL: Record<DayTag, string> = {
  landmark: "LANDMARK",
  rest: "REST DAY",
  finish: "LOOP CLOSED",
  transit: "",
};

const DAYS: DayData[] = [
  {
    day: 1,
    date: "9月25日",
    dateEn: "Sep 25",
    route: "上海 → 西宁",
    routeEn: "Shanghai  →  Xining",
    subtitle: "接车日 · Pickup Day",
    km: 0,
    time: "16:00 提车",
    highlights: [
      "抵达物流园提车，核对交车视频",
      "重点检查减震是否漏油、风挡及漆水是否破损",
      "试车、就近加满第一箱油",
    ],
    hotel: "西宁海湖新区国投广场亚朵 S酒店",
    hotelStrategy: "距离交车点较近，亚朵的停车条件和设施保障对于长途出发前的休整非常理想。",
    hotelLat: 36.638,
    hotelLng: 101.724,
    tag: "transit",
  },
  {
    day: 2,
    date: "9月26日",
    dateEn: "Sep 26",
    route: "西宁 → 青海湖 → 共和",
    routeEn: "Xining  →  Qinghai Lake  →  Gonghe",
    km: 220,
    time: "18:30 青海湖南岸",
    highlights: [
      "翻越日月山口，正式进入高原地带",
      "绕湖西行，感受 4,000m 湖光山色",
      "抵达湖景酒店观赏青海湖绝美日落",
    ],
    hotel: "晟世璞臻大酒店（豪华湖景大床房）",
    hotelStrategy: "豪华湖景大床房，直面青海湖，风景绝佳，且停车安全。",
    hotelLat: 36.275,
    hotelLng: 100.624,
    tag: "landmark",
    photo: "https://images.unsplash.com/photo-1775391715242-ade010710509?w=1200&h=420&fit=crop&auto=format",
    photoAlt: "Calm blue Qinghai Lake with rolling green hills under a cloudy sky",
  },
  {
    day: 3,
    date: "9月27日",
    dateEn: "Sep 27",
    route: "青海湖 → 茶卡盐湖 → 德令哈",
    routeEn: "Qinghai Lake  →  Chaka Salt Lake  →  Delingha",
    km: 300,
    time: "17:00 抵达德令哈",
    highlights: [
      "茶卡盐湖——天空之镜，地面映天",
      "穿越乌兰县，向柴达木盆地深处推进",
      "德令哈市区重要物资补给",
    ],
    hotel: "桔子酒店（德令哈市政府店）",
    hotelStrategy: "位于德令哈核心区，连锁酒店管理规范，停车方便，适合做长途穿越前的大补给休整。",
    hotelLat: 37.373,
    hotelLng: 97.365,
    tag: "landmark",
  },
  {
    day: 4,
    date: "9月28日",
    dateEn: "Sep 28",
    route: "德令哈 → 水上雅丹 → 大柴旦",
    routeEn: "Delingha  →  Shui Shang Yadan  →  Dachaidan",
    km: 450,
    kmNote: "全程最长",
    time: "19:00 抵达大柴旦",
    highlights: [
      "U型公路——堪称世界级公路景观",
      "水上雅丹地质奇观，鬼斧神工",
      "穿越柴达木无人区，壮阔戈壁无尽头",
    ],
    hotel: "桔子富氧酒店（大柴旦翡翠步行街店）",
    hotelStrategy: "大柴旦旺季住宿紧张，桔子富氧酒店提供弥散式供氧（高海拔地区神器），而且位于翡翠步行街，吃饭极为方便。",
    hotelLat: 37.852,
    hotelLng: 95.364,
    tag: "landmark",
  },
  {
    day: 5,
    date: "9月29日",
    dateEn: "Sep 29",
    route: "大柴旦 → 翡翠湖 → 敦煌",
    routeEn: "Dachaidan  →  Emerald Lake  →  Dunhuang",
    km: 350,
    time: "17:30 抵达敦煌",
    highlights: [
      "翡翠湖——盐碱荒漠上的碧玉奇景",
      "翻越当金山口（海拔 3,700m），俯瞰戈壁",
      "进入河西走廊，千年古道抵达敦煌",
    ],
    hotel: "敦煌沙州夜市北门亚朵酒店",
    hotelStrategy: "位置极佳，就在沙州夜市北门，晚上走路即可去夜市吃烤肉喝酒，无需挪动重机车。",
    hotelLat: 40.145,
    hotelLng: 94.662,
    tag: "landmark",
    photo: "https://images.unsplash.com/photo-1641959166337-5da726834b1e?w=1200&h=420&fit=crop&auto=format",
    photoAlt: "The sun setting over golden sand dunes near Dunhuang",
  },
  {
    day: 6,
    date: "9月30日",
    dateEn: "Sep 30",
    route: "敦煌 · 全天休整",
    routeEn: "Dunhuang  —  Full Rest Day",
    km: 0,
    highlights: [
      "莫高窟——千年壁画，飞天盛景",
      "鸣沙山月牙泉，骑骆驼看沙丘",
      "连住两晚，省去每天收拾边包的苦楚",
    ],
    hotel: "敦煌沙州夜市北门亚朵酒店（连住两晚）",
    hotelStrategy: "连住可省去每天重新收拾边包的繁琐，把精力全部留给景点游览。",
    hotelLat: 40.145,
    hotelLng: 94.662,
    tag: "rest",
  },
  {
    day: 7,
    date: "10月1日",
    dateEn: "Oct 1",
    route: "敦煌 → 瓜州 → 嘉峪关",
    routeEn: "Dunhuang  →  Guazhou  →  Jiayuguan",
    km: 380,
    time: "17:00 关城拍日落",
    highlights: [
      "穿越国庆黄金周逆向车流，错峰制胜",
      "抵达天下第一雄关——嘉峪关关城",
      "万里长城西端起点，夕阳染红边墙",
    ],
    hotel: "全季酒店（嘉峪关大唐美食街市政府店）",
    hotelStrategy: "连锁商务酒店，地下车库完善，紧邻大唐美食街，国庆期间路况复杂时可以步行觅食。",
    hotelLat: 39.773,
    hotelLng: 98.285,
    tag: "landmark",
  },
  {
    day: 8,
    date: "10月2日",
    dateEn: "Oct 2",
    route: "嘉峪关 → 张掖七彩丹霞",
    routeEn: "Jiayuguan  →  Zhangye Danxia",
    km: 230,
    time: "15:30 进入景区",
    highlights: [
      "七彩丹霞——地球的调色板",
      "午后光线最佳，色彩饱和度极高",
      "多处观景台逐一打卡，拍摄黄金时段",
    ],
    hotel: "张掖西站爱琴海购物中心亚朵酒店",
    hotelStrategy: "市区高标准连锁酒店，距离张掖西站较近，商圈配套成熟。",
    hotelLat: 38.932,
    hotelLng: 100.415,
    tag: "landmark",
    photo: "https://images.unsplash.com/photo-1785122713227-a1617ef1f43e?w=1200&h=420&fit=crop&auto=format",
    photoAlt: "Colorful striped red and orange mountains of Zhangye Danxia National Geopark",
  },
  {
    day: 9,
    date: "10月3日",
    dateEn: "Oct 3",
    route: "张掖 → 扁都口 → 祁连山 → 祁连",
    routeEn: "Zhangye  →  Biandukou  →  Qilian Shan  →  Qilian",
    km: 200,
    time: "16:00 游览卓尔山",
    highlights: [
      "扁都口峡谷穿越，山势险峻雄奇",
      "祁连山国家公园草甸，群马牧歌",
      "卓尔山景区，俯瞰祁连全景，雪山环抱",
    ],
    hotel: "祁连宾馆",
    hotelStrategy: "祁连县城的经典老牌宾馆，拥有内部大院停车场，是当地接待规格极高的住宿点。",
    hotelLat: 38.175,
    hotelLng: 100.248,
    tag: "landmark",
    photo: "https://images.unsplash.com/photo-1780928108815-d53daefefa43?w=1200&h=420&fit=crop&auto=format",
    photoAlt: "Green valley with snow-capped Qilian mountains under a dramatic cloudy sky",
  },
  {
    day: 10,
    date: "10月4日",
    dateEn: "Oct 4",
    route: "祁连 → 门源 → 达坂山 → 西宁",
    routeEn: "Qilian  →  Menyuan  →  Dabanshan  →  Xining",
    km: 280,
    time: "18:00 大环线闭环",
    highlights: [
      "门源百里油菜花海（秋末尾声）",
      "翻越达坂山（海拔 3,792m），全程最高公路垭口",
      "18:00 抵达西宁，青甘大环线完美闭合",
    ],
    hotel: "西宁海湖新区国投广场亚朵 S酒店",
    hotelStrategy: "行程最后一天回到原点，入住熟悉的亚朵酒店，舒舒服服洗个热水澡，为明天的交车托运做准备。",
    hotelLat: 36.638,
    hotelLng: 101.724,
    tag: "finish",
  },
  {
    day: 11,
    date: "10月5日",
    dateEn: "Oct 5",
    route: "西宁 · 行程缓冲日",
    routeEn: "Xining  —  Buffer Day",
    km: 50,
    kmApprox: true,
    highlights: [
      "城区休整，车辆状态最终检查",
      "备用行程日，应对任何突发状况",
      "可骑车游览塔尔寺等西宁周边景点",
    ],
    hotel: "同上（连住休整）",
    hotelStrategy: "保留一天余量应对突发状况。好天气也可以骑车游览西宁周边，作为整段旅程的收尾。",
    tag: "transit",
  },
  {
    day: 12,
    date: "10月6日",
    dateEn: "Oct 6",
    route: "西宁 · 交车托运日",
    routeEn: "Xining  —  Shipping Day",
    km: 10,
    kmApprox: true,
    time: "10:00 物流园",
    highlights: [
      "骑车至物流园洗车",
      "按规定抽空燃油，拍照记录车况",
      "办理托运手续，送 CU625 踏上归途",
    ],
    hotel: "西宁曹家堡机场周边酒店",
    hotelStrategy: "车辆已交运，晚上直接打车住到机场周边的快捷酒店，通常提供免费送机服务，方便第二天一早飞回上海。",
    tag: "transit",
  },
  {
    day: 13,
    date: "10月7日",
    dateEn: "Oct 7",
    route: "西宁 → 上海",
    routeEn: "Xining  →  Shanghai",
    subtitle: "返程 · Homebound",
    km: 0,
    highlights: [
      "早班机飞回上海",
      "带着 2,470 公里的记忆，平安归来",
    ],
    hotel: "——",
    hotelStrategy: "",
    tag: "transit",
  },
];

const ROUTE_WAYPOINTS = [
  "西宁", "青海湖", "茶卡", "德令哈",
  "水上雅丹", "大柴旦", "翡翠湖", "敦煌",
  "嘉峪关", "七彩丹霞", "祁连山", "门源", "西宁",
];

function DayCard({ data, onLocate }: { data: DayData, onLocate: (lat: number, lng: number) => void }) {
  const [hotelOpen, setHotelOpen] = useState(false);
  const borderColor = TAG_COLOR[data.tag];
  const tagLabel = TAG_LABEL[data.tag];

  return (
    <article
      className="relative overflow-hidden"
      style={{
        borderLeft: `3px solid ${borderColor}`,
        backgroundColor: "rgba(20, 18, 16, 0.6)",
        backdropFilter: "blur(8px)",
      }}
    >
      {/* Ghost day number */}
      <div
        aria-hidden
        className="absolute top-0 right-0 leading-none select-none pointer-events-none font-display font-bold"
        style={{
          fontSize: "clamp(80px, 22vw, 160px)",
          color: "rgba(255,255,255,0.025)",
          lineHeight: 0.9,
          fontFamily: "var(--font-display)",
        }}
      >
        {String(data.day).padStart(2, "0")}
      </div>

      <div className="relative p-5 sm:p-6 md:p-8">
        {/* Header */}
        <div className="flex flex-row items-start justify-between gap-2 mb-4">
          <div className="min-w-0 flex-1 pr-1">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 mb-2">
              <span
                className="font-mono text-[11px] tracking-[0.18em] uppercase"
                style={{ color: "#7a7068" }}
              >
                Day {String(data.day).padStart(2, "0")}
              </span>
              <span style={{ color: "#2a2520" }}>·</span>
              <span className="font-mono text-[11px]" style={{ color: "#7a7068" }}>
                {data.dateEn}
              </span>
              {tagLabel && (
                <span
                  className="font-mono text-[9px] tracking-[0.14em] px-2 py-0.5 uppercase"
                  style={{
                    backgroundColor: `${borderColor}1a`,
                    color: borderColor,
                    border: `1px solid ${borderColor}35`,
                  }}
                >
                  {tagLabel}
                </span>
              )}
            </div>

            <h2
              className="text-2xl md:text-[1.75rem] font-semibold leading-tight"
              style={{ fontFamily: "var(--font-display)", color: "#f0e8d8" }}
            >
              {data.route}
            </h2>
            <p
              className="text-[13px] mt-1 tracking-wide"
              style={{ color: "#7a7068", fontFamily: "var(--font-sans)" }}
            >
              {data.routeEn}
            </p>
            {data.subtitle && (
              <p
                className="text-sm mt-1.5 font-medium"
                style={{ color: "#9a8f82", fontFamily: "var(--font-sans)" }}
              >
                {data.subtitle}
              </p>
            )}
          </div>

          {/* KM stat */}
          <div className="shrink-0 text-right" style={{ minWidth: "52px" }}>
            {data.km > 0 ? (
              <>
                <div
                  className="font-mono font-medium leading-none"
                  style={{
                    fontSize: "clamp(22px, 5.5vw, 40px)",
                    color: "#c8963e",
                  }}
                >
                  {data.kmApprox && (
                    <span style={{ fontSize: "0.65em", opacity: 0.7 }}>~</span>
                  )}
                  {data.km.toLocaleString()}
                </div>
                <div
                  className="font-mono text-[10px] tracking-[0.2em] uppercase mt-1"
                  style={{ color: "#7a7068" }}
                >
                  km
                </div>
                {data.kmNote && (
                  <div
                    className="font-mono text-[10px] mt-0.5"
                    style={{ color: `${borderColor}70` }}
                  >
                    {data.kmNote}
                  </div>
                )}
              </>
            ) : (
              <div
                className="font-mono font-light leading-none"
                style={{ fontSize: "28px", color: "#4a4540" }}
              >
                — km
              </div>
            )}
          </div>
        </div>

        {/* Time marker */}
        {data.time && (
          <div className="flex items-center gap-2 mb-4 -mt-1">
            <span
              className="inline-block w-1 h-1 rounded-full shrink-0"
              style={{ backgroundColor: borderColor }}
            />
            <span
              className="font-mono text-[11px] tracking-wide"
              style={{ color: "#9a9080" }}
            >
              {data.time}
            </span>
          </div>
        )}

        {/* Photo strip */}
        {data.photo && (
          <div
            className="mb-5 overflow-hidden rounded-sm"
            style={{ margin: "0 -20px 20px", backgroundColor: "#0a0908" }}
          >
            <img
              src={data.photo}
              alt={data.photoAlt}
              loading="lazy"
              className="w-full object-cover"
              style={{
                height: "clamp(150px, 44vw, 240px)",
                opacity: 0.82,
                transition: "opacity 0.6s ease",
                display: "block",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLImageElement).style.opacity = "1")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLImageElement).style.opacity = "0.82")}
            />
          </div>
        )}

        {/* Highlights */}
        <ul className="space-y-2 mb-5">
          {data.highlights.map((h, i) => (
            <li
              key={i}
              className="flex items-start gap-3 text-sm leading-snug"
              style={{ color: "#d0c0b0", fontFamily: "var(--font-sans)" }}
            >
              <span
                className="mt-[6px] shrink-0 rounded-full"
                style={{
                  width: "4px",
                  height: "4px",
                  backgroundColor: borderColor,
                  opacity: 0.7,
                }}
              />
              {h}
            </li>
          ))}
        </ul>

        {/* Hotel accordion */}
        {data.hotel && data.hotel !== "——" && (
          <div
            className="pt-4"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
          >
            <button
              onClick={() => setHotelOpen((o) => !o)}
              className="flex items-start justify-between w-full text-left gap-4"
              style={{ cursor: "pointer" }}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className="mt-0.5 shrink-0 font-mono text-[10px] tracking-[0.15em] uppercase px-1.5 py-0.5"
                  style={{
                    color: "#4a9fa5",
                    border: "1px solid #4a9fa535",
                    backgroundColor: "#4a9fa510",
                  }}
                >
                  住宿
                </div>
                <div className="flex-1">
                  <div
                    className="text-sm font-medium leading-snug flex items-center flex-wrap gap-2"
                    style={{ color: "#b0a090", fontFamily: "var(--font-sans)" }}
                  >
                    {data.hotel}
                    {data.hotelLat && data.hotelLng && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          onLocate(data.hotelLat!, data.hotelLng!);
                        }}
                        className="inline-flex bg-[#4a9fa5] text-[#0e0d0b] px-2 py-0.5 rounded text-[10px] font-bold hover:bg-[#3d8388] transition-colors whitespace-nowrap cursor-pointer shadow-lg"
                      >
                        一键定位地图
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <span
                className="shrink-0 font-mono text-xs mt-0.5"
                style={{
                  color: "#6a7068",
                  transform: hotelOpen ? "rotate(180deg)" : "none",
                  transition: "transform 0.2s ease",
                  display: "inline-block",
                }}
              >
                ▾
              </span>
            </button>

            {hotelOpen && (
              <div
                className="mt-3 ml-8 text-sm leading-relaxed"
                style={{ color: "#6a6050", fontFamily: "var(--font-sans)" }}
              >
                {data.hotelStrategy}
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

import MapContainer from "./components/MapContainer";
import Uploader from "./components/Uploader";
import { Play } from "lucide-react";

import mqtt from "mqtt";

export default function App() {
  const [track, setTrack] = useState<[number, number][]>([]);
  const [currentLocation, setCurrentLocation] = useState<[number, number] | undefined>(undefined);
  const [isSimulating, setIsSimulating] = useState(false);
  
  // MQTT State
  const [mqttStatus, setMqttStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const [mqttClient, setMqttClient] = useState<mqtt.MqttClient | null>(null);
  
  const MQTT_SERVER_DOMAIN = "mqtt.nestormao.com";

  // Mock waypoints coordinates for the map
  const waypoints = [
    { title: "西宁", subtitle: "起点/终点", lat: 36.6171, lng: 101.7782 },
    { title: "青海湖", lat: 36.75, lng: 100.25 },
    { title: "黑马河", lat: 36.72, lng: 99.78 },
    { title: "茶卡盐湖", lat: 36.78, lng: 99.08 },
    { title: "德令哈", lat: 37.37, lng: 97.37 },
    { title: "大柴旦", lat: 37.85, lng: 95.36 },
    { title: "水上雅丹", lat: 37.5, lng: 92.5 },
    { title: "翡翠湖", lat: 37.75, lng: 95.5 },
    { title: "敦煌", subtitle: "莫高窟、鸣沙山", lat: 40.14, lng: 94.66 },
    { title: "嘉峪关", subtitle: "天下第一雄关", lat: 39.77, lng: 98.28 },
    { title: "张掖", subtitle: "七彩丹霞", lat: 38.93, lng: 100.45 },
    { title: "祁连", subtitle: "卓尔山", lat: 38.17, lng: 100.25 },
    { title: "门源", subtitle: "达坂山", lat: 37.38, lng: 101.62 },
  ];

  // Simulation logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSimulating && track.length > 0) {
      let index = 0;
      interval = setInterval(() => {
        if (index < track.length) {
          setCurrentLocation(track[index]);
          // Move 5 points at a time for speed in simulation
          index += Math.max(1, Math.floor(track.length / 500)); 
        } else {
          setIsSimulating(false);
          clearInterval(interval);
        }
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isSimulating, track]);

  const startSimulation = () => {
    if (track.length === 0) {
      alert("请先上传 GPX 轨迹文件，再开启实时位置模拟。");
      return;
    }
    setIsSimulating(true);
  };

  const connectMqtt = () => {
    setMqttStatus("connecting");
    // Connect via secure WebSocket (WSS) over standard port 443 with /mqtt path
    const client = mqtt.connect(`wss://${MQTT_SERVER_DOMAIN}/mqtt`, {
      username: "Nestor", 
      password: "3545941mhk",
    });

    client.on("connect", () => {
      setMqttStatus("connected");
      // Subscribe to all owntracks topics
      client.subscribe("owntracks/+/+");
    });

    client.on("message", (topic, message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data._type === "location" && data.lat && data.lon) {
          setCurrentLocation([data.lat, data.lon]);
        }
      } catch (err) {
        console.error("Failed to parse MQTT message", err);
      }
    });

    client.on("error", (err) => {
      console.error("MQTT Error:", err);
      setMqttStatus("disconnected");
      alert(`无法连接至 ${MQTT_SERVER_DOMAIN}。请检查您的服务器 Nginx/SSL 配置是否生效！`);
      client.end();
    });

    setMqttClient(client);
  };

  const disconnectMqtt = () => {
    if (mqttClient) {
      mqttClient.end();
      setMqttClient(null);
    }
    setMqttStatus("disconnected");
  };

  return (
    <div
      className="relative w-full h-screen overflow-hidden"
      style={{
        backgroundColor: "#0e0d0b",
        color: "#f0e8d8",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* ── Left Sidebar (Timeline) ── */}
      <div 
        className="absolute top-0 left-0 w-full md:w-[420px] lg:w-[460px] h-[50vh] md:h-screen overflow-y-auto custom-scrollbar flex flex-col z-10 shadow-[20px_0_40px_rgba(0,0,0,0.5)]"
        style={{
          backgroundColor: "rgba(14, 13, 11, 0.75)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderRight: "1px solid rgba(255, 255, 255, 0.05)"
        }}
      >
        {/* Hero */}
        <header className="relative shrink-0 overflow-hidden" style={{ minHeight: "320px" }}>
          <img
            src="https://images.unsplash.com/photo-1751886797630-f1107c2cd1b8?w=1800&h=700&fit=crop&auto=format"
            alt="Motorcycles riding on a winding mountain highway"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: "center 40%" }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(14,13,11,0.25) 0%, rgba(14,13,11,0.55) 40%, rgba(14,13,11,0.92) 75%, rgba(14,13,11,1) 100%)",
            }}
          />

          <div
            className="relative z-10 w-full px-6 flex flex-col justify-end pb-8 h-full"
            style={{ minHeight: "320px" }}
          >
            {/* Title */}
            <h1
              className="font-bold leading-[0.9] mb-2 mt-auto"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(32px, 8vw, 64px)",
                color: "#f0e8d8",
              }}
            >
              青甘大环线
            </h1>
            <p
              className="font-light mb-6"
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontSize: "18px",
                color: "#b8a880",
              }}
            >
              Qinghai-Gansu Grand Loop
            </p>
          </div>
        </header>

        <div className="px-6 py-6 bg-[#141210]">
          <h3 className="text-sm font-semibold mb-3 text-[#c8963e]">车辆轨迹数据 (Chigee)</h3>
          <Uploader onDataParsed={setTrack} />
          
          <div className="mt-6 pt-6 border-t border-[#2a2520]">
            <h3 className="text-sm font-semibold mb-3 text-[#4a9fa5]">实时位置追踪 (OwnTracks)</h3>
            <div className="flex gap-2">
              {mqttStatus === "disconnected" ? (
                <button
                  onClick={connectMqtt}
                  className="flex-1 bg-[#4a9fa5] text-[#0e0d0b] px-4 py-2.5 rounded text-sm font-medium hover:bg-[#3d8388] transition-colors"
                >
                  一键连接真实坐标
                </button>
              ) : (
                <button
                  onClick={disconnectMqtt}
                  className="flex-1 bg-[#ff4a4a] text-white px-4 py-2.5 rounded text-sm font-medium hover:bg-[#cc3b3b] transition-colors"
                >
                  {mqttStatus === "connecting" ? "连接中..." : "断开连接"}
                </button>
              )}
            </div>
            {mqttStatus === "connected" && (
              <p className="text-xs text-[#7ab87a] mt-2">已成功加密连接至服务器 (mqtt.nestormao.com)，等待接收车辆坐标...</p>
            )}
          </div>
          
          <div className="mt-4 flex gap-3">
            <button
              onClick={startSimulation}
              disabled={isSimulating}
              className="flex items-center justify-center gap-2 flex-1 py-2.5 rounded text-sm font-medium transition-colors"
              style={{ 
                backgroundColor: isSimulating ? "#2a2520" : "#c8963e",
                color: isSimulating ? "#5a5048" : "#141210",
                cursor: isSimulating ? "not-allowed" : "pointer"
              }}
            >
              <Play className="w-4 h-4" />
              {isSimulating ? "模拟行驶中..." : "开启本地路径模拟"}
            </button>
          </div>
        </div>

        {/* Timeline */}
        <main className="px-6 py-8 flex-1">
          <div className="relative" style={{ paddingLeft: "26px" }}>
            <div
              className="absolute top-4 bottom-4"
              style={{ left: "6px", width: "1px", backgroundColor: "#1e1c18" }}
            />
            {DAYS.map((day) => (
              <div key={day.day} className="relative mb-2.5">
                <div
                  className="absolute rounded-full"
                  style={{
                    left: "-20px",
                    top: "26px",
                    width: "13px",
                    height: "13px",
                    border: `2px solid ${TAG_COLOR[day.tag]}`,
                    backgroundColor: "#0e0d0b",
                    zIndex: 1,
                  }}
                />
                <DayCard data={day} onLocate={(lat, lng) => setCurrentLocation([lat, lng])} />
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* ── Background Map Area ── */}
      <div className="absolute inset-0 z-0">
        <MapContainer track={track} currentLocation={currentLocation} waypoints={waypoints} />
      </div>
      
      {/* Inject custom scrollbar style */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0e0d0b;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #2a2520;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3a3530;
        }
      `}</style>
    </div>
  );
}
