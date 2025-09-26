import {inject, Injectable} from "@angular/core";
import {Subject} from "rxjs";
import {talnetParser} from "./core/talnet-parser";
import {BufferParser} from "./core/buffer-parser";
import {BrowserWebSocket} from "./websocket/browser-websocket";
import {IwebSocket} from "./websocket/I-Ws";
import {TermBuffer} from "./core/term-buffer";

@Injectable({
  providedIn: "root",   // A 是全域的
})
export class Terminal
{
  termBuffer: TermBuffer;
  talnetParser: talnetParser;
  termBufferParser: BufferParser;
  private destroy$ = new Subject<void>();
  private ws: IwebSocket = inject(BrowserWebSocket);

  constructor()
  {
    // DI: module, component , root, 我只好在最高的 gemini-terminal 控制 buffer 的可見性
    this.termBuffer = new TermBuffer();
    this.termBufferParser = new BufferParser(this.termBuffer);
    this.talnetParser = new talnetParser(this.ws,this.termBufferParser);
     this.tempTest();
  }
  parse(chunk: string)
  {

  }


  tempTest()
  {
    this.ws.connect().then(e =>
    {
      console.log(`then: ${e.explain}`);
      // this.ws.send("abcdefg");
    }).catch(e =>
    {
      console.log(`reject: ${e.explain}`);
    });//test
    this.ws.onMessage = async (e: MessageEvent) =>
    {
      const data = new Uint8Array(e.data);
      const str = String.fromCharCode(...data);
      this.talnetParser.parseTalnet(str);
    };
  }

  ngOnDestroy(): void
  {
    // this.destroy$.next();
    this.destroy$.complete();
    //   this.wsBro.onMessage().pipe(takeUntil(this.destroy$)).subscribe(evt => this.lastMessage = String(evt.data ?? ""));
    //   this.wsBro.connectionStatus().pipe(takeUntil(this.destroy$)).subscribe(s => this.status = s);
    this.ws.close();
  }
}
