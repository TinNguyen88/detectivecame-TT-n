export interface AiResult {
  suspectLevel: "LOW" | "MEDIUM" | "HIGH";
  confidence: number;
  detectedObjects: string[];
  reasoning: string;
  riskAnalysis: string;
  recommendations: string[];
}

export type TabType = "dashboard" | "ai-scanner" | "lens-filter" | "emf-meter" | "network-guide";

export interface EmfReading {
  x: number;
  y: number;
  z: number;
  total: number;
  isCalibrated: boolean;
  intensity: "SAFE" | "WARNING" | "DANGER";
}

export interface NetworkDevice {
  ip: string;
  mac: string;
  name: string;
  vendor: string;
  isSuspicious: boolean;
  reasons: string[];
  portsOpen: number[];
}
