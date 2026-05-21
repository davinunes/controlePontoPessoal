/**
 * sync.js - Motor de Sincronização Automática
 * Monitora o estado da rede e sincroniza dados locais do IndexedDB com o servidor.
 */

class SyncService {
    constructor() {
        // Se rodar pelo file://, aponta para localhost:3000. Se rodar em um servidor, usa a mesma origem.
        this.serverUrl = window.location.protocol.startsWith('file') 
            ? 'http://localhost:3000' 
            : window.location.origin;
        
        this.isOnline = navigator.onLine;
        this.isSyncing = false;
        this.statusListeners = [];
        this.onSyncCompleteCallbacks = [];

        this.init();
    }

    /**
     * Inicializa os event listeners de rede do navegador.
     */
    init() {
        window.addEventListener('online', () => {
            console.log("Conexão com a rede reestabelecida.");
            this.isOnline = true;
            this.notifyStatusChange('online');
            this.triggerAutoSync();
        });

        window.addEventListener('offline', () => {
            console.log("Conexão com a rede perdida.");
            this.isOnline = false;
            this.notifyStatusChange('offline');
        });

        // Tenta sincronizar ao carregar o script
        this.triggerAutoSync();
    }

    /**
     * Registra ouvintes para mudanças de status (online, offline, sincronizando).
     */
    registerStatusListener(callback) {
        this.statusListeners.push(callback);
        // Dispara o status atual imediatamente para o novo ouvinte
        callback(this.getCurrentStatus());
    }

    /**
     * Registra ouvintes para a conclusão com sucesso da sincronização.
     */
    registerSyncCompleteListener(callback) {
        this.onSyncCompleteCallbacks.push(callback);
    }

    /**
     * Retorna o status atual da sincronização em formato de string.
     */
    getCurrentStatus() {
        if (this.isSyncing) return 'syncing';
        return this.isOnline ? 'online' : 'offline';
    }

    /**
     * Notifica todos os ouvintes sobre a alteração de status.
     */
    notifyStatusChange(status) {
        this.statusListeners.forEach(cb => cb(status || this.getCurrentStatus()));
    }

    /**
     * Dispara a sincronização automática em segundo plano para o usuário atual (se logado).
     */
    triggerAutoSync() {
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser && this.isOnline && !this.isSyncing) {
            this.sync(currentUser).catch(err => {
                console.warn("Falha na sincronização automática em segundo plano:", err);
            });
        }
    }

    /**
     * Executa a sincronização de fato.
     * Envia registros pendentes e baixa atualizações do servidor.
     * 
     * @param {string} username Nome do usuário logado
     */
    async sync(username) {
        if (!username) return;
        if (!this.isOnline) {
            throw new Error("Impossível sincronizar: dispositivo offline.");
        }
        if (this.isSyncing) return;

        this.isSyncing = true;
        this.notifyStatusChange('syncing');

        try {
            // 1. Busca todos os pontos locais que não foram sincronizados
            const unsyncedPunches = await window.dbService.getUnsyncedPunches(username);

            // 2. Monta o payload de sincronização
            const payload = {
                username: username.toLowerCase(),
                punches: unsyncedPunches
            };

            // 3. Envia os dados para a API do Servidor
            const response = await fetch(`${this.serverUrl}/api/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Servidor retornou status ${response.status}`);
            }

            const data = await response.json();

            if (data.success && Array.isArray(data.punches)) {
                // 4. Integra os dados retornados pelo servidor no IndexedDB local
                await window.dbService.mergePunchesFromServer(username, data.punches);
                
                // 5. Marca os itens originais enviados como sincronizados
                // (O merge já faz isso, mas garantimos para os IDs enviados)
                const sentIds = unsyncedPunches.map(p => p.id);
                await window.dbService.markPunchesAsSynced(sentIds);

                console.log("Sincronização realizada com sucesso!");
                this.isSyncing = false;
                this.notifyStatusChange('online'); // Volta ao estado online (sincronizado)

                // Dispara callbacks de tela atualizada
                this.onSyncCompleteCallbacks.forEach(cb => cb());
            } else {
                throw new Error(data.message || "Estrutura de resposta inválida do servidor");
            }
        } catch (error) {
            console.error("Erro durante o processo de sincronização:", error);
            this.isSyncing = false;
            // Se falhar a conexão com o servidor (ex: server.js não está rodando), 
            // tratamos como offline para o usuário de forma amigável
            this.notifyStatusChange('offline'); 
            throw error;
        }
    }
}

// Expõe a instância globalmente
window.syncService = new SyncService();
