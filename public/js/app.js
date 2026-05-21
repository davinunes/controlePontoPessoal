/**
 * app.js - Controlador Principal da SPA (Single Page Application)
 * Gerencia rotas, formulários, renderização de telas e cálculos de banco de horas.
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Estado Global da Aplicação
    const state = {
        currentUser: null,           // Objeto do usuário logado atualmente
        currentView: 'home',         // Tela ativa ('home', 'timesheet', 'album', 'settings')
        selectedMonth: new Date(),   // Mês de referência para Folha de Ponto
        albumMonth: new Date(),      // Mês de referência para Álbum de Comprovantes
        currentPunchPhoto: null,     // Base64 da foto do comprovante em seleção
        availableUsers: [],          // Lista de perfis salvos neste dispositivo
        editingDate: null,           // Objeto Date sendo editado atualmente
        editingPunches: []           // Lista de punches temporários da edição do dia
    };

    // Referências de Elementos do DOM - Autenticação
    const domAuthScreen = document.getElementById('auth-screen');
    const domAppScreen = document.getElementById('app-screen');
    const domLoginForm = document.getElementById('login-form');
    const domRegisterForm = document.getElementById('register-form');
    const domGoToRegister = document.getElementById('go-to-register');
    const domGoToLogin = document.getElementById('go-to-login');
    const domAuthSubtitle = document.getElementById('auth-subtitle');
    
    // Cadastro de Usuário
    const regJourney = document.getElementById('reg-journey');
    const regJourneyCustomGroup = document.getElementById('reg-journey-custom-group');
    const regJourneyCustom = document.getElementById('reg-journey-custom');
    
    // Referências - Cabeçalho
    const domHeaderUserName = document.getElementById('header-user-name');
    const domHeaderUserCompany = document.getElementById('header-user-company');
    const domSyncBadge = document.getElementById('sync-badge');
    const domSyncStatusText = document.getElementById('sync-status-text');
    const domSyncSpinner = domSyncBadge.querySelector('.sync-spinner');

    // Referências - Navegação e Abas
    const domNavItems = document.querySelectorAll('.nav-item');
    const domViewPanels = document.querySelectorAll('.view-panel');
    const domBtnPunchFab = document.getElementById('btn-punch-fab');

    // Referências - Tela Home
    const domHomeTodayDate = document.getElementById('home-today-date');
    const domHomeMonthBalance = document.getElementById('home-month-balance');
    const domHomeMonthTrend = document.getElementById('home-month-trend');
    const domHomeMonthProgress = document.getElementById('home-month-progress');
    const domHomeUserJourney = document.getElementById('home-user-journey');
    const domHomeRecordsCount = document.getElementById('home-records-count');
    const domHomePunchesList = document.getElementById('home-punches-list');
    const domHomeDaySummary = document.getElementById('home-day-summary');
    const domHomeDayWorked = document.getElementById('home-day-worked');
    const domHomeDayBalance = document.getElementById('home-day-balance');

    // Referências - Tela Folha de Ponto
    const domTimesheetMonthLabel = document.getElementById('timesheet-month-label');
    const domTimesheetPrevMonth = document.getElementById('timesheet-prev-month');
    const domTimesheetNextMonth = document.getElementById('timesheet-next-month');
    const domTimesheetDaysWorked = document.getElementById('timesheet-days-worked');
    const domTimesheetTotalHours = document.getElementById('timesheet-total-hours');
    const domTimesheetTotalBalance = document.getElementById('timesheet-total-balance');
    const domTimesheetDaysContainer = document.getElementById('timesheet-days-container');

    // Referências - Tela Álbum
    const domAlbumMonthLabel = document.getElementById('album-month-label');
    const domAlbumPrevMonth = document.getElementById('album-prev-month');
    const domAlbumNextMonth = document.getElementById('album-next-month');
    const domAlbumDaysContainer = document.getElementById('album-days-container');

    // Referências - Configurações
    const domSettingsProfileForm = document.getElementById('settings-profile-form');
    const domSettingsName = document.getElementById('settings-name');
    const domSettingsCompany = document.getElementById('settings-company');
    const domSettingsJourney = document.getElementById('settings-journey');
    const domSettingsJourneyCustomGroup = document.getElementById('settings-journey-custom-group');
    const domSettingsJourneyCustom = document.getElementById('settings-journey-custom');
    const domSettingsServerUrl = document.getElementById('settings-server-url');
    const domBtnManualSync = document.getElementById('btn-manual-sync');
    const domSettingsProfilesList = document.getElementById('settings-profiles-list');
    const domBtnAddProfile = document.getElementById('btn-add-profile');
    const domBtnLogout = document.getElementById('btn-logout');

    // Referências - Modal Novo Ponto
    const domPunchModal = document.getElementById('punch-modal');
    const domPunchForm = document.getElementById('punch-form');
    const domBtnClosePunchModal = document.getElementById('btn-close-punch-modal');
    const domPunchDatetime = document.getElementById('punch-datetime');
    const domImageUploadTrigger = document.getElementById('image-upload-trigger');
    const domPunchPhotoInput = document.getElementById('punch-photo-input');
    const domPunchCameraInput = document.getElementById('punch-camera-input');
    const domUploadPreviewContainer = document.getElementById('upload-preview-container');
    const domUploadPreviewImg = document.getElementById('upload-preview-img');
    const domUploadPreviewInfo = document.getElementById('upload-preview-info');
    const domBtnRemovePhoto = document.getElementById('btn-remove-photo');
    const domBtnTriggerCamera = document.getElementById('btn-trigger-camera');
    const domBtnTriggerGallery = document.getElementById('btn-trigger-gallery');
    const domBtnCancelPunch = document.getElementById('btn-cancel-punch');

    // Atalhos Rápidos Horário
    const domBtnSetNow = document.getElementById('btn-set-now');
    const domBtnSetMorning = document.getElementById('btn-set-today-morning');
    const domBtnSetLunchOut = document.getElementById('btn-set-today-lunch-out');
    const domBtnSetLunchIn = document.getElementById('btn-set-today-lunch-in');
    const domBtnSetEvening = document.getElementById('btn-set-today-evening');

    // Referências - Lightbox
    const domLightboxModal = document.getElementById('lightbox-modal');
    const domBtnCloseLightbox = document.getElementById('btn-close-lightbox');
    const domLightboxImg = document.getElementById('lightbox-img');
    const domLightboxDate = document.getElementById('lightbox-date');
    const domLightboxTime = document.getElementById('lightbox-time');

    // Referências - Modal Editar Dia
    const domEditDayModal = document.getElementById('edit-day-modal');
    const domBtnCloseEditModal = document.getElementById('btn-close-edit-modal');
    const domEditModalDateLabel = document.getElementById('edit-modal-date-label');
    const domEditPunchesContainer = document.getElementById('edit-punches-container');
    const domBtnAddEditPunch = document.getElementById('btn-add-edit-punch');
    const domBtnCancelEdit = document.getElementById('btn-cancel-edit');
    const domBtnSaveEdit = document.getElementById('btn-save-edit');

    // Referências - Modal Recorte
    const domCropModal = document.getElementById('crop-modal');
    const domBtnCloseCropModal = document.getElementById('btn-close-crop-modal');
    const domCropViewport = document.getElementById('crop-viewport');
    const domCropImage = document.getElementById('crop-image');
    const domCropZoomSlider = document.getElementById('crop-zoom-slider');
    const domBtnCancelCrop = document.getElementById('btn-cancel-crop');
    const domBtnConfirmCrop = document.getElementById('btn-confirm-crop');
    const domBtnCropPhotoNew = document.getElementById('btn-crop-photo-new');

    // Referências - Configurações Câmera
    const domSettingsCamera = document.getElementById('settings-camera');

    // Referência - Toast
    const domToast = document.getElementById('toast');
    let toastTimeout = null;

    // ==========================================================================
    // INICIALIZAÇÃO DO BANCO E FLUXO DE LOGIN
    // ==========================================================================
    
    try {
        await window.dbService.init();
        console.log("Banco de dados local IndexedDB pronto.");
        
        // Verifica se há sessão ativa salva no localStorage
        const savedUsername = localStorage.getItem('currentUser');
        if (savedUsername) {
            const users = await window.dbService.getAllUsers();
            state.availableUsers = users;
            
            // Busca os dados completos do usuário logado
            const activeUser = users.find(u => u.username === savedUsername);
            if (activeUser) {
                // Como não carregamos a senha por segurança no getAllUsers, buscamos o objeto na base
                const transaction = window.dbService.db.transaction(['users'], 'readonly');
                const store = transaction.objectStore('users');
                const request = store.get(savedUsername);
                
                request.onsuccess = () => {
                    if (request.result) {
                        loginSuccess(request.result);
                    } else {
                        showAuthScreen();
                    }
                };
                request.onerror = () => showAuthScreen();
            } else {
                showAuthScreen();
            }
        } else {
            showAuthScreen();
        }
    } catch (e) {
        showToast("Erro crítico ao inicializar o banco de dados.");
        showAuthScreen();
    }

    // ==========================================================================
    // SEÇÃO DE ROTAS E NAVEGAÇÃO DE TELAS (SPA)
    // ==========================================================================
    
    function navigateTo(viewName) {
        state.currentView = viewName;

        // Atualiza botões da barra de navegação
        domNavItems.forEach(btn => {
            if (btn.getAttribute('data-view') === viewName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Alterna os painéis visuais
        domViewPanels.forEach(panel => {
            if (panel.id === `view-${viewName}`) {
                panel.classList.remove('hidden');
            } else {
                panel.classList.add('hidden');
            }
        });

        // FAB só aparece nas visualizações diárias, mensais e fotos. Oculta no Ajustes para limpar a UI.
        if (viewName === 'settings') {
            domBtnPunchFab.classList.add('hidden');
        } else {
            domBtnPunchFab.classList.remove('hidden');
        }

        // Renderiza a tela específica
        renderActiveView();
    }

    // Registra clique nos itens da barra de navegação
    domNavItems.forEach(item => {
        item.addEventListener('click', () => {
            const viewName = item.getAttribute('data-view');
            navigateTo(viewName);
        });
    });

    // Renderiza a aba atual
    function renderActiveView() {
        if (!state.currentUser) return;

        switch (state.currentView) {
            case 'home':
                renderHome();
                break;
            case 'timesheet':
                renderTimesheet();
                break;
            case 'album':
                renderAlbum();
                break;
            case 'settings':
                renderSettings();
                break;
        }
    }

    // ==========================================================================
    // COMPORTAMENTO DO BADGE DE SINCRONIZAÇÃO
    // ==========================================================================
    
    // Escuta alterações de rede/sincronização
    window.syncService.registerStatusListener((status) => {
        domSyncBadge.className = 'sync-badge ' + status;
        domSyncSpinner.classList.add('hidden');

        if (status === 'online') {
            domSyncStatusText.textContent = "Sincronizado";
        } else if (status === 'offline') {
            // Se estiver rodando em file:// ou offline de fato
            domSyncStatusText.textContent = "Modo Local";
        } else if (status === 'syncing') {
            domSyncStatusText.textContent = "Sincronizando...";
            domSyncSpinner.classList.remove('hidden');
        }
    });

    // Ouvinte para re-renderizar telas quando a sincronização terminar com sucesso
    window.syncService.registerSyncCompleteListener(() => {
        console.log("Atualizando telas após sincronização em segundo plano.");
        renderActiveView();
    });

    // Forçar Sincronização Manual ao clicar no badge
    domSyncBadge.addEventListener('click', triggerManualSync);
    
    async function triggerManualSync() {
        if (!state.currentUser) return;
        if (!window.syncService.isOnline) {
            showToast("Dispositivo offline. Não é possível sincronizar.");
            return;
        }
        
        showToast("Iniciando sincronização...");
        try {
            await window.syncService.sync(state.currentUser.username);
            showToast("Dados sincronizados com sucesso!");
        } catch (e) {
            showToast("Servidor inacessível. Operando localmente.");
        }
    }

    // ==========================================================================
    // CADASTRO / LOGIN / DIALOGOS DE AUTENTICAÇÃO
    // ==========================================================================
    
    // Troca para formulário de cadastro
    domGoToRegister.addEventListener('click', (e) => {
        e.preventDefault();
        domLoginForm.classList.add('hidden');
        domRegisterForm.classList.remove('hidden');
        domAuthSubtitle.textContent = "Cadastre um novo perfil profissional";
    });

    // Troca para formulário de login
    domGoToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        domRegisterForm.classList.add('hidden');
        domLoginForm.classList.remove('hidden');
        domAuthSubtitle.textContent = "Entre na sua folha de ponto pessoal";
    });

    // Exibe jornada customizada se selecionar 'custom' no Cadastro
    regJourney.addEventListener('change', () => {
        if (regJourney.value === 'custom') {
            regJourneyCustomGroup.classList.remove('hidden');
        } else {
            regJourneyCustomGroup.classList.add('hidden');
        }
    });

    // Exibe jornada customizada se selecionar 'custom' nas Configurações
    domSettingsJourney.addEventListener('change', () => {
        if (domSettingsJourney.value === 'custom') {
            domSettingsJourneyCustomGroup.classList.remove('hidden');
        } else {
            domSettingsJourneyCustomGroup.classList.add('hidden');
        }
    });

    // Submissão do Formulário de Login
    domLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        try {
            // 1. Tenta autenticar localmente no IndexedDB primeiro
            const user = await window.dbService.loginUser(username, password);
            loginSuccess(user);
            showToast(`Bem-vindo, ${user.name}!`);
        } catch (err) {
            // 2. Se falhar localmente (ex: usuário não cadastrado nesta origem), tenta no servidor
            if (err === "Usuário não encontrado." || err === "Senha incorreta.") {
                showToast("Buscando usuário no servidor...");
                try {
                    // Obtém a URL do servidor configurada nas preferências locais ou padrão
                    const serverUrl = localStorage.getItem(`serverUrl_${username.trim().toLowerCase()}`) || window.syncService.serverUrl;
                    
                    const response = await fetch(`${serverUrl}/api/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, password })
                    });

                    if (!response.ok) {
                        const errData = await response.json();
                        throw new Error(errData.message || "Erro na autenticação com o servidor.");
                    }

                    const data = await response.json();
                    if (data.success && data.user) {
                        // Cria/Salva o perfil de usuário retornado no IndexedDB local
                        const serverUser = {
                            username: data.user.username,
                            password: password, // guarda a senha para logins locais futuros
                            name: data.user.name,
                            company: data.user.company,
                            journey: data.user.journey,
                            createdAt: data.user.createdAt || new Date().toISOString()
                        };
                        
                        await window.dbService.saveUser(serverUser);
                        
                        // Mescla e restaura todos os pontos obtidos do servidor
                        if (Array.isArray(data.punches)) {
                            await window.dbService.mergePunchesFromServer(serverUser.username, data.punches);
                        }

                        loginSuccess(serverUser);
                        showToast(`Histórico recuperado do servidor! Bem-vindo, ${serverUser.name}`);
                    } else {
                        throw new Error("Resposta inválida do servidor.");
                    }
                } catch (srvErr) {
                    console.error("Erro na autenticação remota:", srvErr);
                    // Se falhar por conexão (fetch failed), exibe o erro local original
                    if (srvErr.message && (srvErr.message.includes("fetch") || srvErr.message.includes("NetworkError"))) {
                        showToast("Servidor inacessível. Erro local: " + err);
                    } else {
                        showToast(srvErr.message || err);
                    }
                }
            } else {
                showToast(err);
            }
        }
    });

    // Submissão do Formulário de Cadastro
    domRegisterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('reg-username').value;
        const password = document.getElementById('reg-password').value;
        const name = document.getElementById('reg-name').value;
        const company = document.getElementById('reg-company').value;
        
        let journey = 480;
        if (regJourney.value === 'custom') {
            const timeVal = regJourneyCustom.value; // "HH:MM"
            journey = parseTimeToMinutes(timeVal) || 480;
        } else {
            journey = parseInt(regJourney.value);
        }

        try {
            const user = await window.dbService.registerUser(username, password, name, company, journey);
            
            // Tenta enviar o cadastro para o servidor se estiver online
            if (window.syncService.isOnline) {
                try {
                    await fetch(`${window.syncService.serverUrl}/api/register`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(user)
                    });
                } catch(srvErr) {
                    console.warn("Servidor offline ao cadastrar usuário, perfil salvo localmente:", srvErr);
                }
            }

            loginSuccess(user);
            showToast("Perfil cadastrado com sucesso!");
        } catch (err) {
            showToast(err);
        }
    });

    function loginSuccess(user) {
        state.currentUser = user;
        localStorage.setItem('currentUser', user.username);
        
        // Atualiza a URL do servidor configurada nas preferências do usuário ou usa padrão local
        const savedServerUrl = localStorage.getItem(`serverUrl_${user.username}`) || window.syncService.serverUrl;
        window.syncService.serverUrl = savedServerUrl;

        // Atualiza preferência de câmera
        const savedCamera = localStorage.getItem(`preferredCamera_${user.username}`) || 'environment';
        domPunchCameraInput.setAttribute('capture', savedCamera);

        // Atualiza Elementos Fixos do Cabeçalho
        domHeaderUserName.textContent = user.name;
        domHeaderUserCompany.textContent = user.company;

        // Limpa campos
        domLoginForm.reset();
        domRegisterForm.reset();
        regJourneyCustomGroup.classList.add('hidden');

        // Alterna telas
        domAuthScreen.classList.add('hidden');
        domAppScreen.classList.remove('hidden');

        // Carrega dados e vai para home
        navigateTo('home');

        // Tenta sincronizar
        window.syncService.triggerAutoSync();
        
        // Carrega usuários disponíveis
        loadAvailableProfiles();
    }

    function showAuthScreen() {
        state.currentUser = null;
        localStorage.removeItem('currentUser');
        domAppScreen.classList.add('hidden');
        domAuthScreen.classList.remove('hidden');
        domLoginForm.classList.remove('hidden');
        domRegisterForm.classList.add('hidden');
        domAuthSubtitle.textContent = "Entre na sua folha de ponto pessoal";
    }

    // ==========================================================================
    // RENDERIZAÇÃO DA TELA 1: HOME (VISÃO DIÁRIA)
    // ==========================================================================
    
    async function renderHome() {
        const username = state.currentUser.username;
        
        // Data de hoje formatada por extenso
        const now = new Date();
        domHomeTodayDate.textContent = now.toLocaleDateString('pt-BR', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        });

        // Configuração de jornada legível
        domHomeUserJourney.textContent = formatMinutesToTime(state.currentUser.journey);

        try {
            // Busca todos os pontos
            const allPunches = await window.dbService.getPunches(username);
            
            // Filtra pontos de HOJE (com base na data local)
            const todayStr = now.toLocaleDateString('pt-BR');
            const todayPunches = allPunches.filter(p => new Date(p.timestamp).toLocaleDateString('pt-BR') === todayStr);

            // Atualiza quantidade
            domHomeRecordsCount.textContent = todayPunches.length === 1 
                ? "1 batida" 
                : `${todayPunches.length} batidas`;

            // Limpa lista
            domHomePunchesList.innerHTML = '';

            if (todayPunches.length === 0) {
                // Exibe estado vazio
                domHomePunchesList.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">
                            <svg viewBox="0 0 24 24" width="36" height="36" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        </div>
                        <p>Nenhum ponto registrado hoje.</p>
                        <span>Clique no botão flutuante para bater seu ponto.</span>
                    </div>
                `;
                domHomeDaySummary.classList.add('hidden');
            } else {
                // Renderiza cada ponto do dia
                todayPunches.forEach((punch, index) => {
                    const punchTime = new Date(punch.timestamp).toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    });

                    // Define rótulo baseado na ordem: Entrada 1, Saída 1, Entrada 2, Saída 2...
                    const isEntry = index % 2 === 0;
                    const punchLabel = `${isEntry ? 'Entrada' : 'Saída'} ${Math.floor(index / 2) + 1}`;

                    const card = document.createElement('div');
                    card.className = 'punch-card glass';

                    let photoHtml = '';
                    if (punch.photo) {
                        photoHtml = `<img src="${punch.photo}" class="receipt-thumbnail" alt="Comprovante" data-id="${punch.id}">`;
                    }

                    card.innerHTML = `
                        <div class="punch-card-left">
                            <div class="punch-number">${index + 1}</div>
                            <div class="punch-info">
                                <span class="punch-time">${punchTime}</span>
                                <span class="punch-label">${punchLabel}</span>
                            </div>
                        </div>
                        <div class="punch-card-right">
                            ${photoHtml}
                            <button class="btn-delete-punch" data-id="${punch.id}" title="Excluir batida">
                                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                            </button>
                        </div>
                    `;

                    domHomePunchesList.appendChild(card);
                });

                // Registra cliques na miniatura da foto para abrir lightbox
                domHomePunchesList.querySelectorAll('.receipt-thumbnail').forEach(thumb => {
                    thumb.addEventListener('click', () => {
                        const pid = thumb.getAttribute('data-id');
                        const p = todayPunches.find(x => x.id === pid);
                        if (p) openLightbox(p);
                    });
                });

                // Registra cliques de exclusão
                domHomePunchesList.querySelectorAll('.btn-delete-punch').forEach(btn => {
                    btn.addEventListener('click', async () => {
                        const pid = btn.getAttribute('data-id');
                        if (confirm("Deseja realmente excluir este ponto?")) {
                            try {
                                await window.dbService.deletePunch(pid);
                                showToast("Ponto marcado para exclusão.");
                                renderHome();
                                window.syncService.triggerAutoSync();
                            } catch (err) {
                                showToast(err);
                            }
                        }
                    });
                });

                // Cálculo diário
                const workedToday = calculateWorkedMinutes(todayPunches);
                const journeyMinutes = state.currentUser.journey;
                const balanceToday = workedToday - journeyMinutes;

                domHomeDayWorked.textContent = formatMinutesToHoursText(workedToday);
                domHomeDayBalance.textContent = formatBalanceText(balanceToday, true);
                
                // Formatação de cores do saldo diário
                domHomeDayBalance.className = 'summary-value ' + (balanceToday >= 0 ? 'positive' : 'negative');
                
                domHomeDaySummary.classList.remove('hidden');
            }

            // ====================================================
            // CÁLCULO E RENDERIZAÇÃO DO BANCO DE HORAS ACUMULADO DO MÊS
            // ====================================================
            renderHomeMonthSummary(allPunches);

        } catch (e) {
            console.error("Erro ao carregar dados da Home:", e);
            showToast("Erro ao carregar registros do dia.");
        }
    }

    /**
     * Calcula o banco de horas acumulado do mês e atualiza os elementos visuais na Home.
     */
    function renderHomeMonthSummary(allPunches) {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth(); // 0-indexed

        // Filtra todos os pontos do mês atual
        const monthPunches = allPunches.filter(p => {
            const pDate = new Date(p.timestamp);
            return pDate.getFullYear() === currentYear && pDate.getMonth() === currentMonth;
        });

        // Agrupa pontos por dia local
        const punchesByDay = new Map();
        monthPunches.forEach(p => {
            const pDateStr = new Date(p.timestamp).toLocaleDateString('pt-BR');
            if (!punchesByDay.has(pDateStr)) {
                punchesByDay.set(pDateStr, []);
            }
            punchesByDay.get(pDateStr).push(p);
        });

        let totalBalance = 0;
        let totalWorked = 0;
        let totalExpected = 0;

        punchesByDay.forEach((dayPunches) => {
            // Ordena cronologicamente
            dayPunches.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            
            const workedMin = calculateWorkedMinutes(dayPunches);
            const expectedMin = state.currentUser.journey;
            const balanceMin = workedMin - expectedMin;

            totalWorked += workedMin;
            totalExpected += expectedMin;
            totalBalance += balanceMin;
        });

        // Atualiza os elementos na UI
        domHomeMonthBalance.textContent = formatBalanceText(totalBalance, false);
        
        // Define classes e estilo de tendência do banco de horas
        if (totalBalance > 0) {
            domHomeMonthBalance.className = 'metric-value positive';
            domHomeMonthTrend.className = 'metric-trend-indicator positive';
            domHomeMonthTrend.textContent = 'Positivo';
            
            domHomeMonthProgress.className = 'progress-bar-fill positive';
            domHomeMonthProgress.style.width = '100%';
        } else if (totalBalance < 0) {
            domHomeMonthBalance.className = 'metric-value negative';
            domHomeMonthTrend.className = 'metric-trend-indicator negative';
            domHomeMonthTrend.textContent = 'Devedor';
            
            domHomeMonthProgress.className = 'progress-bar-fill negative';
            // Calcula o percentual cumprido da jornada de forma simples
            const pct = totalExpected > 0 ? Math.min(100, Math.round((totalWorked / totalExpected) * 100)) : 50;
            domHomeMonthProgress.style.width = `${pct}%`;
        } else {
            domHomeMonthBalance.className = 'metric-value';
            domHomeMonthTrend.className = 'metric-trend-indicator neutral';
            domHomeMonthTrend.textContent = 'Estável';
            
            domHomeMonthProgress.className = 'progress-bar-fill';
            domHomeMonthProgress.style.width = '50%';
        }
    }

    // ==========================================================================
    // RENDERIZAÇÃO DA TELA 2: FOLHA DE PONTO (MENSAL)
    // ==========================================================================
    
    // Controles de alteração de mês
    domTimesheetPrevMonth.addEventListener('click', () => {
        state.selectedMonth.setMonth(state.selectedMonth.getMonth() - 1);
        renderTimesheet();
    });

    domTimesheetNextMonth.addEventListener('click', () => {
        state.selectedMonth.setMonth(state.selectedMonth.getMonth() + 1);
        renderTimesheet();
    });

    async function renderTimesheet() {
        const username = state.currentUser.username;
        const year = state.selectedMonth.getFullYear();
        const month = state.selectedMonth.getMonth(); // 0-indexed

        // Nome do mês / ano exibido no cabeçalho
        domTimesheetMonthLabel.textContent = state.selectedMonth.toLocaleDateString('pt-BR', { 
            month: 'long', 
            year: 'numeric' 
        });

        try {
            // Busca pontos totais e filtra
            const allPunches = await window.dbService.getPunches(username);
            const monthPunches = allPunches.filter(p => {
                const d = new Date(p.timestamp);
                return d.getFullYear() === year && d.getMonth() === month;
            });

            // Agrupa pontos por dia
            const punchesByDay = {};
            monthPunches.forEach(p => {
                const dayNum = new Date(p.timestamp).getDate();
                if (!punchesByDay[dayNum]) punchesByDay[dayNum] = [];
                punchesByDay[dayNum].push(p);
            });

            // Calcula estatísticas mensais gerais
            let totalWorkedMinutes = 0;
            let totalExpectedMinutes = 0;
            let daysWorkedCount = 0;
            let totalBalanceMinutes = 0;

            // Obtém quantidade de dias no mês
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            
            // Limpa container de dias
            domTimesheetDaysContainer.innerHTML = '';

            // Renderiza cada dia do mês de trás para frente (mais recentes primeiro)
            for (let day = daysInMonth; day >= 1; day--) {
                const dateObj = new Date(year, month, day);
                const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6; // Dom ou Sab
                const weekdayName = dateObj.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');

                const dayPunches = punchesByDay[day] || [];
                dayPunches.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

                let punchesText = '';
                let workedMin = 0;
                let balanceMin = 0;
                let hasPhotos = false;

                if (dayPunches.length > 0) {
                    daysWorkedCount++;
                    // Horários formatados: "08:00 • 12:00 • 13:00 • 17:00"
                    punchesText = dayPunches.map(p => {
                        if (p.photo) hasPhotos = true;
                        return new Date(p.timestamp).toLocaleTimeString('pt-BR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                        });
                    }).join(' • ');

                    workedMin = calculateWorkedMinutes(dayPunches);
                    const expectedMin = state.currentUser.journey;
                    balanceMin = workedMin - expectedMin;

                    totalWorkedMinutes += workedMin;
                    totalExpectedMinutes += expectedMin;
                    totalBalanceMinutes += balanceMin;
                }

                // Cria elemento de linha do dia
                const row = document.createElement('div');
                row.className = `day-row glass ${isWeekend ? 'weekend' : ''}`;

                // Renderização das informações do dia
                let balanceHtml = '';
                if (dayPunches.length > 0) {
                    const balanceClass = balanceMin > 0 ? 'positive' : (balanceMin < 0 ? 'negative' : 'zero');
                    const balanceSign = balanceMin > 0 ? '+' : '';
                    balanceHtml = `<span class="day-balance-text ${balanceClass}">${balanceSign}${formatMinutesToHoursText(balanceMin)}</span>`;
                } else {
                    balanceHtml = `<span class="day-balance-text zero">--</span>`;
                }

                // Indicador de foto
                const photoIndicatorHtml = hasPhotos 
                    ? `<div class="day-has-photos-indicator"><span class="dot-photo-indicator"></span></div>` 
                    : '';

                row.innerHTML = `
                    <div class="day-row-left">
                        <div class="day-date-badge">
                            <span class="date-day-num">${String(day).padStart(2, '0')}</span>
                            <span class="date-day-week">${weekdayName}</span>
                        </div>
                        <div class="day-punches-summary">
                            <span class="punches-list-text">${punchesText}</span>
                            ${dayPunches.length > 0 ? `<span class="day-worked-time">Trabalhado: ${formatMinutesToHoursText(workedMin)}</span>` : ''}
                        </div>
                    </div>
                    <div class="day-row-right">
                        ${balanceHtml}
                        ${photoIndicatorHtml}
                    </div>
                `;

                domTimesheetDaysContainer.appendChild(row);

                // Habilita Toque Longo para Edição
                addLongPressListener(row, () => {
                    openEditDayModal(dateObj, dayPunches);
                });
            }

            // Atualiza os cartões de resumo mensal
            domTimesheetDaysWorked.textContent = daysWorkedCount;
            domTimesheetTotalHours.textContent = formatMinutesToHoursText(totalWorkedMinutes);
            domTimesheetTotalBalance.textContent = formatBalanceText(totalBalanceMinutes, false);
            
            if (totalBalanceMinutes > 0) {
                domTimesheetTotalBalance.className = 'summary-card-value positive';
            } else if (totalBalanceMinutes < 0) {
                domTimesheetTotalBalance.className = 'summary-card-value negative';
            } else {
                domTimesheetTotalBalance.className = 'summary-card-value';
            }

        } catch (e) {
            console.error("Erro ao carregar Folha de Ponto:", e);
            showToast("Erro ao carregar relatório mensal.");
        }
    }

    // ==========================================================================
    // RENDERIZAÇÃO DA TELA 3: ÁLBUM DE FIGURINHAS (COMPROVANTES EM FOTO)
    // ==========================================================================
    
    domAlbumPrevMonth.addEventListener('click', () => {
        state.albumMonth.setMonth(state.albumMonth.getMonth() - 1);
        renderAlbum();
    });

    domAlbumNextMonth.addEventListener('click', () => {
        state.albumMonth.setMonth(state.albumMonth.getMonth() + 1);
        renderAlbum();
    });

    async function renderAlbum() {
        const username = state.currentUser.username;
        const year = state.albumMonth.getFullYear();
        const month = state.albumMonth.getMonth();

        domAlbumMonthLabel.textContent = state.albumMonth.toLocaleDateString('pt-BR', { 
            month: 'long', 
            year: 'numeric' 
        });

        try {
            const allPunches = await window.dbService.getPunches(username);
            
            // Filtra por fotos deste mês
            const photosPunches = allPunches.filter(p => {
                const d = new Date(p.timestamp);
                return d.getFullYear() === year && d.getMonth() === month && p.photo;
            });

            domAlbumDaysContainer.innerHTML = '';

            if (photosPunches.length === 0) {
                domAlbumDaysContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">
                            <svg viewBox="0 0 24 24" width="36" height="36" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                        </div>
                        <p>Nenhum comprovante em foto este mês.</p>
                        <span>Bata um ponto e anexe uma foto para aparecer aqui.</span>
                    </div>
                `;
                return;
            }

            // Agrupa por dia para exibir uma linha horizontal por dia
            const groupedByDay = {};
            photosPunches.forEach(p => {
                const dayNum = new Date(p.timestamp).getDate();
                if (!groupedByDay[dayNum]) groupedByDay[dayNum] = [];
                groupedByDay[dayNum].push(p);
            });

            // Ordena os dias decrescente
            const daysWithPhotos = Object.keys(groupedByDay).map(Number).sort((a,b) => b - a);

            daysWithPhotos.forEach(day => {
                const dayPunches = groupedByDay[day];
                // Ordena os pontos do dia de forma cronológica
                dayPunches.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

                const dateObj = new Date(year, month, day);
                const dayLabel = dateObj.toLocaleDateString('pt-BR', { 
                    weekday: 'short', 
                    day: '2-digit', 
                    month: '2-digit' 
                });

                const rowSection = document.createElement('div');
                rowSection.className = 'album-day-row glass';

                rowSection.innerHTML = `
                    <h4 class="album-day-title">${dayLabel}</h4>
                    <div class="album-photos-grid" id="album-grid-day-${day}">
                        <!-- Fotos serão inseridas aqui -->
                    </div>
                `;

                domAlbumDaysContainer.appendChild(rowSection);

                const grid = document.getElementById(`album-grid-day-${day}`);

                dayPunches.forEach(punch => {
                    const timeStr = new Date(punch.timestamp).toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    });

                    const wrapper = document.createElement('div');
                    wrapper.className = 'album-photo-wrapper';
                    wrapper.innerHTML = `
                        <img src="${punch.photo}" alt="Comprovante ${timeStr}">
                        <div class="album-photo-time">${timeStr}</div>
                    `;

                    wrapper.addEventListener('click', () => {
                        openLightbox(punch);
                    });

                    grid.appendChild(wrapper);
                });
            });

        } catch (e) {
            console.error("Erro ao renderizar Álbum:", e);
            showToast("Erro ao carregar álbum de comprovantes.");
        }
    }

    // ==========================================================================
    // RENDERIZAÇÃO DA TELA 4: CONFIGURAÇÕES E MULTI-USUÁRIO
    // ==========================================================================
    
    function renderSettings() {
        // Preenche formulário do perfil
        domSettingsName.value = state.currentUser.name;
        domSettingsCompany.value = state.currentUser.company;
        
        const journey = state.currentUser.journey;
        if ([240, 360, 480, 528].includes(journey)) {
            domSettingsJourney.value = String(journey);
            domSettingsJourneyCustomGroup.classList.add('hidden');
        } else {
            domSettingsJourney.value = 'custom';
            domSettingsJourneyCustomGroup.classList.remove('hidden');
            domSettingsJourneyCustom.value = formatMinutesToTime(journey);
        }

        // Preenche URL do servidor configurada
        domSettingsServerUrl.value = window.syncService.serverUrl;

        // Preenche preferência da câmera
        const savedCamera = localStorage.getItem(`preferredCamera_${state.currentUser.username}`) || 'environment';
        domSettingsCamera.value = savedCamera;

        // Renderiza lista de perfis salvos para alternar
        loadAvailableProfiles();
    }

    // Ação de Salvar Configurações
    domSettingsProfileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = domSettingsName.value;
        const company = domSettingsCompany.value;
        
        let journey = 480;
        if (domSettingsJourney.value === 'custom') {
            journey = parseTimeToMinutes(domSettingsJourneyCustom.value) || 480;
        } else {
            journey = parseInt(domSettingsJourney.value);
        }

        try {
            const updatedUser = await window.dbService.updateUser(state.currentUser.username, name, company, journey);
            state.currentUser = updatedUser;
            
            // Atualiza no cabeçalho
            domHeaderUserName.textContent = updatedUser.name;
            domHeaderUserCompany.textContent = updatedUser.company;

            // Salva URL do servidor customizada
            const serverUrl = domSettingsServerUrl.value.trim();
            if (serverUrl) {
                window.syncService.serverUrl = serverUrl;
                localStorage.setItem(`serverUrl_${state.currentUser.username}`, serverUrl);
            }

            // Salva preferência da câmera
            const cameraPref = domSettingsCamera.value;
            localStorage.setItem(`preferredCamera_${state.currentUser.username}`, cameraPref);
            domPunchCameraInput.setAttribute('capture', cameraPref);

            // Tenta enviar o update para o servidor
            if (window.syncService.isOnline) {
                try {
                    await fetch(`${window.syncService.serverUrl}/api/register`, { // A rota de cadastro atua como put/upsert no servidor
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updatedUser)
                    });
                } catch(srvErr) {
                    console.warn("Servidor offline ao atualizar perfil no backend:", srvErr);
                }
            }

            showToast("Configurações salvas com sucesso!");
            renderSettings();
            // Dispara sync das modificações
            window.syncService.triggerAutoSync();
        } catch (err) {
            showToast(err);
        }
    });

    // Sincronização manual acionada pelo menu de configurações
    domBtnManualSync.addEventListener('click', triggerManualSync);

    // Carrega a lista de perfis salvos localmente no switch do menu de Ajustes
    async function loadAvailableProfiles() {
        try {
            const users = await window.dbService.getAllUsers();
            state.availableUsers = users;

            domSettingsProfilesList.innerHTML = '';

            users.forEach(user => {
                const isActive = user.username === state.currentUser.username;
                const initials = user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

                const item = document.createElement('div');
                item.className = `profile-item ${isActive ? 'active' : ''}`;
                
                item.innerHTML = `
                    <div class="profile-item-left">
                        <div class="profile-avatar">${initials}</div>
                        <div class="profile-details">
                            <span class="profile-name">${user.name}</span>
                            <span class="profile-username">@${user.username} - ${user.company}</span>
                        </div>
                    </div>
                    ${isActive ? `
                        <div class="profile-active-indicator">
                            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                    ` : ''}
                `;

                // Clique para alternar perfil imediatamente
                if (!isActive) {
                    item.addEventListener('click', async () => {
                        // Para login correto precisamos buscar a senha na base
                        const transaction = window.dbService.db.transaction(['users'], 'readonly');
                        const store = transaction.objectStore('users');
                        const request = store.get(user.username);
                        
                        request.onsuccess = () => {
                            if (request.result) {
                                loginSuccess(request.result);
                                showToast(`Perfil alterado para ${user.name}`);
                            }
                        };
                    });
                }

                domSettingsProfilesList.appendChild(item);
            });
        } catch (e) {
            console.error("Erro ao carregar lista de perfis:", e);
        }
    }

    // Botão Adicionar Novo Perfil (Redireciona para o formulário de cadastro)
    domBtnAddProfile.addEventListener('click', () => {
        state.currentUser = null;
        localStorage.removeItem('currentUser');
        domAppScreen.classList.add('hidden');
        domAuthScreen.classList.remove('hidden');
        domLoginForm.classList.add('hidden');
        domRegisterForm.classList.remove('hidden');
        domAuthSubtitle.textContent = "Cadastre um novo perfil profissional";
    });

    // Botão Sair da Conta (Logout)
    domBtnLogout.addEventListener('click', () => {
        if (confirm("Deseja realmente sair de sua conta?")) {
            showAuthScreen();
            showToast("Sessão finalizada.");
        }
    });

    // ==========================================================================
    // MODAL DE REGISTRO DE NOVO PONTO (PUNCH)
    // ==========================================================================
    
    // Abre modal para bater ponto
    domBtnPunchFab.addEventListener('click', openPunchModal);

    function openPunchModal() {
        // Preenche com a data e hora local do sistema ajustada no fuso
        const now = new Date();
        
        // Converte para o formato aceito pelo input datetime-local: YYYY-MM-DDTHH:MM
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hour = String(now.getHours()).padStart(2, '0');
        const minute = String(now.getMinutes()).padStart(2, '0');
        
        domPunchDatetime.value = `${year}-${month}-${day}T${hour}:${minute}`;

        // Limpa foto
        clearPunchPhotoSelection();

        // Abre modal
        domPunchModal.classList.remove('hidden');
    }

    // Fecha modal
    domBtnClosePunchModal.addEventListener('click', closePunchModal);
    domBtnCancelPunch.addEventListener('click', closePunchModal);

    function closePunchModal() {
        domPunchModal.classList.add('hidden');
        clearPunchPhotoSelection();
    }

    // Funções de atalhos rápidos de horário
    domBtnSetNow.addEventListener('click', () => {
        const now = new Date();
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        setTimeInInput(`${h}:${m}`);
    });
    domBtnSetMorning.addEventListener('click', () => setTimeInInput('08:00'));
    domBtnSetLunchOut.addEventListener('click', () => setTimeInInput('12:00'));
    domBtnSetLunchIn.addEventListener('click', () => setTimeInInput('13:00'));
    domBtnSetEvening.addEventListener('click', () => setTimeInInput('17:00'));

    function setTimeInInput(timeStr) {
        const currentVal = domPunchDatetime.value; // "YYYY-MM-DDTHH:MM"
        if (currentVal.includes('T')) {
            const datePart = currentVal.split('T')[0];
            domPunchDatetime.value = `${datePart}T${timeStr}`;
        }
    }

    // Configuração do Upload de Fotos de Comprovante
    
    // Área de clique central (ativa input de câmera por padrão agora)
    domImageUploadTrigger.addEventListener('click', (e) => {
        // Se clicar no botão de remover imagem ou no botão de recortar, não ativa o input
        if (e.target.closest('#btn-remove-photo') || e.target.closest('#btn-crop-photo-new')) return;
        
        // Abre o input de câmera por padrão
        domPunchCameraInput.click();
    });

    // Recortar foto selecionada no upload normal
    domBtnCropPhotoNew.addEventListener('click', (e) => {
        e.stopPropagation(); // Evita reabrir seleção
        if (state.currentPunchPhoto) {
            openCropModal(state.currentPunchPhoto, (croppedBase64) => {
                state.currentPunchPhoto = croppedBase64;
                domUploadPreviewImg.src = croppedBase64;
                const sizeKB = Math.round((croppedBase64.length * 3) / 4 / 1024);
                domUploadPreviewInfo.textContent = `Foto comprovante (recortada) - ~${sizeKB}KB`;
                showToast("Comprovante recortado com sucesso!");
            });
        }
    });

    // Botões dedicados para acionar especificamente Câmera ou Galeria
    domBtnTriggerCamera.addEventListener('click', () => domPunchCameraInput.click());
    domBtnTriggerGallery.addEventListener('click', () => domPunchPhotoInput.click());

    // Escuta alterações de arquivo nos inputs
    domPunchPhotoInput.addEventListener('change', handleFileSelection);
    domPunchCameraInput.addEventListener('change', handleFileSelection);

    async function handleFileSelection(e) {
        const file = e.target.files[0];
        if (!file) return;

        showToast("Processando e comprimindo foto...");
        
        try {
            // Comprime a foto no canvas local para economizar servidor e local storage (IndexedDB)
            // Largura máxima de 800px e 70% de qualidade jpeg
            const base64Data = await window.cameraService.resizeAndCompress(file, 800, 800, 0.7);
            
            state.currentPunchPhoto = base64Data;

            // Atualiza previsualização
            domUploadPreviewImg.src = base64Data;
            
            // Calcula o tamanho comprimido em KB para feedback do usuário
            const sizeKB = Math.round((base64Data.length * 3) / 4 / 1024);
            domUploadPreviewInfo.textContent = `Foto comprovante - comprimida para ~${sizeKB}KB`;
            
            domUploadPreviewContainer.classList.remove('hidden');
            showToast("Foto do comprovante integrada!");
        } catch (err) {
            console.error("Erro ao comprimir imagem:", err);
            showToast("Erro ao processar comprovante: " + err);
            clearPunchPhotoSelection();
        }
    }

    // Botão de remover foto selecionada
    domBtnRemovePhoto.addEventListener('click', (e) => {
        e.stopPropagation(); // Evita reabrir caixa de seleção de arquivo
        clearPunchPhotoSelection();
    });

    function clearPunchPhotoSelection() {
        state.currentPunchPhoto = null;
        domPunchPhotoInput.value = '';
        domPunchCameraInput.value = '';
        domUploadPreviewContainer.classList.add('hidden');
        domUploadPreviewImg.src = '';
    }

    // Formulário de Envio do Ponto
    domPunchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const datetimeVal = domPunchDatetime.value; // Formato: "YYYY-MM-DDTHH:MM"
        if (!datetimeVal) {
            showToast("Por favor, selecione data e hora.");
            return;
        }

        // Converte o datetime-local para string de Data ISO em UTC para persistência
        const punchDate = new Date(datetimeVal);
        
        const newPunch = {
            username: state.currentUser.username,
            timestamp: punchDate.toISOString(),
            photo: state.currentPunchPhoto, // Base64 comprimido ou null
            synced: false,
            deleted: false
        };

        try {
            await window.dbService.savePunch(newPunch);
            showToast("Ponto registrado com sucesso!");
            closePunchModal();
            
            // Atualiza tela corrente
            renderActiveView();

            // Dispara sincronização em segundo plano automaticamente
            window.syncService.triggerAutoSync();
        } catch (err) {
            showToast("Falha ao salvar ponto local: " + err);
        }
    });

    // ==========================================================================
    // LIGHTBOX VISUALIZADOR DE FOTO DE COMPROVANTE
    // ==========================================================================
    
    function openLightbox(punch) {
        if (!punch.photo) return;

        const dateObj = new Date(punch.timestamp);
        
        domLightboxImg.src = punch.photo;
        
        domLightboxDate.textContent = dateObj.toLocaleDateString('pt-BR', {
            weekday: 'long', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric'
        });

        domLightboxTime.textContent = "Batida de ponto às " + dateObj.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });

        domLightboxModal.classList.remove('hidden');
    }

    domBtnCloseLightbox.addEventListener('click', () => {
        domLightboxModal.classList.add('hidden');
        domLightboxImg.src = '';
    });

    // ==========================================================================
    // HELPERS E UTILS DE CÁLCULO DE TEMPO E INTERFACE
    // ==========================================================================
    
    /**
     * Calcula o total de minutos trabalhados no dia com base nas batidas de ponto.
     * Segue a regra CLT de intervalos em ordem cronológica (Entrada/Saída).
     */
    function calculateWorkedMinutes(punches) {
        let totalMinutes = 0;
        
        // Garante ordenação cronológica
        const sorted = [...punches].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        // Calcula a duração entre pares ordenados: (P1 a P2), (P3 a P4), etc.
        for (let i = 0; i < sorted.length - 1; i += 2) {
            const start = new Date(sorted[i].timestamp);
            const end = new Date(sorted[i+1].timestamp);
            const diffMs = end - start;
            if (diffMs > 0) {
                totalMinutes += Math.floor(diffMs / 1000 / 60);
            }
        }

        return totalMinutes;
    }

    /**
     * Converte minutos em string HH:MM
     */
    function formatMinutesToTime(totalMinutes) {
        const absMinutes = Math.abs(totalMinutes);
        const hrs = String(Math.floor(absMinutes / 60)).padStart(2, '0');
        const mins = String(absMinutes % 60).padStart(2, '0');
        return `${hrs}:${mins}`;
    }

    /**
     * Converte minutos em formato amigável de horas "XXh YYm"
     */
    function formatMinutesToHoursText(totalMinutes) {
        const absMinutes = Math.abs(totalMinutes);
        const hrs = String(Math.floor(absMinutes / 60)).padStart(2, '0');
        const mins = String(absMinutes % 60).padStart(2, '0');
        return `${hrs}h ${mins}m`;
    }

    /**
     * Converte string de tempo HH:MM em minutos inteiros
     */
    function parseTimeToMinutes(timeStr) {
        if (!timeStr || !timeStr.includes(':')) return 0;
        const parts = timeStr.split(':');
        const hrs = parseInt(parts[0]) || 0;
        const mins = parseInt(parts[1]) || 0;
        return (hrs * 60) + mins;
    }

    /**
     * Formata um saldo de minutos positivo ou negativo com sinal de +/-
     */
    function formatBalanceText(balanceMinutes, showNeutralPlus = false) {
        const formatted = formatMinutesToHoursText(balanceMinutes);
        if (balanceMinutes > 0) {
            return `+${formatted}`;
        } else if (balanceMinutes < 0) {
            return `-${formatted}`;
        }
        return (showNeutralPlus ? '+' : '') + formatted;
    }

    /**
     * Exibe uma notificação flutuante temporária
     */
    function showToast(message, duration = 3000) {
        if (toastTimeout) clearTimeout(toastTimeout);
        
        domToast.textContent = message;
        domToast.className = 'toast'; // Limpa estados anteriores
        
        // Força reflow para relançar animações do CSS
        void domToast.offsetWidth;
        
        domToast.classList.add('show');

        toastTimeout = setTimeout(() => {
            domToast.classList.remove('show');
            domToast.classList.add('hidden');
        }, duration);
    }

    // ==========================================================================
    // MÓDULO DE RECORTE DE FOTO (CROP)
    // ==========================================================================
    const cropState = {
        originalSrc: null,
        targetCallback: null,
        scale: 1,
        x: 0,
        y: 0,
        isDragging: false,
        startX: 0,
        startY: 0
    };

    function openCropModal(originalPhotoBase64, onConfirmCallback) {
        cropState.originalSrc = originalPhotoBase64;
        cropState.targetCallback = onConfirmCallback;
        cropState.scale = 1;
        cropState.x = 0;
        cropState.y = 0;
        
        domCropImage.src = originalPhotoBase64;
        domCropZoomSlider.value = 1;
        domCropImage.style.transform = `translate(0px, 0px) scale(1)`;
        
        domCropModal.classList.remove('hidden');
    }

    function closeCropModal() {
        domCropModal.classList.add('hidden');
        domCropImage.src = '';
    }

    // Eventos de Arrastar (Drag & Touch)
    function startCropDrag(e) {
        cropState.isDragging = true;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        cropState.startX = clientX - cropState.x;
        cropState.startY = clientY - cropState.y;
        
        // Evita rolar a página no mobile enquanto arrasta
        if (e.cancelable) e.preventDefault();
    }

    function moveCropDrag(e) {
        if (!cropState.isDragging) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        cropState.x = clientX - cropState.startX;
        cropState.y = clientY - cropState.startY;
        
        domCropImage.style.transform = `translate(${cropState.x}px, ${cropState.y}px) scale(${cropState.scale})`;
        if (e.cancelable) e.preventDefault();
    }

    function endCropDrag() {
        cropState.isDragging = false;
    }

    domCropViewport.addEventListener('mousedown', startCropDrag);
    domCropViewport.addEventListener('mousemove', moveCropDrag);
    window.addEventListener('mouseup', endCropDrag);

    domCropViewport.addEventListener('touchstart', startCropDrag, { passive: false });
    domCropViewport.addEventListener('touchmove', moveCropDrag, { passive: false });
    window.addEventListener('touchend', endCropDrag);

    // Controle de Zoom Slider
    domCropZoomSlider.addEventListener('input', (e) => {
        cropState.scale = parseFloat(e.target.value);
        domCropImage.style.transform = `translate(${cropState.x}px, ${cropState.y}px) scale(${cropState.scale})`;
    });

    // Cancelar Recorte
    domBtnCancelCrop.addEventListener('click', closeCropModal);
    domBtnCloseCropModal.addEventListener('click', closeCropModal);

    // Confirmar Recorte (Canvas)
    domBtnConfirmCrop.addEventListener('click', () => {
        if (!cropState.originalSrc) {
            closeCropModal();
            return;
        }

        try {
            const rectV = domCropViewport.getBoundingClientRect();
            const rectI = domCropImage.getBoundingClientRect();
            
            const naturalWidth = domCropImage.naturalWidth;
            const naturalHeight = domCropImage.naturalHeight;
            
            const ratio = naturalWidth / rectI.width;
            
            const cropX = (rectV.left - rectI.left) * ratio;
            const cropY = (rectV.top - rectI.top) * ratio;
            const cropW = rectV.width * ratio;
            const cropH = rectV.height * ratio;

            const canvas = document.createElement('canvas');
            canvas.width = 650;
            canvas.height = 850;
            
            const ctx = canvas.getContext('2d');
            
            ctx.drawImage(
                domCropImage,
                cropX, cropY, cropW, cropH,
                0, 0, canvas.width, canvas.height
            );
            
            const croppedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            
            if (cropState.targetCallback) {
                cropState.targetCallback(croppedBase64);
            }
            
            closeCropModal();
        } catch (err) {
            console.error("Erro ao recortar imagem no Canvas:", err);
            showToast("Falha ao recortar imagem.");
        }
    });

    // ==========================================================================
    // MÓDULO DE EDIÇÃO DE DIAS DA FOLHA (LONG PRESS)
    // ==========================================================================
    
    function addLongPressListener(element, callback) {
        let timer = null;
        let isLongPress = false;
        
        function start(e) {
            if (e.type === 'mousedown' && e.button !== 0) return;
            isLongPress = false;
            
            timer = setTimeout(() => {
                isLongPress = true;
                callback(e);
            }, 600);
        }
        
        function cancel() {
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
        }
        
        function preventClick(e) {
            if (isLongPress) {
                e.preventDefault();
                e.stopPropagation();
            }
        }
        
        element.addEventListener('touchstart', start, { passive: true });
        element.addEventListener('touchend', cancel);
        element.addEventListener('touchmove', cancel);
        element.addEventListener('touchcancel', cancel);
        
        element.addEventListener('mousedown', start);
        element.addEventListener('mouseup', cancel);
        element.addEventListener('mouseleave', cancel);
        
        element.addEventListener('click', preventClick, true);
        element.addEventListener('contextmenu', (e) => {
            if (isLongPress || e.pointerType === 'touch') {
                e.preventDefault();
            }
        });
    }

    function openEditDayModal(dateObj, punches) {
        state.editingDate = dateObj;
        state.editingPunches = punches.map(p => ({
            id: p.id,
            username: p.username,
            timestamp: p.timestamp,
            photo: p.photo,
            synced: p.synced
        }));
        
        const dateFormatted = dateObj.toLocaleDateString('pt-BR', { 
            weekday: 'long', 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric' 
        });
        domEditModalDateLabel.textContent = dateFormatted;
        
        renderEditingPunches();
        domEditDayModal.classList.remove('hidden');
    }

    function closeEditDayModal() {
        domEditDayModal.classList.add('hidden');
        state.editingDate = null;
        state.editingPunches = [];
    }

    function renderEditingPunches() {
        domEditPunchesContainer.innerHTML = '';
        
        if (state.editingPunches.length === 0) {
            domEditPunchesContainer.innerHTML = `
                <div class="empty-state" style="padding: 20px 10px;">
                    <p>Nenhum horário registrado para este dia.</p>
                    <span style="font-size: 11px;">Clique abaixo para adicionar um horário.</span>
                </div>
            `;
            return;
        }

        state.editingPunches.sort((a, b) => a.timestamp - b.timestamp);

        const cameraPref = localStorage.getItem(`preferredCamera_${state.currentUser.username}`) || 'environment';

        state.editingPunches.forEach((punch, index) => {
            const punchTime = new Date(punch.timestamp);
            const timeStr = `${String(punchTime.getHours()).padStart(2, '0')}:${String(punchTime.getMinutes()).padStart(2, '0')}`;
            
            const rowEl = document.createElement('div');
            rowEl.className = 'edit-punch-row glass';
            rowEl.innerHTML = `
                <div class="edit-punch-row-header">
                    <h4>Lançamento #${index + 1}</h4>
                    <button type="button" class="btn-delete-edit-punch" title="Remover lançamento">
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
                <div class="edit-punch-fields">
                    <div class="form-group" style="margin-bottom: 0;">
                        <label>Horário</label>
                        <input type="time" class="edit-time-input" value="${timeStr}" style="padding: 10px; font-size: 14px;" required>
                    </div>
                    <div class="edit-photo-section">
                        <div class="edit-photo-preview-container">
                            ${punch.photo ? `<img src="${punch.photo}" class="edit-photo-preview">` : `<div class="edit-photo-placeholder">Sem comprovante</div>`}
                        </div>
                        <div class="edit-photo-controls">
                            <input type="file" accept="image/*" class="edit-file-input hidden">
                            <input type="file" accept="image/*" capture="${cameraPref}" class="edit-camera-input hidden">
                            
                            <button type="button" class="btn-edit-camera-trigger btn-small-outline" style="padding: 6px 10px; font-size: 11px;">
                                <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                                Câmera
                            </button>
                            <button type="button" class="btn-edit-photo-trigger btn-small-outline" style="padding: 6px 10px; font-size: 11px;">
                                <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                                Galeria
                            </button>
                            
                            ${punch.photo ? `
                            <button type="button" class="btn-edit-crop-photo" title="Recortar" style="width: 24px; height: 24px; border-radius: 50%; border: none; background-color: var(--primary); color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                                <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M6.13 1L6 16a2 2 0 0 0 2 2h15"></path><path d="M1 6.13L16 6a2 2 0 0 1 2 2v15"></path></svg>
                            </button>
                            <button type="button" class="btn-edit-remove-photo btn-edit-remove-photo">Remover</button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
            
            const timeInput = rowEl.querySelector('.edit-time-input');
            const btnDelete = rowEl.querySelector('.btn-delete-edit-punch');
            const btnCamera = rowEl.querySelector('.btn-edit-camera-trigger');
            const btnGallery = rowEl.querySelector('.btn-edit-photo-trigger');
            const fileInput = rowEl.querySelector('.edit-file-input');
            const cameraInput = rowEl.querySelector('.edit-camera-input');
            const btnCrop = rowEl.querySelector('.btn-edit-crop-photo');
            const btnRemovePhoto = rowEl.querySelector('.btn-edit-remove-photo');
            
            timeInput.addEventListener('change', (e) => {
                const timeVal = e.target.value;
                if (timeVal) {
                    const [hours, minutes] = timeVal.split(':').map(Number);
                    const d = new Date(punch.timestamp);
                    d.setHours(hours);
                    d.setMinutes(minutes);
                    d.setSeconds(0);
                    d.setMilliseconds(0);
                    punch.timestamp = d.getTime();
                    punch.synced = false;
                }
            });
            
            btnDelete.addEventListener('click', () => {
                state.editingPunches.splice(index, 1);
                renderEditingPunches();
            });
            
            btnCamera.addEventListener('click', () => cameraInput.click());
            btnGallery.addEventListener('click', () => fileInput.click());
            
            const handleFileSelect = async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                showToast("Processando imagem...");
                try {
                    const base64 = await window.cameraService.resizeAndCompress(file, 800, 800, 0.7);
                    punch.photo = base64;
                    punch.synced = false;
                    renderEditingPunches();
                } catch (err) {
                    showToast("Erro ao processar imagem: " + err);
                }
            };
            
            fileInput.addEventListener('change', handleFileSelect);
            cameraInput.addEventListener('change', handleFileSelect);
            
            if (btnCrop) {
                btnCrop.addEventListener('click', () => {
                    openCropModal(punch.photo, (croppedBase64) => {
                        punch.photo = croppedBase64;
                        punch.synced = false;
                        renderEditingPunches();
                    });
                });
            }
            
            if (btnRemovePhoto) {
                btnRemovePhoto.addEventListener('click', () => {
                    punch.photo = null;
                    punch.synced = false;
                    renderEditingPunches();
                });
            }
            
            domEditPunchesContainer.appendChild(rowEl);
        });
    }

    domBtnCloseEditModal.addEventListener('click', closeEditDayModal);
    domBtnCancelEdit.addEventListener('click', closeEditDayModal);

    domBtnAddEditPunch.addEventListener('click', () => {
        if (!state.editingDate) return;
        const d = state.editingDate;
        const timestamp = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0).getTime();
        
        state.editingPunches.push({
            id: 'new_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            username: state.currentUser.username,
            timestamp: timestamp,
            photo: null,
            synced: false
        });
        
        renderEditingPunches();
    });

    domBtnSaveEdit.addEventListener('click', async () => {
        if (!state.editingDate || !state.currentUser) return;
        
        showToast("Salvando alterações...");
        
        const username = state.currentUser.username;
        const year = state.editingDate.getFullYear();
        const month = state.editingDate.getMonth();
        const day = state.editingDate.getDate();
        
        try {
            const allPunches = await window.dbService.getPunches(username);
            const originalDayPunches = allPunches.filter(p => {
                const d = new Date(p.timestamp);
                return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
            });
            
            const editIds = state.editingPunches.map(p => p.id);
            const toDelete = originalDayPunches.filter(p => !editIds.includes(p.id));
            
            for (const p of toDelete) {
                await window.dbService.deletePunch(p.id);
            }
            
            for (const p of state.editingPunches) {
                const finalId = p.id.startsWith('new_') 
                    ? 'punch_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7) 
                    : p.id;
                    
                const cleanPunch = {
                    id: finalId,
                    username: username,
                    timestamp: p.timestamp,
                    photo: p.photo,
                    synced: false
                };
                
                await window.dbService.savePunch(cleanPunch);
            }
            
            showToast("Folha de ponto atualizada!");
            closeEditDayModal();
            
            if (state.currentView === 'timesheet') {
                await renderTimesheet();
            } else if (state.currentView === 'home') {
                await renderHome();
            }
            
            window.syncService.triggerAutoSync();
        } catch (err) {
            console.error("Erro ao salvar edições do dia:", err);
            showToast("Erro ao salvar alterações: " + err);
        }
    });
});
