/**
 * 將終端狀態 JSON 渲染到指定的 HTML 元素中
 * @param terminalJson - 從 TerminalBuffer.serialize() 得到的 JSON 字串
 * @param containerElement - 要渲染到的目標 HTML 元素
 */
export function renderTerminal(terminalJson, containerElement) {
    const state = JSON.parse(terminalJson);
    // 清空現有內容
    containerElement.innerHTML = '';
    // 建立一個 DocumentFragment 以提高性能
    const fragment = document.createDocumentFragment();
    // 遍歷所有行
    state.grid.forEach((row, y) => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'term-row';
        // 遍歷行中的所有儲存格
        row.forEach((cell, x) => {
            const cellDiv = document.createElement('div');
            cellDiv.className = 'term-cell';
            // 處理游標位置 (簡單地用反相顏色表示)
            if (state.cursor.x === x && state.cursor.y === y) {
                cell.attrs.inverse = true;
            }
            // 設定文字內容 (處理空字元)
            cellDiv.textContent = cell.char === '' ? ' ' : cell.char;
            // 應用 SGR 屬性到 CSS 樣式
            const fg = cell.attrs.inverse ? cell.attrs.bg : cell.attrs.fg;
            const bg = cell.attrs.inverse ? cell.attrs.fg : cell.attrs.bg;
            if (fg)
                cellDiv.style.color = fg;
            if (bg)
                cellDiv.style.backgroundColor = bg;
            if (cell.attrs.bold)
                cellDiv.style.fontWeight = 'bold';
            if (cell.attrs.italic)
                cellDiv.style.fontStyle = 'italic';
            if (cell.attrs.underline)
                cellDiv.style.textDecoration = 'underline';
            rowDiv.appendChild(cellDiv);
        });
        fragment.appendChild(rowDiv);
    });
    // 一次性將所有內容加入 DOM
    containerElement.appendChild(fragment);
}
