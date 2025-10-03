import {inject, Injectable} from "@angular/core";
import {Subject} from "rxjs";
import {environment} from "../../../../environments/environment";
import {ParserTalnet} from "./core/parser-talnet";
import {ParserBuffer} from "./core/parser-buffer";
import {ProductTestUtils} from "./test/product-testUtil";
import {TestUtils} from "./test/testUtils";
import {BrowserWebSocket} from "./websocket/browser-websocket";
import {IwebSocket} from "./websocket/I-Ws";
import {TermBuffer} from "./core/term-buffer";

@Injectable({
  providedIn: "root",   // A 是全域的
})
export class Terminal
{
  termBuffer: TermBuffer;
  talnetParser: ParserTalnet;
  termBufferParser: ParserBuffer;
  testUtils: TestUtils;
  private destroy$ = new Subject<void>();
  private ws: IwebSocket = inject(BrowserWebSocket);

  constructor()
  {
    // DI: module, component , root, 我只好在最高的 gemini-terminal 控制 buffer 的可見性

    if (environment.production)
      this.testUtils = new ProductTestUtils();
    else
      this.testUtils = new TestUtils();
    this.termBuffer = new TermBuffer(this.testUtils);
    this.termBufferParser = new ParserBuffer(this.termBuffer, this.testUtils);
    this.talnetParser = new ParserTalnet(this.ws, this.termBufferParser, this.testUtils);
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
