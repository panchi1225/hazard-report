import { useLayoutEffect, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// ファイル読み込み時点（React初期化前）の最速タイミングでブラウザのスクロール復元機能をロック
if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

// どこのスコープからでも確実に呼ばれる共通の強制スクロール処理
const performScrollToTop = () => {
  // 1. window全体のスクロールを即時リセット
  try {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' } as ScrollToOptions);
  } catch (e) {
    window.scrollTo(0, 0); // fallback
  }
  
  // 2. DOM要素群のスクロール位置を直接ゼロにする
  if (document.documentElement) {
    document.documentElement.scrollTop = 0;
  }
  if (document.body) {
    document.body.scrollTop = 0;
  }

  // 3. 画面内の各コンテナを一掃
  const scrollContainers = document.querySelectorAll(
    '#root, body, html, main, .overflow-auto, .overflow-y-auto, [role="main"]'
  );
  scrollContainers.forEach((el) => {
    if (el instanceof HTMLElement) {
      el.scrollTop = 0;
    }
  });
  
  // 4. 絶対確実な基準点(アンカー)へスクロールを合わせる
  const topAnchor = document.getElementById('page-top-anchor');
  if (topAnchor) {
    try {
      topAnchor.scrollIntoView({ block: 'start' });
    } catch (e) {
      // fallback
    }
  }
};

export const ScrollToTop = () => {
  const location = useLocation();

  useLayoutEffect(() => {
    // Step 1: 同期タイミングで即座に実行
    performScrollToTop();

    // Step 2 & 3: フレーム遷移と時間差による強制上書き
    const rafId = requestAnimationFrame(() => {
      performScrollToTop();
      setTimeout(performScrollToTop, 10);
      setTimeout(performScrollToTop, 50);
      setTimeout(performScrollToTop, 150);
    });

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [location.pathname, location.hash, location.search, location.key]);

  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        performScrollToTop();
        setTimeout(performScrollToTop, 50);
      }
    };
    
    const handlePopState = () => {
      performScrollToTop();
      setTimeout(performScrollToTop, 10);
      setTimeout(performScrollToTop, 50);
    };
    
    // イベント削除用のラッパー
    const popStateWrapper = () => handlePopState();

    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('popstate', popStateWrapper);
    
    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('popstate', popStateWrapper);
    };
  }, []);

  return null;
};
