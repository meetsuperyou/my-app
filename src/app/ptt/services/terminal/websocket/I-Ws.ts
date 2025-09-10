import {Injectable, OnDestroy} from "@angular/core";
import {BehaviorSubject, Observable} from "rxjs";
import {explainCloseCode} from "../../../language/ws-error";

export enum wsStatus
{
  CONNECTING,
  OPEN,
  CLOSING,
  CLOSED,
  RECONNECTING, // 可選的自訂狀態
  ERROR
}

export interface wsInfo
{
  status: wsStatus;
  code?: number;
  reason?: string;
  explain?: string;
}

@Injectable({providedIn: "root"})
export abstract class IwebSocket implements OnDestroy
{
  protected statusSubject = new BehaviorSubject<wsInfo>({status: wsStatus.CLOSED});
  public statusSubject$: Observable<wsInfo> = this.statusSubject.asObservable();
  protected abstract sendWsArrayBuffer(data: ArrayBuffer): void | Promise<void>;
  public abstract close(code?: number, reason?: string): void | Promise<void>;
  public abstract connect(): Promise<wsInfo>;
  abstract onMessage: (event: MessageEvent) => void; // 商業邏輯
  protected connectReplyMsg:
          {
            ConnectingOrConnected: wsInfo,
            OpenSucess: wsInfo,
            connecting: wsInfo,
            closed: (event: CloseEvent) => wsInfo,
            error: (explain?: string) => wsInfo,
          }
          =
          {
            ConnectingOrConnected: {
              status: wsStatus.CONNECTING,
              explain: "翻譯: 連線中; WebSocket is already connected or connecting."
            },
            OpenSucess: {
              status: wsStatus.OPEN,
              explain: "open sucess"
            },
            connecting: {
              status: wsStatus.CONNECTING,
              explain: "connecting"
            },
            closed: (event: CloseEvent): wsInfo =>
            {
              return {
                status: wsStatus.CLOSED,
                code: event.code,
                reason: event.reason || "(無)",
                explain: explainCloseCode(event.code),
              };
            },
            error: (explain?: string): wsInfo =>
            {
              /**
               * 在 瀏覽器 WebSocket 中，
               * error 事件不會給詳細錯誤原因（例如 404、TLS 錯誤、CORS 問題）
               * ，只會觸發一個泛用的 Event。
               * 真正的錯誤細節通常會在 close 事件的 code / reason 裡面比較清楚。
               * **/
              return {
                status: wsStatus.ERROR,
                explain: explain || " error occur"
              };
            }
          };

  ngOnDestroy(): void
  {
    this.close();
  }


  public async onReceive(): Promise<string>
  {
    return "";
  }

  // 不要用 send, 太多重複名字
  // 還沒做 送失敗的訊息，先作收
  // 這個就是 send
  public sendWsMsg(str: string): string | void
  {
    const chunkSize = 1000;
    for (let i = 0; i < str.length; i += chunkSize)
    {
      const chunkStr = str.substring(i, i + chunkSize);
      const byteArray = new Uint8Array(
              Array.from(chunkStr, ch => ch.charCodeAt(0))
      );
      this.sendWsArrayBuffer(byteArray.buffer); // abcdef 分批送 abc, def
    }
  }

  protected async parseWsData(data: string | ArrayBuffer | Blob): Promise<string>
  {
    if (typeof data === "string")
    {
      // 已經是字串，直接回傳
      return Promise.resolve(data);
    }
    else if (data instanceof ArrayBuffer)
    {
      // ArrayBuffer → Uint8Array → String
      const arr = new Uint8Array(data);
      return Promise.resolve(String.fromCharCode(...arr));
    }
    else if (data instanceof Blob) // 因為我沒有用 arrayBuffer talnet 溝通。 就會得到 blob
    {
      // Blob → ArrayBuffer → Uint8Array → String
      //  this.socket.binaryType = "arraybuffer";
      const buf = await data.arrayBuffer();
      const arr_1 = new Uint8Array(buf);
      return String.fromCharCode(...arr_1);
    }
    else
    {
      return Promise.resolve(""); // 不支援型別
    }
  }
}

/**
 * onOpen?: (event: Event) => void;
 * 一個可選的回呼函式屬性 (optional callback function property)
 * -----
 *  onOpen(event: Event): void;
 *  這是方法 method
 * **/
// abstract onOpen: (event: any) => void;
// abstract onClose: (event: CloseEvent) => void;
// abstract onError: (event: Event) => void; // browser 要做的
