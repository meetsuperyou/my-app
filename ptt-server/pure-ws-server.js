import express from "express";
import { Server as WebSocketServer, WebSocket } from "ws";
import { pttmockdata4 } from "./ptt-data.js";

// Configuration
const DEFAULT_PORT = Number(process.env.PORT) || 3002;
const HEARTBEAT_MS = 30_000; // send server time every 30s

// Server bootstrap
const app = express();
const httpServer = app.listen(DEFAULT_PORT, () => {
	console.log(`Listening on ${DEFAULT_PORT}`);
});
const wsServer = new WebSocketServer({ server: httpServer });

// Utilities
function logRequestHeaders(req) {
	const key = req.headers["sec-websocket-key"];
	const origin = req.headers["origin"];
	const myheader = req.headers["myheader"];
	const connection = req.headers["connection"];
	console.log("origin:", origin);
	console.log("myheader:", myheader);
	console.log("connection:", connection);
	return key;
}

function safeSend(ws, data) {
	if (ws.readyState === WebSocket.OPEN) {
		ws.send(data);
	}
}

function toUint8ArrayFromHex(hexString) {
	const hexArray = hexString.trim().split(/\s+/);
	const bytes = hexArray.map((b) => parseInt(b, 16));
	return new Uint8Array(bytes);
}

// Handlers
let connectionCount = 0;

wsServer.on("connection", (ws, req) => {
	// Attach an id from header for tracing
	// eslint-disable-next-line no-param-reassign
	ws.id = logRequestHeaders(req);
	console.log(`\n${connectionCount++}:${ws.id}:Connected`);

	// Periodic heartbeat: send server time
	const heartbeatTimer = setInterval(() => {
		safeSend(ws, new Date().toISOString());
	}, HEARTBEAT_MS);

	// Optional: delayed close example (disabled)
	// setTimeout(() => ws.close(1008, "不合法的請求"), 1000);

	ws.on("open", () => {
		console.log("open");
		safeSend(ws, "hello");
	});

	ws.on("message", (data) => {
		const payloadBytes = data instanceof Buffer ? new Uint8Array(data) : new Uint8Array();
		console.log(String(data));
		console.log(data);
		console.log(`${connectionCount++}:${ws.id}:server receive message=${payloadBytes.toString()}`);
		// echo or process...
		// safeSend(ws, `${String(data)}:${new Date().toISOString()}`);
	});

	ws.on("close", () => {
		clearInterval(heartbeatTimer);
		console.log(`${connectionCount++}:${ws.id}:Closed`);
	});

	// Example login seed (binary)
	function login(targetWs) {
		// eslint-disable-next-line no-param-reassign
		targetWs.binaryType = "arraybuffer";
		safeSend(targetWs, pttmockdata4);
	}
	// login(ws);
});

// Export utilities for potential reuse/tests
export { toUint8ArrayFromHex as hexStringToUint8Array };
