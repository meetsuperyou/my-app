import {Injectable} from "@angular/core";
import {environment} from "../../../../../environments/environment";
import {explainCloseCode} from "../../../language/ws-error";
import {IwebSocket, wsInfo, wsStatus} from "./I-Ws";

@Injectable({providedIn: "root"})
export class BrowserWebSocket extends IwebSocket
{
  private socket!: WebSocket | null;
  private url = environment.wscofig.url;
  onMessage!: (event: MessageEvent) => void;

  constructor()
  {
    super();
  }

  async connect(): Promise<wsInfo>
  {
    return new Promise((resolve, reject) =>
    {
      // 如果已經連線或正在連線中，就不要重複執行
      if (this.socket && this.socket.readyState !== WebSocket.CLOSED)
      {
        console.log("WebSocket is already connected or connecting.");
        // 關閉才需要 connect
        return reject(this.connectReplyMsg.ConnectingOrConnected);
      }
      console.log(`socket url: ${this.url}`);
      this.statusSubject.next(this.connectReplyMsg.connecting);
      try
      {
        this.socket = new WebSocket(this.url);
        this.socket.binaryType = "arraybuffer";
        this.socket.onopen = (event) =>
        {
          console.log("log WebSocket connection opened:");
          this.statusSubject.next(this.connectReplyMsg.OpenSucess);
          resolve(this.connectReplyMsg.OpenSucess);
        };
        // 使用者實作商業邏輯 of onmessage
        this.socket.onmessage = (ev) => this.onMessage(ev);
        // 監聽連線關閉
        this.socket.onclose = (event: CloseEvent) =>
        {
          console.log(
                  "🔌 連線關閉:", "code =", event.code, "reason =", event.reason || "(無)", "explain =", explainCloseCode(event.code), "clean =", event.wasClean
          );
          this.statusSubject.next(this.connectReplyMsg.closed(event));
          this.socket = null;
          return reject(this.connectReplyMsg.closed(event));
        };
        // 監聽錯誤
        this.socket.onerror = (event: Event) =>
        {
          console.log("log WebSocket error observed:");
          // 錯誤通常也會觸發 onclose，所以狀態會變為 CLOSED
          this.statusSubject.next({status: wsStatus.ERROR});
          return reject(this.connectReplyMsg.error());
        };
      }
      catch (event: any)
      {
        console.log(`connect catch error: ${event}`);
        return reject(this.connectReplyMsg.error("網址錯誤"));
      }
    });
  }

  // send 在 I-WS 做成 chunk - 1000 了
  protected sendWsArrayBuffer(data: ArrayBuffer): void | Promise<void>
  {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN)
    {
      console.error("Cannot send message, WebSocket is not open.");
      return;
    }
    this.socket.send(data);
  }

  close(code?: number, reason?: string): void
  {
    if (this.socket)
    {
      this.statusSubject.next({status: wsStatus.CLOSING});
      this.socket.close(code, reason);
    }
  }
}

// this.url = 'wss://echo.websocket.org';
//  this.url = 'http://localhost:3003'; // 直接送，沒透過 proxy
// onClose!: (event: CloseEvent) => void;
// onError!: (event: Event) => void;
// onOpen!: (event: Event) => void;
