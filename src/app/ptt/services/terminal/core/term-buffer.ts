import {TermCols, TermRows} from "../terminal-constants";
import {TestUtils} from "../test/testUtils";
import {Cell, SgrAttributes, SgrColorBg, SgrColorFg} from "./buffer-model";

const DEFAULT_ATTRIBUTES: SgrAttributes =
        {
          fg: SgrColorFg._37_LightGray,
          bg: SgrColorBg._40_Black,
          bright: false, blink: false, underLine: false,
          inverse: false, isLeadByte: false, sgrReset: 0
        };

export class TermBuffer
{
  cols = TermCols;
  rows = TermRows;
  cursor_x = 0;
  cursor_y = 0;
  save_cursor_x = -1;
  save_cursor_y = -1;
  scrollTop = 0;
  scrollBottom = TermRows - 1;
  buffer: Cell[][] = Array.from({length: this.rows}, () =>
          Array.from({length: this.cols}, () => this.createDefaultCell()));
  templateSgrAttribute: SgrAttributes = {...DEFAULT_ATTRIBUTES};

  constructor(private testUtils: TestUtils)
  {
    /**
     this.lines = new Array(this.rows);
     for (let i = 0; i < this.rows; i++)
     {
     let line: Cell[] = new Array(this.cols);
     for (let j = 0; j < this.cols; j++)
     {
     line[j] = this.createDefaultCell();
     }
     this.lines[i] = line;
     }
     **/
    this.unitTest();
  }

  unitTest()
  {
    // this.lines[0][5].char = "[0-5]"; //  Cannot read properties of undefined (reading '5')
    // this.lines[0][1].char = "[0-1]";
    // // this.lines[2][1].char = "[2-1]";
    // // this.lines[23][1].char = "[23-1]";
    // this.buffer[23][0].char="[23-0]";
    // this.dump();
  }

  dump(): void
  {
    // console.log(`dump:\n`);
    // const buffer = this.lines.map(row => row.map(cell => cell.char).join(""));//Cannot read properties of undefined (reading 'map')
    // console.log("buf:\n" + buffer.join("\n"));
    // console.log(`\n`);
    // const line0 = this.lines[2];
    // console.log(`test1=${line0.map(cell => cell.char).join("")}`);
    // console.log(`test2=${JSON.stringify(this.lines)}`);
    // console.log(`this.toJSON()=${this.toJSON()}`);
    // console.log(`this.buffer[23]=${this.buffer[23]}`);
    // let bbb = this.buffer.pop();
    // let ccc= this.lines.pop();
    //
    // if (bbb && ccc)
    // {
    //   console.log(`bbb=${this.getCharOnly_NoSgrColor(bbb)}`);
    //   console.log(`ccc=${this.getCharOnly_NoSgrColor(ccc)}`);
    //   let aaa = this.buffer.unshift(bbb);
    //   console.log(`test3=\n${JSON.stringify(this.buffer[0])}`);
    // }
    //
    //
  }

  getCharOnly_NoSgrColor(line: Cell[])
  {
    return line.map(cell => cell.char).join(",");
  }

  // true 向上滾動，buffer data 往下移動，上面行出現文章前段
  // false向下滾動，buffer data 往上移動，下面行出現文章後段
  scroll(bufferScrollDirection: boolean, scrollLineNumber: number, _caller: string)
  {
    let scrollTop = this.scrollTop; // 0
    let scrollBottom = this.scrollBottom; // 23
    if (scrollBottom <= scrollTop)
    {
      scrollTop = 0;
      if (scrollBottom < 1)
        scrollBottom = this.rows - 1;
    }
    if (scrollLineNumber >= this.rows) // scroll more than 1 pages = 清除全螢幕
      this.clear(2);
    else if (scrollLineNumber >= scrollBottom - scrollTop + 1) // number>=24
    {
      let cols = this.cols;
      for (let row = scrollTop; row <= scrollBottom; ++row)
      { //設定範圍, 0, 0<=23
        for (let col = 0; col < cols; ++col)
        { //清空一行
          this.buffer[row][col] = this.createDefaultCell();
        }
      }
    }
    else
    {
      let lines = this.buffer;
      let rows = this.rows;
      let cols = this.cols;
      if (bufferScrollDirection) //向上滾動，但是把 buffer 資料往下搬動
      {
        for (let i = 0; i < rows - 1 - scrollBottom; ++i) // i < 24 -1 - 23
        {
          this.moveTailToHead(lines);
        }
        while (--scrollLineNumber >= 0)
        {
          let start = rows - 1 - scrollBottom + scrollTop;
          let last = lines.pop();// 取出最後一個
          if (last !== undefined)
          {
            lines.splice(start, 0, last);
            for (let col = 0; col < cols; ++col)
              last[col] = this.createDefaultCell();
          }
        }
        for (let i = 0; i < rows - 1 - scrollBottom; ++i)
        {
          this.moveHeadToTail(lines);
        }
      }
      else // 向下滾動，把 buffer 資料往上移動
      {
        for (let i = 0; i < scrollTop; ++i)
        {
          this.moveHeadToTail(lines);
          while (--scrollLineNumber >= 0)
          {
            let first = lines.shift();
            if (first !== undefined)
            {
              lines.splice(scrollBottom - scrollTop, 0, first);
              for (let col = 0; col < cols; ++col) // 重置 the line
                first[col] = this.createDefaultCell();
            }
          }
          for (let i = 0; i < scrollTop; ++i)
          {
            this.moveTailToHead(lines);
          }
        }
      }
    }
  }

  private moveTailToHead<T>(lines: T[][])
  {
    let last = lines.pop();
    if (last !== undefined)
      lines.unshift(last);
  }

  private moveHeadToTail<T>(lines: T[][])
  {
    let first = lines.shift();
    if (first !== undefined)
    {
      lines.push(first);
    }
  }

  public createDefaultCell(): Cell
  {
    // 每次都回傳新的 Cell
    return {
      char: " ",
      attrs: {...DEFAULT_ATTRIBUTES},
    };
  }

  toJSON(): string
  {
    let _rows = this.buffer.map(row => row.map(cell => cell.char).join(""));
    let rows = JSON.stringify(_rows, null, 2);
    // const all = JSON.stringify(this.buffer, null, 2);
    let result = rows;
    return result;
    // 第二個參數 null, 第三個參數 2 → 美化縮排，方便看
  }

  putText(str: string): void
  {
    if (!str)
      return;
    // console.log(`puts\n`);
    // this.testUtils.visualizeChar(str, false);
    let cols = this.cols;
    let n = str.length;
    let line = this.buffer[this.cursor_y];
    for (let i = 0; i < n; ++i)
    {
      let ch = str[i];
      switch (ch)
      {
        case "\x07":
          // FIX ME: beep (1)Sound (2)AlertNotification (3)change icon
          // should only play sound
          continue;
        case "\b":
          // console.log(`不會有back 吧`); 結果有
          this.back();
          continue;
        case "\r":
          this.carriageReturn();
          continue;
        case "\n":
        case "\f":
        case "\v":
          this.lineFeed();
          line = this.buffer[this.cursor_y];
          continue;
        case "\0":
          continue;
      }
      //if( ch < ' ')
      //    //dump('Unhandled invisible char' + ch.charCodeAt(0)+ '\n');
      if (this.cursor_x >= cols)
      {
        // next line
        this.lineFeed();
        this.cursor_x = 0;
        line = this.buffer[this.cursor_y];
      }
      switch (ch)
      {
        case "\t":
          this.tab(1);
          break;
        default:
          // let cell = line[this.cursor_x]; // 資料是 term char, 2 char = 1 中文
          line[this.cursor_x] = {attrs: {...this.templateSgrAttribute}, char: ch};
          ++this.cursor_x;
      }
    }
  }

  moveCursorXY(cursorX: number, cursorY: number)
  {
    if (cursorX >= this.cols)
      cursorX = this.cols - 1;
    if (cursorY >= this.rows)
      cursorY = this.rows - 1;
    if (cursorX < 0)
      cursorX = 0;
    if (cursorY < 0)
      cursorY = 0;
    this.cursor_x = cursorX;
    this.cursor_y = cursorY;
  }

  saveCursorPosition()
  {
    this.save_cursor_x = this.cursor_x;
    this.save_cursor_y = this.cursor_y;
  }

  restoreCursorPosition()
  {
    if (this.save_cursor_x < 0 || this.save_cursor_y < 0)
      return;
    this.cursor_x = this.save_cursor_x;
    this.cursor_y = this.save_cursor_y;
  }

  eraseLine(param: number)// 清除游標所在行（0=游標到行尾, 1=行首到游標, 2=整行）
  {
    let line = this.buffer[this.cursor_y];
    let cols = this.cols;
    switch (param)
    {
      case 0: // erase to rigth
        for (let col = this.cursor_x; col < cols; ++col)
        {
          line[col] = this.createDefaultCell();
        }
        break;
      case 1: //erase to left
        let cursor_x = this.cursor_x;
        for (let col = 0; col < cursor_x; ++col)
        {
          line[col] = this.createDefaultCell();
        }
        break;
      case 2: //erase all
        for (let col = 0; col < cols; ++col)
        {
          line[col] = this.createDefaultCell();
        }
        break;
    }
  }

  insertLine(param: number)
  {
    let scrollTop = this.scrollTop;
    if (this.cursor_y < this.scrollBottom)
    {
      this.scrollTop = this.cursor_y;
      this.scroll(true, param, "insertLine");
    }
    this.scrollTop = scrollTop;
  }

  deleteLine(param: number)
  {
    let scrollTop = this.scrollTop;
    this.scrollTop = this.cursor_y;
    this.scroll(false, param, "deleteLine");
    this.scrollTop = scrollTop;
  }

  deleteChars(param: number)
  {
    let line = this.buffer[this.cursor_y];
    let cols = this.cols;
    let cursor_x = this.cursor_x;
    if (cursor_x > 0 && line[cursor_x - 1].attrs.isLeadByte)
      ++cursor_x;
    if (cursor_x == cols)
      return;
    if (cursor_x + param >= cols)
    {
      for (let col = cursor_x; col < cols; ++col)
      {
        line[col] = this.createDefaultCell();
      }
    }
    else
    {
      let n = cols - cursor_x - param;
      while (--n >= 0)
      {
        let tailCell = line.pop();
        if (tailCell !== undefined)
        {
          line.splice(cursor_x, 0, tailCell);
        }
      }
      for (let col = cols - param; col < cols; ++col)
        line[col] = this.createDefaultCell();
    }
  }

  insert(param: number) // 插入空白字元，不能是其他字元
  {
    let line = this.buffer[this.cursor_y];
    let cols = this.cols;
    let cursor_x = this.cursor_x;
    if (cursor_x > 0 && line[cursor_x - 1].attrs.isLeadByte)
      ++cursor_x;
    if (cursor_x == cols)
      return;
    if (cursor_x + param >= cols)
    {
      for (let col = cursor_x; col < cols; ++col)
      {
        line[col] = this.createDefaultCell();
      }
    }
    else
    {
      while (--param >= 0)
      {
        let LastCell = line.pop();
        if (LastCell !== undefined)
        {
          line.splice(cursor_x, 0, LastCell);
          LastCell = this.createDefaultCell();
        }
      }
    }
  }

  eraseChars(param: number)
  {
    let line = this.buffer[this.cursor_y];
    let cols = this.cols;
    let cursor_x = this.cursor_x;
    if (cursor_x > 0 && line[cursor_x - 1].attrs.isLeadByte)
      ++cursor_x;
    if (cursor_x == cols)
      return;
    let n = (cursor_x + param > cols) ? cols : cursor_x + param;
    for (let col = cursor_x; col < n; ++col)
    {
      line[col] = this.createDefaultCell();
    }
  }

  setScrollRegion(params: number[])
  {
    if (params.length < 2)
    {
      this.scrollTop = 0;
      this.scrollBottom = this.rows - 1;
    }
    else
    {
      if (params[0] > 0)
        --params[0];
      if (params[1] > 0)
        --params[1];
      this.scrollTop = params[0];
      this.scrollBottom = params[1];
    }
  }

  applySgrTemplate(params: number[])
  {
    // xxx
    // 31;42m   or 32;0m;不可能  0m 不會帶參數
    // this.templateSgrAttribute.sgrReset = false;
    params.forEach(val =>
    {
      switch (val)
      {
        case 0: // reset，問題在於，沒有人會把 reset 改成 un-reset. 所以 true/false 沒意義
          // this.resetAttr();
          // template 只有一個，一值加上去是可以的
          let counterSgrReset = ++this.templateSgrAttribute.sgrReset;
          this.templateSgrAttribute = {...DEFAULT_ATTRIBUTES};
          // console.log(`reset 出現`);
          this.templateSgrAttribute.sgrReset = counterSgrReset;
          // let a = params.join(";");
          // console.log(`0m 的參數是:${a},sgr=${this.templateSgrAttribute.sgrReset}`);
          break;
        case 1: // bright
          // this.bright = true;
          this.templateSgrAttribute.bright = true;
          break;
        case 4:
          // this.underLine = true;
          this.templateSgrAttribute.underLine = true;
          break;
        case 5: // blink
        case 6:
          // this.blink = true;
          this.templateSgrAttribute.blink = true;
          break;
        case 7: // invert
          // this.invert = true;
          this.templateSgrAttribute.inverse = true;
          break;
        case 8:
          // invisible is not supported
          break;
        case 22: // normal, or not bright
          // this.templateSgrAttribute.bright = false;
          break;
        case 24: // not underlined
          // this.templateSgrAttribute.underline = false;
          break;
        case 25: // steady, or not blink
          // this.templateSgrAttribute.blink = false;
          break;
        case 27: // positive, or not invert
          // this.templateSgrAttribute.inverse = false;
          break;
        default:
          if (val >= 30 && val <= 37)
            this.templateSgrAttribute.fg = val as SgrColorFg;
          else if (val >= 40 && val <= 47)
            this.templateSgrAttribute.bg = val as SgrColorBg;
          break;
      }
    });
  }

  carriageReturn()
  {
    this.cursor_x = 0;
  }

  lineFeed()
  {
    if (this.cursor_y < this.scrollBottom)
    {
      ++this.cursor_y;
    }
    else
    { // at bottom of screen
      this.scroll(false, 1, "lineFeed"); // 往下滾，出現新行
    }
  }

  public clear(param: number) // clear J
  {
    switch (param)
    { // 清除螢幕（0=光標到末尾, 1=開頭到光標, 2=整個畫面）
      case 0:// 清除螢幕（0=光標到末尾）
        for (let col = this.cursor_x; col < this.cols; ++col) // y 行，cursor 到 結尾
        {
          this.buffer[this.cursor_y][col] = this.createDefaultCell();
        }
        for (let row = this.cursor_y; row < this.rows; ++row) // 第 y 行 到最後一行
        {
          for (let col = 0; col < this.cols; ++col)
          {
            this.buffer[row][col] = this.createDefaultCell();
          }
        }
        break;
      case 1:// 清除螢幕（ 1=開頭到光標）
        for (let row = 0; row < this.cursor_y; ++row) // 第一行到 y 行
        {
          for (let col = 0; col < this.cols; ++col)
          {
            this.buffer[row][col] = this.createDefaultCell();
          }
        }
        for (let col = 0; col < this.cursor_x; ++col) // // y 行，開頭 到 cursor
        {
          this.buffer[this.cursor_y][col] = this.createDefaultCell();
        }
        break;
      case 2:// 清除螢幕（0=光標到末尾, 1=開頭到光標, 2=整個畫面）
        // 使用更常見的 for 迴圈來清除整個畫面，可讀性比 `while (--rows >= 0)` 更好
        for (let row = 0; row < this.rows; row++)
        {
          for (let col = 0; col < this.cols; col++)
          {
            this.buffer[row][col] = this.createDefaultCell();
          }
        }
        break;
    }
  }

  tab(param: number)
  {
    let mod = this.cursor_x % 4;
    this.cursor_x += 4 - mod;
    if (param > 1)
      this.cursor_x += 4 * (param - 1);
    if (this.cursor_x >= this.cols)
      this.cursor_x = this.cols - 1;
  }

  backTab(param: number)
  {
    let mod = this.cursor_x % 4;
    this.cursor_x -= (mod > 0 ? mod : 4);
    if (param > 1)
      this.cursor_x -= 4 * (param - 1);
    if (this.cursor_x < 0)
      this.cursor_x = 0;
  }

  private back()
  {
    if (this.cursor_x > 0)
    {
      --this.cursor_x;
    }
  }
}
