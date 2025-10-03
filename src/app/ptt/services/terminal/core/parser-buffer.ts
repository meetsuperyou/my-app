import {TestUtils} from "../test/testUtils";
import {TermBuffer} from "./term-buffer";

const enum ParserState
{
  TEXT,
  ESC,
  CSI, // Control Sequence Introducer: \x1b[
  C1,  // C1 Control Codes: \x1b followed by a single char
}

const ESC = "\x1b";

export class ParserBuffer
{
  private state: ParserState = ParserState.TEXT;
  private textBuffer: string = "";
  private paramsBuffer: string = "";

  constructor(private termBuffer: TermBuffer, private testUtilities: TestUtils)
  {
  }

  // this.parser.feed(data);
  parseTermBufferData(data: string)
  {
    // console.log(`talnet 過濾之後的資料\n`);
    // this.testUtilities.visualizeChar(data, false);
    this.textBuffer = "";
    let dataLength = data.length;
    for (let index = 0; index < dataLength; ++index)
    {
      const char = data[index];
      switch (this.state)
      {
        case ParserState.TEXT:
          this.handleTextState(char);
          break;
        case ParserState.ESC:
          if (char === "[") // esc 後面一定是 [，下一個字就是 csi
          {
            this.state = ParserState.CSI;
          }
          else // 處理 ESC 後面不是 '[' 的情況，這個字就是 c1
          {
            this.state = ParserState.C1;
            index--;
          }
          break;
        case ParserState.CSI:
          this.handleCsiState(char);
          break;
        case ParserState.C1:
          let C1_End = true;
          let C1_Char = [" ", "#", "%", "(", ")", "*", "+", "-", ".", "/"];
          if (this.paramsBuffer)  // 一開始是沒有 escPara的，因為前一個符號是 *esc
          { // multi-char is not supported now, parambuffer 全找出來，然後清掉不處理
            for (let j = 0; j < C1_Char.length; ++j)
            {
              if (this.paramsBuffer === C1_Char[j]) // c1-char 代表後面還有字元
              {
                C1_End = false; // find it
              }
            }
            if (C1_End)
            {
              --index;
            }
            else
            {
              this.paramsBuffer += char; // 繼續累加
            }
            //dump('UNKNOWN C1 CONTROL CHAR IS FOUND: ' + this.esc + '\n');
            this.paramsBuffer = ""; // 清空
            this.state = ParserState.TEXT;
            break; // 進入 if, 最終都是 break;
          }
          let term = this.termBuffer;
          switch (char)
          {
            case "7":
              this.termBuffer.saveCursorPosition();
              break;
            case "8":
              this.termBuffer.restoreCursorPosition();
              break;
            case "D":
              this.termBuffer.scroll(false, 1, "c1-D"); // scrolldown
              break;
            case "E": //// Next Line
              this.termBuffer.lineFeed();
              term.carriageReturn();
              break;
            case "M":
              term.scroll(true, 1, "c1-M"); //scroll up
              break;
            default:
              this.paramsBuffer += char;
              C1_End = false;
          } // end switch(char)
          console.log(`\n\n\nptt 有 C1 ?ch:${char},para:${this.paramsBuffer}  \n\n\n`);
          if (!C1_End) // 先不要清空 para-buffer, 繼續找出 multi-para
            break;
          this.paramsBuffer = "";
          this.state = ParserState.TEXT;
          break;
      } //  switch (this.state)
    } // end for
    this.flushTextBuffer();// 處理迴圈結束後剩餘的純文字
    this.testUtilities.logBuffer(this.termBuffer);
  }

  private handleCsiState(finalByte: string): void
  {
    // CSI 序列由參數字元 (0-9;?) 和一個結束的命令字元 (A-Z, a-z) 組成
    // if ((ch >= "`" && ch <= "z") || (ch >= "@" && ch <= "Z"))
    // if ((char >= "`" && char <= "z") || (char >= "@" && char <= "Z"))
    if (finalByte >= "@" && finalByte <= "~")
    {
      this.processCsiCommand(finalByte, this.termBuffer);// 只有處理 switch
      // 無論 processCsiCommand 成功或失敗，都清空 paramsBuffer
    }
    else
    {
      this.paramsBuffer += finalByte; // 累積 esc = \x1b[38;5;27，沒有m，沒有H
    }
  }

  private isNumberStringsOrEmpty(arr: string[])
  {
    return arr.every(el => (el === "" || (/^\d+$/.test(el)))
    );
  }

  private processCsiCommand(finalByte: string, term: TermBuffer): void
  {
    let params1 = this.paramsBuffer.split(";");
    if (!this.isNumberStringsOrEmpty(params1)) // ptt 只處理數字 para
    {
      return; // 外面會清空
    }
    let params: number[] = params1.map(p => parseInt(p, 10) || 0);// array 的 空字串補0
    switch (finalByte)
    {
      case "m": // 設定字型樣式，例如顏色、粗體、底線、反白等
        this.termBuffer.applySgrTemplate(params);
        break;
      case "@": // 插入 n 個空白字元。
        this.termBuffer.insert(params[0] > 0 ? params[0] : 1);
        break;
      case "A": // 游標上移 n 行（預設 1）。
        // 如果是0,就換成1;  *[A = *[0A = *[1A
        this.termBuffer.moveCursorXY(term.cursor_x, term.cursor_y - (params[0] ? params[0] : 1));
        break;
      case "B": //游標下移 n 行（預設 1），假設游標現在在 第 5 行第 10 列：ESC [ 3 B 移到 第 8 行第 10 列
        // case "e": // 假設游標現在在 第 5 行第 10 列：ESC [ 3 e 移到 第 8 行第 1 列，VT220 等終端支援
        this.termBuffer.moveCursorXY(term.cursor_x, term.cursor_y + (params[0] ? params[0] : 1));
        break;
      case "C": // 游標右移 n 行（預設 1）。
        this.termBuffer.moveCursorXY(term.cursor_x + (params[0] ? params[0] : 1), term.cursor_y);
        break;
      case "D": //游標左移 n 行（預設 1）
        this.termBuffer.moveCursorXY(term.cursor_x - (params[0] ? params[0] : 1), term.cursor_y);
        break;
      case "E": // 這不是 e 的事情嗎，可能 ptt 錯了
        // this.termBuffer.setCursorX(0); 回到行首，下面做
        this.termBuffer.moveCursorXY(0, term.cursor_y + (params[0] ? params[0] : 1));
        break;
      case "F": // 游標上移 n 行，並回到行首。
        // this.termBuffer.setCursorX(0);
        this.termBuffer.moveCursorXY(0, term.cursor_y - (params[0] ? params[0] : 1));
        break;
      case "G":
      case "`": // 移動游標到指定的欄位
        this.termBuffer.moveCursorXY(params[0] > 0 ? params[0] - 1 : 0, term.cursor_y);
        break;
      case "I":
        term.tab(params[0] > 0 ? params[0] : 1);
        break;
      case "d": // 移動游標到指定的列
        this.termBuffer.moveCursorXY(term.cursor_x, params[0] > 0 ? params[0] - 1 : 0);
        break;
      case "J": // 清除螢幕（0=光標到末尾, 1=開頭到光標, 2=整個畫面）
        this.termBuffer.clear(params ? params[0] : 0);
        break;
      case "H": // 移動游標到指定的 (row, col)。
      case "f": // f,H 兩者功能完全一樣，只是名稱不同。
        if (params.length < 2)
        {
          term.moveCursorXY(0, 0); // *[H
        }
        else
        {
          if (params[0] > 0)
            --params[0];
          if (params[1] > 0)
            --params[1];
          term.moveCursorXY(params[1], params[0]);
          // *[1;80H = move to row 1, col 80 = (x:80,y:1)
        }
        break;
      case "K": // 清除游標所在行（0=游標到行尾, 1=行首到游標, 2=整行）
        this.termBuffer.eraseLine(params ? params[0] : 0);
        // 如果 params 存在（不是 null / undefined / false）
        // console.log(0 ?? 42);        // 0   (因為 0 不是 null/undefined)
        // console.log(0 || 42);        // 42  (因為 0 是 falsy)
        // 一個? 號 。如果 params 存在（不是 null / undefined / false）
        break;
      case "L": // 插入 n 行。
        this.termBuffer.insertLine(params[0] > 0 ? params[0] : 1);
        break;
      case "M": // 刪除 n 行。
        this.termBuffer.deleteLine(params[0] > 0 ? params[0] : 1);
        break;
      case "P": // 刪除 n 個字元。
        this.termBuffer.deleteChars(params[0] > 0 ? params[0] : 1);
        break;
      case "r": // 設定滾動區域（例如只讓中間幾行能捲動）。
        this.termBuffer.setScrollRegion(params);
        break; // p1: top, p2: bottom
      case "s":// 儲存游標位置。
        this.termBuffer.saveCursorPosition();
        break;
      case "u": // 回復游標位置。
        this.termBuffer.restoreCursorPosition();
        break;
      case "S": // 捲動螢幕 n 行（新行加在底部）
        this.termBuffer.scroll(false, (params[0] > 0 ? params[0] : 1), "csi-S");
        break;
      case "T": //反向捲動 n 行（新行加在頂部）。
        this.termBuffer.scroll(true, (params[0] > 0 ? params[0] : 1), "csi-T");
        break;
      case "X": // 清除游標右邊 n 個字元。
        this.termBuffer.eraseChars(params[0] > 0 ? params[0] : 1);
        break;
      case "Z":
        term.backTab(params[0] > 0 ? params[0] : 1);
        break;
      default:
        console.warn(`Unsupported CSI command: '${finalByte}' with params: [${params.join(",")}]`);
    }
    this.state = ParserState.TEXT;
    this.paramsBuffer = "";
  }

  private handleTextState(char: string): void
  {
    if (char === ESC)
    {
      this.flushTextBuffer();
      this.state = ParserState.ESC;
    }
    else
    {
      this.textBuffer += char;
    }
  }

  private handleC1State(char: string): void
  {
    // C1 控制碼的簡易處理
    // vt100 不用 C1。 進入文章，往下一頁，往上一行，出現 M
    switch (char)
    {
      case "7":
        this.termBuffer.saveCursorPosition();
        break;
      case "8":
        this.termBuffer.restoreCursorPosition();
        break;
      case "D": // Index
        this.termBuffer.scroll(false, 1, "c1-D");
        break;
      case "E": // Next Line
        // this.termBuffer.setCursorX(0);
        this.termBuffer.moveCursorXY(0, 1);
        break;
      case "M": // Reverse Index
        this.termBuffer.scroll(true, 1, "c1-M");
        break;
    }
    // C1 控制碼通常只有一個字元，處理完就回到 TEXT 狀態
    this.state = ParserState.TEXT;
  }

  private flushTextBuffer(): void
  {
    if (this.textBuffer)
    {
      this.termBuffer.putText(this.textBuffer);
      this.textBuffer = "";
    }
  }
}
