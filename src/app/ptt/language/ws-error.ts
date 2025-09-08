export function explainCloseCode(code: number): string {
  switch (code) {
    case 1000: return "Normal Closure (正常關閉)";
    case 1001: return "Going Away (伺服器或使用者關閉)";
    case 1002: return "Protocol Error (協議錯誤)";
    case 1003: return "Unsupported Data (不支援的資料類型)";
    case 1006: return "Abnormal Closure (非正常關閉，通常是網路問題)";
    case 1007: return "Invalid Data (資料格式錯誤)";
    case 1008: return "Policy Violation (違反伺服器政策)";
    case 1009: return "Message Too Big (訊息太大)";
    case 1011: return "Internal Error (伺服器內部錯誤)";
    default:   return `Unknown (${code})`;
  }
}
