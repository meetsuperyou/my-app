// 去 firebase 取值
let termUrl = "ptt.cc/bbs";
let termHearder1 = "term.ptt.cc";
// 一樣覆蓋 ptt1 by firebase, set by sqllite
// 之後再做。
let term2Url = "ptt.cc/bbs";
let term2Hearder1 = "term.ptt.cc";

interface ItermEnviroment {
  url: string;
  header1: string;
}

export interface WsConfig {
  production: ItermEnviroment;
  server1: ItermEnviroment; //
  server2: ItermEnviroment;
  pureWsServer: ItermEnviroment;
  wsProxyServer: ItermEnviroment;
}

// export type WsConfig = Record<string, TermEnvConfig>;
export const wsConfig: WsConfig = {
  production: {
    url: "wss://ws.ptt.cc/bbs", // proxy 轉送， or
    header1: "https://term.ptt.cc",//its origin，要被 firebase 複寫，如果跑 proxy 則無用
  },
  server1: {
    url: "http://localhost:4200/server1",  // 透過 proxy, 藥用 http
    // url: "wss://localhost:4200/server1", // ws 值連
    header1: "https://term.ptt.cc",//its origin
  },
  server2: {
    url: "http://localhost:4200/server2",
    header1: "https://term.ptt2.cc",//its origin
  },
  pureWsServer: {
    url: "http://localhost:4200/pureWsServer",
    header1: "hello local",// 沒有用。因為 proxy.config 寫死
  },
  wsProxyServer: {
    url: "http://localhost:4200/wsProxyServer",
    header1: "hello local",// 沒有用。因為 proxy.config 寫死
  },

};
