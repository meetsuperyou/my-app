import WebSocket, {WebSocketServer} from "ws";
import * as http from "http";
import {IncomingMessage} from "http"; // 為了更清晰地標示 req 的型別
import {promises as fs} from "fs";
import path from "path";
import {mockLogin} from "./mockdata";

loadResources().then(() =>
{
  console.log(`load`);
});
const PROXY_PORT: number = 3003; // Angular 連這個
let TARGET_WS: string = "wss://ws.ptt2.cc/bbs"; // 真正 WS server
// TARGET_WS = "ws://localhost:3002";
// TARGET_WS = "ws://localhost:3002"; // 真正 WS server，測試機，可以用
//  TARGET_WS = "https://ws.ptt.cc"; // 真正 WS server 不能用
// TARGET_WS = "wss://ws.ptt2.cc/bbs"; // 真正 WS server，可以用
// TARGET_WS = "https://ws.ptt2.cc/bbs"; // 也可以用
// 建立 HTTP 伺服器
const server = http.createServer();
// 將 WebSocket 伺服器附加到 HTTP 伺服器上
const wss = new WebSocketServer({server});
// 監聽來自 Angular 客戶端的連線
wss.on("connection", (clientWs: WebSocket, _req: IncomingMessage) =>
{
  console.log("✅ Angular connected to proxy");
  // 準備要轉發到目標伺服器的自訂 header
  const headers: http.OutgoingHttpHeaders = {
    origin: "https://term.ptt2.cc",
  };

  let test=true;

  if(test)
  {
    mockLogin(clientWs);
    return ;
  }


  // 建立連向真正 WebSocket 伺服器的連線
  const targetWs = new WebSocket(TARGET_WS, {headers});
  targetWs.binaryType = "arraybuffer";

  // [轉發] 當收到來自客戶端(Angular)的訊息時，轉發給目標伺服器
  clientWs.on("message", (msg: WebSocket.RawData) =>
  {
    console.log(`utf-8=${msg.toString()};`);
    // console.log(`big5=\n${u2b(msg.toString())};`);
    console.log(`hex=\n${stringToHex(msg.toString())};`);

    if (targetWs.readyState === WebSocket.OPEN)
    {
      targetWs.send(msg);
    }
  });
  // [轉發] 當收到來自目標伺服器的訊息時，轉發給客戶端(Angular)
  targetWs.on("message", (msg: WebSocket.RawData) =>
  {
    // msg 可能是 TermBuffer，console.log 會自動調用 .toString()
    // console.log(`ptt msg\n=${msg}`);
    if (clientWs.readyState === WebSocket.OPEN)
    {
      clientWs.send(msg);
    }
  });
  // --- 連線關閉處理 ---
  // 當客戶端(Angular)斷線時，主動關閉與目標伺服器的連線
  clientWs.on("close", () =>
  {
    console.log("❌ Client closed");
    if (targetWs.readyState === WebSocket.OPEN || targetWs.readyState === WebSocket.CONNECTING)
    {
      targetWs.close();
    }
  });
  // 當目標伺服器斷線時，也關閉與客戶端(Angular)的連線
  targetWs.on("close", (code: number, reason: Buffer) =>
  {
    console.log("❌ Target server closed");
    console.log(`WebSocket closed, code: ${code}, reason: ${reason.toString()}`);
    if (clientWs.readyState === WebSocket.OPEN || clientWs.readyState === WebSocket.CONNECTING)
    {
      clientWs.close();
    }
  });
  // --- 其他事件監聽 ---
  targetWs.on("open", () => console.log("✅ Proxy connected to WS server"));
  targetWs.on("error", (err: Error) => console.error("⚠️ Target WS error:", err));
  clientWs.on("error", (err: Error) => console.error("⚠️ Client WS error:", err));
});
// 啟動代理伺服器
server.listen(PROXY_PORT, () => console.log(`🚀 Proxy WS running on ${PROXY_PORT}`));

export function u2b(it: string)
{
  if (!lib.u2bArray || !lib.b2uArray)
  {
    return "";
  }
  let data = "";
  for (let i = 0; i < it.length; ++i)
  {
    if (it.charAt(i) < "\x80")
    {
      data += it.charAt(i);
      continue;
    }
    let pos = it.charCodeAt(i);
    let hi = lib.u2bArray[2 * pos], lo = lib.u2bArray[2 * pos + 1];
    if (hi || lo)
      data += String.fromCharCode(hi) + String.fromCharCode(lo);
    else // Not a big5 char
      data += "\xFF\xFD";
  }
  return data;
}

interface ConvLib
{
  b2uArray?: Uint8Array;
  u2bArray?: Uint8Array;
}

const lib: ConvLib = {};

export async function loadResources(): Promise<void>
{
  try
  {
    const [b2uBin, u2bBin] = await Promise.all([
      // loadTable(require("./conv/b2u_table.bin")),
      // loadTable(require("./conv/u2b_table.bin")),
      loadTable(path.resolve(__dirname, "./conv/b2u_table.bin")),
      loadTable(path.resolve(__dirname, "./conv/u2b_table.bin")),
    ]);
    lib.b2uArray = new Uint8Array(b2uBin);
    lib.u2bArray = new Uint8Array(u2bBin);
    console.log("✅ loadResources done");
  }
  catch (e)
  {
    console.error("❌ loadResources failed:", e);
  }
}

export async function loadTable(filePath: string): Promise<ArrayBuffer | SharedArrayBuffer>
{
  const buffer = await fs.readFile(filePath);
  // 把 Node.js TermBuffer 轉成 ArrayBuffer
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

export async function loadTablex(url: string)
{
  const response = await fetch(url);
  if (!response.ok)
    throw new Error("loadTable failed: " + response.statusText + ": " + url);
  return await response.arrayBuffer();
}

function stringToHex(str: string, encoding: "utf16" | "utf8" = "utf8"): string
{
  if (encoding === "utf16")
  {
    return Array.from(str)
            .map(ch => ch.charCodeAt(0).toString(16).padStart(4, "0"))
            .join(" ");
  }
  else
  {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    return Array.from(bytes)
            .map(b => b.toString(16).padStart(2, "0"))
            .join(" ");
  }
}
