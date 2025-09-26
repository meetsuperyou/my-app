// src/app/gemini-terminal/gemini-terminal-buffer.service.ts
import {Injectable} from "@angular/core";
import {BehaviorSubject, Observable} from "rxjs";
import {Cell2, CellAttributes2, TerminalBuffer2} from "./terminal.model";

const DEFAULT_ATTRIBUTES2: CellAttributes2 = {
  fg: null, bg: null,
  bold: false, italic: false, underline: false, inverse: false
};
const DEFAULT_CELL2: Cell2 = {char: " ", attrs: {...DEFAULT_ATTRIBUTES2}};

@Injectable({
  providedIn: "root", // 讓此服務成為一個全域單例
})
export class TerminalBufferService
{
  private readonly rows = 24;
  private readonly cols = 80;
  // 使用 BehaviorSubject 來保存和廣播終端狀態
  private readonly stateSubject: BehaviorSubject<TerminalBuffer2>;
  public readonly state$: Observable<TerminalBuffer2>;
  private currentAttributes: CellAttributes2 = {...DEFAULT_ATTRIBUTES2};

  constructor()
  {
    const initialState = this.createInitialState(this.rows, this.cols);
    this.stateSubject = new BehaviorSubject<TerminalBuffer2>(initialState);
    this.state$ = this.stateSubject.asObservable(); // 對外提供唯讀的 Observable
  }

  private createInitialState(rows: number, cols: number): TerminalBuffer2
  {
    return {
      rows,
      cols,
      cursor: {x: 0, y: 0},
      grid: Array.from({length: rows}, () =>
              Array.from({length: cols}, () => JSON.parse(JSON.stringify(DEFAULT_CELL2)))
      ),
    };
  }

  // 所有修改狀態的方法，現在都會取得目前狀態，修改後再透過 .next() 發出新狀態
  public write(text: string): void
  {
    const state = {...this.stateSubject.getValue()}; // 取得目前狀態的淺拷貝
    for (const char of text)
    {
      if (char === "\n")
      {
        this.newLine(state);
        continue;
      }
// console.log(`char=${char};`);
      state.grid[state.cursor.y][state.cursor.x] = {
        char,
        attrs: {...this.currentAttributes}, // 就是這個，複製 currentAttributes
      };
      state.cursor.x++;
      if (state.cursor.x >= state.cols)
      {
        this.newLine(state);
      }
    }
    this.stateSubject.next(state); // 發送更新後的狀態
  }

  private newLine(state: TerminalBuffer2): void
  {
    state.cursor.x = 0;
    state.cursor.y++;
    if (state.cursor.y >= state.rows)
    { //超過高度了， 拿掉第一 row.
      state.grid.shift();
      state.grid.push(
              Array.from({length: state.cols}, () => JSON.parse(JSON.stringify(DEFAULT_CELL2)))
      );
      state.cursor.y = state.rows - 1;
    }
  }

  public setAttributes(attrs: Partial<CellAttributes2>): void
  {
    this.currentAttributes = {...this.currentAttributes, ...attrs};
    // 這個是，屬性部分覆蓋。 {...a,b,c, ...覆蓋b}
    // 還要手動 resetAttributes ....
    // 不對，要 follow 才是對的，例如: [underline, inverse hello [31m hello ,紅色底線 hello
    // 這是操作物件的方法。
  }

  public resetAttributes(): void
  {
    this.currentAttributes = {...DEFAULT_ATTRIBUTES2};
  }

  public setCursor(x: number, y: number): void
  {
    const state = {...this.stateSubject.getValue()};
    state.cursor.x = Math.max(0, Math.min(x, state.cols - 1));
    state.cursor.y = Math.max(0, Math.min(y, state.rows - 1));
    this.stateSubject.next(state);
  }

  public clear(): void
  {
    const newState = this.createInitialState(this.rows, this.cols);
    this.resetAttributes();
    this.stateSubject.next(newState);
  }

  public serialize(): string
  {
    return JSON.stringify(this.stateSubject.getValue());
  }

  public load(jsonString: string): void
  {
    try
    {
      const loadedState = JSON.parse(jsonString) as TerminalBuffer2;
      if (loadedState && loadedState.grid)
      {
        this.stateSubject.next(loadedState);
      }
    }
    catch (e)
    {
      console.error("Failed to load gemini-terminal state from JSON.", e);
    }
  }
}
