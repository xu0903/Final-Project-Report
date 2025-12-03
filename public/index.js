document.addEventListener("DOMContentLoaded", () => {
  // 設定圖片路徑陣列
  // ★ 請確保您有這些圖片檔案，名稱與路徑要正確
  const images = [
    "IndexPage/indexpage_1.png",
    "IndexPage/indexpage_2.png",
    "IndexPage/indexpage_3.png",
    "IndexPage/indexpage_4.png",
    "IndexPage/indexpage_5.png",
    "IndexPage/indexpage_6.png" 
    // 如果有更多圖片，可以繼續往下加
  ];

  let currentIndex = 0;
  const sliderImg = document.getElementById("hero-slider");

  // 預先載入圖片 (避免切換時閃爍或載入過慢)
  images.forEach(src => {
    const img = new Image();
    img.src = src;
  });

  if (sliderImg) {
    // 設定計時器，每 3000 毫秒 (3秒) 執行一次
    setInterval(() => {
      // 1. 先淡出
      sliderImg.style.opacity = 0;

      // 2. 等待 0.5 秒 (配合 CSS transition 時間) 後切換圖片並淡入
      setTimeout(() => {
        // 計算下一張圖片的索引 (循環播放)
        currentIndex = (currentIndex + 1) % images.length;
        
        // 更換圖片來源
        sliderImg.src = images[currentIndex];
        
        // 圖片載入完成後再淡入 (避免圖片還沒讀到就顯示)
        sliderImg.onload = () => {
            sliderImg.style.opacity = 1;
        };
        // 為了保險起見 (如果圖片已經在快取中)，直接設定淡入
        setTimeout(() => { sliderImg.style.opacity = 1; }, 50);

      }, 500); // 這個時間要跟 CSS 的 transition: 0.5s 一致

    }, 3000);
  }
});