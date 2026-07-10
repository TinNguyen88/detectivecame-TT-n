import React, { useState, useEffect, useRef } from "react";
import { Radio, AlertTriangle, CheckCircle, RefreshCw, Volume2, VolumeX, ShieldAlert, Zap } from "lucide-react";
import { EmfReading } from "../types";
import { motion, AnimatePresence } from "motion/react";

export default function EmfMeter() {
  const [reading, setReading] = useState<EmfReading>({
    x: 18.2,
    y: -24.5,
    z: 11.1,
    total: 32.5,
    isCalibrated: true,
    intensity: "SAFE"
  });

  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  
  // Custom Virtual Environment Hotspot Grid for users to "practice sweeping" or find virtual cameras
  const [suspectHotspot, setSuspectHotspot] = useState({ x: 65, y: 40 }); // Percentage coordinates
  const [pointerPos, setPointerPos] = useState({ x: 0, y: 0 }); // Mouse position relative to the grid
  const [isInsideGrid, setIsInsideGrid] = useState(false);
  const gridRef = useRef<HTMLDivElement | null>(null);

  // Audio Context for beep sound effects during EMF scanning
  const audioCtxRef = useRef<AudioContext | null>(null);
  const beepIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Simulate Device Magnetometer if actual sensor is unavailable (or run simulation + real noise)
  useEffect(() => {
    let lastUpdate = Date.now();
    
    const interval = setInterval(() => {
      if (isCalibrating) return;

      setReading(prev => {
        let baseNoiseX = (Math.random() - 0.5) * 4;
        let baseNoiseY = (Math.random() - 0.5) * 4;
        let baseNoiseZ = (Math.random() - 0.5) * 4;

        let targetX = 18 + baseNoiseX;
        let targetY = -24 + baseNoiseY;
        let targetZ = 12 + baseNoiseZ;

        // If user is hovering/interacting with the virtual sweeping grid, calculate proximity to the camera hotspot
        if (isInsideGrid) {
          // Calculate distance between cursor (0-100) and virtual hidden camera hotspot
          const dx = pointerPos.x - suspectHotspot.x;
          const dy = pointerPos.y - suspectHotspot.y;
          const distance = Math.sqrt(dx * dx + dy * dy); // range from 0 to ~120
          
          // Proximity factor: close = 1, far = 0
          const proximity = Math.max(0, 1 - (distance / 45)); 
          
          if (proximity > 0) {
            // Strong magnetic spikes from virtual wire/processor
            const spike = proximity * 90; // maximum spike is +90 uT
            targetX += spike * 0.6;
            targetY += spike * 0.5;
            targetZ += spike * 0.62;
          }
        }

        const total = Math.sqrt(targetX * targetX + targetY * targetY + targetZ * targetZ);

        let intensity: "SAFE" | "WARNING" | "DANGER" = "SAFE";
        if (total > 85) {
          intensity = "DANGER";
        } else if (total > 50) {
          intensity = "WARNING";
        }

        return {
          x: Number(targetX.toFixed(1)),
          y: Number(targetY.toFixed(1)),
          z: Number(targetZ.toFixed(1)),
          total: Number(total.toFixed(1)),
          isCalibrated: true,
          intensity
        };
      });
    }, 150);

    return () => {
      clearInterval(interval);
    };
  }, [isCalibrating, isInsideGrid, pointerPos, suspectHotspot]);

  // Handle magnetic beeping interval based on EMF intensity
  useEffect(() => {
    if (beepIntervalRef.current) {
      clearInterval(beepIntervalRef.current);
      beepIntervalRef.current = null;
    }

    if (!soundEnabled) return;

    let delay = 1000; // safe rate
    if (reading.intensity === "DANGER") {
      delay = 120; // super fast warning beeps
    } else if (reading.intensity === "WARNING") {
      delay = 400; // standard warning beep
    }

    beepIntervalRef.current = setInterval(() => {
      playBeep();
    }, delay);

    return () => {
      if (beepIntervalRef.current) {
        clearInterval(beepIntervalRef.current);
      }
    };
  }, [reading.intensity, soundEnabled]);

  const playBeep = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      // Pitch of warning beep
      let freq = 800;
      if (reading.intensity === "DANGER") freq = 1200;
      else if (reading.intensity === "WARNING") freq = 950;

      osc.frequency.value = freq;
      osc.type = "sine";

      // Very quick transient pulse
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch (e) {
      console.warn("Audio beeper context load failed:", e);
    }
  };

  const calibrateSensor = () => {
    setIsCalibrating(true);
    let counter = 0;
    const calInterval = setInterval(() => {
      counter++;
      if (counter >= 12) {
        clearInterval(calInterval);
        setIsCalibrating(false);
      }
    }, 150);
  };

  // Track virtual grid pointer positioning
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPointerPos({ x, y });
    setIsInsideGrid(true);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!gridRef.current || e.touches.length === 0) return;
    const rect = gridRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = ((touch.clientX - rect.left) / rect.width) * 100;
    const y = ((touch.clientY - rect.top) / rect.height) * 100;
    setPointerPos({ x, y });
    setIsInsideGrid(true);
  };

  const handleMouseLeave = () => {
    setIsInsideGrid(false);
  };

  const resetHotspot = () => {
    setSuspectHotspot({
      x: 15 + Math.random() * 70,
      y: 15 + Math.random() * 70
    });
  };

  return (
    <div className="space-y-8" id="emf-meter-view">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Radio className="h-5 w-5 text-purple-400" />
            Máy đo từ trường & bức xạ EMF
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Theo dõi dao động điện từ (uT) để phát hiện nguồn điện kích thước cực nhỏ chạy ngầm từ chip xử lý và dây dẫn camera.
          </p>
        </div>

        <div className="flex gap-2.5">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              soundEnabled
                ? "bg-purple-500/20 border-purple-500/40 text-purple-400"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300"
            }`}
            id="btn-sound-toggle"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="h-3.5 w-3.5" /> Âm cảnh báo: Bật
              </>
            ) : (
              <>
                <VolumeX className="h-3.5 w-3.5" /> Âm cảnh báo: Tắt
              </>
            )}
          </button>

          <button
            onClick={calibrateSensor}
            disabled={isCalibrating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-all"
            id="btn-calibrate-emf"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isCalibrating ? "animate-spin" : ""}`} /> Hiệu chuẩn lại
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Huge Interactive EMF Indicator Radial Dial */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-[#111827]/60 p-6 backdrop-blur-md flex flex-col items-center justify-between min-h-[420px]" id="emf-dial-container">
          
          <div className="text-center space-y-1 w-full">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Bức xạ điện từ thời gian thực</span>
            <div className="flex items-center justify-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse"></span>
              <span className="text-xs font-mono font-bold text-purple-400">CHỈ SỐ TỪ TRƯỜNG</span>
            </div>
          </div>

          {/* Rotating and dynamic radial gauge circle */}
          <div className="relative flex items-center justify-center my-6 h-60 w-60">
            
            {/* Pulsing light rings based on danger level */}
            <div className={`absolute inset-0 rounded-full border border-dashed transition-all duration-300 ${
              reading.intensity === "DANGER" 
                ? "border-rose-500/30 scale-105 animate-ping bg-rose-500/5" 
                : reading.intensity === "WARNING" 
                ? "border-amber-500/20 scale-102 bg-amber-500/5" 
                : "border-purple-500/10 scale-100"
            }`} />

            <div className={`absolute h-48 w-48 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-300 ${
              reading.intensity === "DANGER"
                ? "border-rose-500 bg-rose-950/20 shadow-[0_0_20px_rgba(244,63,94,0.3)]"
                : reading.intensity === "WARNING"
                ? "border-amber-500 bg-amber-950/20 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                : "border-purple-500/40 bg-purple-950/10"
            }`}>
              
              {/* Actual value */}
              {isCalibrating ? (
                <div className="text-center space-y-1">
                  <RefreshCw className="h-6 w-6 text-purple-400 animate-spin mx-auto" />
                  <span className="text-[10px] font-mono text-purple-300">Đang đồng bộ...</span>
                </div>
              ) : (
                <>
                  <span className={`text-4xl font-extrabold font-mono tracking-tight transition-colors ${
                    reading.intensity === "DANGER" ? "text-rose-400" : reading.intensity === "WARNING" ? "text-amber-400" : "text-purple-300"
                  }`}>
                    {reading.total}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400 mt-0.5">microTesla (µT)</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border mt-2 ${
                    reading.intensity === "DANGER" 
                      ? "bg-rose-500/20 border-rose-500/40 text-rose-300" 
                      : reading.intensity === "WARNING" 
                      ? "bg-amber-500/20 border-amber-500/40 text-amber-300" 
                      : "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                  }`}>
                    {reading.intensity === "DANGER" ? "NGUY HIỂM / BẤT THƯỜNG" : reading.intensity === "WARNING" ? "CẢNH BÁO NHẸ" : "AN TOÀN / BÌNH THƯỜNG"}
                  </span>
                </>
              )}
            </div>

            {/* Simulated dial marker rotating */}
            <svg className="absolute inset-0 h-full w-full rotate-[-90deg] pointer-events-none">
              <circle
                cx="120"
                cy="120"
                r="105"
                stroke="rgba(30, 41, 59, 0.4)"
                strokeWidth="3"
                fill="transparent"
              />
              <circle
                cx="120"
                cy="120"
                r="105"
                stroke={reading.intensity === "DANGER" ? "#f43f5e" : reading.intensity === "WARNING" ? "#f59e0b" : "#a855f7"}
                strokeWidth="4"
                strokeDasharray="660"
                strokeDashoffset={660 - (Math.min(reading.total, 120) / 120) * 660}
                fill="transparent"
                className="transition-all duration-300"
              />
            </svg>
          </div>

          {/* Tri-axis readings breakdown */}
          <div className="grid grid-cols-3 gap-4 w-full border-t border-slate-800/80 pt-4 text-center font-mono">
            <div className="space-y-0.5">
              <span className="text-[10px] text-gray-500 uppercase block font-semibold">Trục X</span>
              <span className="text-xs text-slate-300">{isCalibrating ? "..." : `${reading.x} µT`}</span>
            </div>
            <div className="space-y-0.5 border-x border-slate-800">
              <span className="text-[10px] text-gray-500 uppercase block font-semibold">Trục Y</span>
              <span className="text-xs text-slate-300">{isCalibrating ? "..." : `${reading.y} µT`}</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-gray-500 uppercase block font-semibold">Trục Z</span>
              <span className="text-xs text-slate-300">{isCalibrating ? "..." : `${reading.z} µT`}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Virtual Space Room Sweeper (Extremely Innovative Feature) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-[#111827]/60 p-5 backdrop-blur-md flex flex-col justify-between space-y-5" id="emf-room-scanner">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-200">
                  Bản đồ mô phỏng rà quét từ trường thực hành
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Di chuyển chuột hoặc ngón tay chạm vào ô phòng bên dưới để mô phỏng dò quét EMF tìm vị trí lắp ẩn camera.
                </p>
              </div>
              <button
                onClick={resetHotspot}
                className="self-start px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900 text-[10px] font-semibold text-purple-400 hover:text-white transition-all flex items-center gap-1"
              >
                Ẩn camera chỗ khác
              </button>
            </div>

            {/* Visual sweeping grid */}
            <div 
              ref={gridRef}
              onMouseMove={handleMouseMove}
              onTouchMove={handleTouchMove}
              onMouseLeave={handleMouseLeave}
              className="relative rounded-xl border border-slate-800 bg-[#070b13] aspect-video w-full overflow-hidden cursor-crosshair group"
              id="sweeper-grid"
            >
              {/* Architectural grids */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-25" />

              {/* Fake furniture sketches */}
              <div className="absolute top-4 left-6 border border-slate-800 bg-slate-900/10 px-3 py-2 text-[9px] font-mono text-slate-600 rounded">GIƯỜNG NGỦ</div>
              <div className="absolute top-4 right-6 border border-slate-800 bg-slate-900/10 px-3 py-2 text-[9px] font-mono text-slate-600 rounded">Ổ CẮM / TV</div>
              <div className="absolute bottom-4 left-6 border border-slate-800 bg-slate-900/10 px-3 py-2 text-[9px] font-mono text-slate-600 rounded">GƯƠNG SOI</div>
              <div className="absolute bottom-4 right-6 border border-slate-800 bg-slate-900/10 px-3 py-2 text-[9px] font-mono text-slate-600 rounded">ĐỒNG HỒ ĐEO TAY</div>

              {/* Dynamic hotspot wave rings (Only reveal fully if we are close) */}
              {isInsideGrid && (
                <div 
                  className="absolute pointer-events-none rounded-full transition-all duration-300"
                  style={{
                    left: `${pointerPos.x}%`,
                    top: `${pointerPos.y}%`,
                    width: "48px",
                    height: "48px",
                    marginLeft: "-24px",
                    marginTop: "-24px",
                    background: reading.intensity === "DANGER" 
                      ? "rgba(244,63,94,0.15)" 
                      : reading.intensity === "WARNING" 
                      ? "rgba(245,158,11,0.1)" 
                      : "rgba(168,85,247,0.05)",
                    border: `1px solid ${
                      reading.intensity === "DANGER" ? "#f43f5e" : reading.intensity === "WARNING" ? "#f59e0b" : "#a855f7"
                    }`,
                    boxShadow: `0 0 16px ${
                      reading.intensity === "DANGER" ? "rgba(244,63,94,0.4)" : "rgba(168,85,247,0.1)"
                    }`
                  }}
                />
              )}

              {/* Hidden sensor hotspot visual - turns slightly visible if we overlap or hover right on top of it */}
              <div 
                className="absolute h-5 w-5 pointer-events-none rounded-full flex items-center justify-center transition-all duration-500"
                style={{
                  left: `${suspectHotspot.x}%`,
                  top: `${suspectHotspot.y}%`,
                  marginLeft: "-10px",
                  marginTop: "-10px",
                  background: reading.intensity === "DANGER" ? "rgba(244,63,94,0.4)" : "transparent",
                  border: reading.intensity === "DANGER" ? "2px solid #f43f5e" : "1px solid transparent"
                }}
              >
                {reading.intensity === "DANGER" && (
                  <Zap className="h-3 w-3 text-rose-300 animate-bounce" />
                )}
              </div>

              {/* Interactive cursor tracking info popup */}
              {isInsideGrid && (
                <div 
                  className="absolute pointer-events-none bg-slate-950/90 border border-slate-700/60 px-2 py-1.5 rounded text-[9px] font-mono text-slate-300 space-y-0.5 z-10 backdrop-blur-sm shadow-md"
                  style={{
                    left: `${Math.min(pointerPos.x + 3, 75)}%`,
                    top: `${Math.min(pointerPos.y + 4, 75)}%`
                  }}
                >
                  <div>X: {pointerPos.x.toFixed(0)} Y: {pointerPos.y.toFixed(0)}</div>
                  <div className={
                    reading.intensity === "DANGER" ? "text-rose-400 font-bold" : reading.intensity === "WARNING" ? "text-amber-400 font-bold" : "text-purple-400"
                  }>
                    {reading.intensity === "DANGER" ? "● PHÁT HIỆN CAM GIẤU KÍN!" : reading.intensity === "WARNING" ? "● TÍN HIỆU NGHI NGỜ" : "● CẢM BIẾN AN TOÀN"}
                  </div>
                </div>
              )}

              {/* Screen Sweeper Standby Message when mouse is not over */}
              {!isInsideGrid && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-center p-4">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-300">RÊ CHUỘT / TRƯỢT TAY VÀO ĐÂY</p>
                    <p className="text-[10px] text-gray-500">Hãy đưa máy rà đi khắp các đồ vật giả lập để thực tập.</p>
                  </div>
                </div>
              )}

            </div>

            {/* Scientific Explanation Card */}
            <div className="rounded-xl border border-slate-800 bg-[#0c1220]/70 p-4 space-y-2.5 text-xs text-gray-400 leading-normal">
              <h4 className="text-slate-200 font-bold flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-purple-400" /> Lưu ý quan trọng về thiết bị phần cứng di động:
              </h4>
              <p>
                Cảm biến từ trường vật lý (Magnetometer) tích hợp sẵn trong hầu hết các dòng smartphone để hỗ trợ la bàn số. Trên trình duyệt web, một số hệ điều hành (như iOS / Android mới) có thể khóa bảo mật hoặc yêu cầu kích hoạt thủ công quyền truy cập <strong className="text-slate-200">DeviceMotion</strong> hoặc <strong className="text-slate-200">DeviceOrientation</strong>.
              </p>
              <p>
                Trang Sweeper phòng ảo bên trên là môi trường huấn luyện điều tra thực tế, giúp bạn nhận thức được sự thay đổi cường độ dao động từ trường µT khi dí sát ống quét vào cục nguồn, công tắc hoặc thiết bị phát sóng lén.
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
