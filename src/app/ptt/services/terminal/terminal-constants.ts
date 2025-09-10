export const TermRows = 24;
export const TermCols = 80;
export const BufferConst = {
  Scroll: {
    Up: 1,
    Down: 0
  },
} as const;
// 定義型別
export type BufferScroll = typeof BufferConst.Scroll[keyof typeof BufferConst.Scroll];
