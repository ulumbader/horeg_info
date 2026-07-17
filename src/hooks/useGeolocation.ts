import { useState, useCallback } from 'react';

export type GeolocationStatus = 
  | 'idle' 
  | 'requesting' 
  | 'success' 
  | 'denied' 
  | 'unavailable' 
  | 'timeout' 
  | 'error';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export function useGeolocation() {
  const [status, setStatus] = useState<GeolocationStatus>('idle');
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const requestPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('unavailable');
      setErrorMessage('Browser Anda tidak mendukung geolokasi.');
      return;
    }

    setStatus('requesting');
    setErrorMessage(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setStatus('success');
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        setCoordinates(null);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setStatus('denied');
            setErrorMessage('Izin lokasi ditolak. Silakan izinkan akses lokasi di pengaturan browser.');
            break;
          case error.POSITION_UNAVAILABLE:
            setStatus('unavailable');
            setErrorMessage('Informasi lokasi tidak tersedia.');
            break;
          case error.TIMEOUT:
            setStatus('timeout');
            setErrorMessage('Waktu permintaan lokasi habis.');
            break;
          default:
            setStatus('error');
            setErrorMessage('Terjadi kesalahan yang tidak diketahui.');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setCoordinates(null);
    setErrorMessage(null);
  }, []);

  return {
    status,
    coordinates,
    errorMessage,
    requestPosition,
    reset,
  };
}
