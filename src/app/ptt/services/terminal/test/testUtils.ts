import {environment} from "../../../../../environments/environment";
import {Cell, SgrColorBg, SgrColorFg} from "../core/buffer-model";
import {TermBuffer} from "../core/term-buffer";

export class TestUtils
{
  enableTest = !environment.production;

  constructor()
  {
    if (!environment.production)
    {
      this.enableTest = true;
      if (this.enableTest)
      {
        console.log(`TestUtils: enable test utils`);
      }
    }
  }

  visualizeChar(str: string, ifreturnStr = false): string | void
  {
    let stopTest = false;
    if (stopTest)
    {
      return;
    }
    let showLog = str.split("").map((c) =>
    {
      switch (c)
      {
        case "\n":
        case "\f":
        case "\v":
          return "\\n";
        case "\r":
          return "\\r";
        case "\t":
          return "\\t";
        case "\x1b":
          return "*";
        case " ":
          return "\\s";
        case "\b":
          return "\\b";
        default:
          // 如果是不可見控制字元 (ASCII < 0x20)，用 ^X 表示
          if (c.charCodeAt(0) < 0x20)
          {
            // return `^${String.fromCharCode(c.charCodeAt(0) + 64)}`;
            let asciiControllCode = c.charCodeAt(0).toString(16).padStart(2, "0").toUpperCase();
            switch (asciiControllCode)
            {
              case "07":
                return "*[Bell]";
            }
            return "^Ox" + asciiControllCode + ";";
          }
          return c;
      }
    }).join("");
    if (ifreturnStr)
      return showLog;
    else
      console.log(`${showLog}`);
  }

  logBuffer(termbuffer: TermBuffer)
  {
    let lines = termbuffer.buffer;
    let cols = termbuffer.cols;
    let rows = termbuffer.rows;
    let templateChar = termbuffer.createDefaultCell();
    templateChar.attrs.fg = SgrColorFg._100_undefined;
    templateChar.attrs.bg = SgrColorBg._110_undefined;
    // console.log(`termbuffer.buffer[0][3].attrs.sgrReset=${termbuffer.buffer[0][3].attrs.sgrReset}`);
    let bufferdata = "";
    for (let r = 0; r < rows; r++)
    {
      let line = lines[r];
      for (let c = 0; c < cols; c++)
      {
        let termchar = line[c];
        let char = termchar.char;
        let char16data = char.charCodeAt(0).toString(16);// charcode的16進位
        // if (c === 3)
        // {
        //   console.log(`termchar.attrs.sgrReset=${termchar.attrs.sgrReset}`);
        // }
        let diffStr = this.compareTermChar(templateChar, termchar, r, c);
        if (diffStr)
        {
          templateChar = termchar; // 更新 previousChar 為目前的 termchar
          bufferdata += diffStr;
        }
        // if (char16data !== "20")
          bufferdata += char16data;
      }
    }
    // @ts-ignore
    bufferdata = bufferdata.match(new RegExp(`.{1,80}`, "g")).join("\n");
    console.log(`bufferdata=\n${bufferdata}`);
  }

  compareTermChar(templateChar: Cell, currentChar: Cell, r: number, c: number): string
  {
    let str = "";
    if (templateChar.attrs.fg !== currentChar.attrs.fg)
    {
      str += currentChar.attrs.fg + ";";
    }
    if (templateChar.attrs.bg !== currentChar.attrs.bg)
    {
      str += currentChar.attrs.bg + ";";
    }
    if (templateChar.attrs.bright !== currentChar.attrs.bright)
    {
      str += currentChar.attrs.bright ? "1" : "22" + ";";
    }
    if (templateChar.attrs.underLine !== currentChar.attrs.underLine)
    {
      str += (currentChar.attrs.underLine ? "4" : "24") + ";";
    }
    if (templateChar.attrs.inverse !== currentChar.attrs.inverse)
    {
      str += currentChar.attrs.inverse ? "7" : "27" + ";";
    }
    if (templateChar.attrs.blink !== currentChar.attrs.blink)
    {
      str += currentChar.attrs.blink ? "5" : "25" + ";";
    }
    if (templateChar.attrs.isLeadByte !== currentChar.attrs.isLeadByte)
    {
      // str += currentChar.attrs.isLeadByte;
    }
    // 0,1, 0, 2, 0,0,3
    if (templateChar.attrs.sgrReset < currentChar.attrs.sgrReset)
    {
      // console.log(`sgrReset 改變!!!!!!!!!! r:${r}, c:${c}`);
      str = "0;";
    }
    if (str !== "")
      str = "[" + str + "m";
    return str;
  }
}
