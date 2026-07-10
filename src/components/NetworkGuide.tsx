import React, { useState } from "react";
import { Wifi, Search, AlertTriangle, ShieldCheck, CheckCircle2, RefreshCw, Smartphone, Monitor, ShieldAlert, Cpu } from "lucide-react";
import { NetworkDevice } from "../types";
import { motion, AnimatePresence } from "motion/react";

export default function NetworkGuide() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [devices, setDevices] = useState<NetworkDevice[]>([]);
  const [scannedOnce, setScannedOnce] = useState(false);

  // List of mock devices to be revealed sequentially during the scan
  const sampleDevices: NetworkDevice[] = [
    {
      ip: "192.168.1.1",
      mac: "00:1A:2B:3C:4D:5E",
      name: "Gateway / Router Wi-Fi",
      vendor: "TP-Link Corporation",
      isSuspicious: false,
      reasons: [],
      portsOpen: [80, 443]
    },
    {
      ip: "192.168.1.104",
      mac: "B4:E6:2A:1C:89:D2",
      name: "Điện thoại của bạn (Thiết bị này)",
      vendor: "Apple Inc. (iPhone)",
      isSuspicious: false,
      reasons: [],
      portsOpen: []
    },
    {
      ip: "192.168.1.115",
      mac: "D8:B3:77:3E:AA:90",
      name: "CCTV-CAM_IP_X12",
      vendor: "Shenzhen Hikvision Digital",
      isSuspicious: true,
      reasons: [
        "Thiết bị mở cổng ghi hình RTSP (Port 554) truyền luồng video thời gian thực",
        "Tên thiết bị chứa định dạng 'CAM' đáng nghi",
        "Không có danh tính người dùng cụ thể"
      ],
      portsOpen: [80, 554, 8080]
    },
    {
      ip: "192.168.1.120",
      mac: "AC:CF:23:4C:E5:61",
      name: "Smart Plug SmartLife",
      vendor: "Tuya Smart Co.",
      isSuspicious: false,
      reasons: [],
      portsOpen: [80]
    },
    {
      ip: "192.168.1.201",
      mac: "00:0E:C6:A1:0F:77",
      name: "Thiết bị không tên (Unknown Device)",
      vendor: "Generic Wireless chip",
      isSuspicious: true,
      reasons: [
        "Ẩn danh hoàn toàn, không cung cấp tên máy (hostname)",
        "Mở cổng máy chủ web nội bộ chưa xác minh (Port 81)",
        "Đang truyền gói tin liên tục tốc độ cao (Video Streaming)"
      ],
      portsOpen: [81]
    }
  ];

  const runNetworkScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    setDevices([]);
    setScannedOnce(true);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 4;
      setScanProgress(progress);

      // Dynamically push discovered devices based on scanning steps
      if (progress === 20) {
        setDevices(prev => [sampleDevices[0]]);
      } else if (progress === 44) {
        setDevices(prev => [...prev, sampleDevices[1]]);
      } else if (progress === 68) {
        setDevices(prev => [...prev, sampleDevices[2]]);
      } else if (progress === 88) {
        setDevices(prev => [...prev, sampleDevices[3], sampleDevices[4]]);
      }

      if (progress >= 100) {
        clearInterval(interval);
        setIsScanning(false);
      }
    }, 120);
  };

  const suspiciousCount = devices.filter(d => d.isSuspicious).length;

  return (
    <div className="space-y-8" id="network-guide-view">
      
      {/* Header info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Wifi className="h-5 w-5 text-blue-400" />
            Bộ dò quét mạng Wi-Fi & Phát hiện rò rỉ dữ liệu
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Quét và lọc các thiết bị phần cứng đang dùng chung một điểm truy cập Wi-Fi với bạn để bóc tách camera IP không dây bí mật.
          </p>
        </div>

        {!isScanning && (
          <button
            onClick={runNetworkScan}
            className="self-start px-4 py-2 bg-blue-500 hover:bg-blue-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all flex items-center gap-2"
            id="btn-scan-network"
          >
            <Search className="h-4 w-4" /> 
            {scannedOnce ? "Quét lại mạng Wi-Fi" : "Kích hoạt quét Wi-Fi"}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Interactive network list of devices */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-[#111827]/60 p-5 backdrop-blur-md min-h-[400px] flex flex-col justify-between" id="network-devices-card">
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Danh sách thiết bị kết nối ({devices.length})</span>
                {isScanning && (
                  <span className="text-xs text-blue-400 font-mono flex items-center gap-1">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Đang quét {scanProgress}%
                  </span>
                )}
              </div>

              {/* Progress bar */}
              {isScanning && (
                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-400 transition-all duration-150" style={{ width: `${scanProgress}%` }} />
                </div>
              )}

              {/* Device items listed dynamically */}
              <div className="space-y-3.5 mt-4" id="devices-list">
                <AnimatePresence>
                  {devices.length > 0 ? (
                    devices.map((dev) => (
                      <motion.div
                        key={dev.ip}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                          dev.isSuspicious
                            ? "bg-rose-500/5 border-rose-500/20 hover:border-rose-500/30"
                            : "bg-slate-900/40 border-slate-800/80 hover:border-slate-700/50"
                        }`}
                      >
                        <div className="flex gap-3.5">
                          <div className={`p-2.5 rounded-xl border self-start ${
                            dev.isSuspicious 
                              ? "bg-rose-500/10 border-rose-500/20 text-rose-400" 
                              : "bg-slate-800 border-slate-700 text-slate-400"
                          }`}>
                            {dev.isSuspicious ? <ShieldAlert className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-200">{dev.name}</h4>
                              {dev.isSuspicious && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 uppercase tracking-wide border border-rose-500/30">
                                  NGHI NGỜ CAO
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400">{dev.vendor}</p>
                            
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1.5 text-[10px] font-mono text-gray-500">
                              <span>IP: <strong className="text-slate-400">{dev.ip}</strong></span>
                              <span>MAC: <strong className="text-slate-400">{dev.mac}</strong></span>
                            </div>

                            {/* Show open suspicious ports */}
                            {dev.portsOpen.length > 0 && (
                              <div className="flex items-center gap-1.5 pt-1">
                                <span className="text-[10px] text-gray-500">Cổng phát sóng mở:</span>
                                <div className="flex gap-1">
                                  {dev.portsOpen.map(p => (
                                    <span key={p} className={`text-[9px] font-mono font-bold px-1.5 rounded ${
                                      p === 554 || p === 81 || p === 8080 
                                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/20" 
                                        : "bg-slate-800 text-slate-400"
                                    }`}>
                                      {p}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Show warning explanation */}
                            {dev.isSuspicious && dev.reasons.length > 0 && (
                              <div className="mt-2.5 pl-2.5 border-l-2 border-rose-500/40 space-y-1">
                                {dev.reasons.map((r, idx) => (
                                  <p key={idx} className="text-[10px] text-rose-400 leading-relaxed">• {r}</p>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : !isScanning ? (
                    // Standby view
                    <div className="py-12 text-center text-gray-500 space-y-3">
                      <div className="inline-flex rounded-full bg-slate-950 p-4 border border-slate-800 text-slate-600">
                        <Wifi className="h-8 w-8" />
                      </div>
                      <p className="text-xs max-w-xs mx-auto text-gray-400">
                        Chưa chạy rà soát. Hãy kết nối vào Wi-Fi phòng của bạn rồi bấm nút kích hoạt quét ở góc trên bên phải.
                      </p>
                    </div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>

            {scannedOnce && !isScanning && (
              <div className="border-t border-slate-800/80 pt-4 mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <span className="text-gray-400">
                  {suspiciousCount > 0 ? (
                    <span className="text-rose-400 font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="h-4.5 w-4.5" /> Phát hiện {suspiciousCount} điểm đáng nghi trong mạng nội bộ!
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                      <ShieldCheck className="h-4.5 w-4.5" /> Chúc mừng! Không tìm thấy thiết bị camera phát hình ảnh bất chính trong mạng này.
                    </span>
                  )}
                </span>
                <span className="text-[10px] font-mono text-gray-500 uppercase">Mã quét: SHA-256 SECURE</span>
              </div>
            )}

          </div>
        </div>

        {/* Right Column: Educational Guide Book on Wi-Fi Leak detection */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-[#111827]/60 p-5 backdrop-blur-md space-y-5" id="network-educational-section">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Cpu className="h-4.5 w-4.5 text-blue-400" />
              Cách tự vệ trước thiết bị Wifi giấu kín
            </h3>

            <div className="space-y-4 text-xs text-gray-400 leading-relaxed">
              
              <div className="space-y-1.5">
                <strong className="text-slate-300 block">1. Tìm kiếm Wi-Fi ẩn danh không có bảo mật:</strong>
                <p>
                  Một số camera giấu kín giá rẻ tự tạo một điểm phát Wi-Fi độc lập không mật khẩu để đối tượng truy cập trực tiếp. Hãy mở Cài đặt Wi-Fi trên điện thoại, tìm các mạng có dạng chuỗi ký tự ngẫu nhiên dài (ví dụ: <strong className="font-mono text-rose-400 text-[11px]">CAM_f9d3b4-A8</strong>, <strong className="font-mono text-rose-400 text-[11px]">HD-WIFICAM</strong>, <strong className="font-mono text-rose-400 text-[11px]">Tuya_10283</strong>) và tránh xa hoặc báo cáo ngay.
                </p>
              </div>

              <div className="space-y-1.5 border-t border-slate-800/80 pt-3">
                <strong className="text-slate-300 block">2. Cổng dịch vụ RTSP nguy hiểm là gì?</strong>
                <p>
                  RTSP (Real-Time Streaming Protocol) chạy trên cổng <strong className="text-slate-200">554</strong> là giao thức tiêu chuẩn để máy quay truyền video trực tuyến. Khi quét mạng, nếu phát hiện thiết bị mở cổng 554, 8080, hoặc 81, khả năng cực kỳ cao đó chính là camera quay lén hoặc camera an ninh đang được lắp đặt lén lút.
                </p>
              </div>

              <div className="space-y-1.5 border-t border-slate-800/80 pt-3">
                <strong className="text-slate-300 block">3. Biện pháp triệt tiêu dữ liệu:</strong>
                <p>
                  Nếu lo lắng nhưng chưa thể định vị thiết bị vật lý, bạn có thể rút điện nguồn hộp phát Wi-Fi (Modem/Router) chính của căn phòng. Không có sóng truyền dẫn, camera ẩn sẽ không thể gửi dữ liệu trực tiếp về tay kẻ xấu bên ngoài.
                </p>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
