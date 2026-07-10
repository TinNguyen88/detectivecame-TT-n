import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;

function getAiClient(): GoogleGenAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY is not defined. Please configure it in Settings > Secrets.");
  }
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

async function startServer() {
  const app = express();

  // Parse JSON payloads up to 25MB for base64 images
  app.use(express.json({ limit: "25mb" }));

  // API Route: Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // API Route: AI Hidden Camera Detector
  app.post("/api/detect", async (req, res) => {
    try {
      const { image, locationType, objectType } = req.body;

      if (!image) {
        res.status(400).json({ error: "No image data provided" });
        return;
      }

      // Base64 format verification and cleaning
      let base64Data = image;
      let mimeType = "image/jpeg";

      if (image.startsWith("data:")) {
        const matches = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          mimeType = matches[1];
          base64Data = matches[2];
        }
      }

      const ai = getAiClient();

      const imagePart = {
        inlineData: {
          mimeType: mimeType,
          data: base64Data,
        },
      };

      const systemInstruction = 
        "Bạn là một chuyên gia điều tra và an ninh công nghệ cao chuyên phát hiện các thiết bị quay lén, camera giấu kín và thiết bị nghe lén siêu nhỏ. " +
        "Nhiệm vụ của bạn là phân tích hình ảnh được cung cấp một cách cực kỳ chi tiết, tìm kiếm các dấu hiệu của thấu kính máy ảnh (lens reflection), " +
        "lỗ kim pinhole nghi ngờ trên thiết bị thông thường (như ổ điện, đồng hồ, máy báo khói, vít treo tường, củ sạc, bút, chai nước, đồ chơi), " +
        "đèn hồng ngoại LED vô hình phản quang, cổng sạc/truyền dữ liệu bất thường hoặc sự lắp ráp thiếu đồng bộ. " +
        "Hãy luôn trả về kết quả bằng tiếng Việt, trung thực, mang tính cảnh giác nhưng khách quan và khoa học, không gây hoang mang không cần thiết.";

      const promptText = `
Hãy phân tích hình ảnh này để tìm các dấu hiệu của camera ẩn hoặc thiết bị giấu kín.
Thông tin bối cảnh bổ sung:
- Vị trí chụp hình: ${locationType || "Không xác định"}
- Loại vật thể người dùng nghi ngờ: ${objectType || "Vật thể thông thường"}

Hãy xem xét kỹ:
1. Có thấu kính tròn nhỏ bóng loáng phản quang (lens glint/reflection) không?
2. Có lỗ tròn bất thường (đường kính khoảng 1-2mm) ở nơi không nên có không?
3. Có cấu trúc mạch điện, cổng cắm hoặc dây nhợ lạ so với thiết bị tiêu chuẩn thông thường không?
4. Có đèn LED hồng ngoại (IR) hoặc điểm sáng đỏ/tím mờ nhạt không?

Yêu cầu đầu ra dạng cấu trúc JSON chính xác theo Schema đã cho. Tất cả nội dung tiếng Việt.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          imagePart,
          { text: promptText }
        ],
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suspectLevel: {
                type: Type.STRING,
                description: "Mức độ nghi ngờ. Phải chọn 1 trong 3 giá trị: 'LOW' (Thấp/An toàn), 'MEDIUM' (Trung bình/Cần theo dõi), 'HIGH' (Cao/Nguy hiểm)",
              },
              confidence: {
                type: Type.INTEGER,
                description: "Độ tin cậy của dự đoán tính theo phần trăm (0-100)",
              },
              detectedObjects: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Danh sách các vật thể, chi tiết hoặc điểm bất thường phát hiện được trên ảnh",
              },
              reasoning: {
                type: Type.STRING,
                description: "Phân tích kỹ lưỡng, giải thích chi tiết các dấu hiệu thị giác nhìn thấy trên ảnh làm cơ sở cho dự đoán (bằng tiếng Việt)",
              },
              riskAnalysis: {
                type: Type.STRING,
                description: "Đánh giá mức độ rủi ro dựa trên vị trí và cấu trúc vật thể, những mối nguy cơ có thể xảy ra (bằng tiếng Việt)",
              },
              recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Các bước hướng dẫn cụ thể, thực tế và hành động tiếp theo người dùng nên làm để kiểm tra hoặc tự bảo vệ (bằng tiếng Việt)",
              }
            },
            required: ["suspectLevel", "confidence", "detectedObjects", "reasoning", "riskAnalysis", "recommendations"]
          }
        }
      });

      const responseText = response.text || "{}";
      const result = JSON.parse(responseText.trim());
      res.json(result);

    } catch (error: any) {
      console.error("AI detection error:", error);
      res.status(500).json({
        error: error.message || "Đã xảy ra lỗi khi phân tích bằng AI.",
        details: error.stack
      });
    }
  });

  // Serve static assets / Vite server
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
