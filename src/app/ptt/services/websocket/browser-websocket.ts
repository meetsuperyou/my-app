import {Injectable} from "@angular/core";
import {environment} from "../../../../environments/environment";
import {explainCloseCode} from "../../language/ws-error";
import {AbsWebSocket, wsInfo, wsStatus} from "./Abs-Ws";
import {wsConfig, WsConfig} from "./ws-config";

@Injectable({providedIn: "root"})
export class BrowserWebSocket extends AbsWebSocket
{
  get termConfig(): WsConfig
  {
    return wsConfig;
  }

  private socket!: WebSocket | null;
  onOpen!: (event: Event) => void;
  onMessage!: (event: { data: any }) => void;
  onClose!: (event: CloseEvent) => void;
  onError!: (event: Event) => void;
  private url = environment.wscofig.url;

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
        return reject({
          status: wsStatus.CONNECTING,
          explain: `翻譯: 連線中`
        });
      }
      console.log(`socket url: ${this.url}`);
      this.statusSubject.next({status: wsStatus.CONNECTING});
      try
      {
        this.socket = new WebSocket(this.url);
        this.socket.onopen = (event) =>
        {
          console.log("log WebSocket connection opened:");
          this.statusSubject.next({status: wsStatus.OPEN});
          resolve({status: wsStatus.OPEN, explain: `ok`});
        };
        // 使用者實作商業邏輯 of onmessage
        this.socket.onmessage = (ev) => this.onMessage(ev);
        // 監聽連線關閉
        this.socket.onclose = (event) =>
        {
          console.log(
                  "🔌 連線關閉:",
                  "code =", event.code,
                  "reason =", event.reason || "(無)",
                  "explain =", explainCloseCode(event.code),
                  "clean =", event.wasClean
          );
          this.statusSubject.next({
            status: wsStatus.CLOSED,
            reason: event.reason || "(無)",
            code: event.code,
            explain: explainCloseCode(event.code),
          });
          this.socket = null;
          return reject({
            status: wsStatus.CLOSED,
            explain: `翻譯: closed}`
          });
        };
        // 監聽錯誤
        this.socket.onerror = (event: Event) =>
        {
          console.log("log WebSocket error observed:");
          // 錯誤通常也會觸發 onclose，所以狀態會變為 CLOSED
          this.statusSubject.next({status: wsStatus.ERROR});
          return reject({
            status: wsStatus.ERROR,
            explain: `翻譯: onerror}`
          });
        };
      }
      catch (e)
      {
        console.log(`connect catch error: ${e}`);
        reject({
          status: wsStatus.ERROR,
          explain: `翻譯: 網址格是錯誤`
        });//只有網址格式錯誤，我幾乎不會格是錯誤
      }
    });
  }

  // async connectxxx(): Promise<void>
  // {
  //   if (this.socket && this.socket.readyState !== WebSocket.CLOSED)
  //   {
  //     console.warn("WebSocket is already connected or connecting.");
  //     return;
  //   }
  //   console.log(`socket url: ${this.url}`);
  //   this.socket = new WebSocket(this.url);
  //   this.socket.binaryType = "arraybuffer";
  //   this.socket.onopen = (ev) => this.onOpen(ev);
  //   this.socket.onmessage = (ev) => this.onMessage(ev);
  //   this.socket.onclose = (ev) => this.onClose(ev);
  //   this.socket.onerror = (ev) => this.onError(ev);
  // }

  send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void
  {
    if (this.statusSubject.getValue().status !== wsStatus.OPEN || !this.socket)
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
