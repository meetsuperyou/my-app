// src/app/gemini-terminal/gemini-terminal.component.ts
import {Component} from "@angular/core";
import {CommonModule} from "@angular/common";
import {Observable} from "rxjs";
import {TerminalBufferService} from "./ge-terminal-buffer";
import {TerminalBuffer2, CellAttributes2} from "./terminal.model";

@Component({
  selector: "app-gemini-terminal",
  standalone: true,
  imports: [CommonModule], // 導入 CommonModule 以使用 *ngFor, async pipe 等
  templateUrl: "./terminal.html",
  styleUrls: ["./terminal.scss"],
})
export class TerminalComponent
{
  // 直接將 service 中的 state observable 暴露給模板
  public state$: Observable<TerminalBuffer2>;
  ngOnInit()
  {
    this.runDemo();
  }
  runDemo(): void
  {
    const term = this.terminalBufferService;
    term.clear();
    term.write("Welcome to the Angular Terminal!\n");
    term.write("Current Time: " + new Date().toLocaleTimeString("zh-TW", {timeZone: "Asia/Taipei"}) + "\n\n");
    term.setAttributes({fg: "#ff5555", bold: true});
    term.write("ERROR: ");
    term.resetAttributes();
    term.write("Something went wrong.\n");
    term.setAttributes({fg: "#55ff55"});
    term.write("SUCCESS: ");
    term.resetAttributes();
    term.write("Operation completed.\n\n");
    term.setAttributes({underline: true});
    term.write("This is an important note.");
    term.setCursor(0, 10);
    term.setAttributes({bg: "black", fg: "white"});
    // 文字初步來，因為多塞了空白。
    term.write("中文Writing text at a specific location!");
    term.resetAttributes();
  }

  clearTerminal(): void
  {
    this.terminalBufferService.clear();
  }
  constructor(private terminalBufferService: TerminalBufferService)
  {
    this.state$ = this.terminalBufferService.state$;
    this.state$.subscribe(state => console.log("Terminal state:", state));
  }

  // 輔助函式，用於計算儲存格的 ngStyle
  getCellStyle(attrs: CellAttributes2): { [key: string]: any }
  {
    const fg = attrs.inverse ? attrs.bg : attrs.fg;
    const bg = attrs.inverse ? attrs.fg : attrs.bg;
    const style: { [key: string]: any } = {};
    if (fg)
      style["color"] = fg;
    if (bg)
      style["backgroundColor"] = bg;
    return style;
  }
}
