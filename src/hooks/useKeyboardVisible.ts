// src/hooks/useKeyboardVisible.ts
import { useState, useEffect } from 'react';

export default function useKeyboardVisible(): boolean {
  const [isKeyboardVisible, setKeyboardVisible] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => {
      // Jika tinggi Visual Viewport lebih kecil dari tinggi window aslinya, 
      // berarti ada keyboard yang menghalangi area pandang.
      if (window.visualViewport) {
        setKeyboardVisible(window.visualViewport.height < window.innerHeight * 0.85);
      }
    };

    window.visualViewport?.addEventListener('resize', handleResize);
    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
    };
  }, []);

  return isKeyboardVisible;
}