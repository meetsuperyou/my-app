//https://stackoverflow.com/questions/13364243/websocketserver-node-js-how-to-differentiate-clients
//https://medium.com/enjoy-life-enjoy-coding/javascript-websocket-%E8%AE%93%E5%89%8D%E5%BE%8C%E7%AB%AF%E6%B2%92%E6%9C%89%E8%B7%9D%E9%9B%A2-34536c333e1b

//import express 和 ws 套件
// eslint-disable-next-line @typescript-eslint/no-var-requires,no-undef
const express = require("express");
const {pttmockdata1, pttmockdata4} = require("./ptt-data");
// eslint-disable-next-line @typescript-eslint/no-var-requires,no-undef
const SocketServer = require("ws").Server;

//指定開啟的 port
const PORT = 3002;

//創建 express 的物件，並綁定及監聽 3000 port ，且設定開啟後在 console 中提示
const server = express()
	.listen(PORT, () => console.log(`Listening on ${PORT}`));

//將 express 交給 SocketServer 開啟 WebSocket 的服務
const wss = new SocketServer({
	server
});

//當 WebSocket 從外部連結時執行
let  count = 0;
wss.on("connection", (ws, req) =>
{
	ws.id = req.headers["sec-websocket-key"];
	console.log("\n" + count++ + ":" + ws.id + ":Connected");

	const origin = req.headers["origin"];
	console.log("origin:", origin);
	// myheader
	const myheader = req.headers["myheader"];
	console.log("myheader:", myheader);

	const connection = req.headers["connection"];
	console.log("connection:", connection);
	//固定送最新時間給 Client
	const sendNowTime = setInterval(() =>
	{
		ws.send(String(new Date()));
	}, 1000000);

	// login(ws);

	setTimeout(() => {
		// ws.close(1008, "不合法的請求");
	}, 1000);



	ws.on("open", () => {
		console.log("open");
		ws.send('hello');
	});


	ws.on("message", data =>
	{
		// ptt chrome 的 資料
		// 登入 = 181,110,164,74  <TermBuffer b5 6e a4 4a>
		// 中文A的 = 164,164,164,229,65,170,186   <TermBuffer a4 a4 a4 e5>
		// ctrl u = 21
		// ctrl v = 22
		// u = 117

		let wordarray = new Uint8Array(data);
		console.log(`${data}`);
		console.log(data);
		console.log(count++ + ":" + ws.id + ":server receive message=" + wordarray.toString());
		//var r=Math.random();
		ws.send(data + ":" + new Date());
	});

	ws.on("close", () =>
	{
		//連線中斷時停止 setInterval
		clearInterval(sendNowTime);
		console.log("" + count++ + ":" + ws.id + ":Closed");
	});
});

function login(ws) {
	ws.binaryType = "arraybuffer";
	ws.send(pttmockdata4);// watch
}


function hexStringToUint8Array(hexString) {
	// 去掉多餘空白，分割成兩兩一組
	const hexArray = hexString.trim().split(/\s+/);
	const bytes = hexArray.map(b => parseInt(b, 16));
	return new Uint8Array(bytes);
}
