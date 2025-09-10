// src/app/gemini-terminal/gemini-terminal.model.ts
export interface CellAttributes2
{
  fg: string | null;
  bg: string | null;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  inverse: boolean;
}

export interface Cell2
{
  char: string;
  attrs: CellAttributes2;
}

export interface TerminalBuffer2
{
  rows: number;
  cols: number;
  cursor: { x: number; y: number };
  grid: Cell2[][];
}
