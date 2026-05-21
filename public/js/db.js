/**
 * db.js - Controle de Banco de Dados Local (IndexedDB)
 * Gerencia a persistência offline de usuários, configurações e registros de ponto.
 */

const DB_NAME = 'ControlePontoDB';
const DB_VERSION = 1;

class AppDB {
    constructor() {
        this.db = null;
    }

    /**
     * Inicializa a conexão com o IndexedDB e cria os schemas se necessário.
     */
    init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                console.error("Erro ao abrir banco de dados:", event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Tabela de usuários
                if (!db.objectStoreNames.contains('users')) {
                    db.createObjectStore('users', { keyPath: 'username' });
                }

                // Tabela de registros de ponto (punches)
                if (!db.objectStoreNames.contains('punches')) {
                    const punchStore = db.createObjectStore('punches', { keyPath: 'id' });
                    // Índices para facilitar buscas rápidas
                    punchStore.createIndex('username', 'username', { unique: false });
                    punchStore.createIndex('timestamp', 'timestamp', { unique: false });
                    punchStore.createIndex('username_timestamp', ['username', 'timestamp'], { unique: false });
                }
            };
        });
    }

    // ==========================================
    // SEÇÃO DE GERENCIAMENTO DE USUÁRIOS
    // ==========================================

    /**
     * Cadastra um novo usuário se ele não existir.
     */
    registerUser(username, password, name, company, journey = 480) {
        return new Promise((resolve, reject) => {
            if (!username || typeof username !== 'string') {
                return reject("Nome de usuário inválido.");
            }
            const cleanUsername = username.trim().toLowerCase();
            if (!cleanUsername) {
                return reject("Nome de usuário não pode ser vazio.");
            }
            
            const transaction = this.db.transaction(['users'], 'readwrite');
            const store = transaction.objectStore('users');
            const checkRequest = store.get(cleanUsername);

            checkRequest.onsuccess = () => {
                if (checkRequest.result) {
                    reject("Nome de usuário já cadastrado.");
                } else {
                    const newUser = {
                        username: cleanUsername,
                        password: password, // Em um app real usaríamos hash, aqui mantemos simples conforme requisitos
                        name: name.trim(),
                        company: company.trim(),
                        journey: parseInt(journey) || 480, // Jornada em minutos (padrão 8h = 480m)
                        createdAt: new Date().toISOString()
                    };

                    const addRequest = store.add(newUser);
                    addRequest.onsuccess = () => resolve(newUser);
                    addRequest.onerror = (e) => reject("Erro ao registrar usuário: " + e.target.error);
                }
            };

            checkRequest.onerror = (e) => reject("Erro ao verificar usuário: " + e.target.error);
        });
    }

    /**
     * Salva ou atualiza um usuário diretamente (utilizado para restaurar/sincronizar dados do servidor).
     */
    saveUser(user) {
        return new Promise((resolve, reject) => {
            if (!user || !user.username) {
                return reject("Usuário inválido.");
            }
            const cleanUsername = user.username.trim().toLowerCase();
            const transaction = this.db.transaction(['users'], 'readwrite');
            const store = transaction.objectStore('users');
            
            const request = store.put({
                ...user,
                username: cleanUsername
            });
            request.onsuccess = () => resolve(user);
            request.onerror = (e) => reject("Erro ao salvar perfil de usuário: " + e.target.error);
        });
    }

    /**
     * Autentica um usuário existente.
     */
    loginUser(username, password) {
        return new Promise((resolve, reject) => {
            if (!username || typeof username !== 'string') {
                return reject("Nome de usuário inválido.");
            }
            const cleanUsername = username.trim().toLowerCase();
            if (!cleanUsername) {
                return reject("Nome de usuário inválido.");
            }
            const transaction = this.db.transaction(['users'], 'readonly');
            const store = transaction.objectStore('users');
            const request = store.get(cleanUsername);

            request.onsuccess = () => {
                const user = request.result;
                if (!user) {
                    reject("Usuário não encontrado.");
                } else if (user.password !== password) {
                    reject("Senha incorreta.");
                } else {
                    resolve(user);
                }
            };

            request.onerror = (e) => reject("Erro no login: " + e.target.error);
        });
    }

    /**
     * Atualiza as configurações do usuário.
     */
    updateUser(username, name, company, journey) {
        return new Promise((resolve, reject) => {
            if (!username || typeof username !== 'string') {
                return reject("Nome de usuário inválido.");
            }
            const cleanUsername = username.trim().toLowerCase();
            if (!cleanUsername) {
                return reject("Nome de usuário inválido.");
            }
            const transaction = this.db.transaction(['users'], 'readwrite');
            const store = transaction.objectStore('users');
            const request = store.get(cleanUsername);

            request.onsuccess = () => {
                const user = request.result;
                if (!user) {
                    reject("Usuário não encontrado.");
                } else {
                    user.name = name.trim();
                    user.company = company.trim();
                    user.journey = parseInt(journey) || 480;

                    const updateRequest = store.put(user);
                    updateRequest.onsuccess = () => resolve(user);
                    updateRequest.onerror = (e) => reject("Erro ao atualizar configurações: " + e.target.error);
                }
            };

            request.onerror = (e) => reject("Erro ao buscar usuário: " + e.target.error);
        });
    }

    /**
     * Retorna a lista de todos os usuários cadastrados (para troca de perfil).
     */
    getAllUsers() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['users'], 'readonly');
            const store = transaction.objectStore('users');
            const request = store.getAll();

            request.onsuccess = () => {
                // Remove senhas antes de retornar
                const users = request.result.map(u => {
                    const { password, ...safeUser } = u;
                    return safeUser;
                });
                resolve(users);
            };

            request.onerror = (e) => reject("Erro ao carregar usuários: " + e.target.error);
        });
    }

    // ==========================================
    // SEÇÃO DE CONTROLE DE PONTOS (PUNCHES)
    // ==========================================

    /**
     * Adiciona ou atualiza um registro de ponto localmente.
     * punch: { id, username, timestamp (ISO), photo (Base64/null), synced (bool), deleted (bool) }
     */
    savePunch(punch) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['punches'], 'readwrite');
            const store = transaction.objectStore('punches');

            if (!punch.id) {
                punch.id = 'punch_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            }
            if (punch.synced === undefined) punch.synced = false;
            if (punch.deleted === undefined) punch.deleted = false;

            const request = store.put(punch);

            request.onsuccess = () => resolve(punch);
            request.onerror = (e) => reject("Erro ao salvar ponto: " + e.target.error);
        });
    }

    /**
     * Busca todos os pontos válidos (não deletados) de um usuário, ordenados por data/hora.
     */
    getPunches(username) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['punches'], 'readonly');
            const store = transaction.objectStore('punches');
            const index = store.index('username');
            const request = index.getAll(username.trim().toLowerCase());

            request.onsuccess = () => {
                // Filtra pontos marcados como deletados localmente
                const activePunches = request.result
                    .filter(p => !p.deleted)
                    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                resolve(activePunches);
            };

            request.onerror = (e) => reject("Erro ao buscar pontos: " + e.target.error);
        });
    }

    /**
     * Marca um ponto como deletado localmente (soft delete para sincronizar posterior).
     */
    deletePunch(punchId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['punches'], 'readwrite');
            const store = transaction.objectStore('punches');
            const request = store.get(punchId);

            request.onsuccess = () => {
                const punch = request.result;
                if (!punch) {
                    reject("Ponto não encontrado.");
                } else {
                    punch.deleted = true;
                    punch.synced = false; // Precisa sincronizar a exclusão com o servidor
                    const updateRequest = store.put(punch);
                    updateRequest.onsuccess = () => resolve(punch);
                    updateRequest.onerror = (e) => reject("Erro ao marcar exclusão: " + e.target.error);
                }
            };

            request.onerror = (e) => reject("Erro ao buscar ponto para exclusão: " + e.target.error);
        });
    }

    /**
     * Retorna os pontos que estão pendentes de sincronização.
     */
    getUnsyncedPunches(username) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['punches'], 'readonly');
            const store = transaction.objectStore('punches');
            const index = store.index('username');
            const request = index.getAll(username.trim().toLowerCase());

            request.onsuccess = () => {
                const unsynced = request.result.filter(p => !p.synced);
                resolve(unsynced);
            };

            request.onerror = (e) => reject("Erro ao carregar pontos não sincronizados: " + e.target.error);
        });
    }

    /**
     * Marca uma lista de IDs de ponto como sincronizados.
     */
    markPunchesAsSynced(punchIds) {
        return new Promise((resolve, reject) => {
            if (punchIds.length === 0) return resolve();

            const transaction = this.db.transaction(['punches'], 'readwrite');
            const store = transaction.objectStore('punches');

            let completed = 0;
            let errored = false;

            punchIds.forEach(id => {
                const getReq = store.get(id);
                getReq.onsuccess = () => {
                    const punch = getReq.result;
                    if (punch) {
                        // Se o ponto foi marcado como deletado e acabou de ser sincronizado,
                        // podemos removê-lo fisicamente do IndexedDB local para liberar espaço!
                        if (punch.deleted) {
                            const delReq = store.delete(id);
                            delReq.onsuccess = checkComplete;
                        } else {
                            punch.synced = true;
                            const putReq = store.put(punch);
                            putReq.onsuccess = checkComplete;
                        }
                    } else {
                        checkComplete();
                    }
                };
                getReq.onerror = () => {
                    errored = true;
                    checkComplete();
                };
            });

            function checkComplete() {
                completed++;
                if (completed === punchIds.length) {
                    if (errored) reject("Alguns pontos falharam ao marcar como sincronizados.");
                    else resolve();
                }
            }
        });
    }

    /**
     * Mescla os dados recebidos do servidor.
     * serverPunches é uma lista de pontos retornada pelo servidor (estado global definitivo).
     */
    mergePunchesFromServer(username, serverPunches) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['punches'], 'readwrite');
            const store = transaction.objectStore('punches');

            // Primeiro, vamos carregar os pontos locais
            const index = store.index('username');
            const localRequest = index.getAll(username.trim().toLowerCase());

            localRequest.onsuccess = () => {
                const localPunches = localRequest.result;
                const localMap = new Map(localPunches.map(p => [p.id, p]));
                
                let operations = [];

                // Processa cada ponto do servidor
                serverPunches.forEach(srvPunch => {
                    const localPunch = localMap.get(srvPunch.id);

                    if (srvPunch.deleted) {
                        // O servidor diz que foi deletado. Remove localmente se existir.
                        if (localPunch) {
                            operations.push(store.delete(srvPunch.id));
                        }
                    } else {
                        // Se não existe localmente, adiciona e marca como sincronizado.
                        // Se existe localmente mas não está sincronizado, o servidor é soberano, a menos que o local seja mais recente.
                        // Se existe e está sincronizado, mas difere (ex: editado no PC), atualiza localmente.
                        const isDifferent = localPunch && (
                            localPunch.timestamp !== srvPunch.timestamp ||
                            localPunch.photo !== srvPunch.photo
                        );

                        if (!localPunch || !localPunch.synced || isDifferent) {
                            srvPunch.synced = true;
                            operations.push(store.put(srvPunch));
                        }
                    }
                    // Remove do mapa local para sabermos quais pontos existem só localmente
                    localMap.delete(srvPunch.id);
                });

                // Os pontos que restaram no localMap existem apenas localmente.
                // Se eles já estavam marcados como synced=true, significa que foram apagados no servidor.
                // Removemos localmente também.
                localMap.forEach((localPunch, id) => {
                    if (localPunch.synced) {
                        operations.push(store.delete(id));
                    }
                });

                // Espera todas as transações finalizarem
                if (operations.length === 0) {
                    resolve();
                } else {
                    let completed = 0;
                    operations.forEach(op => {
                        op.onsuccess = () => {
                            completed++;
                            if (completed === operations.length) resolve();
                        };
                        op.onerror = (e) => {
                            console.error("Erro na mesclagem de ponto:", e.target.error);
                            // Continua mesmo com erro em um registro individual
                            completed++;
                            if (completed === operations.length) resolve();
                        };
                    });
                }
            };

            localRequest.onerror = (e) => reject("Erro ao obter pontos locais para merge: " + e.target.error);
        });
    }
}

// Expõe a instância globalmente
window.dbService = new AppDB();
