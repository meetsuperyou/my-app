// src/main.ts
import { TerminalBuffer } from './services/terminal-buffer.service';
import { renderTerminal } from './renderer';
// 1. 取得 HTML 容器元素
const terminalContainer = document.getElementById('terminal');
if (!terminalContainer) {
    throw new Error('Terminal container not found!');
}
// 2. 建立 TerminalBuffer 實例
const term = new TerminalBuffer(24, 80);
// 3. 操作 Buffer
console.log('--- 操作緩衝區 ---');
term.write('Hello, world!\n');
term.setAttributes({ fg: 'red', bold: true });
term.write('This is an error message.\n');
term.resetAttributes();
term.setAttributes({ bg: '#005577', underline: true });
term.write('This is a line with a background color and underline.\n');
term.resetAttributes();
term.write('\nMoving cursor to (10, 5) and writing...');
term.setCursor(10, 5);
term.setAttributes({ fg: 'yellow', italic: true });
term.write('...here!');
// 4. 將 Buffer 序列化成 JSON
console.log('--- 序列化成 JSON ---');
const terminalStateJson = term.serialize();
console.log(terminalStateJson.substring(0, 200) + '...'); // 只顯示部分 JSON
// 5. 使用渲染函式將 JSON 畫到畫面上
console.log('--- 渲染到畫面 ---');
renderTerminal(terminalStateJson, terminalContainer);
