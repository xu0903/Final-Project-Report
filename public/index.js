document.addEventListener("DOMContentLoaded", () => {
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

  images.forEach(src => {
    const img = new Image();
    img.src = src;
  });

  // 初始化
  if (thumbsContainer) {
    images.forEach((src, index) => {
        const thumb = document.createElement("img");
        thumb.src = src;
        thumb.className = `thumb-img ${index === 0 ? 'active-thumb' : ''}`;
        thumb.dataset.index = index; 
        
        // 點擊縮圖事件
        thumb.addEventListener("click", () => {
            changeSlide(index);
            resetTimer(); // 點擊後重置計時器，避免馬上跳下一張
        });

        thumbsContainer.appendChild(thumb);
    });
  }

  // 切換圖片
  const changeSlide = (newIndex) => {
    if (newIndex >= images.length) newIndex = 0;
    if (newIndex < 0) newIndex = images.length - 1;
    
    currentIndex = newIndex;

    if (sliderImg) {
        sliderImg.style.opacity = 0; // 淡出
        setTimeout(() => {
            sliderImg.src = images[currentIndex];
            // 圖片讀取後淡入
            sliderImg.onload = () => { sliderImg.style.opacity = 1; };
            setTimeout(() => { sliderImg.style.opacity = 1; }, 50);
        }, 500);
    }

    const allThumbs = document.querySelectorAll(".thumb-img");
    allThumbs.forEach(t => t.classList.remove("active-thumb"));
    
    const targetThumb = allThumbs[currentIndex];
    if (targetThumb) targetThumb.classList.add("active-thumb");
  };

  // 自動輪播
  const nextSlide = () => {
    changeSlide(currentIndex + 1);
  };

  const startSlider = () => {
    if (slideInterval) clearInterval(slideInterval);
    slideInterval = setInterval(nextSlide, 3000);
  };

  const stopSlider = () => {
    clearInterval(slideInterval);
  };

  // 當手動點擊時，重置計時器
  const resetTimer = () => {
    stopSlider();
    startSlider();
  };

  if (sliderImg) {
    startSlider();

    // 滑鼠移入大圖 -> 暫停
    sliderImg.addEventListener('mouseenter', stopSlider);
    sliderImg.addEventListener('mouseleave', startSlider);
  }
  
  if (thumbsContainer) {
    thumbsContainer.addEventListener('mouseenter', stopSlider);
    thumbsContainer.addEventListener('mouseleave', startSlider);
  }
});