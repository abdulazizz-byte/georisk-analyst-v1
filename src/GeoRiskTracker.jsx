import { useState, useEffect, useRef, useMemo } from "react";
import * as d3 from "d3";

// --- CONTINENT OUTLINES (simplified [lng, lat] polygons) ---
const CONTINENTS = [
  { name: "North America", coords: [[-130,55],[-125,60],[-115,68],[-100,72],[-85,75],[-70,72],[-60,65],[-55,50],[-65,45],[-70,42],[-75,35],[-80,25],[-85,18],[-90,15],[-100,18],[-105,20],[-110,25],[-115,30],[-120,35],[-125,42],[-128,48],[-130,55]] },
  { name: "Central America", coords: [[-100,20],[-95,18],[-90,16],[-85,14],[-82,10],[-78,8],[-80,10],[-85,12],[-90,14],[-95,16],[-100,20]] },
  { name: "South America", coords: [[-78,10],[-72,12],[-65,10],[-55,5],[-50,0],[-45,-5],[-38,-8],[-35,-12],[-38,-18],[-42,-22],[-48,-28],[-52,-32],[-58,-38],[-65,-42],[-68,-52],[-72,-48],[-73,-42],[-70,-35],[-68,-28],[-70,-20],[-75,-15],[-78,-5],[-80,0],[-78,5],[-78,10]] },
  { name: "Europe", coords: [[-10,36],[-8,42],[-5,44],[0,46],[3,48],[5,50],[8,54],[10,56],[12,58],[15,60],[18,62],[22,65],[28,68],[32,70],[38,70],[42,68],[45,65],[42,60],[38,55],[35,50],[30,45],[28,42],[25,38],[22,36],[18,35],[12,36],[8,38],[2,43],[-2,44],[-8,43],[-10,36]] },
  { name: "Africa", coords: [[-15,30],[-17,22],[-16,15],[-12,10],[-8,5],[-5,4],[5,4],[10,2],[12,0],[15,-5],[20,-10],[28,-15],[32,-20],[35,-25],[35,-30],[30,-34],[25,-34],[18,-30],[15,-28],[12,-20],[10,-12],[5,-5],[2,0],[5,5],[10,8],[15,10],[20,15],[25,20],[28,25],[32,30],[35,32],[30,35],[25,35],[20,35],[15,35],[10,36],[5,36],[0,35],[-5,34],[-10,32],[-15,30]] },
  { name: "Asia", coords: [[28,42],[32,38],[35,35],[38,32],[42,28],[45,25],[48,22],[52,18],[55,15],[60,20],[65,25],[70,28],[72,22],[75,15],[78,8],[80,12],[85,18],[88,22],[92,18],[95,12],[100,5],[102,2],[105,0],[108,-5],[110,-8],[115,-8],[120,-5],[122,5],[125,10],[128,18],[130,25],[132,32],[135,35],[138,38],[140,42],[142,45],[145,50],[148,55],[150,60],[155,62],[160,65],[170,68],[175,70],[180,68],[180,50],[175,55],[170,58],[165,60],[160,58],[155,55],[150,50],[145,48],[140,50],[135,52],[130,55],[125,52],[120,50],[115,48],[110,48],[105,50],[100,52],[90,52],[80,55],[70,58],[65,55],[60,55],[55,58],[50,55],[45,58],[42,60],[38,55],[35,50],[30,45],[28,42]] },
  { name: "Australia", coords: [[115,-22],[118,-18],[122,-15],[128,-14],[132,-12],[135,-14],[138,-16],[142,-14],[146,-16],[148,-18],[150,-22],[152,-26],[153,-28],[152,-32],[150,-35],[148,-38],[145,-38],[140,-36],[135,-35],[130,-32],[125,-33],[120,-34],[116,-34],[114,-30],[113,-26],[114,-24],[115,-22]] },
  { name: "UK", coords: [[-6,50],[-5,52],[-4,54],[-5,56],[-4,58],[-3,58],[-1,58],[0,56],[1,54],[1,52],[0,51],[-2,50],[-4,50],[-6,50]] },
  { name: "Japan", coords: [[130,31],[131,33],[133,34],[135,35],[137,36],[139,36],[140,38],[141,40],[142,42],[143,44],[145,45],[144,43],[142,40],[140,37],[138,35],[136,34],[134,33],[132,32],[130,31]] },
  { name: "New Zealand", coords: [[166,-46],[168,-44],[172,-42],[175,-41],[178,-38],[178,-40],[176,-42],[174,-44],[172,-45],[170,-46],[168,-46],[166,-46]] },
  { name: "Sri Lanka", coords: [[80,10],[81,8],[82,7],[81,6],[80,7],[80,10]] },
  { name: "Madagascar", coords: [[44,-12],[46,-14],[48,-16],[49,-20],[49,-24],[47,-25],[44,-24],[43,-20],[43,-16],[44,-12]] },
  { name: "Indonesia", coords: [[96,5],[98,3],[100,1],[102,0],[104,-1],[106,-2],[108,-5],[110,-7],[112,-8],[114,-8],[116,-8],[118,-8],[120,-7],[122,-5],[124,-6],[126,-5],[128,-4],[130,-3],[132,-2],[134,-3],[136,-5],[138,-6],[140,-5],[140,-3],[138,-2],[136,-1],[134,0],[132,0],[130,-1],[128,-2],[126,-3],[124,-4],[122,-3],[120,-5],[118,-6],[116,-7],[114,-7],[112,-6],[110,-5],[108,-3],[106,-1],[104,0],[102,1],[100,2],[98,4],[96,5]] },
];

// --- GEOPOLITICAL RISK ZONES ---
const RISK_ZONES = [
  { id: "ukr", name: "Ukraine-Russia", lat: 49, lng: 32, risk: 95, level: "CRITICAL", desc: "Active full-scale war. Energy supply disruption. Nuclear escalation risk. NATO involvement potential.", factors: ["Active conflict", "Nuclear posture", "Energy disruption", "Refugee crisis", "Sanctions regime"] },
  { id: "twn", name: "Taiwan Strait", lat: 23.5, lng: 121, risk: 82, level: "HIGH", desc: "China military drills intensifying. US CHIPS Act reshoring accelerating. Semiconductor supply chain at risk.", factors: ["Military buildup", "Semiconductor dependency", "US-China tensions", "Naval exercises", "Trade restrictions"] },
  { id: "me", name: "Middle East", lat: 32, lng: 44, risk: 85, level: "HIGH", desc: "Iran nuclear program advancing. Israel regional tensions. Red Sea shipping disruption. Oil price sensitivity.", factors: ["Iran nuclear", "Houthi attacks", "Oil chokepoints", "Israel tensions", "Regional proxy wars"] },
  { id: "scs", name: "South China Sea", lat: 12, lng: 114, risk: 68, level: "ELEVATED", desc: "Territorial disputes. Philippine-China confrontations. Trade route vulnerability. ASEAN alignment shifts.", factors: ["Territorial claims", "Naval incidents", "Trade routes", "ASEAN politics", "Resource disputes"] },
  { id: "kor", name: "Korean Peninsula", lat: 38, lng: 127, risk: 62, level: "ELEVATED", desc: "DPRK missile tests. Satellite launches. South Korea political instability. US troop posture.", factors: ["Missile launches", "Nuclear program", "Political unrest", "Alliance shifts", "Cyber threats"] },
  { id: "shl", name: "Sahel Region", lat: 15, lng: 2, risk: 55, level: "MODERATE", desc: "Military coups spreading. Wagner/Africa Corps presence. French withdrawal. Uranium supply risk.", factors: ["Military coups", "Terrorism", "Wagner presence", "Resource control", "Migration flows"] },
  { id: "ven", name: "Venezuela", lat: 8, lng: -66, risk: 48, level: "MODERATE", desc: "Guyana territorial dispute. Oil sanctions fluctuation. Political crisis. Migration pressure on neighbors.", factors: ["Territory dispute", "Oil sanctions", "Political crisis", "Migration", "Inflation"] },
  { id: "bal", name: "Baltic States", lat: 57, lng: 24, risk: 52, level: "MODERATE", desc: "NATO forward deployment. Russian hybrid warfare. Suwalki Gap vulnerability. Cyber threats.", factors: ["NATO posture", "Hybrid warfare", "Cyber attacks", "Border tensions", "Energy dependency"] },
  { id: "arc", name: "Arctic", lat: 72, lng: 0, risk: 42, level: "WATCH", desc: "Resource competition. Northern Sea Route militarization. Climate-driven access changes.", factors: ["Resource race", "Military bases", "Shipping routes", "Climate change", "Sovereignty claims"] },
  { id: "eth", name: "Horn of Africa", lat: 8, lng: 42, risk: 58, level: "MODERATE", desc: "Ethiopia internal conflict. Somalia instability. Red Sea access. Djibouti base competition.", factors: ["Civil conflict", "Piracy risk", "Military bases", "Famine", "Regional rivalry"] },
  { id: "ind", name: "India-Pakistan", lat: 30, lng: 72, risk: 45, level: "WATCH", desc: "Kashmir tensions. Water disputes. Nuclear-armed neighbors. Periodic escalation cycles.", factors: ["Kashmir", "Nuclear arms", "Water scarcity", "Border skirmishes", "Terrorism"] },
  { id: "cyb", name: "Global Cyber Theater", lat: 45, lng: -90, risk: 75, level: "HIGH", desc: "State-sponsored attacks surging. Critical infrastructure targets. AI-enhanced capabilities.", factors: ["State actors", "Infrastructure attacks", "Ransomware", "AI weapons", "Election interference"] },
];

// --- STOCK RECOMMENDATIONS ---
const STOCK_CATEGORIES = [
  {
    category: "Defense & Aerospace",
    icon: "🛡️",
    riskLink: "Conflict escalation drives defense spending. NATO allies increasing budgets to 2%+ GDP.",
    stocks: [
      { ticker: "LMT", name: "Lockheed Martin", price: 512.30, ytd: 8.2, m3: 5.1, y1: 18.4, y5: 62.3, signal: "BUY" },
      { ticker: "RTX", name: "RTX Corp", price: 128.45, ytd: 12.5, m3: 7.8, y1: 24.1, y5: 48.7, signal: "BUY" },
      { ticker: "NOC", name: "Northrop Grumman", price: 498.70, ytd: 6.8, m3: 3.2, y1: 15.9, y5: 55.1, signal: "HOLD" },
      { ticker: "GD", name: "General Dynamics", price: 302.15, ytd: 9.4, m3: 6.1, y1: 20.3, y5: 58.9, signal: "BUY" },
    ]
  },
  {
    category: "Energy & Commodities",
    icon: "⚡",
    riskLink: "Geopolitical chokepoints threaten supply. Strait of Hormuz, Red Sea disruptions lift prices.",
    stocks: [
      { ticker: "XOM", name: "ExxonMobil", price: 118.90, ytd: -2.1, m3: 1.4, y1: 8.7, y5: 95.2, signal: "HOLD" },
      { ticker: "CVX", name: "Chevron", price: 162.35, ytd: -3.8, m3: -0.5, y1: 5.2, y5: 72.8, signal: "HOLD" },
      { ticker: "SHEL", name: "Shell", price: 68.20, ytd: 4.1, m3: 2.8, y1: 12.5, y5: 88.4, signal: "BUY" },
      { ticker: "COP", name: "ConocoPhillips", price: 112.80, ytd: -1.5, m3: 0.8, y1: 7.3, y5: 110.5, signal: "HOLD" },
    ]
  },
  {
    category: "Precious Metals & Safe Havens",
    icon: "🥇",
    riskLink: "Gold and safe havens surge during uncertainty. Central bank buying at record levels since 2022.",
    stocks: [
      { ticker: "GOLD", name: "Barrick Gold", price: 22.45, ytd: 18.5, m3: 12.1, y1: 35.2, y5: 28.4, signal: "BUY" },
      { ticker: "NEM", name: "Newmont Corp", price: 48.30, ytd: 22.3, m3: 15.4, y1: 42.8, y5: 15.2, signal: "BUY" },
      { ticker: "GLD", name: "SPDR Gold Trust", price: 242.10, ytd: 14.2, m3: 8.9, y1: 28.5, y5: 72.1, signal: "BUY" },
      { ticker: "SLV", name: "iShares Silver", price: 28.90, ytd: 10.8, m3: 6.2, y1: 22.1, y5: 45.3, signal: "HOLD" },
    ]
  },
  {
    category: "Cybersecurity",
    icon: "🔒",
    riskLink: "State-sponsored cyber warfare escalating. Critical infrastructure spending mandatory globally.",
    stocks: [
      { ticker: "CRWD", name: "CrowdStrike", price: 345.20, ytd: 15.8, m3: 9.4, y1: 52.3, y5: 185.4, signal: "BUY" },
      { ticker: "PANW", name: "Palo Alto Networks", price: 188.75, ytd: 11.2, m3: 5.8, y1: 38.7, y5: 210.2, signal: "HOLD" },
      { ticker: "FTNT", name: "Fortinet", price: 98.40, ytd: 19.5, m3: 11.2, y1: 45.1, y5: 165.8, signal: "BUY" },
      { ticker: "ZS", name: "Zscaler", price: 225.60, ytd: 8.9, m3: 4.1, y1: 28.4, y5: 142.3, signal: "HOLD" },
    ]
  },
  {
    category: "Shipping & Logistics",
    icon: "🚢",
    riskLink: "Trade route disruptions (Suez, Hormuz, Malacca) inflate shipping rates and logistics demand.",
    stocks: [
      { ticker: "ZIM", name: "ZIM Shipping", price: 22.80, ytd: 42.5, m3: 28.1, y1: -12.4, y5: 35.2, signal: "SPECULATIVE" },
      { ticker: "MATX", name: "Matson Inc", price: 138.90, ytd: 8.4, m3: 5.2, y1: 18.9, y5: 185.3, signal: "BUY" },
      { ticker: "FDX", name: "FedEx", price: 275.40, ytd: -5.2, m3: -2.1, y1: 8.5, y5: 42.1, signal: "HOLD" },
    ]
  },
  {
    category: "Agriculture & Food Security",
    icon: "🌾",
    riskLink: "Black Sea grain corridor instability. Climate shocks compound supply disruption risk.",
    stocks: [
      { ticker: "ADM", name: "Archer-Daniels", price: 58.20, ytd: -8.5, m3: -4.2, y1: -15.3, y5: 22.1, signal: "WATCH" },
      { ticker: "BG", name: "Bunge Global", price: 98.50, ytd: -3.2, m3: 1.8, y1: -8.4, y5: 68.5, signal: "HOLD" },
      { ticker: "MOS", name: "Mosaic Company", price: 32.10, ytd: 5.8, m3: 8.2, y1: -12.5, y5: -15.8, signal: "SPECULATIVE" },
    ]
  },
];

const RISK_COLORS = {
  CRITICAL: "#ff1744",
  HIGH: "#ff6d00",
  ELEVATED: "#ffd600",
  MODERATE: "#c9a0ff",
  WATCH: "#64b5f6",
};

const SIGNAL_COLORS = {
  BUY: "#00e676",
  HOLD: "#ffd740",
  WATCH: "#64b5f6",
  SPECULATIVE: "#ff6d00",
};

export default function GeoRiskTracker() {
  const svgRef = useRef(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [hoveredZone, setHoveredZone] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 960, height: 500 });
  const [showPanel, setShowPanel] = useState(false);
  const [timeFilter, setTimeFilter] = useState("ytd");
  const [animatedRisks, setAnimatedRisks] = useState({});

  // Animate risk score counting
  useEffect(() => {
    const timers = [];
    RISK_ZONES.forEach((zone) => {
      let current = 0;
      const step = zone.risk / 30;
      const timer = setInterval(() => {
        current += step;
        if (current >= zone.risk) {
          current = zone.risk;
          clearInterval(timer);
        }
        setAnimatedRisks((prev) => ({ ...prev, [zone.id]: Math.round(current) }));
      }, 40);
      timers.push(timer);
    });
    return () => timers.forEach(clearInterval);
  }, []);

  // Calculate global composite risk
  const globalRisk = useMemo(() => {
    const weights = RISK_ZONES.map(z => z.risk);
    const top5 = weights.sort((a, b) => b - a).slice(0, 5);
    return Math.round(top5.reduce((a, b) => a + b, 0) / top5.length);
  }, []);

  // D3 projection
  const projection = useMemo(() => {
    return d3.geoNaturalEarth1()
      .scale(dimensions.width / 5.8)
      .translate([dimensions.width / 2, dimensions.height / 2]);
  }, [dimensions]);

  const pathGenerator = useMemo(() => d3.geoPath().projection(projection), [projection]);

  // Generate graticule
  const graticule = useMemo(() => d3.geoGraticule().step([15, 15])(), []);
  const graticulePath = useMemo(() => pathGenerator(graticule), [pathGenerator, graticule]);
  const outlinePath = useMemo(() => pathGenerator({ type: "Sphere" }), [pathGenerator]);

  // Generate continent paths
  const continentPaths = useMemo(() => {
    return CONTINENTS.map((c) => {
      const feature = {
        type: "Feature",
        geometry: { type: "Polygon", coordinates: [c.coords] },
      };
      return { name: c.name, path: pathGenerator(feature) };
    });
  }, [pathGenerator]);

  // Project risk zone positions
  const projectedZones = useMemo(() => {
    return RISK_ZONES.map((z) => {
      const [x, y] = projection([z.lng, z.lat]);
      return { ...z, x, y };
    });
  }, [projection]);

  const handleZoneClick = (zone) => {
    setSelectedZone(zone);
    setShowPanel(true);
    setSelectedCategory(null);
  };

  const handleResize = () => {
    const w = Math.min(window.innerWidth, 960);
    setDimensions({ width: w, height: w * 0.52 });
  };

  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const formatPerf = (val) => {
    const prefix = val >= 0 ? "+" : "";
    return `${prefix}${val.toFixed(1)}%`;
  };

  const perfKey = { ytd: "ytd", "3m": "m3", "1y": "y1", "5y": "y5" };

  return (
    <div style={{ background: "#0a0a0f", minHeight: "100vh", color: "#fff", fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&family=Space+Grotesk:wght@300;400;500;700&display=swap');
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0a0a0f; }
        ::-webkit-scrollbar-thumb { background: #2a2040; border-radius: 3px; }
        
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes pulse-ring-critical {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(3); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes glowPulse {
          0%, 100% { text-shadow: 0 0 10px rgba(180,130,255,0.3); }
          50% { text-shadow: 0 0 20px rgba(180,130,255,0.6), 0 0 40px rgba(180,130,255,0.2); }
        }
        
        .zone-marker { cursor: pointer; transition: all 0.2s; }
        .zone-marker:hover { filter: brightness(1.5); }
        
        .stock-row { 
          transition: all 0.15s; 
          cursor: pointer;
          border-left: 2px solid transparent;
        }
        .stock-row:hover { 
          background: rgba(180,130,255,0.08) !important;
          border-left-color: #b482ff;
        }
        
        .cat-btn {
          transition: all 0.2s;
          cursor: pointer;
          border: 1px solid rgba(180,130,255,0.15);
        }
        .cat-btn:hover, .cat-btn.active {
          background: rgba(180,130,255,0.15) !important;
          border-color: #b482ff;
        }

        .time-btn {
          transition: all 0.15s;
          cursor: pointer;
        }
        .time-btn:hover { background: rgba(180,130,255,0.15); }
        .time-btn.active { background: #b482ff; color: #000; font-weight: 700; }

        .panel-section {
          animation: fadeIn 0.3s ease-out;
        }

        .risk-badge {
          font-size: 10px;
          padding: 2px 8px;
          border-radius: 3px;
          font-weight: 700;
          letter-spacing: 1px;
        }
      `}</style>

      {/* HEADER */}
      <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(180,130,255,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(180deg, rgba(180,130,255,0.04) 0%, transparent 100%)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: globalRisk > 70 ? "#ff1744" : "#ffd600", boxShadow: `0 0 12px ${globalRisk > 70 ? "#ff1744" : "#ffd600"}` }} />
          <div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, letterSpacing: 2, color: "#b482ff", animation: "glowPulse 3s infinite" }}>
              GEOPOLITICAL RISK MONITOR
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: 3, marginTop: 2 }}>
              REAL-TIME THREAT ASSESSMENT & PORTFOLIO POSITIONING
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: 1 }}>COMPOSITE RISK INDEX</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: globalRisk > 70 ? "#ff6d00" : "#ffd600", fontFamily: "'Space Grotesk', sans-serif" }}>
              {globalRisk}<span style={{ fontSize: 14, color: "rgba(255,255,255,0.3)" }}>/100</span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: 1 }}>ACTIVE ZONES</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#b482ff", fontFamily: "'Space Grotesk', sans-serif" }}>
              {RISK_ZONES.length}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: 1 }}>LAST UPDATE</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
              {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </div>
          </div>
        </div>
      </div>

      {/* RISK LEVEL LEGEND */}
      <div style={{ padding: "8px 24px", display: "flex", gap: 16, alignItems: "center", borderBottom: "1px solid rgba(180,130,255,0.06)" }}>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: 1 }}>THREAT LEVELS</span>
        {Object.entries(RISK_COLORS).map(([level, color]) => (
          <div key={level} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}60` }} />
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: 1 }}>{level}</span>
          </div>
        ))}
      </div>

      {/* MAIN CONTENT */}
      <div style={{ display: "flex", height: "calc(100vh - 110px)" }}>
        
        {/* MAP */}
        <div style={{ flex: showPanel ? "0 0 55%" : "1", transition: "flex 0.3s", position: "relative", overflow: "hidden" }}>
          {/* Scanline effect */}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 5, opacity: 0.03 }}>
            <div style={{ width: "100%", height: 2, background: "linear-gradient(90deg, transparent, #b482ff, transparent)", animation: "scanline 8s linear infinite" }} />
          </div>

          <svg
            ref={svgRef}
            viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
            style={{ width: "100%", height: "100%", display: "block" }}
          >
            <defs>
              {RISK_ZONES.map((z) => (
                <radialGradient key={`glow-${z.id}`} id={`glow-${z.id}`}>
                  <stop offset="0%" stopColor={RISK_COLORS[z.level]} stopOpacity="0.6" />
                  <stop offset="50%" stopColor={RISK_COLORS[z.level]} stopOpacity="0.15" />
                  <stop offset="100%" stopColor={RISK_COLORS[z.level]} stopOpacity="0" />
                </radialGradient>
              ))}
              <filter id="glow-filter">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Globe outline */}
            <path d={outlinePath} fill="none" stroke="rgba(180,130,255,0.08)" strokeWidth="1" />

            {/* Graticule */}
            <path d={graticulePath} fill="none" stroke="rgba(180,130,255,0.04)" strokeWidth="0.5" />

            {/* Continent fills */}
            {continentPaths.map((c, i) => (
              <path
                key={i}
                d={c.path}
                fill="rgba(180,130,255,0.06)"
                stroke="rgba(180,130,255,0.15)"
                strokeWidth="0.5"
              />
            ))}

            {/* Risk zone glows */}
            {projectedZones.map((z) => (
              <g key={z.id} className="zone-marker" onClick={() => handleZoneClick(z)} onMouseEnter={() => setHoveredZone(z.id)} onMouseLeave={() => setHoveredZone(null)}>
                {/* Ambient glow */}
                <circle cx={z.x} cy={z.y} r={z.risk * 0.45} fill={`url(#glow-${z.id})`} opacity={0.5} />
                
                {/* Pulse rings */}
                <circle cx={z.x} cy={z.y} r={z.risk * 0.12} fill="none" stroke={RISK_COLORS[z.level]} strokeWidth="1" opacity="0.5">
                  <animate attributeName="r" from={z.risk * 0.12} to={z.risk * 0.35} dur={z.level === "CRITICAL" ? "1.5s" : "2.5s"} repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.6" to="0" dur={z.level === "CRITICAL" ? "1.5s" : "2.5s"} repeatCount="indefinite" />
                </circle>
                {z.level === "CRITICAL" && (
                  <circle cx={z.x} cy={z.y} r={z.risk * 0.12} fill="none" stroke={RISK_COLORS[z.level]} strokeWidth="0.5" opacity="0.3">
                    <animate attributeName="r" from={z.risk * 0.15} to={z.risk * 0.5} dur="2s" begin="0.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.4" to="0" dur="2s" begin="0.5s" repeatCount="indefinite" />
                  </circle>
                )}

                {/* Core dot */}
                <circle cx={z.x} cy={z.y} r={hoveredZone === z.id || selectedZone?.id === z.id ? 6 : 4} fill={RISK_COLORS[z.level]} filter="url(#glow-filter)" style={{ transition: "r 0.2s" }}>
                  {z.level === "CRITICAL" && <animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite" />}
                </circle>

                {/* Label */}
                {(hoveredZone === z.id || selectedZone?.id === z.id) && (
                  <g style={{ animation: "fadeIn 0.2s" }}>
                    <rect x={z.x + 10} y={z.y - 22} width={z.name.length * 7.5 + 50} height={28} rx={3} fill="rgba(10,10,15,0.92)" stroke={RISK_COLORS[z.level]} strokeWidth="0.5" />
                    <text x={z.x + 16} y={z.y - 5} fill="#fff" fontSize="11" fontFamily="'Space Grotesk', sans-serif" fontWeight="600">{z.name}</text>
                    <text x={z.x + 16 + z.name.length * 7} y={z.y - 5} fill={RISK_COLORS[z.level]} fontSize="11" fontWeight="700" fontFamily="'JetBrains Mono', monospace"> {animatedRisks[z.id] || 0}</text>
                  </g>
                )}
              </g>
            ))}
          </svg>

          {/* Zone list overlay */}
          <div style={{ position: "absolute", bottom: 12, left: 12, right: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
            {RISK_ZONES.sort((a, b) => b.risk - a.risk).slice(0, 6).map((z) => (
              <div
                key={z.id}
                onClick={() => handleZoneClick(z)}
                style={{
                  padding: "4px 10px",
                  background: selectedZone?.id === z.id ? "rgba(180,130,255,0.2)" : "rgba(10,10,15,0.85)",
                  border: `1px solid ${selectedZone?.id === z.id ? "#b482ff" : "rgba(180,130,255,0.12)"}`,
                  borderRadius: 4,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "all 0.15s",
                }}
              >
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: RISK_COLORS[z.level], boxShadow: `0 0 4px ${RISK_COLORS[z.level]}` }} />
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", letterSpacing: 0.5 }}>{z.name}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: RISK_COLORS[z.level] }}>{animatedRisks[z.id] || 0}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{
          flex: showPanel ? "0 0 45%" : "0 0 0%",
          overflow: showPanel ? "auto" : "hidden",
          opacity: showPanel ? 1 : 0,
          transition: "all 0.3s",
          borderLeft: "1px solid rgba(180,130,255,0.1)",
          background: "linear-gradient(180deg, rgba(180,130,255,0.02) 0%, #0a0a0f 100%)",
        }}>
          {selectedZone && (
            <div style={{ padding: 20, animation: "slideIn 0.3s ease-out" }}>
              {/* Zone header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: RISK_COLORS[selectedZone.level], boxShadow: `0 0 10px ${RISK_COLORS[selectedZone.level]}` }} />
                    <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, margin: 0, color: "#fff" }}>
                      {selectedZone.name}
                    </h2>
                  </div>
                  <span className="risk-badge" style={{ background: `${RISK_COLORS[selectedZone.level]}20`, color: RISK_COLORS[selectedZone.level], border: `1px solid ${RISK_COLORS[selectedZone.level]}40`, display: "inline-block", marginTop: 6 }}>
                    {selectedZone.level}
                  </span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: 1 }}>RISK SCORE</div>
                  <div style={{ fontSize: 36, fontWeight: 700, color: RISK_COLORS[selectedZone.level], fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1 }}>
                    {selectedZone.risk}
                  </div>
                </div>
              </div>

              {/* Risk bar */}
              <div style={{ height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2, marginBottom: 12 }}>
                <div style={{ height: "100%", width: `${selectedZone.risk}%`, background: `linear-gradient(90deg, ${RISK_COLORS[selectedZone.level]}80, ${RISK_COLORS[selectedZone.level]})`, borderRadius: 2, transition: "width 0.5s" }} />
              </div>

              {/* Description */}
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, marginBottom: 12 }}>
                {selectedZone.desc}
              </p>

              {/* Risk factors */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 20 }}>
                {selectedZone.factors.map((f, i) => (
                  <span key={i} style={{ fontSize: 10, padding: "3px 8px", background: "rgba(180,130,255,0.06)", border: "1px solid rgba(180,130,255,0.12)", borderRadius: 3, color: "rgba(255,255,255,0.5)" }}>
                    {f}
                  </span>
                ))}
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: "rgba(180,130,255,0.1)", margin: "16px 0" }} />

              {/* STOCK RECOMMENDATIONS */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#b482ff", letterSpacing: 2 }}>PORTFOLIO POSITIONING</div>
                <div style={{ display: "flex", gap: 2 }}>
                  {["ytd", "3m", "1y", "5y"].map((t) => (
                    <button
                      key={t}
                      className={`time-btn ${timeFilter === t ? "active" : ""}`}
                      onClick={() => setTimeFilter(t)}
                      style={{ fontSize: 10, padding: "3px 10px", border: "none", borderRadius: 3, background: "rgba(255,255,255,0.05)", color: timeFilter === t ? "#000" : "rgba(255,255,255,0.5)", letterSpacing: 1, textTransform: "uppercase" }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category pills */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                {STOCK_CATEGORIES.map((cat, i) => (
                  <button
                    key={i}
                    className={`cat-btn ${selectedCategory === i ? "active" : ""}`}
                    onClick={() => setSelectedCategory(selectedCategory === i ? null : i)}
                    style={{ fontSize: 10, padding: "5px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 4, color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <span>{cat.icon}</span> {cat.category}
                  </button>
                ))}
              </div>

              {/* Stock tables */}
              {(selectedCategory !== null ? [STOCK_CATEGORIES[selectedCategory]] : STOCK_CATEGORIES).map((cat, ci) => (
                <div key={ci} className="panel-section" style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 14 }}>{cat.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#fff", fontFamily: "'Space Grotesk', sans-serif" }}>{cat.category}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 8, lineHeight: 1.5, paddingLeft: 22 }}>
                    {cat.riskLink}
                  </div>

                  {/* Table header */}
                  <div style={{ display: "grid", gridTemplateColumns: "70px 1fr 80px 70px 60px", padding: "6px 8px", background: "rgba(180,130,255,0.04)", borderRadius: "4px 4px 0 0", borderBottom: "1px solid rgba(180,130,255,0.08)" }}>
                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: 1 }}>TICKER</span>
                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: 1 }}>NAME</span>
                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: 1, textAlign: "right" }}>PRICE</span>
                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: 1, textAlign: "right" }}>{timeFilter.toUpperCase()}</span>
                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: 1, textAlign: "right" }}>SIGNAL</span>
                  </div>

                  {/* Stock rows */}
                  {cat.stocks.map((s, si) => {
                    const perfVal = s[perfKey[timeFilter]];
                    return (
                      <div key={si} className="stock-row" style={{ display: "grid", gridTemplateColumns: "70px 1fr 80px 70px 60px", padding: "8px 8px", borderBottom: "1px solid rgba(255,255,255,0.03)", alignItems: "center" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#b482ff" }}>{s.ticker}</span>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>{s.name}</span>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>${s.price.toFixed(2)}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, textAlign: "right", color: perfVal >= 0 ? "#00e676" : "#ff5252", fontVariantNumeric: "tabular-nums" }}>
                          {formatPerf(perfVal)}
                        </span>
                        <span style={{ fontSize: 9, textAlign: "right", fontWeight: 700, color: SIGNAL_COLORS[s.signal], letterSpacing: 0.5 }}>
                          {s.signal}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Disclaimer */}
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", marginTop: 16, padding: "10px", background: "rgba(255,255,255,0.02)", borderRadius: 4, lineHeight: 1.5, borderLeft: "2px solid rgba(180,130,255,0.15)" }}>
                Illustrative data only. Not financial advice. Risk scores are composite assessments based on multiple geopolitical factors. Performance figures are simulated. Consult a licensed financial advisor before making investment decisions.
              </div>
            </div>
          )}

          {!selectedZone && showPanel && (
            <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.3)" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🎯</div>
              <div style={{ fontSize: 12 }}>Select a risk zone to view analysis</div>
            </div>
          )}
        </div>

        {/* Initial state - no panel */}
        {!showPanel && (
          <div style={{ position: "absolute", right: 24, top: "50%", transform: "translateY(-50%)", textAlign: "right", animation: "fadeIn 1s" }}>
            <div style={{ fontSize: 11, color: "rgba(180,130,255,0.5)", letterSpacing: 2, marginBottom: 8 }}>SELECT A RISK ZONE</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", maxWidth: 200 }}>
              Click any hotspot on the map to view threat assessment and portfolio positioning
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
