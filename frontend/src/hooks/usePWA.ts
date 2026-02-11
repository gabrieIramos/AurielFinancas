import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export function usePWA() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      console.log('Service Worker registrado:', swUrl);
      
      // Verifica atualizações a cada hora
      if (registration) {
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error('Erro ao registrar Service Worker:', error);
    },
  });

  useEffect(() => {
    if (offlineReady) {
      console.log('App pronto para uso offline!');
    }
  }, [offlineReady]);

  useEffect(() => {
    if (needRefresh) {
      console.log('Nova versão disponível!');
    }
  }, [needRefresh]);

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return {
    offlineReady,
    needRefresh,
    updateServiceWorker,
    close,
  };
}
