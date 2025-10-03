#!/usr/bin/env node
// compare.js
// 用法: node compare.js file1.txt file2.txt

const fs = require("fs");
const { diffChars } = require("diff");

if (process.argv.length < 4) {
	console.error("❌ 用法: node compare.js <file1> <file2>");
	process.exit(1);
}

const [,, file1, file2] = process.argv;

try {
	const str1 = fs.readFileSync(file1, "utf8").trim();
	const str2 = fs.readFileSync(file2, "utf8").trim();

	if (str1 === str2) {
		console.log("✅ 兩個檔案的文字完全相同");
	} else {
		console.log("❌ 檔案內容不同，差異如下：\n");

		const changes = diffChars(str1, str2);
		// 紅色增加，綠色移除
		changes.forEach(part => {
			const color = part.added ? "\x1b[32m" : part.removed ? "\x1b[31m" : "\x1b[0m";
			process.stdout.write(color + part.value + "\x1b[0m");
		});
		console.log("\n");
	}
} catch (err) {
	console.error("讀取檔案時發生錯誤:", err.message);
}
