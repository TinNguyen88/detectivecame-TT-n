import React, { useState, useRef, useEffect } from "react";
import { Camera, Eye, Sliders, RefreshCw, AlertCircle, Info, Sun, HelpCircle } from "lucide-react";
import { motion } from "motion/react";

type FilterType = "infrared" | "high-contrast-red" | "negative" | "lens-glint-threshold";

export default function LensFilter() {
  const [isActive, setIsActive] = useState(false);
  const [filter, setFilter] = useState<FilterType>("high-contrast-red");
  const [brightness, setBrightness] = useState(130);
  const [contrast, setContrast] = useState(200);
  const [threshold, setThreshold] = useState(180);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setError(null);
      setIsActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error("Lens camera error:", err);
      setIsActive(false);
      setError("Không thể khởi động camera. Vui lòng cấp quyền truy cập camera trong trình duyệt của bạn.");
    }
  };

  const stopCamera = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsActive(false);
  };

  // Run real-time Canvas video filter processing
  useEffect(() => {
    if (!isActive) return;

    const processFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) {
        animationFrameId.current = requestAnimationFrame(processFrame);
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        animationFrameId.current = requestAnimationFrame(processFrame);
        return;
      }

      // Keep canvas resolution synced to video viewport aspect ratio
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
      }

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Grab pixel array
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        const len = data.length;

        // Custom pixel manipulation filters
        if (filter === "high-contrast-red") {
          // Boosts red and amplifies highlights to look like lens reflection
          for (let i = 0; i < len; i += 4) {
            let r = data[i];
            let g = data[i+1];
            let b = data[i+2];

            // Convert to grayscale first
            let gray = 0.299 * r + 0.587 * g + 0.114 * b;
            
            // Apply bright highlight amplification
            let val = gray * (brightness / 100);
            val = ((val - 128) * (contrast / 100)) + 128;
            val = Math.max(0, Math.min(255, val));

            if (val > threshold) {
              // Lens glint suspect spot: Paint glowing hot red
              data[i] = 255;
              data[i+1] = 0;
              data[i+2] = 0;
            } else {
              // Dim background: convert to dark gray/blue ambient
              data[i] = val * 0.15;
              data[i+1] = val * 0.25;
              data[i+2] = val * 0.35;
            }
          }
        } else if (filter === "infrared") {
          // Simulate infra-red camera filter (black and white with slight violet glow)
          for (let i = 0; i < len; i += 4) {
            let r = data[i];
            let g = data[i+1];
            let b = data[i+2];

            let gray = 0.3 * r + 0.59 * g + 0.11 * b;
            let val = gray * (brightness / 120);
            val = ((val - 128) * (contrast / 100)) + 128;
            val = Math.max(0, Math.min(255, val));

            // Violet tint for infrared effect
            data[i] = val;
            data[i+1] = val * 0.8;
            data[i+2] = val * 1.1; // boost blue for violet
          }
        } else if (filter === "negative") {
          // Negative filter makes hidden pinholes inside dark crevices show as light circles
          for (let i = 0; i < len; i += 4) {
            data[i] = 255 - data[i];     // Invert Red
            data[i+1] = 255 - data[i+1]; // Invert Green
            data[i+2] = 255 - data[i+2]; // Invert Blue
          }
        } else if (filter === "lens-glint-threshold") {
          // Hard binary threshold to filter out background and only keep intense highlights/light spots
          for (let i = 0; i < len; i += 4) {
            let r = data[i];
            let g = data[i+1];
            let b = data[i+2];

            let maxColor = Math.max(r, g, b);
            let brightnessVal = (r + g + b) / 3;

            if (brightnessVal > threshold && maxColor > 220) {
              // Keep intense light points glowing yellow/white
              data[i] = 255;
              data[i+1] = 255;
              data[i+2] = 0;
            } else {
              // Turn off everything else to pitch black
              data[i] = 0;
              data[i+1] = 0;
              data[i+2] = 0;
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);
      }

      animationFrameId.current = requestAnimationFrame(processFrame);
    };

    animationFrameId.current = requestAnimationFrame(processFrame);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isActive, filter, brightness, contrast, threshold]);

  return (
    <div className="space-y-8" id="lens-filter-view">
      
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Camera className="h-5 w-5 text-cyan-400" />
            Bộ lọc phát hiện phản quang thấu kính
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Mô phỏng thấu kính đặc biệt để phát hiện tia phản chiếu cực nhỏ từ tròng kính camera ẩn khi bạn bật đèn flash điện thoại.
          </p>
        </div>
        
        {isActive && (
          <button 
            onClick={stopCamera}
            className="self-start inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-800 bg-rose-500/10 text-rose-400 hover:text-white hover:bg-rose-600 transition-all"
            id="btn-stop-filter"
          >
            Tắt camera bộ lọc
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Real-time filter viewfinder */}
        <div className="lg:col-span-8 space-y-4">
          <div className="relative rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden aspect-video flex flex-col items-center justify-center" id="filter-viewfinder">
            
            {/* Native Video element hidden, used only to feed the canvas */}
            <video 
              ref={videoRef}
              autoPlay
              playsInline
              className="hidden"
            />

            {isActive ? (
              // Active Canvas Viewfinder
              <canvas 
                ref={canvasRef}
                className="w-full h-full object-cover"
              />
            ) : (
              // Standby/Launch View
              <div className="text-center p-8 space-y-4 max-w-md">
                <div className="inline-flex rounded-full bg-cyan-500/10 p-5 text-cyan-400">
                  <Camera className="h-10 w-10 animate-pulse" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-base font-bold text-slate-200">Kích hoạt ống ngắm phản quang</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Hệ thống sẽ bật camera sau của điện thoại và áp dụng thuật toán tăng độ tương phản hạt để tìm kiếm đốm sáng đặc thù của mắt thấu kính.
                  </p>
                </div>
                <button
                  onClick={startCamera}
                  className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-cyan-500/10 transition-all flex items-center justify-center gap-2 mx-auto"
                  id="btn-start-filter-cam"
                >
                  <Eye className="h-4 w-4" /> Bật Bộ Lọc Dò Thấu Kính
                </button>
              </div>
            )}

            {/* In-view overlay for instructions when camera is active */}
            {isActive && (
              <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none">
                <div className="rounded-lg bg-black/70 px-3 py-1.5 text-[10px] font-mono text-cyan-400 border border-cyan-500/20 backdrop-blur-sm flex items-center gap-1.5 uppercase">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping"></span>
                  LỌC: {filter.replace(/-/g, " ")}
                </div>
                <div className="rounded-lg bg-black/70 px-3 py-1.5 text-[10px] font-mono text-white/80 border border-slate-700 backdrop-blur-sm">
                  CỰC CẬN QUANG HỌC
                </div>
              </div>
            )}
          </div>

          {/* Quick Guide & Scientific Principle */}
          <div className="rounded-2xl border border-slate-800 bg-[#111827]/40 p-5 backdrop-blur-sm grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="h-4 w-4 text-cyan-400" /> Cách thực hiện quét tối ưu:
              </h4>
              <ul className="space-y-2 text-xs text-gray-400">
                <li className="flex gap-2">
                  <span className="text-cyan-400 font-bold">•</span>
                  Tắt bớt đèn trong phòng để tạo không gian tối hoặc ánh sáng yếu.
                </li>
                <li className="flex gap-2">
                  <span className="text-cyan-400 font-bold">•</span>
                  Bật đèn Flashlight điện thoại (hoặc đèn hồng ngoại) rọi thẳng vào hướng vật thể nghi ngờ.
                </li>
                <li className="flex gap-2">
                  <span className="text-cyan-400 font-bold">•</span>
                  Nhìn qua màn hình bộ lọc này: Nếu thấu kính camera giấu kín phản xạ ánh sáng đèn flash, một chấm sáng cực mạnh (đỏ hoặc vàng) sẽ hiện lên lấp lánh nổi bật.
                </li>
              </ul>
            </div>

            <div className="space-y-2 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Sun className="h-4 w-4 text-cyan-400" /> Nguyên lý vật lý:
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Thấu kính máy ảnh (lens) luôn được làm từ thủy tinh cong có tráng lớp phủ chống lóa. Khi ánh sáng hội tụ đi vào, một lượng bức xạ nhỏ bị dội ngược ra (lóa thấu kính). Bộ lọc contrast cao triệt tiêu màu sắc vô hại khác, giữ lại và nhuộm đỏ điểm lóa giúp mắt người nhận biết dễ dàng.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Filter Adjustments Console */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-[#111827]/60 p-5 backdrop-blur-md space-y-6" id="filter-panel-settings">
            <h3 className="text-sm font-semibold text-slate-200 border-b border-slate-800/80 pb-3 flex items-center gap-2">
              <Sliders className="h-4.5 w-4.5 text-cyan-400" />
              Bảng điều khiển thông số lọc
            </h3>

            {/* Filter Modes list */}
            <div className="space-y-2">
              <label className="text-xs text-slate-400 block font-medium">Chế độ bộ lọc hiển thị</label>
              <div className="grid grid-cols-2 gap-2" id="filter-mode-selectors">
                
                <button
                  onClick={() => setFilter("high-contrast-red")}
                  className={`px-3 py-2.5 rounded-xl border text-xs text-left transition-all ${
                    filter === "high-contrast-red"
                      ? "bg-rose-500/10 border-rose-500/40 text-rose-400"
                      : "bg-slate-900/40 border-slate-800 text-gray-400 hover:bg-slate-900/60"
                  }`}
                >
                  <strong className="block text-[11px] text-white">Quang Phổ Đỏ</strong>
                  <span className="text-[9px] opacity-75">Tô đỏ điểm lóa</span>
                </button>

                <button
                  onClick={() => setFilter("lens-glint-threshold")}
                  className={`px-3 py-2.5 rounded-xl border text-xs text-left transition-all ${
                    filter === "lens-glint-threshold"
                      ? "bg-amber-500/10 border-amber-500/40 text-amber-400"
                      : "bg-slate-900/40 border-slate-800 text-gray-400 hover:bg-slate-900/60"
                  }`}
                >
                  <strong className="block text-[11px] text-white">Lọc Đốm Sáng</strong>
                  <span className="text-[9px] opacity-75">Chỉ giữ đốm lóa</span>
                </button>

                <button
                  onClick={() => setFilter("infrared")}
                  className={`px-3 py-2.5 rounded-xl border text-xs text-left transition-all ${
                    filter === "infrared"
                      ? "bg-purple-500/10 border-purple-500/40 text-purple-400"
                      : "bg-slate-900/40 border-slate-800 text-gray-400 hover:bg-slate-900/60"
                  }`}
                >
                  <strong className="block text-[11px] text-white">Mô phỏng IR</strong>
                  <span className="text-[9px] opacity-75">Nhìn trong tối</span>
                </button>

                <button
                  onClick={() => setFilter("negative")}
                  className={`px-3 py-2.5 rounded-xl border text-xs text-left transition-all ${
                    filter === "negative"
                      ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-400"
                      : "bg-slate-900/40 border-slate-800 text-gray-400 hover:bg-slate-900/60"
                  }`}
                >
                  <strong className="block text-[11px] text-white">Màu Âm Bản</strong>
                  <span className="text-[9px] opacity-75">Đảo ngược sắc</span>
                </button>

              </div>
            </div>

            {/* Sliders parameters */}
            <div className="space-y-4 pt-4 border-t border-slate-800/80">
              
              {/* Threshold Slider */}
              {(filter === "high-contrast-red" || filter === "lens-glint-threshold") && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Ngưỡng lọc lóa sáng (Threshold)</span>
                    <span className="font-mono text-cyan-400 font-bold">{threshold}</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="240"
                    value={threshold}
                    onChange={(e) => setThreshold(Number(e.target.value))}
                    disabled={!isActive}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 disabled:opacity-30"
                  />
                  <p className="text-[10px] text-gray-500">
                    Kéo sang phải để lọc bớt nguồn sáng nhiễu nhẹ, chỉ giữ lại đốm sáng phản quang cực mạnh.
                  </p>
                </div>
              )}

              {/* Brightness Slider */}
              {filter !== "negative" && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Độ phơi sáng (Exposure/Brightness)</span>
                    <span className="font-mono text-cyan-400 font-bold">{brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="200"
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    disabled={!isActive}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 disabled:opacity-30"
                  />
                </div>
              )}

              {/* Contrast Slider */}
              {(filter === "high-contrast-red" || filter === "infrared") && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Độ tương phản hạt (Contrast)</span>
                    <span className="font-mono text-cyan-400 font-bold">{contrast}%</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="300"
                    value={contrast}
                    onChange={(e) => setContrast(Number(e.target.value))}
                    disabled={!isActive}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 disabled:opacity-30"
                  />
                </div>
              )}

            </div>

            {error && (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs text-rose-400 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="rounded-xl border border-slate-800/80 bg-[#0c1220]/70 p-3 flex gap-2.5 items-start text-xs text-gray-500 leading-normal">
              <Info className="h-4.5 w-4.5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Khuyến nghị:</strong> Bạn có thể dùng dán một miếng băng keo trong có tô bút lông đỏ đè lên đèn flash camera để giả lập luồng sóng phản hồi hồng ngoại (IR Filter).
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
