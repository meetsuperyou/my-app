import {TermCols, TermRows} from "../terminal-constants";
import {TestUtils} from "../test/testUtils";
import {IwebSocket} from "../websocket/I-Ws";
import {ParserBuffer} from "./parser-buffer";

const enum Command
{
  SE = "\xf0",               // End of subnegotiation
  NOP = "\xf1",
  DATA_MARK = "\xf2",
  BREAK = "\xf3",
  INTERRUPT_PROCESS = "\xf4",
  ABORT_OUTPUT = "\xf5",
  ARE_YOU_THERE = "\xf6",
  ERASE_CHARACTER = "\xf7",
  ERASE_LINE = "\xf8",
  GO_AHEAD = "\xf9",
  SB = "\xfa",       // SB \xFA Subnegotiation Begin（子協商開始）
  WILL = "\xfb",             // 我願意啟用某選項
  WONT = "\xfc",             // 我拒絕啟用某選項
  DO = "\xfd",               // 我同意啟用某選項, ptt 要求
  DONT = "\xfe",             // 我不同意啟用某選項，ptt 要求
  IAC = "\xff",              // 這個前綴就是 IAC (0xFF)，代表後面跟的不是一般文字，而是 Telnet 指令。
  ECHO = "\x01",
  SUPRESS_GO_AHEAD = "\x03", // 半雙工用, Go Ahead（提示可以輸入，早期半雙工用）
  TERM_TYPE = "\x18",
  IS = "\x00",
  SEND = "\x01",
  NAWS = "\x1f",
}
/*
* DO/DONT → 希望對方做 / 不做。
  WILL/WONT → 宣告自己願意做 / 不做。
* */
const enum TelnetState
{
  DATA,
  IAC,//這個前綴就是 IAC (0xFF)，代表後面跟的不是一般文字，而是 Telnet 指令。
  WILL,
  WONT,
  DO,
  DONT,
  SB, // Subnegotiation
}


export class ParserTalnet
{
  private state: TelnetState = TelnetState.DATA;
  private subNegotiationBuffer = "";
  private termType = "VT100";
  // private termBufferParser: ParserBuffer;
  private readonly myTermTypeCmd = Command.IAC + Command.SB
          + Command.TERM_TYPE + Command.IS + this.termType
          + Command.IAC + Command.SE;
  private readonly myTerminalSizeCmd = Command.IAC + Command.SB + Command.NAWS
          + String.fromCharCode(0, TermCols, 0, TermRows)
          + Command.IAC + Command.SE;

  constructor(private ws: IwebSocket, private termBufferParser: ParserBuffer, private testUtils:TestUtils)
  {
  }

  public parseTalnet(chunk: string)
  {
    // this.testUtils.visualizeChar(chunk); // 不准，這裡大家都是一樣的。

    if (chunk.length > 0)
    {
      let dataBuffer = "";
      for (const char of chunk)
      {
        switch (this.state)
        {
          case TelnetState.DATA:
            if (char === Command.IAC)
            {
              // 如果緩衝區有純文字，先發送出去
              if (dataBuffer)
              {
                this.termBufferParser.parseTermBufferData(dataBuffer);
                dataBuffer = "";
              }
              this.state = TelnetState.IAC;
            }
            else
            {
              dataBuffer += char;
            }
            break;
          case TelnetState.IAC:
            this.handleIac(char);
            break;
          case TelnetState.WILL:
            this.handleWill(char);
            break;
          case TelnetState.DO:
            this.handleDo(char);
            break;
          case TelnetState.DONT:
          case TelnetState.WONT:
            // 收到 DONT 或 WONT 後，直接回到 DATA 狀態，不做任何事
            this.state = TelnetState.DATA;
            break;
          case TelnetState.SB:
            this.handleSubNegotiation(char);
            break;
        }
      }// end for
      // 處理迴圈結束後剩餘的純文字數據
      if (dataBuffer)
      {
        // console.log(b2u(str));
        this.termBufferParser.parseTermBufferData(dataBuffer);
        dataBuffer = "";
      }
    }// end if
  }

  // 這個前綴就是 IAC (0xFF)，代表後面跟的不是一般文字，而是 Telnet 指令。
  handleIac(char: string): void
  {
    switch (char)
    {
      case Command.WILL:
        this.state = TelnetState.WILL;
        break;
      case Command.WONT:
        this.state = TelnetState.WONT;
        break;
      case Command.DO:
        this.state = TelnetState.DO;
        break;
      case Command.DONT:
        this.state = TelnetState.DONT;
        break;
      case Command.SB:
        this.state = TelnetState.SB;
        break;
      default:
        this.state = TelnetState.DATA;
        break; // 其他情況（如 IAC IAC）回到數據模式
    }
  }

  private handleWill(char: string): void
  {
    switch (char)
    {
      case Command.ECHO:
        console.log(`伺服器將啟用 (WILL): Echo，我同意 (DO)`);
        this.sendCommand(Command.IAC + Command.DO + char);
        break;
      case Command.SUPRESS_GO_AHEAD:
        console.log(`伺服器將啟用 (WILL): supress go ahead(抑制前進)，我同意 (DO)`);
        // Suppress Go Ahead = 不要傳「可以開始講話」這種控制符（因為現在全雙工不需要）。
        this.sendCommand(Command.IAC + Command.DO + char);
        break;
      default:
        /**
         * 所以很多 Telnet 伺服器在跟 VT100 客戶端協商時，會送 IAC DONT 0，表示：
         * 「這是一個文字終端機，不需要 8-bit Binary Mode」。
         * 這樣就能確保連線上跑的是 純文字 + 控制序列（像 ESC[31m 顯示紅字）。
         * */
        console.log(`伺服器將啟用 (WILL): ${char.charCodeAt(0)}，我拒絕 (DONT)`);
        this.sendCommand(Command.IAC + Command.DONT + char);
    }
    this.state = TelnetState.DATA;
  }

  private handleDo(char: string): void
  {
    switch (char)
    {
      case Command.TERM_TYPE:
        console.log(`伺服器要求我啟用 (DO): TERM_TYPE，我同意 (WILL)`);
        this.sendCommand(Command.IAC + Command.WILL + char);
        break;
      case Command.NAWS:
        console.log(`伺服器要求我啟用 (DO): NAWS`);
        // this.dispatchEvent(new CustomEvent("doNaws"));
        this.doNaws();
        // NAWS 的回覆通常由使用者介面觸發，這裡僅發出事件
        break;
      default:
        console.log(`伺服器要求我啟用 (DO): ${char.charCodeAt(0)}，我拒絕 (WONT)`);
        this.sendCommand(Command.IAC + Command.WONT + char);
    }
    this.state = TelnetState.DATA;
  }

  handleSubNegotiation(char: string): void
  {
    this.subNegotiationBuffer += char;
    // 檢查是否以 IAC + SE 結尾
    if (this.subNegotiationBuffer.slice(-2) == Command.IAC + Command.SE)
    {
      switch (this.subNegotiationBuffer[0])
      {
        case Command.TERM_TYPE:
          // 伺服器要求終端類型
          this.sendCommand(this.myTermTypeCmd);
          break;
      }
      this.subNegotiationBuffer = "";
      this.state = TelnetState.DATA;
    }
  }

  doNaws()
  {
    console.log(`好，我願意提供 NAWS`);
    this.sendCommand(Command.IAC + Command.WILL + Command.NAWS);
    //====
    this.sendCommand(this.myTerminalSizeCmd);
  }

  sendCommand(str: string)
  {
    if (str)
    {
      this.ws.sendWsMsg(str);
    }
  }
}
