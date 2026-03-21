import fs from "node:fs/promises";
import path from "node:path";
import { renderToString } from "react-dom/server";
import App from "../src/app/App.tsx";

async function main() {
  const distIndexPath = path.resolve(process.cwd(), "dist", "index.html");
  const distIndexHtml = await fs.readFile(distIndexPath, "utf-8");

  const prerendered = renderToString(<App />);

  const nextHtml = distIndexHtml.replace(
    /<div id="root">\s*<\/div>/,
    `<div id="root">${prerendered}</div>`,
  );

  if (nextHtml === distIndexHtml) {
    throw new Error(
      'Failed to find empty <div id="root"></div> in dist/index.html.',
    );
  }

  await fs.writeFile(distIndexPath, nextHtml, "utf-8");
  console.log("Prerendered / and updated dist/index.html");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
