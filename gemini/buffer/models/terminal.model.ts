// src/models/gemini-terminal.model.ts
/**
 * 定義單一儲存格的 SGR (Select Graphic Rendition) 屬性
 */
export interface CellAttributes
{
  fg: string | null;      // 前景色 (e.g., '#FF0000', 'red')
  bg: string | null;      // 背景色
  bold: boolean;
  italic: boolean;
  underline: boolean;
  inverse: boolean;       // 反相 (前景/背景色交換)
}

/**
 * 定義單一儲存格的結構
 */
export interface Cell
{
  char: string;           // 顯示的字元 (預設為 ' ')
  attrs: CellAttributes;
}

/**
 * 整個終端緩衝區的狀態，這就是會被序列化成 JSON 的物件
 */
export interface TerminalState
{
  rows: number;
  cols: number;
  cursor: { x: number; y: number };
  grid: Cell[][]; // 二維陣列，代表整個螢幕的儲存格
}
