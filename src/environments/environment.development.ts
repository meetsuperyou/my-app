// 缺點：build 時就固定了，部署後不能改
import {wsConfig} from "../app/ptt/services/websocket/ws-config";

export const environment = {
  production: false,
  wscofig: wsConfig.wsProxyServer
};
