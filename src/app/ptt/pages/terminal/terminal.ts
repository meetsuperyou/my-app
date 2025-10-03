import {CommonModule} from "@angular/common";
import { Component } from '@angular/core';


@Component({
  selector: 'terminal',
  imports: [CommonModule], // 導入 CommonModule 以使用 *ngFor, async pipe 等
  templateUrl: './terminal.html',
  styleUrl: './terminal.scss'
})
export class Terminal {
  /**
  public state$: Observable<TerminalState>;

  constructor(private terminalBufferService: TerminalBufferService) {
    this.state$ = this.terminalBufferService.state$;
  }

  // 輔助函式，用於計算儲存格的 ngStyle
  getCellStyle(attrs: Cell): { [key: string]: any } {
    const fg = attrs.inverse ? attrs.bg : attrs.fg;
    const bg = attrs.inverse ? attrs.fg : attrs.bg;

    const style: { [key: string]: any } = {};
    if (fg) style['color'] = fg;
    if (bg) style['backgroundColor'] = bg;

    return style;
  }
  **/
}
