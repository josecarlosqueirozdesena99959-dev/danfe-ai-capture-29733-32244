import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'desktop';

export const useDeviceType = (): DeviceType => {
  const [deviceType, setDeviceType] = useState<DeviceType>(() => {
    return window.innerWidth <= 768 ? 'mobile' : 'desktop';
  });

  useEffect(() => {
    const handleResize = () => {
      setDeviceType(window.innerWidth <= 768 ? 'mobile' : 'desktop');
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return deviceType;
};
