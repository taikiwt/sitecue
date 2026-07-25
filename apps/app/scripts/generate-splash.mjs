import fs from "node:fs";
import path from "node:path";

const logoPath = path.join(process.cwd(), "apps/app/public/logo.svg");
const outputPath = path.join(process.cwd(), "apps/app/public/apple-splash.svg");

const logoSvg = fs.readFileSync(logoPath, "utf-8");
// SVGタグ内部のコンテンツを取得
const innerContent = logoSvg.replace(/<svg[^>]*>/, "").replace(/<\/svg>/, "");

const splashSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="2048" height="2732" viewBox="0 0 2048 2732">
  <rect width="2048" height="2732" fill="#ffffff"/>
  <g transform="translate(944, 1286) scale(2.8)">
    ${innerContent}
  </g>
</svg>`;

fs.writeFileSync(outputPath, splashSvg);
console.log("Successfully generated apple-splash.svg!");
