(function() {
    // 設定冷卻時間 (0.1秒 = 100ms)
    const COOLDOWN_TIME = 100; 
    let isLocked = false;

    // 監聽全域點擊事件，使用 capture 階段確保它最先被觸發
    document.addEventListener('click', (e) => {
        // 檢查點擊的是不是按鈕或連結
        const target = e.target.closest('button, a, .btn');
        
        if (!target) return;

        // 如果目前處於鎖定狀態，則攔截該點擊
        if (isLocked) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }

        // 啟動鎖定
        isLocked = true;
        document.body.classList.add('global-click-lock');

        // 時間到自動解除
        setTimeout(() => {
            isLocked = false;
            document.body.classList.remove('global-click-lock');
        }, COOLDOWN_TIME);
        
    }, true); // 注意這裡的 true：這讓事件在「捕獲階段」就被攔截
})();