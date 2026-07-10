import React, { useState } from "react";
import { 
  Shield, 
  ShieldAlert, 
  Camera, 
  Radio, 
  Wifi, 
  Cpu, 
  AlertTriangle, 
  CheckCircle, 
  HelpCircle, 
  ArrowRight,
  Eye,
  Info
} from "lucide-react";
import { TabType } from "../types";
import { motion } from "motion/react";

interface DashboardProps {
  onNavigate: (tab: TabType) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  // Simple risk assessment quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<number, boolean>>({});
  const [showQuizResult, setShowQuizResult] = useState(false);

  const quizQuestions = [
    { id: 1, text: "Bạn đang ở trong phòng khách sạn, nhà nghỉ, homestay mới?" },
    { id: 2, text: "Có đồ vật nào đặt ở góc nhìn trực diện giường ngủ/phòng tắm không? (đồng hồ, ổ cắm, củ sạc, máy báo khói)" },
    { id: 3, text: "Bạn phát hiện các lỗ tròn nhỏ bất thường (1-2mm) trên đồ vật trong phòng?" },
    { id: 4, text: "Gần đây bạn có nghe thấy các tiếng động cơ học hoặc tiếng 'tích' cực nhỏ phát ra trong phòng tối không?" },
    { id: 5, text: "Danh sách Wi-Fi trong phòng có tên lạ chứa chuỗi số và chữ dài bất thường?" }
  ];

  const handleQuizAnswer = (qId: number, answer: boolean) => {
    setQuizAnswers(prev => ({ ...prev, [qId]: answer }));
  };

  const answeredCount = Object.keys(quizAnswers).length;
  const yesCount = Object.values(quizAnswers).filter(Boolean).length;

  // Estimate risk score based on quiz answers
  const getRiskLevel = () => {
    if (yesCount === 0) return { label: "AN TOÀN CAO", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10", desc: "Không phát hiện dấu hiệu rủi ro sơ bộ. Tuy nhiên, vẫn nên thực hiện quét thấu kính và AI để chắc chắn 100%." };
    if (yesCount <= 2) return { label: "NGUY CƠ TRUNG BÌNH", color: "text-amber-400 border-amber-500/30 bg-amber-500/10", desc: "Có một vài dấu hiệu nghi ngờ cơ bản. Hãy ưu tiên kiểm tra các đồ vật hướng vào khu vực nhạy cảm." };
    return { label: "RẤT ĐÁNG NGHI", color: "text-rose-400 border-rose-500/30 bg-rose-500/10", desc: "Nhiều dấu hiệu cảnh báo cao! Hãy lập tức kích hoạt bộ quét EMF và camera thấu kính phản quang để tìm kiếm." };
  };

  const riskInfo = getRiskLevel();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
      id="dashboard-view"
    >
      {/* Welcome & Status Banner */}
      <motion.div 
        variants={itemVariants} 
        className="relative overflow-hidden rounded-3xl border border-emerald-500/10 bg-[#161F34]/50 p-6 sm:p-8 md:p-10 backdrop-blur-md"
        id="status-banner"
      >
        <div className="absolute top-0 right-0 -mt-12 -mr-12 h-44 w-44 rounded-full bg-emerald-500/10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 h-44 w-44 rounded-full bg-blue-500/10 blur-3xl"></div>

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold tracking-wider text-emerald-400 uppercase">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400"></span>
              Lớp bảo vệ quyền riêng tư tích cực
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Phát Hiện Camera Giấu Kín
            </h1>
            <p className="text-sm text-gray-400 leading-relaxed">
              Tránh nguy cơ bị quay lén, bảo vệ sự riêng tư tuyệt đối tại khách sạn, nhà nghỉ, phòng thử đồ bằng các công nghệ kiểm tra cảm biến tiên tiến phối hợp AI thông minh.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-700/50 bg-[#1e2942]/60 p-5 min-w-[200px] text-center">
            <Shield className="h-10 w-10 text-emerald-400 mb-2 animate-pulse" />
            <span className="text-xs text-gray-400">Trạng Thái Phòng Của Bạn</span>
            <span className="text-sm font-mono font-semibold text-emerald-400 mt-1">SẴN SÀNG QUÉT</span>
          </div>
        </div>
      </motion.div>

      {/* 4 Core Features Quick Launcher */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            Công cụ quét nâng cao
          </h2>
          <span className="text-xs text-gray-400">Chọn phương pháp dò tìm</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="tools-grid">
          {/* AI Scanner */}
          <motion.div 
            whileHover={{ y: -4, borderColor: "rgba(52, 211, 153, 0.4)" }}
            variants={itemVariants}
            onClick={() => onNavigate("ai-scanner")}
            className="group cursor-pointer rounded-2xl border border-slate-800 bg-[#121A2E]/80 p-5 transition-all hover:bg-[#15203A]"
            id="launch-ai-scanner"
          >
            <div className="mb-4 inline-flex rounded-xl bg-emerald-500/10 p-3 text-emerald-400 group-hover:bg-emerald-500/20">
              <Cpu className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">Quét Trí Tuệ Nhân Tạo</h3>
            <p className="mt-1.5 text-xs text-gray-400 leading-relaxed">Chụp/tải ảnh đồ vật nghi ngờ, AI Gemini sẽ phân tích cấu trúc thấu kính siêu nhỏ ngay lập tức.</p>
            <div className="mt-4 flex items-center text-xs font-semibold text-emerald-400">
              Kích hoạt ngay <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </motion.div>

          {/* Lens Reflection Filter */}
          <motion.div 
            whileHover={{ y: -4, borderColor: "rgba(52, 211, 153, 0.4)" }}
            variants={itemVariants}
            onClick={() => onNavigate("lens-filter")}
            className="group cursor-pointer rounded-2xl border border-slate-800 bg-[#121A2E]/80 p-5 transition-all hover:bg-[#15203A]"
            id="launch-lens-filter"
          >
            <div className="mb-4 inline-flex rounded-xl bg-cyan-500/10 p-3 text-cyan-400 group-hover:bg-cyan-500/20">
              <Camera className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors">Bộ Lọc Phản Quang</h3>
            <p className="mt-1.5 text-xs text-gray-400 leading-relaxed">Sử dụng thấu kính lọc màu và hiệu ứng tương phản cao để phát hiện ánh phản quang thấu kính camera.</p>
            <div className="mt-4 flex items-center text-xs font-semibold text-cyan-400">
              Kích hoạt ngay <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </motion.div>

          {/* EMF Meter */}
          <motion.div 
            whileHover={{ y: -4, borderColor: "rgba(52, 211, 153, 0.4)" }}
            variants={itemVariants}
            onClick={() => onNavigate("emf-meter")}
            className="group cursor-pointer rounded-2xl border border-slate-800 bg-[#121A2E]/80 p-5 transition-all hover:bg-[#15203A]"
            id="launch-emf-meter"
          >
            <div className="mb-4 inline-flex rounded-xl bg-purple-500/10 p-3 text-purple-400 group-hover:bg-purple-500/20">
              <Radio className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-purple-400 transition-colors">Cảm Biến Từ Trường EMF</h3>
            <p className="mt-1.5 text-xs text-gray-400 leading-relaxed">Đo lường mức bức xạ sóng điện từ phát ra từ chip máy quay, ăng-ten truyền tín hiệu giấu kín.</p>
            <div className="mt-4 flex items-center text-xs font-semibold text-purple-400">
              Kích hoạt ngay <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </motion.div>

          {/* Network Scanner Guide */}
          <motion.div 
            whileHover={{ y: -4, borderColor: "rgba(52, 211, 153, 0.4)" }}
            variants={itemVariants}
            onClick={() => onNavigate("network-guide")}
            className="group cursor-pointer rounded-2xl border border-slate-800 bg-[#121A2E]/80 p-5 transition-all hover:bg-[#15203A]"
            id="launch-network-guide"
          >
            <div className="mb-4 inline-flex rounded-xl bg-blue-500/10 p-3 text-blue-400 group-hover:bg-blue-500/20">
              <Wifi className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">Bộ Quét Mạng Wi-Fi</h3>
            <p className="mt-1.5 text-xs text-gray-400 leading-relaxed">Phân tích các thiết bị kết nối cùng mạng Wi-Fi và cảnh báo các dấu hiệu camera truyền dữ liệu bất chính.</p>
            <div className="mt-4 flex items-center text-xs font-semibold text-blue-400">
              Kích hoạt ngay <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Two-Column Section: Assessment Quiz & Emergency Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Risk Assessment Survey */}
        <motion.div 
          variants={itemVariants}
          className="lg:col-span-7 rounded-2xl border border-slate-800 bg-[#111827]/60 p-6 backdrop-blur-md"
          id="risk-assessment-section"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white">Khảo sát nguy cơ rò rỉ</h3>
              <p className="text-xs text-gray-400 mt-1">Đánh giá nhanh tình trạng an toàn không gian sống hiện tại của bạn.</p>
            </div>
            <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs font-mono text-gray-300">
              {answeredCount}/{quizQuestions.length} câu đã chọn
            </span>
          </div>

          <div className="space-y-4 mt-6">
            {quizQuestions.map((q) => (
              <div key={q.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-slate-800/60 bg-slate-900/40 gap-3">
                <span className="text-sm text-slate-300">{q.text}</span>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => handleQuizAnswer(q.id, true)}
                    className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                      quizAnswers[q.id] === true
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-slate-800/40 text-gray-400 border border-transparent hover:bg-slate-800"
                    }`}
                  >
                    Đúng
                  </button>
                  <button
                    onClick={() => handleQuizAnswer(q.id, false)}
                    className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                      quizAnswers[q.id] === false
                        ? "bg-slate-700/50 text-gray-300 border border-slate-600/30"
                        : "bg-slate-800/40 text-gray-400 border border-transparent hover:bg-slate-800"
                    }`}
                  >
                    Sai
                  </button>
                </div>
              </div>
            ))}
          </div>

          {answeredCount > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-6 rounded-xl border p-4 ${riskInfo.color}`}
              id="quiz-result-box"
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                <ShieldAlert className="h-5 w-5 flex-shrink-0" />
                DỰ ĐOÁN NGUY CƠ: {riskInfo.label}
              </div>
              <p className="mt-1.5 text-xs opacity-90 leading-relaxed">
                {riskInfo.desc}
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Emergency Handbook */}
        <motion.div 
          variants={itemVariants}
          className="lg:col-span-5 rounded-2xl border border-slate-800 bg-[#111827]/60 p-6 backdrop-blur-md flex flex-col justify-between"
          id="emergency-handbook-section"
        >
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500 animate-pulse" />
              Cẩm nang khẩn cấp
            </h3>
            <p className="text-xs text-gray-400">Nếu bạn phát hiện thiết bị quay lén thật sự, hãy tuyệt đối tuân thủ quy tắc ứng phó an toàn sau:</p>
            
            <div className="space-y-3.5 mt-4">
              <div className="flex gap-3 items-start">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500/10 text-xs font-mono font-bold text-rose-400 border border-rose-500/20">
                  1
                </span>
                <div className="text-xs">
                  <strong className="text-slate-200">Không chạm hoặc di dời thiết bị:</strong> 
                  <p className="text-gray-400 mt-0.5">Tránh làm hỏng các dấu vết vân tay, chứng cứ sinh trắc học hoặc kích hoạt chức năng xóa dữ liệu từ xa của đối tượng.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500/10 text-xs font-mono font-bold text-rose-400 border border-rose-500/20">
                  2
                </span>
                <div className="text-xs">
                  <strong className="text-slate-200">Chụp ảnh và ghi hình lại:</strong> 
                  <p className="text-gray-400 mt-0.5">Dùng điện thoại cá nhân chụp cận cảnh lỗ camera, chụp tổng thể vị trí lắp đặt để lưu lại chứng cứ xác thực.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500/10 text-xs font-mono font-bold text-rose-400 border border-rose-500/20">
                  3
                </span>
                <div className="text-xs">
                  <strong className="text-slate-200">Che chắn camera tạm thời:</strong> 
                  <p className="text-gray-400 mt-0.5">Dùng băng dính tối màu, khăn mặt, quần áo hoặc mũ bảo hiểm đè/che kín thấu kính ghi hình lại.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500/10 text-xs font-mono font-bold text-rose-400 border border-rose-500/20">
                  4
                </span>
                <div className="text-xs">
                  <strong className="text-slate-200">Báo cáo ngay lập tức:</strong> 
                  <p className="text-gray-400 mt-0.5">Trình báo ban quản lý khách sạn và cơ quan công an địa phương gần nhất để lập biên bản xử lý pháp lý.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-800/60 pt-4 flex items-center gap-2.5 text-xs text-gray-400">
            <Info className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            <span>Mọi dữ liệu hình ảnh quét AI được xử lý trên máy chủ đám mây bảo mật và tự động hủy sau khi phân tích.</span>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}
