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
        abonosMonth: new Date(),     // Mês de referência para Abonos
        currentPunchPhoto: null,     // Base64 da foto do comprovante em seleção
        currentAbonoPhoto: null,     // Base64 da foto do atestado/comprovante de abono
        availableUsers: [],          // Lista de perfis salvos neste dispositivo
        editingDate: null,           // Objeto Date sendo editado atualmente
        editingPunches: [],          // Lista de punches temporários da edição do dia
        editingPunchId: null,        // ID do punch específico sendo editado na Home
        simulationInterval: null     // Intervalo para atualização da simulação de batida "agora"
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
    const domCropWidthSlider = document.getElementById('crop-width-slider');
    const domCropHeightSlider = document.getElementById('crop-height-slider');
    const domCropWidthVal = document.getElementById('crop-width-val');
    const domCropHeightVal = document.getElementById('crop-height-val');
    const domBtnCropPresets = document.querySelectorAll('.btn-crop-preset');
    const domBtnCancelCrop = document.getElementById('btn-cancel-crop');
    const domBtnConfirmCrop = document.getElementById('btn-confirm-crop');
    const domBtnRotateLeft = document.getElementById('btn-rotate-left');
    const domBtnRotateRight = document.getElementById('btn-rotate-right');
    const domBtnCropPhotoNew = document.getElementById('btn-crop-photo-new');

    // Referências - Configurações Câmera
    const domSettingsCamera = document.getElementById('settings-camera');

    // Referências - Tela de Abonos
    const domAbonosMonthLabel = document.getElementById('abonos-month-label');
    const domAbonosPrevMonth = document.getElementById('abonos-prev-month');
    const domAbonosNextMonth = document.getElementById('abonos-next-month');
    const domAbonosListContainer = document.getElementById('abonos-list-container');
    const domBtnAddAbonoTrigger = document.getElementById('btn-add-abono-trigger');
    const domBtnExportPdf = document.getElementById('btn-export-pdf');

    // Referências - Modal de Abono
    const domAbonoModal = document.getElementById('abono-modal');
    const domAbonoModalTitle = document.getElementById('abono-modal-title');
    const domBtnCloseAbonoModal = document.getElementById('btn-close-abono-modal');
    const domAbonoForm = document.getElementById('abono-form');
    const domAbonoId = document.getElementById('abono-id');
    const domAbonoDate = document.getElementById('abono-date');
    const domAbonoReason = document.getElementById('abono-reason');
    const domAbonoType = document.getElementById('abono-type');
    const domAbonoPeriodFields = document.getElementById('abono-period-fields');
    const domAbonoStartTime = document.getElementById('abono-start-time');
    const domAbonoEndTime = document.getElementById('abono-end-time');
    const domAbonoRecurrenceGroup = document.getElementById('abono-recurrence-group');
    const domAbonoRecurrence = document.getElementById('abono-recurrence');
    const domAbonoRecurrenceEndGroup = document.getElementById('abono-recurrence-end-group');
    const domAbonoRecurrenceEnd = document.getElementById('abono-recurrence-end');
    const domAbonoPhotoInput = document.getElementById('abono-photo-input');
    const domAbonoCameraInput = document.getElementById('abono-camera-input');
    const domAbonoImageUploadTrigger = document.getElementById('abono-image-upload-trigger');
    const domAbonoUploadPlaceholder = document.getElementById('abono-upload-placeholder');
    const domAbonoUploadPreviewContainer = document.getElementById('abono-upload-preview-container');
    const domAbonoUploadPreviewImg = document.getElementById('abono-upload-preview-img');
    const domAbonoUploadPreviewInfo = document.getElementById('abono-upload-preview-info');
    const domBtnAbonoRemovePhoto = document.getElementById('btn-abono-remove-photo');
    const domBtnAbonoTriggerCamera = document.getElementById('btn-abono-trigger-camera');
    const domBtnAbonoTriggerGallery = document.getElementById('btn-abono-trigger-gallery');
    const domBtnCancelAbono = document.getElementById('btn-cancel-abono');
    const domBtnCropPhotoAbono = document.getElementById('btn-crop-photo-abono');

    // Referências - Modal de Confirmação Customizado
    const domConfirmModal = document.getElementById('confirm-modal');
    const domConfirmTitle = document.getElementById('confirm-title');
    const domConfirmMessage = document.getElementById('confirm-message');
    const domBtnConfirmYes = document.getElementById('btn-confirm-yes');
    const domBtnConfirmNo = document.getElementById('btn-confirm-no');

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

        // FAB só aparece nas visualizações diárias, mensais e fotos. Oculta no Ajustes e Abonos para limpar a UI.
        if (viewName === 'settings' || viewName === 'abonos') {
            domBtnPunchFab.classList.add('hidden');
        } else {
            domBtnPunchFab.classList.remove('hidden');
        }

        // Para a simulação se navegar para fora da home
        if (viewName !== 'home' && state.simulationInterval) {
            clearInterval(state.simulationInterval);
            state.simulationInterval = null;
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
            case 'abonos':
                renderAbonos();
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

        // Se estiver online, tenta autenticar e sincronizar com o servidor primeiro
        if (window.syncService.isOnline) {
            showToast("Verificando credenciais no servidor...");
            try {
                const serverUrl = localStorage.getItem(`serverUrl_${username.trim().toLowerCase()}`) || window.syncService.serverUrl;
                const response = await fetch(`${serverUrl}/api/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.user) {
                        const serverUser = {
                            username: data.user.username,
                            password: password, // guarda a senha para logins locais futuros
                            name: data.user.name,
                            company: data.user.company,
                            journey: data.user.journey,
                            createdAt: data.user.createdAt || new Date().toISOString()
                        };
                        
                        await window.dbService.saveUser(serverUser);
                        
                        if (Array.isArray(data.punches)) {
                            await window.dbService.mergePunchesFromServer(serverUser.username, data.punches);
                        }

                        loginSuccess(serverUser);
                        showToast(`Sincronizado com o servidor! Bem-vindo, ${serverUser.name}`);
                        return; // Login bem sucedido via servidor
                    }
                } else if (response.status === 401 || response.status === 404) {
                    const errData = await response.json();
                    showToast(errData.message || "Erro de autenticação com o servidor.");
                    return; // Erro explícito de credenciais
                }
            } catch (srvErr) {
                console.warn("Falha de rede ao conectar ao servidor. Tentando login local...", srvErr);
            }
        }

        // Login Local (Offline-First / Fallback)
        try {
            const user = await window.dbService.loginUser(username, password);
            loginSuccess(user);
            showToast(`Bem-vindo, ${user.name}! (Modo Local)`);
        } catch (err) {
            showToast(err);
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
            // Busca todos os pontos (que inclui abonos)
            const allPunchesRaw = await window.dbService.getPunches(username);
            const allPunches = allPunchesRaw.filter(p => !p.isAbono);
            const allAbonos = allPunchesRaw.filter(p => p.isAbono);
            
            // Filtra pontos de HOJE (com base na data local)
            const todayStr = now.toLocaleDateString('pt-BR');
            const todayPunches = allPunches.filter(p => new Date(p.timestamp).toLocaleDateString('pt-BR') === todayStr);
            const todayAbono = allAbonos.find(a => new Date(a.timestamp).toLocaleDateString('pt-BR') === todayStr);

            // Adiciona ou remove badge de abono hoje
            let domAbonoBadge = document.getElementById('home-today-abono-badge');
            if (!domAbonoBadge) {
                domAbonoBadge = document.createElement('span');
                domAbonoBadge.id = 'home-today-abono-badge';
                domHomeRecordsCount.parentNode.insertBefore(domAbonoBadge, domHomeRecordsCount);
            }
            if (todayAbono) {
                const text = todayAbono.abonoType === 'day' 
                    ? `Abonado [${todayAbono.reason}]` 
                    : `Abono ${todayAbono.abonoStart}-${todayAbono.abonoEnd} [${todayAbono.reason}]`;
                domAbonoBadge.className = 'badge-abono ' + (todayAbono.abonoType === 'period' ? 'period' : '');
                domAbonoBadge.style.marginLeft = '8px';
                domAbonoBadge.style.display = 'inline-flex';
                domAbonoBadge.textContent = text;
            } else {
                domAbonoBadge.style.display = 'none';
            }

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
                            <div class="punch-actions-menu">
                                <button class="btn-actions-punch" data-id="${punch.id}" title="Ações">
                                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1.5"></circle><circle cx="12" cy="5" r="1.5"></circle><circle cx="12" cy="19" r="1.5"></circle></svg>
                                </button>
                                <div class="punch-actions-dropdown" id="dropdown-${punch.id}">
                                    <button type="button" class="punch-actions-item edit" data-id="${punch.id}">
                                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path></svg>
                                        Editar
                                    </button>
                                    <button type="button" class="punch-actions-item delete" data-id="${punch.id}">
                                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2 2v2"></path></svg>
                                        Excluir
                                    </button>
                                </div>
                            </div>
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

                // Registra cliques de ações (toggle dropdown)
                domHomePunchesList.querySelectorAll('.btn-actions-punch').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const pid = btn.getAttribute('data-id');
                        const dropdown = document.getElementById(`dropdown-${pid}`);
                        
                        document.querySelectorAll('.punch-actions-dropdown').forEach(d => {
                            if (d !== dropdown) d.classList.remove('show');
                        });
                        dropdown.classList.toggle('show');
                    });
                });

                // Clique fora fecha dropdowns
                document.addEventListener('click', () => {
                    document.querySelectorAll('.punch-actions-dropdown').forEach(d => d.classList.remove('show'));
                });

                // Registra cliques de edição de ponto
                domHomePunchesList.querySelectorAll('.punch-actions-item.edit').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const pid = btn.getAttribute('data-id');
                        const punch = todayPunches.find(x => x.id === pid);
                        if (punch) openEditPunchModal(punch);
                    });
                });

                // Registra cliques de exclusão de ponto
                domHomePunchesList.querySelectorAll('.punch-actions-item.delete').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const pid = btn.getAttribute('data-id');
                        showConfirmModal("Excluir Ponto", "Deseja realmente excluir este registro de ponto?", async () => {
                            try {
                                await window.dbService.deletePunch(pid);
                                showToast("Ponto marcado para exclusão.");
                                renderHome();
                                window.syncService.triggerAutoSync();
                            } catch (err) {
                                showToast(err);
                            }
                        });
                    });
                });

                // Cálculo diário considerando abonos
                const standardJourney = state.currentUser.journey;
                const result = calculateDayWorkedAndExpected(todayPunches, todayAbono, standardJourney);
                const workedToday = result.workedMinutes;
                const balanceToday = result.balance;

                domHomeDayWorked.textContent = formatMinutesToHoursText(workedToday);
                domHomeDayBalance.textContent = formatBalanceText(balanceToday, true);
                
                // Formatação de cores do saldo diário
                domHomeDayBalance.className = 'summary-value ' + (balanceToday >= 0 ? 'positive' : 'negative');
                
                domHomeDaySummary.classList.remove('hidden');
            }

            // ====================================================
            // CÁLCULO E RENDERIZAÇÃO DO BANCO DE HORAS ACUMULADO DO MÊS
            // ====================================================
            const totalBalance = renderHomeMonthSummary(allPunches, allAbonos);

            // Inicia simulação de batida "agora"
            startSimulation(todayPunches, totalBalance, todayAbono);

        } catch (e) {
            console.error("Erro ao carregar dados da Home:", e);
            showToast("Erro ao carregar registros do dia.");
        }
    }

    /**
     * Calcula o banco de horas acumulado do mês e atualiza os elementos visuais na Home.
     */
    function renderHomeMonthSummary(allPunches, allAbonos) {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth(); // 0-indexed

        // Agrupar todos os pontos por dia local (geral, de todo o histórico)
        const punchesByDay = new Map();
        allPunches.forEach(p => {
            if (!p) return;
            const pDateStr = new Date(p.timestamp).toLocaleDateString('pt-BR');
            if (!punchesByDay.has(pDateStr)) {
                punchesByDay.set(pDateStr, []);
            }
            punchesByDay.get(pDateStr).push(p);
        });

        // Agrupar abonos por dia local
        const abonosByDay = new Map();
        allAbonos.forEach(a => {
            if (!a) return;
            const aDateStr = new Date(a.timestamp).toLocaleDateString('pt-BR');
            abonosByDay.set(aDateStr, a);
        });

        // Encontrar todos os dias únicos com ponto ou abono
        const allDays = new Set([...punchesByDay.keys(), ...abonosByDay.keys()]);

        let totalBalance = 0;
        let monthWorked = 0;
        let monthExpected = 0;

        allDays.forEach(dayDateStr => {
            const [d, m, y] = dayDateStr.split('/').map(Number);
            const isCurrentMonth = (y === currentYear && (m - 1) === currentMonth);

            const dayPunches = punchesByDay.get(dayDateStr) || [];
            dayPunches.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            
            const dayAbono = abonosByDay.get(dayDateStr);
            const standardJourney = state.currentUser.journey;
            
            const result = calculateDayWorkedAndExpected(dayPunches, dayAbono, standardJourney);

            totalBalance += result.balance;

            if (isCurrentMonth) {
                monthWorked += result.workedMinutes;
                monthExpected += result.expectedJourney;
            }
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
            const pct = monthExpected > 0 ? Math.min(100, Math.round((monthWorked / monthExpected) * 100)) : 50;
            domHomeMonthProgress.style.width = `${pct}%`;
        } else {
            domHomeMonthBalance.className = 'metric-value';
            domHomeMonthTrend.className = 'metric-trend-indicator neutral';
            domHomeMonthTrend.textContent = 'Estável';
            
            domHomeMonthProgress.className = 'progress-bar-fill';
            domHomeMonthProgress.style.width = '50%';
        }
        return totalBalance;
    }

    /**
     * Inicia a simulação do saldo diário e mensal atualizados a cada segundo
     */
    function startSimulation(todayPunches, totalBalance, todayAbono) {
        if (state.simulationInterval) {
            clearInterval(state.simulationInterval);
            state.simulationInterval = null;
        }

        const isWorking = todayPunches.length % 2 !== 0;
        const domMonthSimulated = document.getElementById('home-month-simulated');
        const domDaySimulated = document.getElementById('home-day-simulated');

        if (!isWorking || !state.currentUser) {
            if (domMonthSimulated) domMonthSimulated.classList.add('hidden');
            if (domDaySimulated) domDaySimulated.classList.add('hidden');
            return;
        }

        if (domMonthSimulated) domMonthSimulated.classList.remove('hidden');
        if (domDaySimulated) domDaySimulated.classList.remove('hidden');

        const journeyMinutes = state.currentUser.journey;

        // Pré-calculo estático dos outros dias do mês em segundos
        const todayResult = calculateDayWorkedAndExpected(todayPunches, todayAbono, journeyMinutes);
        const currentDayBalanceMin = todayResult.balance;
        const otherDaysBalanceMin = totalBalance - currentDayBalanceMin;
        const otherDaysBalanceSec = otherDaysBalanceMin * 60;

        function update() {
            const sim = calculateSimulatedSeconds(todayPunches, todayAbono, journeyMinutes);
            const simulatedDayBalanceSec = sim.balanceSeconds;
            const simulatedTotalBalanceSec = otherDaysBalanceSec + simulatedDayBalanceSec;

            // Atualiza chip de simulação do dia
            if (domDaySimulated) {
                domDaySimulated.innerHTML = `
                    <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" class="timer-icon"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    Se bater agora: ${formatSimulatedBalanceText(simulatedDayBalanceSec)}
                `;
                domDaySimulated.className = 'simulation-chip ' + (simulatedDayBalanceSec >= 0 ? 'positive' : 'negative');
            }

            // Atualiza chip de simulação do mês
            if (domMonthSimulated) {
                domMonthSimulated.innerHTML = `
                    <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" class="timer-icon"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    Projeção se bater agora: ${formatSimulatedBalanceText(simulatedTotalBalanceSec)}
                `;
                domMonthSimulated.className = 'simulation-chip ' + (simulatedTotalBalanceSec >= 0 ? 'positive' : 'negative');
            }
        }

        update();
        state.simulationInterval = setInterval(update, 1000);
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
            const allPunchesRaw = await window.dbService.getPunches(username);
            
            // Separa batidas de abonos
            const monthPunches = allPunchesRaw.filter(p => {
                const d = new Date(p.timestamp);
                return d.getFullYear() === year && d.getMonth() === month && !p.isAbono;
            });
            const monthAbonos = allPunchesRaw.filter(p => {
                const d = new Date(p.timestamp);
                return d.getFullYear() === year && d.getMonth() === month && p.isAbono && !p.deleted;
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

                // Busca abono do dia
                const dayAbono = monthAbonos.find(a => new Date(a.timestamp).getDate() === day);

                let punchesText = '';
                let workedMin = 0;
                let balanceMin = 0;
                let hasPhotos = false;

                const standardJourney = state.currentUser.journey;
                const result = calculateDayWorkedAndExpected(dayPunches, dayAbono, standardJourney);
                workedMin = result.workedMinutes;
                const expectedMin = result.expectedJourney;
                balanceMin = result.balance;

                if (dayPunches.length > 0) {
                    daysWorkedCount++;
                }

                if (dayPunches.length > 0 || dayAbono) {
                    // Horários formatados: "08:00 • 12:00 • 13:00 • 17:00"
                    punchesText = dayPunches.map(p => {
                        if (p.photo) hasPhotos = true;
                        return new Date(p.timestamp).toLocaleTimeString('pt-BR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                        });
                    }).join(' • ');

                    totalWorkedMinutes += workedMin;
                    totalExpectedMinutes += expectedMin;
                    totalBalanceMinutes += balanceMin;
                }

                // Cria elemento de linha do dia
                const row = document.createElement('div');
                
                let abonoClass = '';
                let abonoIndicatorHtml = '';
                if (dayAbono) {
                    if (dayAbono.photo) hasPhotos = true;
                    if (dayAbono.abonoType === 'day') {
                        abonoClass = ' abonado-dia';
                        abonoIndicatorHtml = `<div class="day-row-abono-indicator dia">Abonado: ${dayAbono.reason}</div>`;
                    } else if (dayAbono.abonoType === 'period') {
                        abonoClass = ' abonado-periodo';
                        abonoIndicatorHtml = `<div class="day-row-abono-indicator periodo">Abono: ${dayAbono.abonoStart}-${dayAbono.abonoEnd} (${dayAbono.reason})</div>`;
                    }
                }
                
                row.className = `day-row glass ${isWeekend ? 'weekend' : ''}${abonoClass}`;

                // Renderização das informações do dia
                let balanceHtml = '';
                if (dayPunches.length > 0 || dayAbono) {
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
                            <span class="punches-list-text">${punchesText || (dayAbono && dayAbono.abonoType === 'day' ? 'Abono Integral' : '')}</span>
                            ${dayPunches.length > 0 || (dayAbono && dayAbono.abonoType === 'period') ? `<span class="day-worked-time">Trabalhado: ${formatMinutesToHoursText(workedMin)}</span>` : ''}
                            ${abonoIndicatorHtml}
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
                    <div class="album-scroll-wrapper">
                        <button class="scroll-btn scroll-prev hidden" aria-label="Anterior">
                            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                        </button>
                        <div class="album-photos-grid" id="album-grid-day-${day}">
                            <!-- Fotos serão inseridas aqui -->
                        </div>
                        <button class="scroll-btn scroll-next hidden" aria-label="Próximo">
                            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </button>
                    </div>
                `;

                domAlbumDaysContainer.appendChild(rowSection);

                const grid = document.getElementById(`album-grid-day-${day}`);
                const btnPrev = rowSection.querySelector('.scroll-prev');
                const btnNext = rowSection.querySelector('.scroll-next');

                dayPunches.forEach(punch => {
                    const timeStr = new Date(punch.timestamp).toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    });

                    const isAbono = punch.isAbono;
                    const labelStr = isAbono ? `Abono [${punch.reason}]` : timeStr;
                    const altStr = isAbono ? `Dia ${day} - Abono [${punch.reason}]` : `Dia ${day} - Ponto ${timeStr}`;

                    const wrapper = document.createElement('div');
                    wrapper.className = 'album-photo-wrapper';
                    wrapper.innerHTML = `
                        <img src="${punch.photo}" alt="${altStr}">
                        <div class="album-photo-time" style="${isAbono ? 'font-size: 9px; line-height: 1.2; padding: 2px 4px; background: rgba(16, 185, 129, 0.85); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;' : ''}">${labelStr}</div>
                    `;

                    wrapper.addEventListener('click', () => {
                        openLightbox(punch);
                    });

                    grid.appendChild(wrapper);
                });

                // Configura as setas e o drag
                setupScrollContainer(grid, btnPrev, btnNext);
            });

        } catch (e) {
            console.error("Erro ao renderizar Álbum:", e);
            showToast("Erro ao carregar álbum de comprovantes.");
        }
    }

    /**
     * Gerencia a rolagem horizontal via botões de setas
     */
    function setupScrollContainer(grid, btnPrev, btnNext) {
        function updateArrows() {
            const scrollLeft = grid.scrollLeft;
            const maxScroll = grid.scrollWidth - grid.clientWidth;

            if (scrollLeft > 2) {
                btnPrev.classList.remove('hidden');
            } else {
                btnPrev.classList.add('hidden');
            }

            if (scrollLeft < maxScroll - 2) {
                btnNext.classList.remove('hidden');
            } else {
                btnNext.classList.add('hidden');
            }
        }

        btnPrev.addEventListener('click', () => {
            grid.scrollBy({ left: -200, behavior: 'smooth' });
        });

        btnNext.addEventListener('click', () => {
            grid.scrollBy({ left: 200, behavior: 'smooth' });
        });

        grid.addEventListener('scroll', updateArrows);
        
        // Pequeno timeout para esperar o DOM renderizar completamente
        setTimeout(updateArrows, 100);
        
        // Evita vazamento de memória usando ResizeObserver em vez de event listener na window
        const resizeObserver = new ResizeObserver(() => {
            updateArrows();
        });
        resizeObserver.observe(grid);
        
        enableDragScroll(grid, updateArrows);
    }

    /**
     * Habilita a rolagem ao arrastar o mouse (drag scroll)
     */
    function enableDragScroll(element, onScrollCallback) {
        let isDown = false;
        let startX;
        let scrollLeft;
        let moved = false;

        element.addEventListener('mousedown', (e) => {
            isDown = true;
            moved = false;
            startX = e.pageX - element.offsetLeft;
            scrollLeft = element.scrollLeft;
        });

        element.addEventListener('mouseleave', () => {
            isDown = false;
        });

        element.addEventListener('mouseup', () => {
            isDown = false;
        });

        element.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - element.offsetLeft;
            const walk = (x - startX) * 1.5;
            if (Math.abs(x - startX) > 5) {
                moved = true;
            }
            element.scrollLeft = scrollLeft - walk;
            if (onScrollCallback) onScrollCallback();
        });

        element.addEventListener('click', (e) => {
            if (moved) {
                e.preventDefault();
                e.stopPropagation();
            }
        }, true);
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
            if (state.simulationInterval) {
                clearInterval(state.simulationInterval);
                state.simulationInterval = null;
            }
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
        state.editingPunchId = null;
        document.querySelector('#punch-modal h3').textContent = 'Registrar Novo Ponto';
    }

    function openEditPunchModal(punch) {
        state.editingPunchId = punch.id;
        state.currentPunchPhoto = punch.photo;
        
        // Atualiza título do modal
        document.querySelector('#punch-modal h3').textContent = 'Editar Ponto';
        
        // Define data e hora no formato "YYYY-MM-DDTHH:MM" no fuso local
        const date = new Date(punch.timestamp);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hour = String(date.getHours()).padStart(2, '0');
        const minute = String(date.getMinutes()).padStart(2, '0');
        domPunchDatetime.value = `${year}-${month}-${day}T${hour}:${minute}`;
        
        // Mostra foto se houver
        if (punch.photo) {
            domUploadPreviewImg.src = punch.photo;
            domUploadPreviewInfo.textContent = "comprovante.jpg";
            domUploadPreviewContainer.classList.remove('hidden');
        } else {
            clearPunchPhotoSelection();
        }
        
        domPunchModal.classList.remove('hidden');
    }

    function showConfirmModal(title, message, onYes, onNo = null) {
        domConfirmTitle.textContent = title;
        domConfirmMessage.textContent = message;
        domConfirmModal.classList.remove('hidden');
        
        // Remove listeners antigos clonando os botões
        const newYes = domBtnConfirmYes.cloneNode(true);
        const newNo = domBtnConfirmNo.cloneNode(true);
        
        domBtnConfirmYes.parentNode.replaceChild(newYes, domBtnConfirmYes);
        domBtnConfirmNo.parentNode.replaceChild(newNo, domBtnConfirmNo);
        
        // Adiciona listeners aos novos botões
        newYes.addEventListener('click', () => {
            domConfirmModal.classList.add('hidden');
            if (onYes) onYes();
        });
        
        newNo.addEventListener('click', () => {
            domConfirmModal.classList.add('hidden');
            if (onNo) onNo();
        });
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

        if (state.editingPunchId) {
            newPunch.id = state.editingPunchId;
        }

        try {
            await window.dbService.savePunch(newPunch);
            showToast(state.editingPunchId ? "Ponto atualizado com sucesso!" : "Ponto registrado com sucesso!");
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

        if (punch.isAbono) {
            const abonoDesc = punch.abonoType === 'day' 
                ? 'Abono Integral' 
                : `Abono Período (${punch.abonoStart} - ${punch.abonoEnd})`;
            domLightboxTime.textContent = `${abonoDesc} [${punch.reason}]`;
        } else {
            domLightboxTime.textContent = "Batida de ponto às " + dateObj.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }

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
     * Calcula o tempo trabalhado, a jornada esperada e o saldo do dia considerando abonos.
     */
    function calculateDayWorkedAndExpected(dayPunches, dayAbono, standardJourney) {
        if (dayAbono) {
            if (dayAbono.abonoType === 'day') {
                return {
                    workedMinutes: 0,
                    expectedJourney: 0,
                    balance: 0
                };
            } else if (dayAbono.abonoType === 'period') {
                const [sh, sm] = dayAbono.abonoStart.split(':').map(Number);
                const abStartMin = sh * 60 + sm;
                const [eh, em] = dayAbono.abonoEnd.split(':').map(Number);
                const abEndMin = eh * 60 + em;
                const abonoDuration = Math.max(0, abEndMin - abStartMin);
                
                const expectedJourney = Math.max(0, standardJourney - abonoDuration);
                
                // Calcula as horas trabalhadas descontando as faixas coincidentes com o abono
                let workedMinutes = 0;
                const sorted = [...dayPunches].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                for (let i = 0; i < sorted.length - 1; i += 2) {
                    const start = new Date(sorted[i].timestamp);
                    const end = new Date(sorted[i+1].timestamp);
                    
                    const wStartMin = start.getHours() * 60 + start.getMinutes();
                    const wEndMin = end.getHours() * 60 + end.getMinutes();
                    
                    const duration = wEndMin - wStartMin;
                    if (duration > 0) {
                        const overlapStart = Math.max(wStartMin, abStartMin);
                        const overlapEnd = Math.min(wEndMin, abEndMin);
                        const overlap = Math.max(0, overlapEnd - overlapStart);
                        workedMinutes += (duration - overlap);
                    }
                }
                
                return {
                    workedMinutes,
                    expectedJourney,
                    balance: workedMinutes - expectedJourney
                };
            }
        }
        
        // Sem abono
        const workedMinutes = calculateWorkedMinutes(dayPunches);
        return {
            workedMinutes,
            expectedJourney: standardJourney,
            balance: workedMinutes - standardJourney
        };
    }

    /**
     * Calcula o saldo simulado em segundos considerando abonos.
     */
    function calculateSimulatedSeconds(todayPunches, todayAbono, journeyMinutes) {
        const now = new Date();
        const simulatedPunches = [...todayPunches];
        if (todayPunches.length % 2 !== 0) {
            simulatedPunches.push({ timestamp: now.toISOString() });
        }
        
        let expectedSeconds = journeyMinutes * 60;
        let workedSeconds = 0;
        
        if (todayAbono) {
            if (todayAbono.abonoType === 'day') {
                return {
                    workedSeconds: 0,
                    expectedSeconds: 0,
                    balanceSeconds: 0
                };
            } else if (todayAbono.abonoType === 'period') {
                const [sh, sm] = todayAbono.abonoStart.split(':').map(Number);
                const abStartSec = (sh * 60 + sm) * 60;
                const [eh, em] = todayAbono.abonoEnd.split(':').map(Number);
                const abEndSec = (eh * 60 + em) * 60;
                const abonoDurationSec = Math.max(0, abEndSec - abStartSec);
                
                expectedSeconds = Math.max(0, (journeyMinutes * 60) - abonoDurationSec);
                
                const sorted = [...simulatedPunches].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                for (let i = 0; i < sorted.length - 1; i += 2) {
                    const start = new Date(sorted[i].timestamp);
                    const end = new Date(sorted[i+1].timestamp);
                    
                    const wStartSec = (start.getHours() * 3600) + (start.getMinutes() * 60) + start.getSeconds();
                    const wEndSec = (end.getHours() * 3600) + (end.getMinutes() * 60) + end.getSeconds();
                    
                    const duration = wEndSec - wStartSec;
                    if (duration > 0) {
                        const overlapStart = Math.max(wStartSec, abStartSec);
                        const overlapEnd = Math.min(wEndSec, abEndSec);
                        const overlap = Math.max(0, overlapEnd - overlapStart);
                        workedSeconds += (duration - overlap);
                    }
                }
                
                return {
                    workedSeconds,
                    expectedSeconds,
                    balanceSeconds: workedSeconds - expectedSeconds
                };
            }
        }
        
        // Sem abono
        const sorted = [...simulatedPunches].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        for (let i = 0; i < sorted.length - 1; i += 2) {
            const start = new Date(sorted[i].timestamp);
            const end = new Date(sorted[i+1].timestamp);
            const diffMs = end - start;
            if (diffMs > 0) {
                workedSeconds += Math.floor(diffMs / 1000);
            }
        }
        
        return {
            workedSeconds,
            expectedSeconds,
            balanceSeconds: workedSeconds - expectedSeconds
        };
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
     * Calcula o total de segundos trabalhados no dia com base nas batidas de ponto.
     */
    function calculateWorkedSeconds(punches) {
        let totalSeconds = 0;
        
        // Garante ordenação cronológica
        const sorted = [...punches].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        // Calcula a duração entre pares ordenados: (P1 a P2), (P3 a P4), etc.
        for (let i = 0; i < sorted.length - 1; i += 2) {
            const start = new Date(sorted[i].timestamp);
            const end = new Date(sorted[i+1].timestamp);
            const diffMs = end - start;
            if (diffMs > 0) {
                totalSeconds += Math.floor(diffMs / 1000);
            }
        }

        return totalSeconds;
    }

    /**
     * Converte segundos em formato amigável de horas "XXh YYm ZZs"
     */
    function formatSecondsToHoursText(totalSeconds) {
        const absSeconds = Math.abs(totalSeconds);
        const hrs = String(Math.floor(absSeconds / 3600)).padStart(2, '0');
        const mins = String(Math.floor((absSeconds % 3600) / 60)).padStart(2, '0');
        const secs = String(absSeconds % 60).padStart(2, '0');
        return `${hrs}h ${mins}m ${secs}s`;
    }

    /**
     * Formata um saldo de segundos positivo ou negativo com sinal de +/-
     */
    function formatSimulatedBalanceText(balanceSeconds) {
        const formatted = formatSecondsToHoursText(balanceSeconds);
        if (balanceSeconds > 0) {
            return `+${formatted}`;
        } else if (balanceSeconds < 0) {
            return `-${formatted}`;
        }
        return formatted;
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

    function updateCropViewportSize(width, height) {
        domCropViewport.style.width = `${width}px`;
        domCropViewport.style.height = `${height}px`;
        domCropWidthSlider.value = width;
        domCropHeightSlider.value = height;
        domCropWidthVal.textContent = `${width}px`;
        domCropHeightVal.textContent = `${height}px`;
        
        // Destaca a predefinição ativa
        domBtnCropPresets.forEach(btn => {
            const btnW = parseInt(btn.getAttribute('data-width'));
            const btnH = parseInt(btn.getAttribute('data-height'));
            if (btnW === width && btnH === height) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    function openCropModal(originalPhotoBase64, onConfirmCallback) {
        cropState.originalSrc = originalPhotoBase64;
        cropState.targetCallback = onConfirmCallback;
        cropState.scale = 1;
        cropState.x = 0;
        cropState.y = 0;
        
        domCropImage.src = originalPhotoBase64;
        domCropZoomSlider.value = 1;
        domCropImage.style.transform = `translate(0px, 0px) scale(1)`;
        
        // Reinicializa o viewport para o tamanho padrão (260x340)
        updateCropViewportSize(260, 340);
        
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

    function rotateBase64(base64Str, degrees) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = base64Str;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                if (Math.abs(degrees) === 90 || Math.abs(degrees) === 270) {
                    canvas.width = img.height;
                    canvas.height = img.width;
                } else {
                    canvas.width = img.width;
                    canvas.height = img.height;
                }
                
                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.rotate((degrees * Math.PI) / 180);
                ctx.drawImage(img, -img.width / 2, -img.height / 2);
                
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.onerror = (e) => reject(e);
        });
    }

    if (domBtnRotateLeft) {
        domBtnRotateLeft.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (!cropState.originalSrc) return;
            showToast("Rotacionando...");
            try {
                const rotated = await rotateBase64(cropState.originalSrc, -90);
                cropState.originalSrc = rotated;
                domCropImage.src = rotated;
                cropState.scale = 1;
                cropState.x = 0;
                cropState.y = 0;
                domCropZoomSlider.value = 1;
                domCropImage.style.transform = `translate(0px, 0px) scale(1)`;
            } catch (err) {
                console.error("Erro ao rotacionar imagem:", err);
                showToast("Erro ao rotacionar imagem.");
            }
        });
    }

    if (domBtnRotateRight) {
        domBtnRotateRight.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (!cropState.originalSrc) return;
            showToast("Rotacionando...");
            try {
                const rotated = await rotateBase64(cropState.originalSrc, 90);
                cropState.originalSrc = rotated;
                domCropImage.src = rotated;
                cropState.scale = 1;
                cropState.x = 0;
                cropState.y = 0;
                domCropZoomSlider.value = 1;
                domCropImage.style.transform = `translate(0px, 0px) scale(1)`;
            } catch (err) {
                console.error("Erro ao rotacionar imagem:", err);
                showToast("Erro ao rotacionar imagem.");
            }
        });
    }

    // Controles de Largura e Altura Dinâmicos
    domCropWidthSlider.addEventListener('input', (e) => {
        const w = parseInt(e.target.value);
        const h = parseInt(domCropHeightSlider.value);
        updateCropViewportSize(w, h);
    });

    domCropHeightSlider.addEventListener('input', (e) => {
        const w = parseInt(domCropWidthSlider.value);
        const h = parseInt(e.target.value);
        updateCropViewportSize(w, h);
    });

    // Presets Rápidos
    domBtnCropPresets.forEach(btn => {
        btn.addEventListener('click', () => {
            const w = parseInt(btn.getAttribute('data-width'));
            const h = parseInt(btn.getAttribute('data-height'));
            updateCropViewportSize(w, h);
        });
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

            // Calcula proporção e limita a dimensão máxima em 800px para otimização
            let targetW = cropW;
            let targetH = cropH;
            const MAX_DIM = 800;
            
            if (targetW > MAX_DIM || targetH > MAX_DIM) {
                if (targetW > targetH) {
                    targetH = (targetH / targetW) * MAX_DIM;
                    targetW = MAX_DIM;
                } else {
                    targetW = (targetW / targetH) * MAX_DIM;
                    targetH = MAX_DIM;
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = Math.round(targetW);
            canvas.height = Math.round(targetH);
            
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

    async function openEditDayModal(dateObj, punches) {
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
        
        const dateStr = dateObj.toLocaleDateString('pt-BR');
        
        // Carrega abono do dia
        const username = state.currentUser.username;
        const allPunchesRaw = await window.dbService.getPunches(username);
        const dayAbono = allPunchesRaw.find(p => p.isAbono && !p.deleted && new Date(p.timestamp).toLocaleDateString('pt-BR') === dateStr);
        
        let abonoContainer = document.getElementById('edit-abono-status-container');
        if (!abonoContainer) {
            abonoContainer = document.createElement('div');
            abonoContainer.id = 'edit-abono-status-container';
            domEditPunchesContainer.parentNode.insertBefore(abonoContainer, domEditPunchesContainer);
        }
        
        if (dayAbono) {
            const desc = dayAbono.abonoType === 'day' 
                ? 'Dia Inteiro' 
                : `Período (${dayAbono.abonoStart} - ${dayAbono.abonoEnd})`;
            abonoContainer.innerHTML = `
                <div class="edit-abono-section" style="margin-bottom: 16px; padding: 12px; border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <span class="badge-abono ${dayAbono.abonoType === 'period' ? 'period' : ''}">${desc}</span>
                            <div style="font-size: 13px; font-weight: 600; margin-top: 4px; color: var(--text-primary);">${dayAbono.reason}</div>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button type="button" class="btn btn-outline btn-small" id="btn-edit-day-abono" style="padding: 6px 10px; font-size: 11px;">Editar</button>
                            <button type="button" class="btn btn-danger btn-small" id="btn-delete-day-abono" style="padding: 6px 10px; font-size: 11px;">Remover</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('btn-edit-day-abono').addEventListener('click', () => {
                closeEditDayModal();
                openAbonoModal(dayAbono);
            });
            
            document.getElementById('btn-delete-day-abono').addEventListener('click', () => {
                showConfirmModal("Remover Abono", "Deseja realmente remover o abono deste dia?", async () => {
                    try {
                        await window.dbService.deletePunch(dayAbono.id);
                        showToast("Abono removido com sucesso.");
                        closeEditDayModal();
                        renderActiveView();
                        window.syncService.triggerAutoSync();
                    } catch (err) {
                        showToast("Erro ao remover abono: " + err);
                    }
                });
            });
        } else {
            abonoContainer.innerHTML = `
                <div class="edit-abono-section" style="margin-bottom: 16px; padding: 12px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 12px; color: var(--text-secondary);">Sem abono registrado para este dia.</span>
                    <button type="button" class="btn btn-outline-success btn-small" id="btn-add-day-abono" style="padding: 6px 10px; font-size: 11px;">+ Add Abono</button>
                </div>
            `;
            
            document.getElementById('btn-add-day-abono').addEventListener('click', () => {
                closeEditDayModal();
                openAbonoModal(null);
                
                // Define a data no modal de abono para o dia selecionado
                const y = dateObj.getFullYear();
                const m = String(dateObj.getMonth() + 1).padStart(2, '0');
                const d = String(dateObj.getDate()).padStart(2, '0');
                domAbonoDate.value = `${y}-${m}-${d}`;
            });
        }
        
        renderEditingPunches();
        domEditPunchesContainer.scrollTop = 0;
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

    // ==========================================================================
    // SEÇÃO DE GESTÃO DE ABONOS
    // ==========================================================================

    // Controles de alteração de mês de abonos
    domAbonosPrevMonth.addEventListener('click', () => {
        state.abonosMonth.setMonth(state.abonosMonth.getMonth() - 1);
        renderAbonos();
    });

    domAbonosNextMonth.addEventListener('click', () => {
        state.abonosMonth.setMonth(state.abonosMonth.getMonth() + 1);
        renderAbonos();
    });

    // Abrir modal de novo abono
    domBtnAddAbonoTrigger.addEventListener('click', () => {
        openAbonoModal(null);
    });

    domBtnCloseAbonoModal.addEventListener('click', closeAbonoModal);
    domBtnCancelAbono.addEventListener('click', closeAbonoModal);

    // Alternar campos de período
    domAbonoType.addEventListener('change', () => {
        if (domAbonoType.value === 'period') {
            domAbonoPeriodFields.classList.remove('hidden');
        } else {
            domAbonoPeriodFields.classList.add('hidden');
        }
    });

    // Upload de comprovante de abono
    domAbonoImageUploadTrigger.addEventListener('click', (e) => {
        if (e.target.closest('#btn-abono-remove-photo') || e.target.closest('#btn-crop-photo-abono')) return;
        domAbonoCameraInput.click();
    });

    domBtnAbonoTriggerCamera.addEventListener('click', () => domAbonoCameraInput.click());
    domBtnAbonoTriggerGallery.addEventListener('click', () => domAbonoPhotoInput.click());

    domAbonoPhotoInput.addEventListener('change', handleAbonoFileSelection);
    domAbonoCameraInput.addEventListener('change', handleAbonoFileSelection);

    async function handleAbonoFileSelection(e) {
        const file = e.target.files[0];
        if (!file) return;
        showToast("Processando foto...");
        try {
            const base64Data = await window.cameraService.resizeAndCompress(file, 800, 800, 0.7);
            state.currentAbonoPhoto = base64Data;
            domAbonoUploadPreviewImg.src = base64Data;
            const sizeKB = Math.round((base64Data.length * 3) / 4 / 1024);
            domAbonoUploadPreviewInfo.textContent = `Atestado - ~${sizeKB}KB`;
            domAbonoUploadPlaceholder.classList.add('hidden');
            domAbonoUploadPreviewContainer.classList.remove('hidden');
            showToast("Atestado anexado com sucesso!");
        } catch (err) {
            console.error("Erro ao comprimir imagem:", err);
            showToast("Erro ao processar imagem: " + err);
            clearAbonoPhotoSelection();
        }
    }

    domBtnAbonoRemovePhoto.addEventListener('click', (e) => {
        e.stopPropagation();
        clearAbonoPhotoSelection();
    });

    function clearAbonoPhotoSelection() {
        state.currentAbonoPhoto = null;
        domAbonoPhotoInput.value = '';
        domAbonoCameraInput.value = '';
        domAbonoUploadPreviewContainer.classList.add('hidden');
        domAbonoUploadPreviewImg.src = '';
        domAbonoUploadPlaceholder.classList.remove('hidden');
    }

    // Recortar foto do abono
    domBtnCropPhotoAbono.addEventListener('click', (e) => {
        e.stopPropagation();
        if (state.currentAbonoPhoto) {
            openCropModal(state.currentAbonoPhoto, (croppedBase64) => {
                state.currentAbonoPhoto = croppedBase64;
                domAbonoUploadPreviewImg.src = croppedBase64;
                const sizeKB = Math.round((croppedBase64.length * 3) / 4 / 1024);
                domAbonoUploadPreviewInfo.textContent = `Atestado (recortado) - ~${sizeKB}KB`;
                showToast("Foto recortada com sucesso!");
            });
        }
    });

    function updateRecurrenceOptionText() {
        const dateVal = domAbonoDate.value;
        if (!dateVal) return;
        const [y, m, d] = dateVal.split('-').map(Number);
        const dateObj = new Date(y, m - 1, d, 12, 0, 0);
        const weekdayStr = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' });
        const capitalizedWeekday = weekdayStr.charAt(0).toUpperCase() + weekdayStr.slice(1);
        
        const weeklyOption = domAbonoRecurrence.querySelector('option[value="weekly"]');
        if (weeklyOption) {
            weeklyOption.textContent = `Semanalmente (toda ${capitalizedWeekday})`;
        }
    }

    function getRecurrenceDates(startDateStr, endDateStr, type) {
        const dates = [];
        const start = new Date(startDateStr + 'T12:00:00');
        const end = new Date(endDateStr + 'T12:00:00');
        
        let current = new Date(start);
        const startDayOfWeek = start.getDay();
        
        while (current <= end) {
            let match = false;
            if (type === 'weekly') {
                match = current.getDay() === startDayOfWeek;
            } else if (type === 'weekdays') {
                const day = current.getDay();
                match = day >= 1 && day <= 5;
            } else if (type === 'daily') {
                match = true;
            }
            
            if (match) {
                dates.push(new Date(current));
            }
            current.setDate(current.getDate() + 1);
        }
        return dates;
    }

    domAbonoDate.addEventListener('change', updateRecurrenceOptionText);
    
    domAbonoRecurrence.addEventListener('change', () => {
        if (domAbonoRecurrence.value !== 'none') {
            domAbonoRecurrenceEndGroup.classList.remove('hidden');
        } else {
            domAbonoRecurrenceEndGroup.classList.add('hidden');
        }
    });

    // Salvar Abono
    domAbonoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const dateStr = domAbonoDate.value;
        const reason = domAbonoReason.value;
        const type = domAbonoType.value;
        const startTime = domAbonoStartTime.value;
        const endTime = domAbonoEndTime.value;
        const recurrence = domAbonoRecurrence.value;
        const recurrenceEnd = domAbonoRecurrenceEnd.value;

        if (!dateStr || !reason) {
            showToast("Preencha a data e o motivo.");
            return;
        }

        // Se for gravação com recorrência (apenas para novos registros)
        if (!domAbonoId.value && recurrence !== 'none') {
            if (!recurrenceEnd) {
                showToast("Preencha a data limite para a repetição.");
                return;
            }
            
            const dates = getRecurrenceDates(dateStr, recurrenceEnd, recurrence);
            if (dates.length === 0) {
                showToast("Nenhuma data encontrada no período selecionado.");
                return;
            }

            try {
                for (const d of dates) {
                    const id = 'abono_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
                    const cleanAbono = {
                        id: id,
                        username: state.currentUser.username,
                        timestamp: d.toISOString(),
                        isAbono: true,
                        abonoType: type,
                        abonoStart: type === 'period' ? startTime : null,
                        abonoEnd: type === 'period' ? endTime : null,
                        reason: reason,
                        photo: state.currentAbonoPhoto,
                        synced: false,
                        deleted: false
                    };
                    await window.dbService.savePunch(cleanAbono);
                }
                showToast(`${dates.length} abonos gravados com sucesso!`);
                closeAbonoModal();
                renderAbonos();
                window.syncService.triggerAutoSync();
            } catch (err) {
                showToast("Erro ao gravar abonos recorrentes: " + err);
            }
        } else {
            // Criar objeto Date no meio do dia para evitar problemas de fuso
            const [year, month, day] = dateStr.split('-').map(Number);
            const dateObj = new Date(year, month - 1, day, 12, 0, 0);

            const id = domAbonoId.value || 'abono_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

            const cleanAbono = {
                id: id,
                username: state.currentUser.username,
                timestamp: dateObj.toISOString(),
                isAbono: true,
                abonoType: type,
                abonoStart: type === 'period' ? startTime : null,
                abonoEnd: type === 'period' ? endTime : null,
                reason: reason,
                photo: state.currentAbonoPhoto,
                synced: false,
                deleted: false
            };

            try {
                await window.dbService.savePunch(cleanAbono);
                showToast(domAbonoId.value ? "Abono atualizado com sucesso!" : "Abono gravado com sucesso!");
                closeAbonoModal();
                renderAbonos();
                window.syncService.triggerAutoSync();
            } catch (err) {
                showToast("Erro ao gravar abono: " + err);
            }
        }
    });

    function openAbonoModal(abono = null) {
        if (!abono) {
            domAbonoModalTitle.textContent = "Lançar Novo Abono";
            domAbonoId.value = '';
            domAbonoForm.reset();
            
            // Prefill data com hoje
            const now = new Date();
            const y = now.getFullYear();
            const m = String(now.getMonth() + 1).padStart(2, '0');
            const d = String(now.getDate()).padStart(2, '0');
            domAbonoDate.value = `${y}-${m}-${d}`;
            
            domAbonoType.value = 'day';
            domAbonoPeriodFields.classList.add('hidden');
            
            // Configurações de recorrência
            domAbonoRecurrenceGroup.classList.remove('hidden');
            domAbonoRecurrence.value = 'none';
            domAbonoRecurrenceEndGroup.classList.add('hidden');
            // Data limite padrão: último dia do mês atual
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            const lastY = lastDay.getFullYear();
            const lastM = String(lastDay.getMonth() + 1).padStart(2, '0');
            const lastD = String(lastDay.getDate()).padStart(2, '0');
            domAbonoRecurrenceEnd.value = `${lastY}-${lastM}-${lastD}`;
            updateRecurrenceOptionText();
            
            clearAbonoPhotoSelection();
        } else {
            domAbonoModalTitle.textContent = "Editar Abono";
            domAbonoId.value = abono.id;
            domAbonoReason.value = abono.reason;
            
            const date = new Date(abono.timestamp);
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            domAbonoDate.value = `${y}-${m}-${d}`;
            
            domAbonoType.value = abono.abonoType;
            if (abono.abonoType === 'period') {
                domAbonoPeriodFields.classList.remove('hidden');
                domAbonoStartTime.value = abono.abonoStart || '13:00';
                domAbonoEndTime.value = abono.abonoEnd || '17:00';
            } else {
                domAbonoPeriodFields.classList.add('hidden');
            }
            
            // Esconde recorrência na edição
            domAbonoRecurrenceGroup.classList.add('hidden');
            domAbonoRecurrenceEndGroup.classList.add('hidden');
            
            if (abono.photo) {
                state.currentAbonoPhoto = abono.photo;
                domAbonoUploadPreviewImg.src = abono.photo;
                const sizeKB = Math.round((abono.photo.length * 3) / 4 / 1024);
                domAbonoUploadPreviewInfo.textContent = `Atestado - ~${sizeKB}KB`;
                domAbonoUploadPlaceholder.classList.add('hidden');
                domAbonoUploadPreviewContainer.classList.remove('hidden');
            } else {
                clearAbonoPhotoSelection();
            }
        }
        domAbonoModal.classList.remove('hidden');
    }

    function closeAbonoModal() {
        domAbonoModal.classList.add('hidden');
        clearAbonoPhotoSelection();
    }

    async function renderAbonos() {
        const username = state.currentUser.username;
        const year = state.abonosMonth.getFullYear();
        const month = state.abonosMonth.getMonth();

        domAbonosMonthLabel.textContent = state.abonosMonth.toLocaleDateString('pt-BR', { 
            month: 'long', 
            year: 'numeric' 
        });

        try {
            const allPunchesRaw = await window.dbService.getPunches(username);
            const abonos = allPunchesRaw.filter(p => p.isAbono && !p.deleted);
            
            // Filtrar abonos do mês
            const monthAbonos = abonos.filter(a => {
                const date = new Date(a.timestamp);
                return date.getFullYear() === year && date.getMonth() === month;
            });

            domAbonosListContainer.innerHTML = '';

            if (monthAbonos.length === 0) {
                domAbonosListContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">
                            <svg viewBox="0 0 24 24" width="36" height="36" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                        </div>
                        <p>Nenhum abono registrado neste mês.</p>
                        <span>Clique em "Novo Abono" para cadastrar.</span>
                    </div>
                `;
                return;
            }

            monthAbonos.forEach(a => {
                const date = new Date(a.timestamp);
                const day = String(date.getDate()).padStart(2, '0');
                const weekday = date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
                const photoHtml = a.photo ? `<img src="${a.photo}" class="abono-photo-thumb" data-id="${a.id}" alt="Atestado">` : '';
                const typeBadge = a.abonoType === 'day' 
                    ? `<span class="badge-abono">Dia Inteiro</span>` 
                    : `<span class="badge-abono period">Período (${a.abonoStart} - ${a.abonoEnd})</span>`;
                
                const card = document.createElement('div');
                card.className = 'abono-card glass';
                card.innerHTML = `
                    <div class="abono-info-left">
                        <div class="abono-date-badge">
                            <span class="abono-date-day">${day}</span>
                            <span class="abono-date-month">${weekday}</span>
                        </div>
                        <div class="abono-details">
                            <span class="abono-reason-title">${a.reason}</span>
                            <span class="abono-type-desc">${typeBadge}</span>
                        </div>
                    </div>
                    <div class="abono-card-right">
                        ${photoHtml}
                        <div class="punch-actions-menu">
                            <button class="btn-actions-punch" data-id="${a.id}" title="Ações">
                                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1.5"></circle><circle cx="12" cy="5" r="1.5"></circle><circle cx="12" cy="19" r="1.5"></circle></svg>
                            </button>
                            <div class="punch-actions-dropdown" id="dropdown-${a.id}">
                                <button type="button" class="punch-actions-item edit-abono" data-id="${a.id}">
                                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path></svg>
                                    Editar
                                </button>
                                <button type="button" class="punch-actions-item delete-abono" data-id="${a.id}">
                                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2 2v2"></path></svg>
                                    Excluir
                                </button>
                            </div>
                        </div>
                    </div>
                `;

                domAbonosListContainer.appendChild(card);
            });

            // Registrar cliques nas miniaturas para lightbox
            domAbonosListContainer.querySelectorAll('.abono-photo-thumb').forEach(thumb => {
                thumb.addEventListener('click', () => {
                    const id = thumb.getAttribute('data-id');
                    const abono = monthAbonos.find(x => x.id === id);
                    if (abono) {
                        domLightboxImg.src = abono.photo;
                        domLightboxDate.textContent = new Date(abono.timestamp).toLocaleDateString('pt-BR', {
                            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                        });
                        domLightboxTime.textContent = `Abono (${abono.reason})`;
                        domLightboxModal.classList.remove('hidden');
                    }
                });
            });

            // Registrar cliques de ações (toggle dropdown)
            domAbonosListContainer.querySelectorAll('.btn-actions-punch').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = btn.getAttribute('data-id');
                    const dropdown = document.getElementById(`dropdown-${id}`);
                    
                    document.querySelectorAll('.punch-actions-dropdown').forEach(d => {
                        if (d !== dropdown) d.classList.remove('show');
                    });
                    dropdown.classList.toggle('show');
                });
            });

            // Registrar clique em editar abono
            domAbonosListContainer.querySelectorAll('.punch-actions-item.edit-abono').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = btn.getAttribute('data-id');
                    const abono = monthAbonos.find(x => x.id === id);
                    if (abono) openAbonoModal(abono);
                });
            });

            // Registrar clique em excluir abono
            domAbonosListContainer.querySelectorAll('.punch-actions-item.delete-abono').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = btn.getAttribute('data-id');
                    showConfirmModal("Excluir Abono", "Deseja realmente excluir este abono?", async () => {
                        try {
                            await window.dbService.deletePunch(id);
                            showToast("Abono removido com sucesso.");
                            renderAbonos();
                            window.syncService.triggerAutoSync();
                        } catch (err) {
                            showToast("Erro ao excluir abono: " + err);
                        }
                    });
                });
            });

        } catch (err) {
            console.error("Erro ao renderizar abonos:", err);
            showToast("Erro ao carregar abonos.");
        }
    }

    // Ação de Exportar PDF de Comprovantes (Colmeia)
    domBtnExportPdf.addEventListener('click', async () => {
        if (!state.currentUser) return;
        
        showToast("Gerando relatório de comprovantes...");
        
        const username = state.currentUser.username;
        const year = state.selectedMonth.getFullYear();
        const month = state.selectedMonth.getMonth();
        
        try {
            const allPunchesRaw = await window.dbService.getPunches(username);
            
            // Filtra batidas e abonos deste mês que contenham foto e não estejam excluídos
            const photosList = allPunchesRaw.filter(p => {
                const d = new Date(p.timestamp);
                return d.getFullYear() === year && d.getMonth() === month && p.photo && !p.deleted;
            });
            
            if (photosList.length === 0) {
                showToast("Nenhum comprovante com foto este mês para exportar.");
                return;
            }
            
            // Ordena cronologicamente
            photosList.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            
            // Filtra separadamente os punches regulares para fins de numeração (Entrada 1, Saída 1 etc.)
            const monthPunches = allPunchesRaw.filter(p => {
                const d = new Date(p.timestamp);
                return d.getFullYear() === year && d.getMonth() === month && !p.isAbono && !p.deleted;
            });
            
            // Agrupa as fotos por dia
            const photosByDay = {};
            photosList.forEach(punch => {
                const date = new Date(punch.timestamp);
                const dayNum = date.getDate();
                if (!photosByDay[dayNum]) photosByDay[dayNum] = [];
                photosByDay[dayNum].push(punch);
            });
            
            // Ordena os dias
            const daysWithPhotos = Object.keys(photosByDay).map(Number).sort((a, b) => a - b);
            
            const monthName = state.selectedMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
            
            const rowsHtml = daysWithPhotos.map(day => {
                const dayPunchesWithPhotos = photosByDay[day];
                // Ordena cronologicamente dentro do dia
                dayPunchesWithPhotos.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                
                const dateObj = new Date(year, month, day);
                const weekdayName = dateObj.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
                const dayLabelStr = `Dia ${String(day).padStart(2, '0')} (${weekdayName})`;
                
                const cardsHtml = dayPunchesWithPhotos.map(punch => {
                    const punchDate = new Date(punch.timestamp);
                    
                    let cardClass = 'card';
                    let label = '';
                    let sublabel = '';
                    
                    if (punch.isAbono) {
                        cardClass += ' abono';
                        label = `Abono: ${punch.reason}`;
                        const abonoTime = punch.abonoType === 'day' ? 'Dia Inteiro' : `${punch.abonoStart} - ${punch.abonoEnd}`;
                        sublabel = abonoTime;
                    } else {
                        // Descobre a ordem das batidas do dia correspondente para rotular corretamente
                        const dayPunches = monthPunches.filter(p => new Date(p.timestamp).getDate() === day);
                        dayPunches.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                        const index = dayPunches.findIndex(p => p.id === punch.id);
                        const isEntry = index % 2 === 0;
                        const punchLabel = `${isEntry ? 'Entrada' : 'Saída'} ${Math.floor(index / 2) + 1}`;
                        
                        label = punchLabel;
                        const timeStr = punchDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                        sublabel = timeStr;
                    }
                    
                    return `
                        <div class="${cardClass}">
                            <div class="photo-container">
                                <img src="${punch.photo}" alt="${label}">
                            </div>
                            <div class="card-label" title="${label}">${label}</div>
                            <div class="card-sublabel">${sublabel}</div>
                        </div>
                    `;
                }).join('\n');
                
                return `
                    <div class="day-row-print">
                        <div class="day-header-print">
                            <span class="day-label-print">${dayLabelStr}</span>
                        </div>
                        <div class="day-cards-print">
                            ${cardsHtml}
                        </div>
                    </div>
                `;
            }).join('\n');
            
            // Abre nova aba e renderiza o HTML otimizado para impressão
            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                showToast("Erro ao abrir janela de impressão. Verifique se o bloqueador de pop-ups está ativado.");
                return;
            }
            
            const fullHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <title>Comprovantes de Ponto - ${state.currentUser.name} - ${monthName}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        @page {
            size: A4 portrait;
            margin: 12mm 12mm 15mm 12mm;
        }
        
        body {
            font-family: 'Inter', sans-serif;
            color: #1e293b;
            background-color: #ffffff;
            margin: 0;
            padding: 0;
            font-size: 11px;
            line-height: 1.4;
        }
        
        .header {
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 10px;
            margin-bottom: 18px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
        }
        
        .header-left h1 {
            font-size: 18px;
            font-weight: 700;
            margin: 0 0 4px 0;
            color: #0f172a;
        }
        
        .header-left p {
            margin: 0;
            color: #64748b;
            font-size: 11px;
        }
        
        .header-right {
            text-align: right;
            font-size: 10px;
            color: #64748b;
        }
        
        .header-right p {
            margin: 0 0 2px 0;
        }
        
        .day-row-print {
            display: flex;
            gap: 16px;
            border-bottom: 1px dashed #cbd5e1;
            padding: 12px 0;
            page-break-inside: avoid;
            break-inside: avoid;
        }
        
        .day-row-print:last-child {
            border-bottom: none;
        }
        
        .day-header-print {
            width: 80px;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            font-weight: 700;
            font-size: 12px;
            color: #0f172a;
        }
        
        .day-cards-print {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            flex: 1;
        }
        
        .card {
            width: 132px;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 5px;
            background-color: #f8fafc;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            box-sizing: border-box;
        }
        
        .photo-container {
            width: 100%;
            height: 160px;
            overflow: hidden;
            border-radius: 4px;
            border: 1px solid #e2e8f0;
            background-color: #f1f5f9;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .photo-container img {
            max-width: 100%;
            max-height: 100%;
            width: auto;
            height: auto;
            object-fit: contain;
        }
        
        .card-label {
            font-size: 9px;
            font-weight: 700;
            margin-top: 5px;
            color: #0f172a;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            width: 100%;
        }
        
        .card-sublabel {
            font-size: 8px;
            color: #64748b;
            margin-top: 1px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            width: 100%;
        }
        
        .card.abono {
            border-color: #a7f3d0;
            background-color: #ecfdf5;
        }
        
        .card.abono .card-label {
            color: #047857;
        }
        
        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 9px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 6px;
            background-color: #fff;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-left">
            <h1>Coleção de Comprovantes</h1>
            <p>Colaborador: <strong>${state.currentUser.name}</strong> (@${state.currentUser.username}) | Empresa: <strong>${state.currentUser.company}</strong></p>
        </div>
        <div class="header-right">
            <p>Período: <strong>${monthName}</strong></p>
            <p>Emitido em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
    </div>
    
    <div class="rows-container">
        ${rowsHtml}
    </div>
    
    <div class="footer">
        Controle de Ponto Pessoal • Gerado dinamicamente
    </div>
</body>
</html>
            `;
            
            printWindow.document.write(fullHtml);
            printWindow.document.close();
            
            // Aguarda o processamento inicial e inicia diálogo de impressão
            setTimeout(() => {
                printWindow.print();
            }, 500);
            
        } catch (err) {
            console.error("Erro ao gerar PDF:", err);
            showToast("Falha ao exportar PDF.");
        }
    });
});
