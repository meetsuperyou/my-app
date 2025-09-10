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
  private browserWs = inject(BrowserWebSocket);
  private ws: AbsWebSocket = this.browserWs;
  showTest = signal<string>("");

  constructor()
  {
    this.ws.onMessage = (e) =>
    {
      console.log("on message");
      const data = new Uint8Array(e.data);
      console.log(`data length: ${e.data.byteLength}`);
      const str = String.fromCharCode(...data);
      console.log(`str: ${str}`);
    };
    this.ws.connect().then(e =>
    {
      console.log(`then: ${e}`);
      this.ws.send("abcdefg");
    }).catch(e => console.log(`reject: ${e}`));//test
  }

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
