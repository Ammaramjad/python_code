import type { FieldMap, RankedCandidate } from "./rank";

export function nextFollowUp(input: {
  fields: FieldMap;
  candidates: RankedCandidate[];
  imageWeak: boolean;
}): { question: string; reason: string } {
  const marking = input.fields.marking?.value;
  const measure = input.fields.measurementKind?.value;
  const finish = input.fields.finish?.value;
  const leaders = input.candidates.slice(0, 2);
  if (input.imageWeak && !marking) {
    return {
      question:
        "這張照片還不足以對應目錄。請用尺量實際長寬（公分），並拍攝磚背面或包裝上的印字。示範比對只使用顏色版面，不能單靠照片認定品項。",
      reason: "圖像訊號弱，需要尺寸或印字。",
    };
  }
  if (!marking && leaders.length >= 2) {
    return {
      question: "兩款磚的照片很接近。請拍攝背面或包裝上的印字（例如型號），並用尺量實際長寬，回覆公分或毫米。",
      reason: "圖像接近時，印字最能分開候選。",
    };
  }
  if (measure !== "confirmed") {
    return {
      question: "目前尺寸是近似或未知。請用尺量實際長與寬，例如 30.0 × 30.0 公分，並註明是否含縫。",
      reason: "近似尺寸不能驗證為相同品。",
    };
  }
  if (!finish) {
    return {
      question: "請補充表面是霧面、亮面或止滑，最好在自然光下再拍一張。",
      reason: "表面處理可以排除不同系列。",
    };
  }
  if (!marking) {
    return {
      question: "請拍攝磚背面或紙箱上的產品印字，方便與目錄型號核對。",
      reason: "沒有印字就不能驗證為相同品。",
    };
  }
  return {
    question: "請再確認需要的片數、要自取或送到，以及希望的交期。",
    reason: "身份線索已足夠，接著確認交易條件。",
  };
}
