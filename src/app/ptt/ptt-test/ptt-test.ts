import {Component, OnDestroy, signal} from "@angular/core";
import {CommonModule} from "@angular/common";
import {Subject} from "rxjs";
import {Vt100BufferComponent2} from "../../temp/grok-terminal/vt100-buffer.component2";
import {Terminal} from "../services/terminal/terminal";

@Component({
  selector: "ptt-test",
  imports: [CommonModule, Vt100BufferComponent2],
  templateUrl: "./ptt-test.html",
  styleUrl: "./ptt-test.scss"
})
export class PttTest implements OnDestroy
{
  private destroy$ = new Subject<void>();
  // private browserWs = inject(BrowserWebSocket);
  // private ws: AbsWebSocket = this.browserWs;
  showTest = signal<string>("");
  // terminalBufferService = inject(TerminalBufferService);

  constructor(private termainal: Terminal)
  {
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
    // this.ws.sendWsMsg("abcdefg");
  }

  protected readonly close = close;
}
