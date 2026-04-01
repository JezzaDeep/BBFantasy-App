import { useState, useEffect } from 'react';

export function useDevice() {
  const [device, setDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setDevice('mobile');
      } else if (window.innerWidth < 1024) {
        setDevice('tablet');
      } else {
        setDevice('desktop');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { device };
}

export function useResponsiveFont(baseSize: number) {
  const { device } = useDevice();
  if (device === 'mobile') return `${baseSize * 0.8}px`;
  if (device === 'tablet') return `${baseSize * 0.9}px`;
  return `${baseSize}px`;
}
