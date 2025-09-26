// src/services/gemini-terminal-buffer.service.ts
// 定義預設的屬性與儲存格
const DEFAULT_ATTRIBUTES = {
    fg: null,
    bg: null,
    bold: false,
    italic: false,
    underline: false,
    inverse: false,
};
const DEFAULT_CELL = {
    char: ' ',
    attrs: { ...DEFAULT_ATTRIBUTES },
};
export class TerminalBuffer {
    state;
    currentAttributes;
    constructor(rows = 24, cols = 80) {
        this.state = {
            rows,
            cols,
            cursor: { x: 0, y: 0 },
            grid: this.createGrid(rows, cols),
        };
        this.currentAttributes = { ...DEFAULT_ATTRIBUTES };
    }
    /** 建立一個新的空白格網 */
    createGrid(rows, cols) {
        return Array.from({ length: rows }, () => Array.from({ length: cols }, () => JSON.parse(JSON.stringify(DEFAULT_CELL))));
    }
    /**
     * 在目前游標位置寫入文字
     * @param text 要寫入的字串
     */
    write(text) {
        for (const char of text) {
            if (char === '\n') {
                this.newLine();
                continue;
            }
            // 將字元與目前屬性寫入儲存格
            const cell = this.state.grid[this.state.cursor.y][this.state.cursor.x];
            cell.char = char;
            cell.attrs = { ...this.currentAttributes };
            // 移動游標
            this.state.cursor.x++;
            if (this.state.cursor.x >= this.state.cols) {
                this.newLine();
            }
        }
    }
    /** 換行處理，如果到底部則滾動螢幕 */
    newLine() {
        this.state.cursor.x = 0;
        this.state.cursor.y++;
        if (this.state.cursor.y >= this.state.rows) {
            this.scroll();
            this.state.cursor.y = this.state.rows - 1;
        }
    }
    /** 螢幕向上滾動一行 */
    scroll() {
        // 移除第一行
        this.state.grid.shift();
        // 在底部新增一個空白行
        this.state.grid.push(Array.from({ length: this.state.cols }, () => JSON.parse(JSON.stringify(DEFAULT_CELL))));
    }
    /**
     * 設定後續文字的 SGR 屬性
     * @param attrs - 部分或全部的 CellAttributes
     */
    setAttributes(attrs) {
        this.currentAttributes = { ...this.currentAttributes, ...attrs };
    }
    /** 重設 SGR 屬性為預設值 */
    resetAttributes() {
        this.currentAttributes = { ...DEFAULT_ATTRIBUTES };
    }
    /** 移動游標 */
    setCursor(x, y) {
        this.state.cursor.x = Math.max(0, Math.min(x, this.state.cols - 1));
        this.state.cursor.y = Math.max(0, Math.min(y, this.state.rows - 1));
    }
    /** 清除整個螢幕 */
    clear() {
        this.state.grid = this.createGrid(this.state.rows, this.state.cols);
        this.setCursor(0, 0);
    }
    /**
     * 將目前的緩衝區狀態序列化成 JSON 字串
     * @returns JSON string
     */
    serialize() {
        return JSON.stringify(this.state);
    }
    /**
     * 從 JSON 字串載入狀態
     * @param jsonString - The JSON string to load from.
     */
    load(jsonString) {
        const loadedState = JSON.parse(jsonString);
        // 簡單的驗證
        if (loadedState && loadedState.grid) {
            this.state = loadedState;
        }
        else {
            throw new Error("Invalid gemini-terminal state JSON.");
        }
    }
}
