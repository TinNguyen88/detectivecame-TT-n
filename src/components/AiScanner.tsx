import React, { useState, useRef, useEffect } from "react";
import { 
  Camera, 
  Upload, 
  Cpu, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  RefreshCw, 
  ShieldCheck, 
  Sparkles, 
  Check, 
  Eye, 
  AlertCircle,
  HelpCircle
} from "lucide-react";
import { AiResult } from "../types";
import { motion, AnimatePresence } from "motion/react";

export default function AiScanner() {
  const [image, setImage] = useState<string | null>(null);
  const [locationType, setLocationType] = useState("hotel");
  const [objectType, setObjectType] = useState("smoke_detector");
  const [customObject, setCustomObject] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AiResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  // Camera states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Drag and drop states
  const [isDragging, setIsDragging] = useState(false);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setError(null);
      setIsCameraActive(true);
      setResult(null);
      setImage(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setIsCameraActive(false);
      setError("Không thể truy cập camera. Vui lòng cấp quyền camera hoặc tải ảnh từ máy của bạn.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg");
        setImage(dataUrl);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setError(null);
    setResult(null);
    if (!file.type.startsWith("image/")) {
      setError("Vui lòng tải lên tập tin hình ảnh hợp lệ (PNG, JPG, JPEG).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImage(event.target.result as string);
      }
    };
    reader.onerror = () => {
      setError("Không thể đọc file hình ảnh.");
    };
    reader.readAsDataURL(file);
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const clearImage = () => {
    setImage(null);
    setResult(null);
    setError(null);
    setCompletedSteps({});
    stopCamera();
  };

  const triggerAnalysis = async () => {
    if (!image) return;
    
    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    setCompletedSteps({});

    const actualObjectType = objectType === "other" ? customObject : objectType;

    try {
      const response = await fetch("/api/detect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          image,
          locationType,
          objectType: actualObjectType
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Phân tích thất bại");
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Không thể kết nối đến máy chủ phân tích AI. Vui lòng thử lại sau.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleStep = (index: number) => {
    setCompletedSteps(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const getSuspectBadgeColor = (level: string) => {
    switch (level) {
      case "LOW":
        return {
          bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
          label: "An toàn / Nghi ngờ thấp",
          icon: <ShieldCheck className="h-5 w-5 text-emerald-400" />
        };
      case "MEDIUM":
        return {
          bg: "bg-amber-500/10 border-amber-500/30 text-amber-400",
          label: "Cần cảnh giác / Nghi ngờ trung bình",
          icon: <AlertCircle className="h-5 w-5 text-amber-400" />
        };
      case "HIGH":
        return {
          bg: "bg-rose-500/10 border-rose-500/30 text-rose-400",
          label: "CẢNH BÁO CAO / Nguy hiểm",
          icon: <AlertTriangle className="h-5 w-5 text-rose-400 animate-pulse" />
        };
      default:
        return {
          bg: "bg-slate-500/10 border-slate-500/30 text-slate-400",
          label: "Không xác định",
          icon: <HelpCircle className="h-5 w-5 text-slate-400" />
        };
    }
  };

  return (
    <div className="space-y-8" id="ai-scanner-view">
      
      {/* Header and Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Cpu className="h-5 w-5 text-emerald-400" />
            Máy quét ẩn thấu kính AI thông minh
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Ứng dụng thị giác máy tính của Gemini AI để bóc tách cấu trúc vi mạch, thấu kính camera ẩn.
          </p>
        </div>
        
        {image && !isAnalyzing && (
          <button 
            onClick={clearImage}
            className="self-start inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Quét lại thiết bị khác
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Image Input & Configurations */}
        <div className="lg:col-span-6 space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-[#111827]/60 p-5 backdrop-blur-md space-y-5">
            <h3 className="text-sm font-semibold text-slate-200">1. Cung cấp hình ảnh thiết bị nghi ngờ</h3>

            {/* Media Area */}
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative overflow-hidden rounded-xl border-2 border-dashed aspect-video flex flex-col items-center justify-center transition-all ${
                isDragging ? "border-emerald-400 bg-emerald-500/5" : "border-slate-800 bg-[#0c1220]/70"
              }`}
              id="image-dropzone"
            >
              {isCameraActive ? (
                // Live camera preview
                <div className="absolute inset-0 w-full h-full flex flex-col">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3 px-4">
                    <button
                      onClick={capturePhoto}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1"
                      id="btn-capture"
                    >
                      <Camera className="h-4 w-4" /> Chụp ảnh
                    </button>
                    <button
                      onClick={stopCamera}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-all"
                      id="btn-stop-camera"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ) : image ? (
                // Captured/Uploaded image preview
                <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/40">
                  <img 
                    src={image} 
                    alt="Suspicious object preview" 
                    className="max-w-full max-h-full object-contain"
                  />
                  
                  {/* Glowing scan bar overlay during analysis */}
                  <AnimatePresence>
                    {isAnalyzing && (
                      <motion.div 
                        initial={{ top: "0%" }}
                        animate={{ top: "100%" }}
                        exit={{ opacity: 0 }}
                        transition={{ 
                          repeat: Infinity, 
                          repeatType: "reverse", 
                          duration: 2, 
                          ease: "easeInOut" 
                        }}
                        className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_rgba(52,211,153,0.8)] z-10"
                      />
                    )}
                  </AnimatePresence>

                  <button
                    onClick={() => setImage(null)}
                    disabled={isAnalyzing}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white hover:text-rose-400 transition-all"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                // Default dropzone UI
                <div className="text-center p-6 space-y-4">
                  <div className="inline-flex rounded-full bg-slate-900 border border-slate-800 p-4 text-slate-400">
                    <Camera className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-300">
                      Kéo thả hình ảnh vào đây, hoặc
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                      <label className="cursor-pointer px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all flex items-center gap-1">
                        <Upload className="h-3.5 w-3.5" /> Chọn tệp tin
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleFileUpload} 
                          className="hidden" 
                        />
                      </label>
                      <button 
                        onClick={startCamera}
                        className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-all flex items-center gap-1"
                      >
                        <Camera className="h-3.5 w-3.5" /> Dùng camera trực tiếp
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500">Hỗ trợ định dạng JPG, PNG, WEBP tối đa 20MB</p>
                </div>
              )}
            </div>

            {/* Config Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Vị trí chụp ảnh</label>
                <select
                  value={locationType}
                  onChange={(e) => setLocationType(e.target.value)}
                  disabled={isAnalyzing}
                  className="w-full text-xs rounded-lg border border-slate-800 bg-[#0b0f19] px-3.5 py-2 text-slate-200 focus:border-emerald-500/50 focus:outline-none"
                >
                  <option value="hotel">Khách sạn / Nhà nghỉ / Homestay</option>
                  <option value="bathroom">Phòng tắm / Nhà vệ sinh</option>
                  <option value="changing_room">Phòng thử đồ / Thay quần áo</option>
                  <option value="bedroom">Phòng ngủ gia đình</option>
                  <option value="office">Văn phòng / Phòng họp công ty</option>
                  <option value="airbnb">Căn hộ cho thuê Airbnb</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Vật thể nghi ngờ</label>
                <select
                  value={objectType}
                  onChange={(e) => setObjectType(e.target.value)}
                  disabled={isAnalyzing}
                  className="w-full text-xs rounded-lg border border-slate-800 bg-[#0b0f19] px-3.5 py-2 text-slate-200 focus:border-emerald-500/50 focus:outline-none"
                >
                  <option value="smoke_detector">Đầu báo khói / Báo cháy</option>
                  <option value="power_outlet">Ổ cắm điện / Công tắc</option>
                  <option value="wall_clock">Đồng hồ treo tường</option>
                  <option value="charger_adapter">Củ sạc điện thoại / Thiết bị điện</option>
                  <option value="mirror">Gương treo tường / Kính</option>
                  <option value="screw_fastener">Ốc vít / Đinh vít gắn tường</option>
                  <option value="toys_teddy">Thú bông / Đồ trang trí</option>
                  <option value="other">Vật thể khác...</option>
                </select>
              </div>
            </div>

            {objectType === "other" && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-1.5"
              >
                <label className="text-xs font-medium text-slate-400">Mô tả vật thể nghi ngờ</label>
                <input
                  type="text"
                  value={customObject}
                  onChange={(e) => setCustomObject(e.target.value)}
                  placeholder="Ví dụ: Lọ hoa, bóng đèn ngủ, router wifi..."
                  disabled={isAnalyzing}
                  className="w-full text-xs rounded-lg border border-slate-800 bg-[#0b0f19] px-3.5 py-2 text-slate-200 focus:border-emerald-500/50 focus:outline-none"
                />
              </motion.div>
            )}

            {/* Analysis trigger button */}
            <button
              onClick={triggerAnalysis}
              disabled={!image || isAnalyzing}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 text-slate-950 disabled:text-slate-500 text-sm font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 flex items-center justify-center gap-2"
              id="btn-analyze"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Đang quét và phân tích bằng AI...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Kích hoạt AI quét phân tích thấu kính
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs text-rose-400 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block">Đã xảy ra lỗi:</strong>
                {error}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: AI Analysis Report */}
        <div className="lg:col-span-6">
          <div className="rounded-2xl border border-slate-800 bg-[#111827]/60 p-5 backdrop-blur-md h-full min-h-[400px] flex flex-col justify-between" id="analysis-report-container">
            
            <AnimatePresence mode="wait">
              {isAnalyzing ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4"
                  key="loading"
                >
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-emerald-500/10 blur-xl animate-pulse"></div>
                    <div className="h-14 w-14 rounded-full border-4 border-slate-800 border-t-emerald-400 animate-spin"></div>
                    <Cpu className="h-6 w-6 text-emerald-400 absolute top-4 left-4 animate-bounce" />
                  </div>
                  <div className="space-y-1.5 max-w-sm">
                    <h4 className="text-sm font-bold text-slate-200">Hệ thống AI đang phân tích dữ liệu...</h4>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Đang soi chiếu quang học thấu kính, kiểm tra tính đối xứng của thiết bị và phân tích dấu hiệu hồng ngoại ẩn...
                    </p>
                  </div>
                </motion.div>
              ) : result ? (
                // Detailed result report
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                  key="result"
                  id="ai-report"
                >
                  {/* Result Header Tag */}
                  <div className="space-y-3">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">KẾT QUẢ PHÂN TÍCH FORENSIC AI</span>
                    
                    <div className={`flex items-start gap-3 p-4 rounded-xl border ${getSuspectBadgeColor(result.suspectLevel).bg}`} id="suspect-alert-box">
                      {getSuspectBadgeColor(result.suspectLevel).icon}
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold">
                          {getSuspectBadgeColor(result.suspectLevel).label}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-300">Mức độ tin cậy của AI:</span>
                          <span className="font-mono text-xs font-bold">{result.confidence}%</span>
                          
                          {/* Mini visual gauge */}
                          <div className="h-1.5 w-20 rounded-full bg-slate-800 overflow-hidden">
                            <div 
                              className={`h-full ${
                                result.suspectLevel === "HIGH" ? "bg-rose-500" : result.suspectLevel === "MEDIUM" ? "bg-amber-400" : "bg-emerald-400"
                              }`} 
                              style={{ width: `${result.confidence}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detected anomalies tags */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-semibold text-slate-300">Đặc điểm phát hiện:</h5>
                    <div className="flex flex-wrap gap-2">
                      {result.detectedObjects.length > 0 ? (
                        result.detectedObjects.map((obj, i) => (
                          <span key={i} className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-800 border border-slate-700/50 text-gray-300 font-mono">
                            {obj}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-500 italic">Không phát hiện điểm bất thường cụ thể nào</span>
                      )}
                    </div>
                  </div>

                  {/* Reasoning explain */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-semibold text-slate-300">Cơ sở đánh dấu (Thị giác):</h5>
                    <p className="text-xs text-gray-400 leading-relaxed bg-[#0b0f19]/60 border border-slate-800/80 rounded-xl p-3">
                      {result.reasoning}
                    </p>
                  </div>

                  {/* Risk analysis */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-semibold text-slate-300">Đánh giá nguy cơ không gian:</h5>
                    <p className="text-xs text-gray-400 leading-relaxed bg-[#0b0f19]/60 border border-slate-800/80 rounded-xl p-3">
                      {result.riskAnalysis}
                    </p>
                  </div>

                  {/* Steps Checklist */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-semibold text-slate-300">Danh mục hành động tiếp theo của bạn:</h5>
                    <div className="space-y-2" id="recommendation-checklist">
                      {result.recommendations.map((rec, index) => (
                        <div 
                          key={index} 
                          onClick={() => toggleStep(index)}
                          className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                            completedSteps[index] 
                              ? "bg-emerald-500/5 border-emerald-500/20 text-slate-400" 
                              : "bg-slate-900/30 border-slate-800/60 hover:bg-slate-900/50"
                          }`}
                        >
                          <div className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-md border mt-0.5 transition-all ${
                            completedSteps[index] 
                              ? "bg-emerald-500 border-emerald-500 text-slate-950" 
                              : "border-slate-700"
                          }`}>
                            {completedSteps[index] && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                          <span className={`text-[11px] leading-relaxed transition-all ${completedSteps[index] ? "line-through text-slate-500" : "text-gray-300"}`}>
                            {rec}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                </motion.div>
              ) : (
                // Standby placeholder
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4"
                  key="standby"
                >
                  <div className="inline-flex rounded-full bg-slate-950 p-4 border border-slate-800/50 text-slate-500">
                    <Sparkles className="h-10 w-10" />
                  </div>
                  <div className="space-y-1 max-w-xs">
                    <h4 className="text-sm font-semibold text-slate-300">Sẵn sàng lập báo cáo an ninh</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Hãy cung cấp hình ảnh thiết bị nghi ngờ bên trái để AI tiến hành bóc tách phân tích chi tiết.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {result && !isAnalyzing && (
              <div className="border-t border-slate-800/80 pt-4 mt-6 flex items-center justify-between text-[10px] text-gray-500 font-mono">
                <span>PHÂN TÍCH HOÀN TẤT</span>
                <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Kênh bảo mật mã hóa SSL</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
