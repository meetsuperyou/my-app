import {wsConfig} from "../app/ptt/services/websocket/ws-config";
import {WsConnectionPlugin} from "../app/ptt/setting/ptt-config";

export const environment = {
  production: true,
  wsConnectionPlugin: WsConnectionPlugin.advanceWebsocket,
  wscofig: wsConfig.production
};
