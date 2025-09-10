
import {CommonModule} from "@angular/common";
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

interface SGRAttributes {
  foreground: string;
  background: string;
  bold: boolean;
  underline: boolean;
}

interface Cell {
  character: string;
  attributes: SGRAttributes;
}

@Component({
  selector: 'app-vt100-buffer2',
  standalone: true,
  imports: [CommonModule], // 導入 CommonModule 以使用 *ngFor, async pipe 等
  template: `
      vt100-buffer2
    <div class="terminal" (click)="focusInput()">
      <div class="row" *ngFor="let row of buffer; let i = index">
        <div class="cell" *ngFor="let cell of row; let j = index"
             [style.color]="cell.attributes.foreground"
             [style.background-color]="cell.attributes.background"
             [style.font-weight]="cell.attributes.bold ? 'bold' : 'normal'"
             [style.text-decoration]="cell.attributes.underline ? 'underline' : 'none'"
             [class.cursor]="i === cursorRow && j === cursorCol">
          {{ cell.character || '&nbsp;' }}
        </div>
      </div>
    </div>
    <input #inputField type="text" (keydown)="handleKey($event)" style="opacity: 0; position: absolute;">
    <button (click)="serializeBuffer()">Serialize to JSON</button>
    <pre>{{ serializedJson }}</pre>
  `,
  styles: [`
    .terminal {
      font-family: 'Courier New', monospace;
      font-size: 14px;
      line-height: 1.2;
      background-color: #000;
      padding: 10px;
    }
    .row {
      display: flex;
    }
    .cell {
      width: 12px;
      height: 18px;
      text-align: center;
    }
    .cursor {
      background-color: #555;
    }
  `]
})
export class Vt100BufferComponent2 implements OnInit {
  ROWS = 24;
  COLS = 80;
  buffer: Cell[][] = [];
  serializedJson: string = '';
  cursorRow: number = 0;
  cursorCol: number = 0;
  currentAttributes: SGRAttributes = {
    foreground: '#ffffff',
    background: '#000000',
    bold: false,
    underline: false
  };
  private escapeSequence: string = '';
  private isEscapeMode: boolean = false;

  @ViewChild('inputField') inputField!: ElementRef<HTMLInputElement>;

  ngOnInit() {
    this.initializeBuffer();
    this.fillTestData();
  }

  initializeBuffer() {
    for (let i = 0; i < this.ROWS; i++) {
      const row: Cell[] = [];
      for (let j = 0; j < this.COLS; j++) {
        row.push({
          character: '',
          attributes: { ...this.currentAttributes }
        });
      }
      this.buffer.push(row);
    }
  }

  fillTestData() {
    const text = 'Hello, VT100 Terminal!';
    for (let i = 0; i < text.length && i < this.COLS; i++) {
      this.buffer[0][i].character = text[i];
      this.buffer[0][i].attributes = {
        foreground: '#00ff00',
        background: '#000000',
        bold: true,
        underline: false
      };
    }
  }

  focusInput() {
    this.inputField.nativeElement.focus();
  }

  handleKey(event: KeyboardEvent) {
    event.preventDefault(); // 防止瀏覽器預設行為

    const key = event.key;
    if (this.isEscapeMode) {
      this.escapeSequence += key;
      this.processEscapeSequence();
      return;
    }

    if (key === 'Escape') {
      this.isEscapeMode = true;
      this.escapeSequence = '';
      return;
    }

    if (key === 'Enter') {
      this.cursorRow = Math.min(this.cursorRow + 1, this.ROWS - 1);
      this.cursorCol = 0;
      return;
    }

    if (key === 'Backspace') {
      if (this.cursorCol > 0) {
        this.cursorCol--;
        this.buffer[this.cursorRow][this.cursorCol].character = '';
      }
      return;
    }

    if (key === 'ArrowLeft' && this.cursorCol > 0) {
      this.cursorCol--;
      return;
    }

    if (key === 'ArrowRight' && this.cursorCol < this.COLS - 1) {
      this.cursorCol++;
      return;
    }

    if (key === 'ArrowUp' && this.cursorRow > 0) {
      this.cursorRow--;
      return;
    }

    if (key === 'ArrowDown' && this.cursorRow < this.ROWS - 1) {
      this.cursorRow++;
      return;
    }

    // 處理可打印字元
    if (key.length === 1 && this.cursorCol < this.COLS) {
      this.buffer[this.cursorRow][this.cursorCol].character = key;
      this.buffer[this.cursorRow][this.cursorCol].attributes = { ...this.currentAttributes };
      this.cursorCol++;
      if (this.cursorCol >= this.COLS) {
        this.cursorCol = 0;
        this.cursorRow = Math.min(this.cursorRow + 1, this.ROWS - 1);
      }
    }
  }

  processEscapeSequence() {
    // 簡單的 ANSI 序列解析，例如 \x1B[31m（紅色前景）
    if (this.escapeSequence.match(/^\[\d*m$/)) {
      const code = parseInt(this.escapeSequence.slice(1, -1)) || 0;
      this.updateAttributes(code);
      this.isEscapeMode = false;
      this.escapeSequence = '';
    } else if (this.escapeSequence.length > 10) {
      // 避免無效序列累積
      this.isEscapeMode = false;
      this.escapeSequence = '';
    }
  }

  updateAttributes(code: number) {
    switch (code) {
      case 0: // 重置
        this.currentAttributes = {
          foreground: '#ffffff',
          background: '#000000',
          bold: false,
          underline: false
        };
        break;
      case 1: // 粗體
        this.currentAttributes.bold = true;
        break;
      case 4: // 下劃線
        this.currentAttributes.underline = true;
        break;
      case 31: // 紅色前景
        this.currentAttributes.foreground = '#ff0000';
        break;
      case 32: // 綠色前景
        this.currentAttributes.foreground = '#00ff00';
        break;
      case 44: // 藍色背景
        this.currentAttributes.background = '#0000ff';
        break;
      // 可根據需要添加更多 ANSI 代碼
    }
  }

  serializeBuffer() {
    this.serializedJson = JSON.stringify(this.buffer, null, 2);
  }

  deserializeBuffer(json: string) {
    try {
      this.buffer = JSON.parse(json);
    } catch (e) {
      console.error('Invalid JSON format', e);
    }
  }
}
/***
```

### 新增功能說明

1. **游標管理**：
   - 新增 `cursorRow` 和 `cursorCol` 追蹤當前游標位置。
   - 在渲染時，當前游標位置的格子會有 `.cursor` 樣式（灰色背景）。

2. **鍵盤輸入**：
   - 使用隱藏的 `<input>` 元素捕獲鍵盤事件，透過 `(click)="focusInput()"` 點擊終端機區域時聚焦輸入框。
   - 處理以下鍵盤輸入：
     - **可打印字元**：將字元寫入當前游標位置，應用當前 SGR 屬性，並移動游標。
     - **Enter**：換行（移動到下一行，列設為 0）。
     - **Backspace**：刪除前一個字元並左移游標。
     - **方向鍵**：上下左右移動游標，限制在 buffer 範圍內。

3. **ANSI 控制序列**：
   - 支援基本的 ANSI escape codes，例如：
     - `\x1B[0m`：重置屬性。
     - `\x1B[1m`：設置粗體。
     - `\x1B[4m`：設置下劃線。
     - `\x1B[31m`：紅色前景色。
     - `\x1B[32m`：綠色前景色。
     - `\x1B[44m`：藍色背景色。
   - 使用 `isEscapeMode` 和 `escapeSequence` 追蹤和解析 escape 序列。
   - 目前僅支援簡單的 `CSI m`（SGR）序列，可根據需要擴展其他序列（如游標移動 `\x1B[H`）。

4. **輸入 UI**：
   - 隱藏的 `<input>` 元素用於捕獲鍵盤輸入，確保終端機區域可聚焦。
   - 點擊終端機區域會自動聚焦輸入框。

### 使用方法
1. **啟動輸入**：
   - 點擊終端機區域（黑色背景）以聚焦隱藏的輸入框。
   - 輸入字元會顯示在游標位置，並應用當前的 SGR 屬性。

2. **模擬 ANSI 序列**：
   - 按下 `Escape` 鍵進入 escape 模式，然後輸入序列如 `[31m`（需手動輸入 `[`、`3`、`1`、`m`）。
   - 例如，輸入 `Esc [31m` 後，後續字元會以紅色前景色顯示。

3. **序列化**：
   - 點擊 "Serialize to JSON" 按鈕仍可將 buffer 序列化為 JSON。

### 擴展建議
- **更多 ANSI 序列**：支援游標移動（如 `\x1B[H`）、清除螢幕（`\x1B[2J`）等。
- **輸入流**：支援從外部輸入 ANSI 序列流（例如 WebSocket 串流）。
- **捲動**：當游標超出最後一行時，實現 buffer 捲動（上移並清空最後一行）。
- **複雜屬性**：增加更多 SGR 屬性（如閃爍、反白）。

如果需要實現上述擴展功能或有其他特定需求，請告訴我！
 */
