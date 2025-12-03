// generateClothingData.js
// 自動掃描 clothing 資料夾（無性別版、無 outwear 版）
// 會輸出 public/clothingData.json

const fs = require("fs");
const path = require("path");

// clothing/ 資料夾位置
const ROOT = path.join(__dirname, "public", "clothing");
// 輸出 JSON 位置
const OUTPUT = path.join(__dirname, "public", "clothingData.json");

// 安全讀取資料夾，避免沒有資料夾時爆炸
function safeReadDir(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

function generate() {
  const data = {};

  // 讀取風格資料夾，例如 sweety / simple / formal / street
  const styles = safeReadDir(ROOT);

  styles.forEach(styleDir => {
    if (!styleDir.isDirectory()) return;
    const style = styleDir.name;
    data[style] = {};

    const stylePath = path.join(ROOT, style);

    // 只允許 top / bottom / hat 三種類別（已移除 outwear）
    const categories = safeReadDir(stylePath).filter(d =>
      d.isDirectory() && ["top", "bottom", "hat"].includes(d.name)
    );

    categories.forEach(catDir => {
      const category = catDir.name;
      data[style][category] = {};

      const catPath = path.join(stylePath, category);
      const colors = safeReadDir(catPath);

      colors.forEach(colorDir => {
        if (!colorDir.isDirectory()) return;
        const color = colorDir.name;
        data[style][category][color] = [];

        const colorPath = path.join(catPath, color);
        const images = safeReadDir(colorPath);

        images.forEach(img => {
          // 排除 .DS_Store 和所有隱藏檔
          if (img.isFile() && !img.name.startsWith(".")) {
            const relativePath = `clothing/${style}/${category}/${color}/${img.name}`;
            data[style][category][color].push(relativePath);
          }
        });
      });
    });
  });

  // 寫入 clothingData.json
  fs.writeFileSync(OUTPUT, JSON.stringify(data, null, 2), "utf8");
  console.log("已成功生成！");
}

// 執行主程式
generate();
