document.addEventListener("DOMContentLoaded", () => {
  // 1. 設定 6 張圖片路徑
  // ★ 請確保 IndexPage 資料夾內真的有這些檔案
  const images = [
    "IndexPage/indexpage_1.png",
    "IndexPage/indexpage_2.png",
    "IndexPage/indexpage_3.png",
    "IndexPage/indexpage_4.png",
    "IndexPage/indexpage_5.png",
    "IndexPage/indexpage_6.png"
  ];

  let currentIndex = 0;
  let slideInterval;
  
  const sliderImg = document.getElementById("hero-slider");
  const thumbsContainer = document.getElementById("hero-thumbs-row");

  // 2. 預先載入圖片 (提升體驗)
  images.forEach(src => {
    const img = new Image();
    img.src = src;
  });

  // 3. 初始化：產生縮圖
  if (thumbsContainer) {
    images.forEach((src, index) => {
        const thumb = document.createElement("img");
        thumb.src = src;
        thumb.className = `thumb-img ${index === 0 ? 'active-thumb' : ''}`; // 第一張預設 active
        thumb.dataset.index = index; // 存索引方便點擊抓取
        
        // 點擊縮圖事件
        thumb.addEventListener("click", () => {
            changeSlide(index);
            resetTimer(); // 點擊後重置計時器，避免馬上跳下一張
        });

        thumbsContainer.appendChild(thumb);
    });
  }

  // 4. 切換圖片的核心函式
  const changeSlide = (newIndex) => {
    // 確保索引在範圍內
    if (newIndex >= images.length) newIndex = 0;
    if (newIndex < 0) newIndex = images.length - 1;
    
    currentIndex = newIndex;

    // A. 處理大圖轉場
    if (sliderImg) {
        sliderImg.style.opacity = 0; // 淡出
        setTimeout(() => {
            sliderImg.src = images[currentIndex];
            // 圖片讀取後淡入
            sliderImg.onload = () => { sliderImg.style.opacity = 1; };
            // 保險起見直接淡入 (針對快取圖片)
            setTimeout(() => { sliderImg.style.opacity = 1; }, 50);
        }, 500); // 配合 CSS transition 0.5s
    }

    // B. 更新縮圖 Active 狀態
    const allThumbs = document.querySelectorAll(".thumb-img");
    allThumbs.forEach(t => t.classList.remove("active-thumb"));
    
    const targetThumb = allThumbs[currentIndex];
    if (targetThumb) targetThumb.classList.add("active-thumb");
  };

  // 5. 自動輪播邏輯
  const nextSlide = () => {
    changeSlide(currentIndex + 1);
  };

  const startSlider = () => {
    // 清除舊的以防重複
    if (slideInterval) clearInterval(slideInterval);
    slideInterval = setInterval(nextSlide, 3000);
  };

  const stopSlider = () => {
    clearInterval(slideInterval);
  };

  // 當手動點擊時，重置計時器 (暫停一下再開始)
  const resetTimer = () => {
    stopSlider();
    startSlider();
  };

  // 6. 啟動與事件監聽
  if (sliderImg) {
    startSlider();

    // 滑鼠移入大圖 -> 暫停
    sliderImg.addEventListener('mouseenter', stopSlider);
    sliderImg.addEventListener('mouseleave', startSlider);
  }
  
  // 滑鼠移入縮圖區 -> 也暫停輪播，方便使用者選圖
  if (thumbsContainer) {
    thumbsContainer.addEventListener('mouseenter', stopSlider);
    thumbsContainer.addEventListener('mouseleave', startSlider);
  }
});