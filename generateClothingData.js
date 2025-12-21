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

  /* =====================================================
     原本 sweety / simple / formal / street（完全不改）
  ===================================================== */
  const styles = safeReadDir(ROOT);

  styles.forEach(styleDir => {
    if (!styleDir.isDirectory()) return;
    const style = styleDir.name;

    // ⚠️ clothes_set 不走這一段
    if (style === "clothes_set") return;

    data[style] = {};

    const stylePath = path.join(ROOT, style);

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
          if (img.isFile() && !img.name.startsWith(".")) {
            const relativePath = `clothing/${style}/${category}/${color}/${img.name}`;
            data[style][category][color].push(relativePath);
          }
        });
      });
    });
  });

  /* =====================================================
     新增：clothing/clothes_set 掃描（獨立處理）
  ===================================================== */
  const CLOTHES_SET_ROOT = path.join(ROOT, "clothes_set");
  data.clothes_set = {};

  const setStyles = safeReadDir(CLOTHES_SET_ROOT);

  setStyles.forEach(sceneDir => {
    if (!sceneDir.isDirectory()) return;
    const scene = sceneDir.name; // campus / state / formal ...

    data.clothes_set[scene] = {};

    const scenePath = path.join(CLOTHES_SET_ROOT, scene);
    const sets = safeReadDir(scenePath); // a / b / c / d

    sets.forEach(setDir => {
      if (!setDir.isDirectory()) return;
      const setName = setDir.name;

      data.clothes_set[scene][setName] = [];

      const setPath = path.join(scenePath, setName);
      const images = safeReadDir(setPath);

      images.forEach(img => {
        if (!img.isFile() || img.name.startsWith(".")) return;

        const relativePath =
          `clothing/clothes_set/${scene}/${setName}/${img.name}`;

        data.clothes_set[scene][setName].push(relativePath);
      });
    });
  });

  // 寫入 clothingData.json
  fs.writeFileSync(OUTPUT, JSON.stringify(data, null, 2), "utf8");
  console.log("已成功生成！（包含 clothes_set）");
}

// 執行主程式
generate();
