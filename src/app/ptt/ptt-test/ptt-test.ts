import {Component, OnDestroy, inject, signal} from "@angular/core";
import {CommonModule} from "@angular/common";


import {Subject} from "rxjs";
import {AbsWebSocket} from "../services/websocket/Abs-Ws";
import {BrowserWebSocket} from "../services/websocket/browser-websocket";


@Component({
  selector: "ptt-test",
  imports: [CommonModule],
  templateUrl: "./ptt-test.html",
  styleUrl: "./ptt-test.scss"
})
export class PttTest implements OnDestroy
{
  private destroy$ = new Subject<void>();
  private broserWs = inject(BrowserWebSocket);
  private ws: AbsWebSocket = this.broserWs;
  showTest = signal<string>("");

  constructor()
  {
    this.ws.onMessage = (e) =>
    {
      console.log("on message");
      const data = new Uint8Array(e.data);
      const str = String.fromCharCode(...data);
      console.log(`str: ${str}`);
    };
    this.ws.connect().then(e =>
            console.log(`then: ${e}`)).catch(e => console.log(`reject: ${e}`));
  }

  connect()
  {
    // this.ws.connect().then(e => console.log(`then: ${e}`));
    // this.wsService.connect();
    // console.log(`connect`);
    //
    // this.ws.onmessage = (e) =>
    // {
    //   console.log(`on message:${e.data}`);
    //   const data = new Uint8Array(e.data);
    //   console.log(`data: ${data}`);
    //   const str = String.fromCharCode(...data);
    //   console.log(`str: ${str}`);
    // };
    // this.ws.onopen = (e) =>
    // {
    //   console.log(`open`);
    //   // this._wsID = {ws: this.ws, id: this._wsIdCounter++};
    //   // this.websocketService.wsOpen();
    // };
    // this.ws.onerror = (event) =>
    // {
    //   console.log(`error`);
    //   // this.websocketService.wsError({});
    // };
    // this.ws.onclose = (event) =>
    // {
    //   console.log(`close`);
    //   const code = event.code;
    //   const reason = event.reason;
    //   const wasClean = event.wasClean;
    //   // this.websocketService.wsClose({code: code, reason: reason, wasClean: wasClean});
    // };
  }

  // async testLogin() {
  //   let str = await this.pttConnection.login();
  //   this.showTest.set(str);
  // }
  // connect2() {
  //   // Simple public echo server for demo purposes
  //   this.wsBro.connect("wss://echo.websocket.events");
  //   this.wsBro.connectionStatus().pipe(takeUntil(this.destroy$)).subscribe(s => this.status = s);
  //   this.wsBro.onMessage().pipe(takeUntil(this.destroy$)).subscribe(evt => this.lastMessage = String(evt.data ?? ""));
  // }
  // send2() {
  //   try {
  //     this.wsBro.send("hello");
  //   } catch (e) {
  //     this.lastMessage = String(e);
  //   }
  // }
  ngOnDestroy(): void
  {
    this.destroy$.next();
    this.destroy$.complete();
    //   this.wsBro.onMessage().pipe(takeUntil(this.destroy$)).subscribe(evt => this.lastMessage = String(evt.data ?? ""));
    //   this.wsBro.connectionStatus().pipe(takeUntil(this.destroy$)).subscribe(s => this.status = s);
  }

  send()
  {

  }

  protected readonly close = close;
}
