const WebSocket = require("ws");
const http = require("http");

const PROXY_PORT = 3003; // Angular 連這個
let TARGET_WS = "";
TARGET_WS = "ws://localhost:3002"; // 真正 WS server，測試機，可以用
//  TARGET_WS = "https://ws.ptt.cc"; // 真正 WS server 不能用
TARGET_WS = "wss://ws.ptt2.cc/bbs"; // 真正 WS server，可以用
TARGET_WS = "https://ws.ptt2.cc/bbs"; // 也可以用


const server = http.createServer();
const wss = new WebSocket.Server({server});


wss.on("connection", (clientWs, req) => {
	console.log("✅ Angular connected to proxy");

	// 想加的自訂 header
	const headers = {
		origin: "https://term.ptt2.cc",

	};

	// 連真正的 WS server
	const targetWs = new WebSocket(TARGET_WS, {headers});
	targetWs.binaryType = "arraybuffer";
	// proxy -> server
	clientWs.on("message", (msg) => {

		if (targetWs.readyState === WebSocket.OPEN) {
			targetWs.send(msg);
		}
	});

	// server -> proxy
	targetWs.on("message", (msg) => {
		console.log(`msg=${msg}`);
		if (clientWs.readyState === WebSocket.OPEN) {
			clientWs.send(msg);
		}
	});

	// 關閉處理
	clientWs.on("close", () => {
		console.log("❌ Client closed");
		if (targetWs.readyState === WebSocket.OPEN) {
			targetWs.close();
		}
	});

	targetWs.on("close", (code, reason) => {
		console.log("❌ Target server closed");
		console.log("WebSocket closed, code:", code, "reason:", reason.toString());
		if (clientWs.readyState === WebSocket.OPEN) {
			clientWs.close();
		}
	});

	targetWs.on("open", () => console.log("✅ Proxy connected to WS server"));
	targetWs.on("error", (err) => console.error("⚠️ Target WS error:", err));
});

server.listen(PROXY_PORT, () => console.log(`🚀 Proxy WS running on ${PROXY_PORT}`));
