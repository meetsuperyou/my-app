const PROXY_CONFIG = {
	"/pureWsServer": {
		target: `ws://localhost:3002`,
		secure: true,
		ws: true,
		changeOrigin: true,
		headers: {
			"origin": "localServer",
			"myheader": "my-app-"
		},
	},
	"/wsProxyServer": {
		target: `ws://localhost:3003`,
		secure: true,
		ws: true,
		changeOrigin: true,
		headers: {
			"myheader": "my-app-proxy"
		},
	},
	"/server1": {
		target: `wss://ws.ptt.cc/bbs`,
		secure: true,
		ws: true,
		changeOrigin: true,
		headers: {
			"origin": "https://term.ptt.cc",
		},
	},
	"/server2": {
		target: `wss://ws.ptt2.cc/bbs`,
		secure: true,
		ws: true,
		changeOrigin: true,
		headers: {
			"origin": "https://term.ptt2.cc",
		},
	}
};
module.exports = PROXY_CONFIG;
