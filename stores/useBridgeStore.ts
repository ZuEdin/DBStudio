import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  BridgeConfig, 
  BridgeStatusResponse, 
  BridgeLogEntry, 
  BridgeDeployPayload, 
  BridgeDeployResult 
} from '../types/bridge';

interface ActiveProjectState {
  projectId?: string;
  projectName?: string;
  status: 'idle' | 'generating' | 'deploying' | 'running' | 'stopped' | 'error';
  backendUrl?: string;
  frontendUrl?: string;
  logs: BridgeLogEntry[];
  errorMessage?: string;
}

interface BridgeStoreState {
  config: BridgeConfig;
  isOnline: boolean;
  isChecking: boolean;
  lastChecked: number | null;
  bridgeInfo: BridgeStatusResponse | null;
  activeProject: ActiveProjectState;
  isRunnerModalOpen: boolean;

  // Actions
  updateConfig: (patch: Partial<BridgeConfig>) => void;
  setRunnerModalOpen: (open: boolean) => void;
  checkHealth: () => Promise<boolean>;
  deployProject: (payload: BridgeDeployPayload) => Promise<BridgeDeployResult>;
  sendProcessAction: (projectId: string, action: 'start' | 'stop' | 'restart' | 'build_only') => Promise<boolean>;
  clearLogs: () => void;
  addLog: (entry: BridgeLogEntry) => void;
  setActiveProjectStatus: (status: ActiveProjectState['status'], error?: string) => void;
}

const defaultBridgeConfig: BridgeConfig = {
  host: 'http://127.0.0.1',
  port: 5050,
  token: 'bridge_sec_k928x71a',
  useSharedDependencies: true,
  autoConnect: true,
  autoInstall: true,
  autoMigrateDb: true,
  autoRun: true,
  liveLogStreaming: true,
};

let activeWebSocket: WebSocket | null = null;
let activeLogPoller: any = null;

export function stripAnsiCodes(str: string): string {
  if (!str) return '';
  return str
    // Standard ANSI escape sequences with ESC character (\x1b or \u001b)
    .replace(/\u001b\[[0-9;?]*[a-zA-Z]/g, '')
    .replace(/\x1b\[[0-9;?]*[a-zA-Z]/g, '')
    .replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, '')
    // Orphaned / stripped escape fragments like [32m, [1m, [41;31m, [0m, [2K, [?25h
    .replace(/\[\??[0-9]{1,3}(?:;[0-9]{1,3})*[a-zA-Z]/g, '')
    // Strip other terminal control characters
    .replace(/\u001b\][0-9];[^\u0007]*\u0007/g, '')
    .replace(/\r+/g, '');
}

export function cleanBridgeHost(rawHost: string): string {
  if (!rawHost) return 'http://127.0.0.1';
  let host = rawHost.trim().replace(/\/+$/, '');

  // Strip port appended directly to .php (e.g. bridge_relay.php:5050 -> bridge_relay.php)
  host = host.replace(/(\.php)(:\d+)/gi, '$1');

  // Strip trailing port on https domains or non-localhost URLs (e.g. https://domain.com:5050/api/bridge_relay.php -> https://domain.com/api/bridge_relay.php)
  const isLocalHost = host.includes('127.0.0.1') || host.includes('localhost') || host.includes('0.0.0.0');
  if (host.startsWith('https://') || (host.includes('.php') && !isLocalHost)) {
    host = host.replace(/(https?:\/\/[^\/:]+):\d+/gi, '$1');
  }

  return host;
}

export function getBridgeDisplayUrl(config: BridgeConfig): string {
  const host = cleanBridgeHost(config.host || 'http://127.0.0.1');
  const isLocalHost = host.includes('127.0.0.1') || host.includes('localhost') || host.includes('0.0.0.0');
  
  if (host.includes('.php') || config.useCustomPort === false || host.startsWith('https://') || !isLocalHost || /:\d+$/.test(host)) {
    return host;
  }
  
  return `${host}:${config.port || 5050}`;
}

export function buildBridgeApiUrl(config: BridgeConfig, path: string): string {
  let cleanHost = cleanBridgeHost(config.host || 'http://127.0.0.1');
  
  // If host is provided without protocol, default to https:// for domains or http:// for IPs
  if (!cleanHost.startsWith('http://') && !cleanHost.startsWith('https://')) {
    if (cleanHost.startsWith('127.0.0.1') || cleanHost.startsWith('localhost') || cleanHost.startsWith('0.0.0.0')) {
      cleanHost = `http://${cleanHost}`;
    } else {
      cleanHost = `https://${cleanHost}`;
    }
  }

  // Check if it's a PHP relay script (e.g. https://.../bridge_relay.php)
  if (cleanHost.includes('.php')) {
    let urlObj: URL;
    try {
      urlObj = new URL(cleanHost);
    } catch {
      urlObj = new URL(`https://${cleanHost}`);
    }

    // Ensure port is completely cleared for HTTPS or non-local PHP relay URLs
    if (urlObj.protocol === 'https:' || !cleanHost.includes('127.0.0.1')) {
      urlObj.port = '';
    }

    let pathPart = path;
    let queryPart = '';
    if (path.includes('?')) {
      const parts = path.split('?');
      pathPart = parts[0];
      queryPart = parts[1];
    }

    // Determine action from path
    let actionParam = 'status';
    if (pathPart.includes('deploy')) actionParam = 'deploy';
    else if (pathPart.includes('stop') || pathPart.includes('cancel') || pathPart.includes('abbrechen') || pathPart.includes('kill')) actionParam = 'stop';
    else if (pathPart.includes('restart') || pathPart.includes('neustart')) actionParam = 'restart';
    else if (pathPart.includes('start')) actionParam = 'start';
    else if (pathPart.includes('status')) actionParam = 'status';
    else if (pathPart.includes('pull')) actionParam = 'pull_jobs';
    else if (pathPart.includes('log') || pathPart.includes('get_logs')) actionParam = 'get_logs';
    else if (pathPart.includes('result') || pathPart.includes('get_result')) actionParam = 'get_result';
    else if (pathPart.includes('process') || pathPart.includes('action')) actionParam = 'process_action';
    
    urlObj.searchParams.set('action', actionParam);
    if (config.token) {
      urlObj.searchParams.set('token', config.token);
      urlObj.searchParams.set('key', config.token);
      urlObj.searchParams.set('apiKey', config.token);
    }

    if (queryPart) {
      const pathParams = new URLSearchParams(queryPart);
      pathParams.forEach((val, key) => {
        urlObj.searchParams.set(key, val);
      });
    }

    return urlObj.toString();
  }

  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const isLocalHost = cleanHost.includes('127.0.0.1') || cleanHost.includes('localhost') || cleanHost.includes('0.0.0.0');

  // Do NOT append port if:
  // - useCustomPort is explicitly false
  // - host is not localhost / local IP
  // - host starts with https://
  // - host already specifies a port
  let baseApiUrl = `${cleanHost}${cleanPath}`;
  if (config.useCustomPort !== false && isLocalHost && !/:\d+$/.test(cleanHost) && !cleanHost.startsWith('https://')) {
    const portNum = config.port || 5050;
    if (portNum !== 80 && portNum !== 443) {
      baseApiUrl = `${cleanHost}:${portNum}${cleanPath}`;
    }
  }

  // Ensure security tokens are attached as query parameters for maximum reliability
  if (config.token) {
    const connector = baseApiUrl.includes('?') ? '&' : '?';
    baseApiUrl = `${baseApiUrl}${connector}token=${encodeURIComponent(config.token)}&key=${encodeURIComponent(config.token)}`;
  }

  return baseApiUrl;
}

export function buildBridgeWsUrl(config: BridgeConfig, pathAndQuery: string): string {
  const httpUrl = buildBridgeApiUrl(config, pathAndQuery);
  if (httpUrl.startsWith('https://')) {
    return httpUrl.replace(/^https:\/\//, 'wss://');
  }
  return httpUrl.replace(/^http:\/\//, 'ws://');
}

export const useBridgeStore = create<BridgeStoreState>()(
  persist(
    (set, get) => ({
      config: defaultBridgeConfig,
      isOnline: false,
      isChecking: false,
      lastChecked: null,
      bridgeInfo: null,
      activeProject: {
        status: 'idle',
        logs: []
      },
      isRunnerModalOpen: false,

      updateConfig: (patch) => {
        set((state) => {
          const updatedPatch = { ...patch };
          if (updatedPatch.host) {
            updatedPatch.host = cleanBridgeHost(updatedPatch.host);
          }
          return {
            config: { ...state.config, ...updatedPatch }
          };
        });
      },

      setRunnerModalOpen: (open) => {
        set({ isRunnerModalOpen: open });
      },

      clearLogs: () => {
        set((state) => ({
          activeProject: {
            ...state.activeProject,
            logs: []
          }
        }));
      },

      addLog: (entry) => {
        const cleanedMessage = stripAnsiCodes(entry.message || '');
        set((state) => {
          // Avoid duplicate logs if identical to last log
          const existingLogs = state.activeProject?.logs || [];
          const lastLog = existingLogs.length > 0 ? existingLogs[existingLogs.length - 1] : null;
          if (lastLog && lastLog.message === cleanedMessage && lastLog.service === entry.service && Math.abs(new Date(lastLog.timestamp).getTime() - new Date(entry.timestamp).getTime()) < 1000) {
            return state;
          }
          return {
            activeProject: {
              ...state.activeProject,
              logs: [...existingLogs.slice(-1000), { ...entry, message: cleanedMessage }]
            }
          };
        });
      },

      setActiveProjectStatus: (status, error) => {
        set((state) => ({
          activeProject: {
            ...state.activeProject,
            status,
            errorMessage: error
          }
        }));
      },

      checkHealth: async () => {
        const { config, updateConfig } = get();
        set({ isChecking: true });

        // Candidates to test if token mismatch occurs
        const candidateTokens = Array.from(new Set([
          config.token,
          'bridge_sec_k928x71a',
          'dbstudio-bridge-local-token'
        ].filter(Boolean) as string[]));

        for (const candidateToken of candidateTokens) {
          const testConfig = { ...config, token: candidateToken };
          const url = buildBridgeApiUrl(testConfig, '/api/status');

          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);

            const response = await fetch(url, {
              method: 'GET',
              headers: {
                'X-Bridge-Token': candidateToken,
                'Authorization': `Bearer ${candidateToken}`,
                'bypass-tunnel-reminder': 'true'
              },
              signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
              const data: BridgeStatusResponse = await response.json();
              const isActuallyOnline = data.status === 'online' || data.bridgeConnected === true;
              
              if (candidateToken !== config.token) {
                updateConfig({ token: candidateToken });
              }

              set({
                isOnline: isActuallyOnline,
                isChecking: false,
                lastChecked: Date.now(),
                bridgeInfo: data
              });
              return isActuallyOnline;
            }
          } catch (_) {}
        }

        set({
          isOnline: false,
          isChecking: false,
          lastChecked: Date.now(),
          bridgeInfo: null
        });
        return false;
      },

      deployProject: async (payload) => {
        const { config, addLog } = get();
        const isRelay = config.host.includes('.php');
        const deployUrl = buildBridgeApiUrl(config, '/api/deploy');

        set({
          activeProject: {
            projectId: payload.projectId,
            projectName: payload.projectName,
            status: 'deploying',
            logs: [
              {
                type: 'system',
                timestamp: new Date().toISOString(),
                service: 'DBStudio',
                message: `🚀 Sende Projekt "${payload.projectName}" (${payload.files.length} Dateien) an ${isRelay ? 'PHP-Relay Gateway v2.1.0' : 'Lokale Bridge'} (${deployUrl})...`
              },
              {
                type: 'system',
                timestamp: new Date().toISOString(),
                service: 'DBStudio',
                message: `📦 Shared Dependencies: ${payload.options.useSharedDependencies ? 'AKTIVIERUNG BESTÄTIGT (Vermeidet Datenmüll)' : 'DEAKTIVIERT'}`
              }
            ]
          },
          isRunnerModalOpen: true
        });

        // Setup Log Polling if using Relay Gateway
        if (activeLogPoller) {
          clearInterval(activeLogPoller);
          activeLogPoller = null;
        }

        if (isRelay) {
          const seenLogIds = new Set<string>();
          activeLogPoller = setInterval(async () => {
            try {
              const logsUrl = buildBridgeApiUrl(config, `/api/get_logs?projectId=${encodeURIComponent(payload.projectId)}`);
              const res = await fetch(logsUrl, {
                headers: {
                  'X-Bridge-Token': config.token || '',
                  'Authorization': `Bearer ${config.token || ''}`,
                  'bypass-tunnel-reminder': 'true'
                }
              });
              if (res.ok) {
                const data = await res.json();
                if (data.logs && Array.isArray(data.logs)) {
                  data.logs.forEach((l: any) => {
                    const idKey = `${l.timestamp || ''}_${l.service || ''}_${l.message || ''}`;
                    if (!seenLogIds.has(idKey)) {
                      seenLogIds.add(idKey);
                      addLog({
                        type: l.type || 'stdout',
                        timestamp: l.timestamp || new Date().toISOString(),
                        service: l.service || 'Process',
                        message: l.message || ''
                      });
                    }
                  });
                }
              }
            } catch (_) {}
          }, 1500);
        }

        // Setup WebSocket log streaming if direct bridge connection
        if (!isRelay && config.liveLogStreaming) {
          try {
            if (activeWebSocket) {
              activeWebSocket.close();
              activeWebSocket = null;
            }

            const wsUrl = buildBridgeWsUrl(config, `/logs?projectId=${encodeURIComponent(payload.projectId)}`);
            const ws = new WebSocket(wsUrl);
            activeWebSocket = ws;

            ws.onopen = () => {
              addLog({
                type: 'system',
                timestamp: new Date().toISOString(),
                service: 'LiveStream',
                message: `🟢 Live-Terminal WebSocket verbunden (${wsUrl})`
              });
            };

            ws.onmessage = (event) => {
              try {
                const logData = JSON.parse(event.data);
                addLog({
                  type: logData.type || 'stdout',
                  timestamp: logData.timestamp || new Date().toISOString(),
                  service: logData.service || 'Process',
                  message: logData.message || event.data
                });

                if (logData.status === 'RUNNING') {
                  set((state) => ({
                    activeProject: {
                      ...state.activeProject,
                      status: 'running'
                    }
                  }));
                } else if (logData.status === 'STOPPED') {
                  set((state) => ({
                    activeProject: {
                      ...state.activeProject,
                      status: 'stopped'
                    }
                  }));
                }
              } catch {
                addLog({
                  type: 'stdout',
                  timestamp: new Date().toISOString(),
                  service: 'Runner',
                  message: event.data
                });
              }
            };

            ws.onerror = (err) => {
              console.warn("WebSocket Log streaming error:", err);
            };
          } catch (wsErr) {
            console.warn("Could not initiate WebSocket:", wsErr);
          }
        }

        try {
          const response = await fetch(deployUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Bridge-Token': config.token || '',
              'Authorization': `Bearer ${config.token || ''}`,
              'bypass-tunnel-reminder': 'true'
            },
            body: JSON.stringify(payload)
          });

          if (!response.ok) {
            const errorText = await response.text();
            let parsedError = errorText;
            try {
              const parsed = JSON.parse(errorText);
              parsedError = parsed.message || parsed.error || errorText;
            } catch {}

            addLog({
              type: 'stderr',
              timestamp: new Date().toISOString(),
              service: 'BridgeError',
              message: `❌ Fehler beim Bereitstellen: ${parsedError}`
            });

            set((state) => ({
              activeProject: {
                ...state.activeProject,
                status: 'error',
                errorMessage: parsedError
              }
            }));

            return {
              success: false,
              error: parsedError
            };
          }

          const result: BridgeDeployResult & { jobId?: string } = await response.json();

          addLog({
            type: 'system',
            timestamp: new Date().toISOString(),
            service: 'Bridge',
            message: `✅ Bereitstellung erfolgreich! ${result.message || ''}`
          });

          // If relay provided a jobId, poll for result
          if (isRelay && result.jobId) {
            addLog({
              type: 'system',
              timestamp: new Date().toISOString(),
              service: 'Queue',
              message: `⏳ Job [${result.jobId}] in Relay-Queue eingereiht. Warte auf Ausführung durch lokalen PC-Agenten...`
            });

            let pollCount = 0;
            const resultPoller = setInterval(async () => {
              pollCount++;
              try {
                const resUrl = buildBridgeApiUrl(config, `/api/get_result?jobId=${encodeURIComponent(result.jobId || '')}`);
                const pollRes = await fetch(resUrl, {
                  headers: {
                    'X-Bridge-Token': config.token || '',
                    'Authorization': `Bearer ${config.token || ''}`,
                    'bypass-tunnel-reminder': 'true'
                  }
                });
                if (pollRes.ok) {
                  const resData = await pollRes.json();
                  if (resData.found && resData.result) {
                    clearInterval(resultPoller);
                    const executionResult = resData.result;
                    addLog({
                      type: 'system',
                      timestamp: new Date().toISOString(),
                      service: 'Runner',
                      message: `🟢 Lokaler Runner hat Job ausgeführt! Backend: ${executionResult.backendUrl || 'Port 5000'} | Frontend: ${executionResult.frontendUrl || 'Port 3000'}`
                    });
                    set((state) => ({
                      activeProject: {
                        ...state.activeProject,
                        status: 'running',
                        backendUrl: executionResult.backendUrl,
                        frontendUrl: executionResult.frontendUrl
                      }
                    }));
                  }
                }
              } catch (_) {}

              if (pollCount > 25) {
                clearInterval(resultPoller);
              }
            }, 2000);
          }

          if (result.backendUrl) {
            addLog({
              type: 'system',
              timestamp: new Date().toISOString(),
              service: 'Backend',
              message: `🔗 Backend läuft unter: ${result.backendUrl}`
            });
          }
          if (result.frontendUrl) {
            addLog({
              type: 'system',
              timestamp: new Date().toISOString(),
              service: 'Frontend',
              message: `🔗 Frontend läuft unter: ${result.frontendUrl}`
            });
          }

          set((state) => ({
            activeProject: {
              ...state.activeProject,
              status: 'running',
              backendUrl: result.backendUrl || state.activeProject.backendUrl,
              frontendUrl: result.frontendUrl || state.activeProject.frontendUrl
            }
          }));

          return result;
        } catch (err: any) {
          const errMsg = err.message || 'Unbekannter Netzwerkfehler zur lokalen Bridge.';
          addLog({
            type: 'stderr',
            timestamp: new Date().toISOString(),
            service: 'NetworkError',
            message: `❌ Verbindung zur Bridge fehlgeschlagen (${deployUrl}): ${errMsg}`
          });

          set((state) => ({
            activeProject: {
              ...state.activeProject,
              status: 'error',
              errorMessage: errMsg
            }
          }));

          return {
            success: false,
            error: errMsg
          };
        }
      },

      sendProcessAction: async (projectId, action) => {
        const { config, addLog } = get();
        const effectivePid = projectId || get().activeProject.projectId || 'default';
        
        const actionStr = String(action).toLowerCase();
        let normalizedAction: 'start' | 'stop' | 'restart' = 'restart';
        if (actionStr === 'stop' || actionStr === 'cancel' || actionStr === 'abbrechen' || actionStr === 'kill') {
          normalizedAction = 'stop';
        } else if (actionStr === 'start') {
          normalizedAction = 'start';
        } else {
          normalizedAction = 'restart';
        }

        const actionUrl = buildBridgeApiUrl(config, `/api/process/${normalizedAction}?projectId=${encodeURIComponent(effectivePid)}`);
        const actionName = normalizedAction === 'stop' ? 'STOPPEN' : normalizedAction === 'restart' ? 'NEUSTART' : 'STARTEN';

        addLog({
          type: 'system',
          timestamp: new Date().toISOString(),
          service: 'Control',
          message: `⚡ Sende Prozess-Befehl: ${actionName} für Projekt "${effectivePid}"...`
        });

        // Optimistically update status for instant UI responsiveness
        if (normalizedAction === 'stop') {
          set((state) => ({
            activeProject: { ...state.activeProject, status: 'stopped' }
          }));
        } else if (normalizedAction === 'restart' || normalizedAction === 'start') {
          set((state) => ({
            activeProject: { ...state.activeProject, status: 'running' }
          }));
        }

        try {
          const response = await fetch(actionUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Bridge-Token': config.token || '',
              'Authorization': `Bearer ${config.token || ''}`,
              'bypass-tunnel-reminder': 'true'
            },
            body: JSON.stringify({ 
              projectId: effectivePid, 
              action: normalizedAction,
              controlAction: normalizedAction,
              command: normalizedAction
            })
          });

          if (response.ok) {
            let resData: any = {};
            try {
              resData = await response.json();
            } catch (_) {}

            const successMsg = resData.message || (
              normalizedAction === 'stop' 
                ? '⏹️ Prozesse (Backend & Frontend) wurden erfolgreich gestoppt und Ports freigegeben.' 
                : normalizedAction === 'restart' 
                ? '🔄 Prozesse wurden erfolgreich neu gestartet.' 
                : '🟢 Prozesse wurden erfolgreich gestartet.'
            );

            addLog({
              type: 'system',
              timestamp: new Date().toISOString(),
              service: 'Control',
              message: `✅ ${successMsg}`
            });

            if (resData.status === 'STOPPED' || normalizedAction === 'stop') {
              set((state) => ({
                activeProject: { ...state.activeProject, status: 'stopped' }
              }));
            } else if (resData.status === 'RUNNING' || normalizedAction === 'start' || normalizedAction === 'restart') {
              set((state) => ({
                activeProject: { ...state.activeProject, status: 'running' }
              }));
            }
            return true;
          } else {
            let errText = '';
            try {
              const errJson = await response.json();
              errText = errJson.error || errJson.message || JSON.stringify(errJson);
            } catch (_) {
              errText = await response.text();
            }

            addLog({
              type: 'stderr',
              timestamp: new Date().toISOString(),
              service: 'Control',
              message: `⚠️ Hinweis bei ${actionName}: ${errText || 'Unbekannte Antwort von Bridge'}`
            });
            return false;
          }
        } catch (err: any) {
          addLog({
            type: 'stderr',
            timestamp: new Date().toISOString(),
            service: 'Control',
            message: `⚠️ Lokale Bridge / Relay ist nicht erreichbar (${getBridgeDisplayUrl(config)}). Bitte prüfen Sie Verbindung & Token.`
          });
          return false;
        }
      }
    }),
    {
      name: 'db-studio-bridge-config',
      partialize: (state) => ({
        config: state.config
      })
    }
  )
);
