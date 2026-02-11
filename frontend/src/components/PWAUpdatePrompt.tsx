import { usePWA } from '../hooks/usePWA';

export function PWAUpdatePrompt() {
  const { offlineReady, needRefresh, updateServiceWorker, close } = usePWA();

  if (!offlineReady && !needRefresh) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800">
      {offlineReady && (
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              ✅ App pronto para uso offline!
            </p>
          </div>
          <button
            onClick={close}
            className="rounded px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            OK
          </button>
        </div>
      )}

      {needRefresh && (
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              🔄 Nova versão disponível!
            </p>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              Clique em atualizar para usar a versão mais recente
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => updateServiceWorker(true)}
              className="rounded bg-emerald-500 px-3 py-1 text-sm font-medium text-white hover:bg-emerald-600"
            >
              Atualizar
            </button>
            <button
              onClick={close}
              className="rounded px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Depois
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
