// enum 可以被更改。  const enum 不可以被更改
// 顏色是 css 控制的。 不是 enum.
export enum SgrColorFg
{
  _30_Black = 30,
  _31_Red = 31,
  _32_Green = 32,
  _33_Yellow = 33,
  _34_Blue = 34,
  _35_Magenta = 35, // 洋紅/紫色
  _36_Cyan = 36, // 青色
  _37_LightGray = 37, //淺灰
  _100_undefined = 100, // for test utils
}

export enum SgrColorBg
{
  _40_Black = 40,
  _41_Red = 41,
  _42_Green = 42,
  _43_Yellow = 43,
  _44_Blue = 44,
  _45_Magenta = 45, // 洋紅/紫色
  _46_Cyan = 46, // 青色
  _47_LightGray = 47, //淺灰
  _110_undefined = 110, // for test utils
}

export interface Cell
{
  char: string;
  attrs: SgrAttributes;
}

export interface SgrAttributes
{
  fg: SgrColorFg;
  bg: SgrColorBg;
  bright: boolean;
  inverse: boolean;
  blink: boolean;
  underLine: boolean;
  isLeadByte: boolean;
  sgrReset: number;
}
