
import {CommonModule} from "@angular/common";
import { Component, OnInit } from '@angular/core';

interface SGRAttributes {
  foreground: string; // 前景色，例如 '#ffffff'
  background: string; // 背景色，例如 '#000000'
  bold: boolean;      // 粗體
  underline: boolean; // 下劃線
}

interface Cell {
  character: string;  // 儲存的字元
  attributes: SGRAttributes; // 對應的 SGR 屬性
}

@Component({
  selector: 'app-vt100-buffer',
  standalone: true,
  imports: [CommonModule], // 導入 CommonModule 以使用 *ngFor, async pipe 等
  template: `
    <div class="terminal">
      <div class="row" *ngFor="let row of buffer">
        <div class="cell" *ngFor="let cell of row"
             [style.color]="cell.attributes.foreground"
             [style.background-color]="cell.attributes.background"
             [style.font-weight]="cell.attributes.bold ? 'bold' : 'normal'"
             [style.text-decoration]="cell.attributes.underline ? 'underline' : 'none'">
          {{ cell.character || '&nbsp;' }}
        </div>
      </div>
    </div>
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
  `]
})
export class Vt100BufferComponent implements OnInit {
  ROWS = 24;
  COLS = 80;
  buffer: Cell[][] = [];
  serializedJson: string = '';

  ngOnInit() {
    // 初始化 buffer
    this.initializeBuffer();
    // 範例：填入一些測試資料
    this.fillTestData();
  }

  // 初始化空的 VT100 buffer
  initializeBuffer() {
    for (let i = 0; i < this.ROWS; i++) {
      const row: Cell[] = [];
      for (let j = 0; j < this.COLS; j++) {
        row.push({
          character: '',
          attributes: {
            foreground: '#ffffff',
            background: '#000000',
            bold: false,
            underline: false
          }
        });
      }
      this.buffer.push(row);
    }
  }

  // 填入測試資料
  fillTestData() {
    // 範例文字
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
    // 另一行不同樣式
    const text2 = 'Testing Colors';
    for (let i = 0; i < text2.length && i < this.COLS; i++) {
      this.buffer[1][i].character = text2[i];
      this.buffer[1][i].attributes = {
        foreground: '#ff0000',
        background: '#000000',
        bold: false,
        underline: true
      };
    }
  }

  // 序列化 buffer 為 JSON
  serializeBuffer() {
    this.serializedJson = JSON.stringify(this.buffer, null, 2);
  }

  // 可選：從 JSON 反序列化，變成 buffer, 然後 send to server
  deserializeBuffer(json: string) {
    try {
      this.buffer = JSON.parse(json);
    } catch (e) {
      console.error('Invalid JSON format', e);
    }
  }
}
