import {Injectable, OnDestroy} from "@angular/core";
import {BehaviorSubject, Observable} from "rxjs";

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
  code?: number;    // 只在 onclose 會有
  reason?: string;  // 只在 onclose 會有
  explain?: string;
}

@Injectable({providedIn: "root"})
export abstract class AbsWebSocket implements OnDestroy
{
  ngOnDestroy(): void
  {
    this.close();
  }

  protected statusSubject = new BehaviorSubject<wsInfo>({status: wsStatus.CLOSED});
  public statusSubject$: Observable<wsInfo> = this.statusSubject.asObservable();

  // abstract get termConfig(): any;
  abstract connect(): Promise<wsInfo>;

  abstract sendArrayBuffer(data: ArrayBuffer): void | Promise<void>;

  abstract close(code?: number, reason?: string): void | Promise<void>;

  abstract onOpen: (event: any) => void;
  abstract onClose: (event: CloseEvent) => void;
  abstract onError: (event: Event) => void; // browser 要做的
  abstract onMessage: (event: { data: any }) => void; // 商業邏輯
  public send(str: string)
  {
    const chunkSize = 3;
    for (let i = 0; i < str.length; i += chunkSize)
    {
      const chunkStr = str.substring(i, i + chunkSize);
      const byteArray = new Uint8Array(
              Array.from(chunkStr, ch => ch.charCodeAt(0))
      );
      this.sendArrayBuffer(byteArray.buffer); // abcdef 分批送 abc, def
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
