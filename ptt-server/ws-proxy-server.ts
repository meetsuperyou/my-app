import WebSocket, {WebSocketServer} from "ws";
import * as http from "http";
import {IncomingMessage} from "http"; // 為了更清晰地標示 req 的型別
import {promises as fs} from "fs";
import path from "path";

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
  let byteArray=null;
  if(test)
  {
    setTimeout(() => {
      byteArray = hexStringToUint8Array(pttmockdata1);
      clientWs.send(byteArray.buffer);

    }, 100);
    setTimeout(() => {
      byteArray = hexStringToUint8Array(pttmockdata2);
      clientWs.send(byteArray.buffer);
    }, 200);
    setTimeout(() => {
      byteArray = hexStringToUint8Array(pttmockdata3);
      clientWs.send(byteArray.buffer);
    }, 300);
    setTimeout(() => {
      byteArray = hexStringToUint8Array(pttmockdata4);
      clientWs.send(byteArray.buffer);
    }, 400);
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
    // msg 可能是 Buffer，console.log 會自動調用 .toString()
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
  // 把 Node.js Buffer 轉成 ArrayBuffer
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
export const pttmockdata1='0d 0a 20 20 20 20 20 20 a2 f6 20 20 20 20 20 20 20 20 a2 f7 a3 50 a2 f6 20 45 20 63 20 a2 fc 69 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 1b 5b 33 37 3b 34 30 6d 20 a2 66 20 20 20 a2 67 a2 64 20 1b 5b 6d 0d 0a 20 20 20 20 20 20 20 20 a3 52 a3 40 20 20 a2 d1 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 a3 50 20 67 20 20 2e 2e 20 20 20 20 20 20 20 20 1b 5b 33 30 3b 34 37 6d a2 6b 1b 5b 33 33 6d 2f 1b 5b 33 37 3b 34 30 6d a2 6b 1b 5b 6d 20 20 20 1b 5b 33 33 3b 34 37 6d 20 5c 20 1b 5b 33 37 3b 34 30 6d a2 6b 1b 5b 6d 0d 0a 20 20 20 20 20 20 1b 5b 34 37 6d 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 1b 5b 6d 20 20 20 20 20 20 20 20 20 20 1b 5b 33 37 3b 34 33 6d a2 70 1b 5b 34 37 6d 20 1b 5b 3b 33 35 6d a2 66 1b 5b 31 6d a2 65 a2 66 1b 5b 3b 33 33 3b 34 37 6d 20 a2 6a 1b 5b 6d 0d 0a 20 20 20 20 20 1b 5b 33 30 3b 34 37 6d 20 20 20 20 a2 7a a2 66 20 a2 64 a2 65 20 20 a2 66 a2 7b 20 a2 65 a2 7b 20 20 20 20 20 20 20 20 20 20 1b 5b 6d 20 20 20 20 20 20 1b 5b 31 3b 33 35 6d a2 a8 1b 5b 34 37 6d a2 67 1b 5b 34 35 6d a1 bd a2 69 a2 69 a2 69 1b 5b 3b 33 37 3b 34 35 6d a2 ab 20 1b 5b 33 35 3b 34 30 6d a2 a9 1b 5b 6d 0d 0a 20 20 20 20 20 1b 5b 33 30 3b 34 37 6d 20 20 20 20 20 a2 6d a2 7d 20 20 a2 6d 20 20 20 a2 6d 20 20 a2 66 a2 74 20 20 a1 e3 a1 af 20 20 20 20 1b 5b 6d a2 a9 20 20 20 20 1b 5b 31 3b 33 35 3b 34 35 6d a1 bd a2 69 a2 69 a2 69 a2 69 a2 69 a2 69 a2 6c 1b 5b 6d 0d 0a 20 20 20 20 20 20 20 1b 5b 34 37 6d 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 1b 5b 6d a2 ab 20 20 20 20 1b 5b 31 3b 33 35 6d a2 79 a2 69 1b 5b 34 35 6d a1 bd a2 69 a2 69 a2 69 a2 69 a2 69 a2 6f 1b 5b 3b 33 35 6d a2 6b 1b 5b 6d a2 65 0d 0a 20 20 20 20 20 20 20 20 20 1b 5b 31 3b 33 30 6d 5b 70 74 74 32 2e 74 77 62 62 73 2e 6f 72 67 20 2f 20 70 74 74 32 2e 63 63 5d 1b 5b 6d 20 20 20 20 20 20 20 20 20 20 1b 5b 31 3b 33 35 6d a2 69 1b 5b 34 30 6d a2 ab 1b 5b 3b 33 37 3b 34 30 6d a2 66 1b 5b 31 3b 33 35 3b 34 37 6d 20 20 20 20 1b 5b 3b 33 37 3b 34 30 6d a2 67 1b 5b 31 3b 33 35 6d a2 aa 1b 5b 34 35 6d a2 6d 1b 5b 6d 20 1b 5b 34 37 6d 20 20 20 20 1b 5b 6d 0d 0a 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 2e 2e 69 6c 6c 75 73 74 20 62 79 20 73 65 6e 6b 6f 75 73 68 61 20 20 20 20 20 20 20 20 1b 5b 31 3b 33 35 6d a2 aa 1b 5b 3b 33 30 3b 34 37 6d a2 6d a1 ac 1b 5b 33 31 6d a1 bb 1b 5b 33 30 6d 20 20 a1 ab 20 1b 5b 34 30 6d 20 1b 5b 3b 33 35 6d a2 ab 1b 5b 34 37 6d 20 20 20 20 20 20 1b 5b 6d 0d 0a 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 a1 b4 20 20 1b 5b 33 30 3b 34 37 6d a2 66 a2 66 a2 66 a2 66 1b 5b 6d 20 20 a1 b4 20 1b 5b 33 30 3b 34 37 6d a2 67 a2 68 1b 5b 6d 0d 0a 00';
export const pttmockdata2='ff fd 18 ff fa 18 01 ff f0 ff fd 1f ff fb 01 ff fb 03 ff fb 00 ff fd 00 1b 5b 48 1b 5b 32 4a 1b 5b 6d 0d 0a 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 1b 5b 33 32 6d 20 1b 5b 6d 20 20 20 20 20 20 20 20 20 20 20 20 20 20 1b 5b 31 6d b6 c7 bb a1 a4 a4 a9 de a8 ec ac 59 a8 df aa ba a4 f2 b4 4e a4 a3 b7 7c b3 51 bd f0 2e 2e 2e 2e 2e 1b 5b 6d 0d 0a 20 20 20 20 20 20 a2 63 a2 64 a2 65 a2 66 a2 67 a2 67 a2 66 20 20 20 20 a2 66 a2 67 a2 67 a2 66 a2 65 a2 64 a2 63 0d 0a 20 20 20 20 1b 5b 31 6d a2 aa 1b 5b 34 37 6d a2 a9 1b 5b 6d a2 69 1b 5b 33 30 3b 34 37 6d a2 64 a2 63 1b 5b 33 37 6d a2 69 1b 5b 6d a2 69 a2 69 a2 68 a2 68 a2 69 a2 69 a2 69 1b 5b 33 30 3b 34 37 6d a2 63 a2 64 1b 5b 6d a2 69 1b 5b 31 3b 34 37 6d a2 a8 1b 5b 34 30 6d a2 ab 1b 5b 6d 0d 0a 20 20 1b 5b 33 34 6d a2 67 a2 66 1b 5b 31 3b 33 37 3b 34 34 6d a2 aa a2 ab 1b 5b 6d a2 66 a2 67 a2 68 a2 69 a2 69 a2 69 a2 69 a2 69 a2 69 a2 68 a2 67 a2 66 1b 5b 31 6d a2 aa a2 ab 1b 5b 3b 33 34 3b 34 30 6d a2 64 a2 65 a2 65 a2 64 a2 64 a2 64 a2 66 a2 67 a2 68 a2 64 a2 65 a2 66 a2 67 a2 67 a2 64 a2 63 a1 c5 a2 66 a2 67 a2 69 1b 5b 6d 0d 0a 20 20 1b 5b 34 34 6d 20 20 20 20 20 20 20 20 1b 5b 6d a2 69 1b 5b 34 37 6d 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 1b 5b 6d a2 69 1b 5b 34 34 6d 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 1b 5b 33 33 6d a2 6d 1b 5b 33 37 6d 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 1b 5b 6d 0d 0a 20 20 1b 5b 34 34 6d 20 20 20 20 20 20 a2 a8 1b 5b 6d a2 69 1b 5b 34 37 6d 20 20 20 20 20 20 20 20 20 1b 5b 31 3b 34 31 6d a2 f1 1b 5b 3b 33 37 3b 34 37 6d 20 20 20 20 1b 5b 33 30 6d a2 6a a2 6a a2 6a 1b 5b 33 37 6d 20 1b 5b 34 34 6d a2 a9 20 20 a4 a3 b5 b9 a9 de 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 1b 5b 33 33 6d a2 6e 1b 5b 33 37 6d 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 1b 5b 6d 0d 0a 20 20 1b 5b 34 34 6d 20 20 20 20 20 20 1b 5b 6d a2 69 1b 5b 34 37 6d 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 1b 5b 33 30 6d 20 20 20 1b 5b 33 37 6d 20 1b 5b 33 30 6d a2 6a 1b 5b 33 37 6d 20 1b 5b 6d a2 69 1b 5b 34 34 6d 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 1b 5b 33 33 6d a2 6f 1b 5b 33 37 6d 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 1b 5b 6d 0d 0a 20 20 1b 5b 34 34 6d 20 20 20 20 20 20 1b 5b 6d a2 69 1b 5b 33 30 3b 34 37 6d 20 a2 64 a2 64 a2 64 a2 64 20 20 20 20 20 20 a2 64 a2 64 a2 64 a2 64 20 1b 5b 6d a2 69 1b 5b 34 34 6d 20 20 20 a2 a3 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 1b 5b 33 33 6d a2 aa a2 a9 a2 69 1b 5b 33 37 6d 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 1b 5b 6d 0d 0a 20 20 1b 5b 34 34 6d 20 20 20 20 20 1b 5b 6d a2 69 1b 5b 34 37 6d 20 20 20 20 1b 5b 31 3b 33 36 3b 34 30 6d a2 69 a2 69 1b 5b 3b 33 30 3b 34 37 6d 20 20 20 a1 60 a1 60 1b 5b 33 37 6d 20 20 1b 5b 33 30 6d 20 1b 5b 31 3b 33 36 3b 34 30 6d a2 69 a2 69 1b 5b 3b 33 37 3b 34 37 6d 20 20 20 1b 5b 31 3b 33 36 6d 20 1b 5b 6d a2 69 1b 5b 34 34 6d 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 1b 5b 33 33 6d a2 aa a2 69 1b 5b 33 37';
export const pttmockdata3='6d 20 20 1b 5b 33 33 6d a2 a8 1b 5b 33 37 6d 20 20 20 20 20 20 20 20 20 20 20 1b 5b 6d 0d 0a 20 20 1b 5b 34 34 6d 20 20 20 20 20 1b 5b 6d a2 69 1b 5b 34 37 6d 20 1b 5b 33 31 6d a1 b4 1b 5b 33 37 6d 20 1b 5b 31 3b 33 36 3b 34 30 6d a2 69 a2 69 1b 5b 3b 33 37 3b 34 37 6d 20 20 20 20 20 20 20 20 20 20 1b 5b 31 3b 33 36 3b 34 30 6d a2 69 a2 69 1b 5b 3b 33 37 3b 34 37 6d 20 1b 5b 33 31 6d a1 b4 1b 5b 33 37 6d 20 1b 5b 6d a2 69 1b 5b 34 34 6d 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 1b 5b 31 3b 33 30 6d 21 1b 5b 3b 33 37 3b 34 34 6d 20 20 20 20 1b 5b 33 33 6d a2 69 a2 a8 a2 ab 1b 5b 33 37 6d 20 20 20 20 20 20 20 20 20 20 20 1b 5b 6d 0d 0a 20 20 1b 5b 34 34 6d 20 20 20 20 20 20 1b 5b 6d a2 69 1b 5b 34 37 6d 20 20 20 1b 5b 31 3b 33 36 3b 34 30 6d a2 69 a2 69 1b 5b 3b 33 37 3b 34 37 6d 20 20 20 20 20 20 20 20 20 20 1b 5b 31 3b 33 36 3b 34 30 6d a2 69 a2 69 1b 5b 3b 33 37 3b 34 37 6d 20 20 20 1b 5b 6d a2 69 1b 5b 34 34 6d 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 1b 5b 33 33 3b 34 30 6d a2 69 1b 5b 34 34 6d a2 ab 1b 5b 33 37 6d 20 20 20 20 20 20 20 20 20 20 20 20 20 1b 5b 6d 0d 0a 20 20 1b 5b 34 34 6d 20 20 20 20 20 20 20 a2 aa 1b 5b 6d a2 69 1b 5b 31 3b 33 36 6d a2 69 a2 69 1b 5b 3b 33 37 3b 34 37 6d 20 20 20 20 20 20 20 20 20 20 1b 5b 31 3b 33 36 3b 34 30 6d a2 69 a2 69 1b 5b 6d a2 69 1b 5b 34 34 6d a2 ab 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 1b 5b 34 37 6d 20 1b 5b 33 30 6d a1 5a 1b 5b 33 33 3b 34 30 6d a2 69 1b 5b 33 37 3b 34 34 6d 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 1b 5b 6d 0d 0a 20 20 1b 5b 34 34 6d 20 20 20 20 20 20 20 20 20 20 20 1b 5b 33 34 3b 34 37 6d a2 68 a2 67 1b 5b 31 3b 33 30 6d a2 66 a2 65 a2 64 a2 65 a2 66 1b 5b 3b 33 34 3b 34 37 6d a2 67 a2 68 1b 5b 33 37 3b 34 34 6d 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 1b 5b 33 36 3b 34 31 6d 20 1b 5b 33 37 3b 34 37 6d 20 20 1b 5b 33 33 3b 34 30 6d a2 69 1b 5b 33 37 3b 34 34 6d 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 1b 5b 6d 0d 0a 20 20 1b 5b 34 34 6d 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 1b 5b 6d a2 69 1b 5b 31 3b 33 30 3b 34 37 6d a2 62 a1 c5 a2 62 1b 5b 6d a2 69 1b 5b 34 34 6d 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 1b 5b 33 36 6d a2 aa 1b 5b 33 37 3b 34 33 6d a2 a3 1b 5b 34 34 6d a2 a1 20 20 20 20 20 20 20 20 20 20 20 20 20 1b 5b 6d 0d 0a 20 20 1b 5b 34 34 6d 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 a2 ab 1b 5b 31 3b 33 30 6d a2 ab 1b 5b 3b 33 37 3b 34 34 6d 20 20 1b 5b 31 3b 33 30 6d a2 aa 1b 5b 3b 33 37 3b 34 34 6d a2 aa 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 1b 5b 33 33 6d a2 69 1b 5b 33 37 6d 20 20 20 20 1b 5b 31 3b 33 30 6d a3 72 73 65 61 79 61 74 1b 5b 3b 33 37 3b 34 34 6d 20 20 20 1b 5b 6d 0d 0a 20 20 1b 5b 33 32 3b 34 34 6d a2 65 a2 65 a2 65 a2 66 a2 66 a2 66 a2 67 1b 5b 34 30 6d a2 69 a2 69 a2 69 a2 69 a2 69 a2 69 1b 5b 34 34 6d a2 66 a2 66 a2 66 a2 65 a2 65 a2 65 a2 64 a2 64 a2 64 a2 63 a2 63 a2';
export const pttmockdata4='63 a2 65 a2 66 a2 67 a2 68 a2 69 a2 69 a2 69 a2 67 a2 66 a2 65 a2 64 a2 63 a2 62 1b 5b 6d 0d 0a 20 20 20 20 1b 5b 33 32 6d 20 20 20 1b 5b 31 3b 33 33 6d 50 74 74 32 2e 63 63 20 20 a7 e5 bd f0 bd f0 a8 df 1b 5b 6d 20 20 20 1b 5b 33 36 6d 20 20 20 1b 5b 31 3b 33 37 6d 20 b2 7b a6 62 a6 b3 5b 33 31 32 5d b0 a6 a8 df a8 df c1 d9 a6 62 ac db ab 48 b3 6f ad d3 a8 53 a6 b3 ae da be da aa ba bb a1 aa 6b 0d 0a 0d 0a 0d 0a 0d 0a 1b 5b 73 1b 5b 32 33 3b 31 73 20 1b 5b 6d 1b 5b 3b 31 3b 33 31 6d a1 b8 1b 5b 3b 33 33 3b 31 6d a7 e5 bd f0 bd f0 a8 df a1 44 a9 78 a4 e8 af bb b5 b7 b1 4d ad b6 a6 a8 a5 df 1b 5b 3b 33 31 3b 31 6d a1 b8 1b 5b 6d 20 20 1b 5b 3b 34 34 3b 31 6d 20 66 1b 5b 3b 33 36 6d 20 68 74 74 70 73 3a 2f 2f 77 77 77 2e 66 61 63 65 62 6f 6f 6b 2e 63 6f 6d 2f 50 74 74 32 54 57 2f 20 1b 5b 6d 1b 5b 73 0d 0a 1b 5b 73 1b 5b 32 34 3b 31 73 20 1b 5b 6d 1b 5b 3b 31 3b 33 34 6d ab d8 bd d0 b1 4b a4 c1 c3 f6 aa 60 20 50 74 74 32 20 46 61 63 65 62 6f 6f 6b 20 af bb b5 b7 b9 ce a9 4d a5 bb af b8 20 53 59 53 4f 50 20 aa 4f c4 c0 a5 58 aa ba b0 54 ae a7 a4 ce a4 bd a7 69 a1 43 20 1b 5b 3b 33 31 3b 31 3b 35 6d 48 4f 54 21 20 1b 5b 6d 1b 5b 73 0d 0a 1b 5b 32 31 3b 31 48 1b 5b 4b 1b 5b 6d bd d0 bf e9 a4 4a a5 4e b8 b9 a1 41 a9 ce a5 48 20 67 75 65 73 74 20 b0 d1 c6 5b a1 41 a9 ce a5 48 20 6e 65 77 20 b5 f9 a5 55 3a 20 1b 5b 37 6d 20 20 20 20 20 20 20 20 20 20 20 20 20 20 08 08 08 08 08 08 08 08 08 08 08 08 08 08';

function hexStringToUint8Array(hex: string): Uint8Array {
  const hexArray = hex.trim().split(/\s+/);
  return new Uint8Array(hexArray.map(h => parseInt(h, 16)));
}
