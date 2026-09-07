import { useState } from "react";

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
    hotel: "西宁物流园附近 / 城东区机车友好酒店",
    hotelStrategy: "尽量选带有独立封闭院落或地下车库（且允许摩托下库）的快捷/星级酒店。国内很多智选假日、全季在西宁的分店都有较好的停车条件。部分机车主题客栈还会提供免费的高压水枪供车友洗车。",
    tag: "transit",
  },
  {
    day: 2,
    date: "9月26日",
    dateEn: "Sep 26",
    route: "西宁 → 青海湖 → 黑马河",
    routeEn: "Xining  →  Qinghai Lake  →  Heimahe",
    km: 220,
    time: "18:30 黑马河看日落",
    highlights: [
      "翻越日月山口，正式进入高原地带",
      "绕湖西行，感受 4,000m 湖光山色",
      "黑马河镇观赏青海湖绝美日落",
    ],
    hotel: "黑马河镇 / 共和县沿湖客栈",
    hotelStrategy: "强烈建议在小红书或携程上筛选带「私人院子」的客栈，摩托车直接停在院内，防盗且方便搬卸沉重的边包和骑行服。注意：湖边夜间极冷，务必确认房间有充足的暖气或地暖。",
    tag: "landmark",
    photo: "https://images.unsplash.com/photo-1775391715242-ade010710509?w=1200&h=420&fit=crop&auto=format",
    photoAlt: "Calm blue Qinghai Lake with rolling green hills under a cloudy sky",
  },
  {
    day: 3,
    date: "9月27日",
    dateEn: "Sep 27",
    route: "黑马河 → 茶卡盐湖 → 德令哈",
    routeEn: "Heimahe  →  Chaka Salt Lake  →  Delingha",
    km: 300,
    time: "17:00 抵达德令哈",
    highlights: [
      "茶卡盐湖——天空之镜，地面映天",
      "穿越乌兰县，向柴达木盆地深处推进",
      "德令哈市区重要物资补给",
    ],
    hotel: "德令哈市区星级酒店",
    hotelStrategy: "德令哈是重要的物资补给站，物价合理。推荐选择当地的四星/五星标准酒店，通常拥有面积巨大的地面监控停车场，保安巡逻勤务密集，对摩托车非常友好。",
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
    hotel: "大柴旦镇 汽车旅馆 / 精品民宿",
    hotelStrategy: "大柴旦镇不大，旺季住宿紧张。优先选择一楼能直接停车的汽车旅馆（Motel）式布局。重机车一天骑行 450km 后体力消耗极大，能把车直接停在房间窗户外面或一楼门口，绝对是救命的加分项。",
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
    hotel: "敦煌沙洲夜市周边（带内院酒店）",
    hotelStrategy: "推荐如「嘉河云境酒店」、「阳光·城市舒眠PLUS酒店」或同级拥有内部专属停车场的酒店。距离沙洲夜市步行距离即可，晚上喝了酒直接溜达回酒店，无需挪车。",
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
    hotel: "同 Day 5（连住两晚）",
    hotelStrategy: "连住可省去每天重新收拾边包的繁琐，把精力全部留给景点游览。",
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
    hotel: "嘉峪关关城附近 / 市区中高档酒店",
    hotelStrategy: "嘉峪关作为地级市，城市基建极好。推荐选择大型商务酒店，通常配备完善的地下车库，彻底杜绝国庆期间路面人流复杂带来的刮蹭风险。",
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
    hotel: "张掖七彩丹霞景区北门 / 张掖西站周边",
    hotelStrategy: "如果想第二天不用早起赶路，可以直接住在丹霞七彩镇景区北门外的民宿小镇，这里的客栈几乎家家户户都有大院子，机车停放无忧。",
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
    hotel: "祁连县 卓尔山脚下景观民宿",
    hotelStrategy: "推荐住在卓尔山脚下的景观民宿或青年旅舍，窗外就是雪山。山脚下停车空间充裕，部分民宿老板本身也是摩友，会提供非常好的接待服务。",
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
    hotel: "西宁市 离托运网点较近的酒店",
    hotelStrategy: "提前查好托运网点的位置，选择附近的住宿，为明天的交车做准备。",
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

function DayCard({ data }: { data: DayData }) {
  const [hotelOpen, setHotelOpen] = useState(false);
  const borderColor = TAG_COLOR[data.tag];
  const tagLabel = TAG_LABEL[data.tag];

  return (
    <article
      className="relative overflow-hidden"
      style={{
        borderLeft: `3px solid ${borderColor}`,
        backgroundColor: "#141210",
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
                style={{ color: "#5a5048" }}
              >
                Day {String(data.day).padStart(2, "0")}
              </span>
              <span style={{ color: "#2a2520" }}>·</span>
              <span className="font-mono text-[11px]" style={{ color: "#5a5048" }}>
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
              style={{ color: "#5a5048", fontFamily: "var(--font-sans)" }}
            >
              {data.routeEn}
            </p>
            {data.subtitle && (
              <p
                className="text-sm mt-1.5 font-medium"
                style={{ color: "#7a6f62", fontFamily: "var(--font-sans)" }}
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
                  style={{ color: "#5a5048" }}
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
                style={{ fontSize: "28px", color: "#2a2520" }}
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
              style={{ color: "#7a7060" }}
            >
              {data.time}
            </span>
          </div>
        )}

        {/* Photo strip */}
        {data.photo && (
          <div
            className="mb-5 overflow-hidden"
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
              style={{ color: "#b0a090", fontFamily: "var(--font-sans)" }}
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
            style={{ borderTop: "1px solid #1e1c18" }}
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
                <div>
                  <div
                    className="text-sm font-medium leading-snug"
                    style={{ color: "#8a7f72", fontFamily: "var(--font-sans)" }}
                  >
                    {data.hotel}
                  </div>
                </div>
              </div>
              <span
                className="shrink-0 font-mono text-xs mt-0.5"
                style={{
                  color: "#4a5048",
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

export default function App() {
  return (
    <div
      className="min-h-full"
      style={{
        backgroundColor: "#0e0d0b",
        color: "#f0e8d8",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* ── Hero ── */}
      <header className="relative overflow-hidden" style={{ minHeight: "clamp(320px, 55vh, 460px)" }}>
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
          className="relative z-10 max-w-4xl mx-auto px-5 md:px-12 flex flex-col justify-end"
          style={{ minHeight: "clamp(320px, 55vh, 460px)", paddingBottom: "clamp(24px, 5vh, 48px)" }}
        >
          {/* Eyebrow */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-4">
            <span
              className="font-mono text-[11px] tracking-[0.22em] uppercase"
              style={{ color: "#c8963e" }}
            >
              Moto Cruiser
            </span>
            <span style={{ color: "#3a3530" }}>·</span>
            <span
              className="font-mono text-[11px] tracking-[0.18em] uppercase"
              style={{ color: "#5a5048" }}
            >
              Sep 25 – Oct 7, 2026
            </span>
            <span style={{ color: "#3a3530" }}>·</span>
            <span
              className="font-mono text-[11px] tracking-[0.18em] uppercase"
              style={{ color: "#5a5048" }}
            >
              顺时针大环线
            </span>
          </div>

          {/* Title */}
          <h1
            className="font-bold leading-[0.9] mb-2"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(40px, 11vw, 88px)",
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
              fontSize: "clamp(15px, 4vw, 26px)",
              color: "#b8a880",
            }}
          >
            Qinghai-Gansu Grand Loop
          </p>

          {/* Stats strip — 3-col grid on mobile, flex row on sm+ */}
          <div className="grid grid-cols-3 gap-x-5 gap-y-4 sm:flex sm:flex-wrap sm:gap-x-8 sm:gap-y-4">
            {[
              { val: "13", label: "DAYS" },
              { val: "2,470+", label: "KM TOTAL" },
              { val: "10", label: "RIDING" },
              { val: "450", label: "MAX DAY" },
              { val: "3,792m", label: "TOP PASS" },
            ].map((s) => (
              <div key={s.label}>
                <div
                  className="font-mono font-medium leading-none"
                  style={{
                    fontSize: "clamp(19px, 5vw, 34px)",
                    color: "#c8963e",
                  }}
                >
                  {s.val}
                </div>
                <div
                  className="font-mono tracking-[0.16em] uppercase mt-1"
                  style={{ fontSize: "9px", color: "#5a5048" }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ── Waypoint strip ── */}
      <div
        className="overflow-x-auto"
        style={{ borderTop: "1px solid #1e1c18", borderBottom: "1px solid #1e1c18", backgroundColor: "#100f0d" }}
      >
        <div className="max-w-4xl mx-auto px-5 md:px-12 py-2.5">
          <div
            className="flex items-center gap-1.5 whitespace-nowrap font-mono"
            style={{ fontSize: "11px" }}
          >
            {ROUTE_WAYPOINTS.map((place, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <span
                  style={{
                    color:
                      i === 0 || i === ROUTE_WAYPOINTS.length - 1
                        ? "#c8963e"
                        : "#5a5048",
                  }}
                >
                  {place}
                </span>
                {i < ROUTE_WAYPOINTS.length - 1 && (
                  <span style={{ color: "#2a2520" }}>→</span>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Timeline ── */}
      <main className="max-w-4xl mx-auto px-3 sm:px-6 md:px-12 py-8 md:py-16">
        <div className="relative" style={{ paddingLeft: "26px" }}>
          {/* Vertical line */}
          <div
            className="absolute top-4 bottom-4"
            style={{
              left: "6px",
              width: "1px",
              backgroundColor: "#1e1c18",
            }}
          />

          {DAYS.map((day) => (
            <div key={day.day} className="relative mb-2.5">
              {/* Timeline node */}
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
              <DayCard data={day} />
            </div>
          ))}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer
        className="mt-4"
        style={{
          borderTop: "1px solid #1a1816",
          backgroundColor: "#080807",
        }}
      >
        <div className="max-w-4xl mx-auto px-5 md:px-12 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div
              className="font-mono text-[10px] tracking-[0.2em] uppercase mb-1.5"
              style={{ color: "#3a3530" }}
            >
              行程备注
            </div>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "#4a4540", fontFamily: "var(--font-sans)" }}
            >
              顺时针大环线，完美错峰国庆车流。全程高原路段，建议充分准备应对高反，备足现金，保持燃油充盈。
            </p>
          </div>
          <div
            className="shrink-0 font-mono"
            style={{ fontSize: "11px", color: "#2a2520" }}
          >
            ZONTES CU625 · 2025
          </div>
        </div>
      </footer>
    </div>
  );
}
