import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const outputPath = path.join(
	process.cwd(),
	"apps/app/public/apple-splash.png",
);

// 1242 x 2688 (iOS PWA 向け高解像度 3x) の非圧縮 PNG バッファ生成関数
function createWhitePngWithLogo(width, height) {
	// RAW パクセルデータ (RGBA 各1バイト + 行頭フィルターバイト0)
	const strokeWidth = width;
	const rowBytes = strokeWidth * 4 + 1;
	const rawData = Buffer.alloc(rowBytes * height);

	const cx = Math.floor(width / 2);
	const cy = Math.floor(height / 2);
	const logoRadius = Math.floor(width * 0.12); // 中央ロゴ相当の円形シンボル領域

	for (let y = 0; y < height; y++) {
		const rowOffset = y * rowBytes;
		rawData[rowOffset] = 0; // Filter type: None

		for (let x = 0; x < width; x++) {
			const pixelOffset = rowOffset + 1 + x * 4;
			const dx = x - cx;
			const dy = y - cy;
			const isInsideLogo = dx * dx + dy * dy <= logoRadius * logoRadius;

			if (isInsideLogo) {
				// sitecue アクションカラー / ダークグラフィック
				rawData[pixelOffset] = 30; // R
				rawData[pixelOffset + 1] = 40; // G
				rawData[pixelOffset + 2] = 55; // B
				rawData[pixelOffset + 3] = 255; // A
			} else {
				// ベース背景純白 #ffffff
				rawData[pixelOffset] = 255; // R
				rawData[pixelOffset + 1] = 255; // G
				rawData[pixelOffset + 2] = 255; // B
				rawData[pixelOffset + 3] = 255; // A
			}
		}
	}

	const compressedData = zlib.deflateSync(rawData);

	// CRC32 計算ヘルパー
	const crcTable = new Uint32Array(256);
	for (let i = 0; i < 256; i++) {
		let c = i;
		for (let k = 0; k < 8; k++) {
			c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
		}
		crcTable[i] = c;
	}
	function calcCrc(buf) {
		let crc = 0xffffffff;
		for (let i = 0; i < buf.length; i++) {
			crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
		}
		return (crc ^ 0xffffffff) >>> 0;
	}

	function createChunk(type, data) {
		const typeBuf = Buffer.from(type, "ascii");
		const lenBuf = Buffer.alloc(4);
		lenBuf.writeUInt32BE(data.length, 0);

		const crcBuf = Buffer.alloc(4);
		const totalToCrc = Buffer.concat([typeBuf, data]);
		crcBuf.writeUInt32BE(calcCrc(totalToCrc), 0);

		return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
	}

	// PNG 8 バイトヘッダ
	const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

	// IHDR チャック
	const ihdrData = Buffer.alloc(13);
	ihdrData.writeUInt32BE(width, 0);
	ihdrData.writeUInt32BE(height, 4);
	ihdrData[8] = 8; // Bit depth
	ihdrData[9] = 6; // Color type: RGBA
	ihdrData[10] = 0; // Compression
	ihdrData[11] = 0; // Filter
	ihdrData[12] = 0; // Interlace
	const ihdrChunk = createChunk("IHDR", ihdrData);

	// IDAT チャック
	const idatChunk = createChunk("IDAT", compressedData);

	// IEND チャック
	const iendChunk = createChunk("IEND", Buffer.alloc(0));

	return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

const pngBuffer = createWhitePngWithLogo(1242, 2688);
fs.writeFileSync(outputPath, pngBuffer);
console.log("Successfully generated apple-splash.png!");
