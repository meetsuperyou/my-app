const fs = require("fs");
const path = require("path");
const archiver = require("archiver");

function zipProject(outputFile) {
	const output = fs.createWriteStream(outputFile);
	const archive = archiver("zip", { zlib: { level: 9 } });

	output.on("close", () => {
		console.log(`✅ 專案已壓縮完成: ${outputFile} (${archive.pointer()} bytes)`);
	});

	archive.on("warning", (err) => {
		if (err.code === "ENOENT") {
			console.warn("⚠️ 檔案不存在:", err);
		} else {
			throw err;
		}
	});

	archive.on("error", (err) => {
		throw err;
	});

	archive.pipe(output);

	// 壓縮整個資料夾，但排除不必要的
	archive.glob("**/*", {
		cwd: path.resolve(__dirname),
		ignore: [
			"node_modules/**",
			".git/**",
			"*.zip",
			"資料庫/**",
			"distGemini/**",
			"src/app/temp/**",
			".angular",
			".vscode",
			".idea"
		]
	});

	archive.finalize();
}

// 輸出檔案名稱
zipProject("myproject.zip");
