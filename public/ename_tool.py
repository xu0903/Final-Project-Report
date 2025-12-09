## 新增idea的工具 可快速改檔名
import os
import sys
from PIL import Image
import subprocess

# 設定圖片根目錄
BASE_DIR = os.path.join("public","clothing", "clothes_set")

# 支援的副檔名
VALID_EXTS = ('.png', '.jpg', '.jpeg', '.webp')

def open_image(path):
    """跨平台開啟圖片"""
    if sys.platform == "win32":
        os.startfile(path)
    else:
        opener = "open" if sys.platform == "darwin" else "xdg-open"
        subprocess.call([opener, path])

def process_folder():
    print(f"🚀 開始掃描資料夾: {BASE_DIR} ...\n")
    
    for root, dirs, files in os.walk(BASE_DIR):
        # 過濾掉已經是標準檔名的檔案
        targets = [f for f in files if f.lower().endswith(VALID_EXTS) 
                   and f.split('.')[0] not in ['top', 'bottom', 'hat']]
        
        if not targets:
            continue
            
        print(f"📂 進入資料夾: {root}")
        
        for filename in targets:
            old_path = os.path.join(root, filename)
            
            # 1. 打開圖片讓你看
            print(f"  👉 正在檢視: {filename}")
            open_image(old_path)
            
            # 2. 詢問要改成什麼
            while True:
                choice = input("     [t]op / [b]ottom / [h]at / [s]kip (跳過) / [d]el (刪除): ").lower().strip()
                
                new_name = ""
                if choice == 't': new_name = "top"
                elif choice == 'b': new_name = "bottom"
                elif choice == 'h': new_name = "hat"
                elif choice == 's': break # 跳過
                elif choice == 'd':
                    os.remove(old_path)
                    print("     🗑️ 已刪除")
                    break
                else:
                    continue # 輸入錯誤重來

                if new_name:
                    # 3. 轉換格式並改名 (統一轉成 png)
                    try:
                        with Image.open(old_path) as img:
                            new_filename = f"{new_name}.png"
                            new_path = os.path.join(root, new_filename)
                            
                            # 如果目標檔案已存在 (例如已經有 top.png)，先刪除舊的
                            if os.path.exists(new_path):
                                os.remove(new_path)
                                
                            img.save(new_path, "PNG")
                            
                        # 轉檔成功後，刪除原始檔案 (如果原始不是 png)
                        if old_path != new_path:
                            os.remove(old_path)
                            
                        print(f"     ✅ 已改名為: {new_filename}")
                        break
                    except Exception as e:
                        print(f"     ❌ 錯誤: {e}")
                        break
        print("-" * 30)

if __name__ == "__main__":
    if not os.path.exists(BASE_DIR):
        print(f"❌ 找不到資料夾: {BASE_DIR}")
        print("請確認此腳本放在專案根目錄，且資料夾結構正確。")
    else:
        process_folder()
        print("\n🎉 全部完成！")