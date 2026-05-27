/**
 * server.js - Servidor de Sincronização do Controle de Ponto Pessoal
 * Executa uma API Express para persistência e sincronização de dados multiusuário.
 * Armazena as informações em arquivos JSON locais para evitar problemas de compilação do SQLite no Windows.
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurações e Diretórios
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Cria o diretório de dados se não existir
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

// Inicializa o arquivo de usuários
if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify({}, null, 2));
}

// Middleware
app.use(cors()); // Habilita CORS para permitir conexões de páginas locais (file://)
app.use(express.json({ limit: '50mb' })); // Aumenta limite de JSON para permitir upload de comprovantes em Base64
app.use(express.static(path.join(__dirname, 'public'))); // Serve o frontend estático

// Helpers de Leitura e Escrita
function readUsers() {
    try {
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        return {};
    }
}

function writeUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function getUserPunchesPath(username) {
    // Limpa o nome do arquivo para evitar injeções de diretório
    const safeUsername = username.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    return path.join(DATA_DIR, `punches_${safeUsername}.json`);
}

function readUserPunches(username) {
    const safeUsername = username.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    let allPunches = [];

    // 1. Ler arquivo legado se existir
    const legacyPath = getUserPunchesPath(username);
    if (fs.existsSync(legacyPath)) {
        try {
            const data = fs.readFileSync(legacyPath, 'utf8');
            allPunches = allPunches.concat(JSON.parse(data));
        } catch (e) {
            console.error(`Erro ao ler arquivo legado para ${username}:`, e);
        }
    }

    // 2. Ler todos os arquivos mensais particionados
    try {
        const files = fs.readdirSync(DATA_DIR);
        const monthlyPattern = new RegExp(`^punches_${safeUsername}_(\\d{4})_(\\d{2})\\.json$`);
        files.forEach(file => {
            const match = file.match(monthlyPattern);
            if (match) {
                const filePath = path.join(DATA_DIR, file);
                try {
                    const data = fs.readFileSync(filePath, 'utf8');
                    allPunches = allPunches.concat(JSON.parse(data));
                } catch (e) {
                    console.error(`Erro ao ler arquivo mensal ${file}:`, e);
                }
            }
        });
    } catch (e) {
        console.error(`Erro ao listar diretório de dados para ${username}:`, e);
    }

    // Remover duplicatas por id
    const map = new Map();
    allPunches.forEach(p => {
        if (p && p.id) {
            map.set(p.id, p);
        }
    });
    return Array.from(map.values());
}

function writeUserPunches(username, punches) {
    const safeUsername = username.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    // Agrupar pontos por YYYY_MM
    const grouped = {};
    punches.forEach(punch => {
        if (!punch) return;
        const date = new Date(punch.timestamp);
        let year = date.getFullYear();
        let month = String(date.getMonth() + 1).padStart(2, '0');
        if (isNaN(year)) {
            const now = new Date();
            year = now.getFullYear();
            month = String(now.getMonth() + 1).padStart(2, '0');
        }
        const key = `${year}_${month}`;
        if (!grouped[key]) {
            grouped[key] = [];
        }
        grouped[key].push(punch);
    });

    // Salvar cada grupo no seu respectivo arquivo mensal
    for (const [key, list] of Object.entries(grouped)) {
        const filePath = path.join(DATA_DIR, `punches_${safeUsername}_${key}.json`);
        fs.writeFileSync(filePath, JSON.stringify(list, null, 2));
    }

    // Deletar o arquivo legado para finalizar a migração
    const legacyPath = getUserPunchesPath(username);
    if (fs.existsSync(legacyPath)) {
        try {
            fs.unlinkSync(legacyPath);
            console.log(`[Migração] Arquivo legado de punches migrado e removido: punches_${safeUsername}.json`);
        } catch (e) {
            console.error(`Erro ao deletar arquivo legado punches_${safeUsername}.json:`, e);
        }
    }
}

// ==========================================================================
// ROTAS DA API
// ==========================================================================

/**
 * POST /api/register
 * Cadastra ou atualiza o perfil do usuário no servidor.
 */
app.post('/api/register', (req, res) => {
    const { username, password, name, company, journey } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Usuário e senha são obrigatórios.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const users = readUsers();

    // Se já existe e a senha difere, bloqueia alteração (segurança básica)
    if (users[cleanUsername] && users[cleanUsername].password !== password) {
        return res.status(403).json({ success: false, message: 'Senha incorreta para atualização de perfil.' });
    }

    // Salva ou atualiza perfil
    users[cleanUsername] = {
        username: cleanUsername,
        password, // Simples para este projeto
        name: name || (users[cleanUsername] ? users[cleanUsername].name : ''),
        company: company || (users[cleanUsername] ? users[cleanUsername].company : ''),
        journey: parseInt(journey) || 480,
        updatedAt: new Date().toISOString()
    };

    writeUsers(users);

    console.log(`[API] Usuário registrado/atualizado: @${cleanUsername}`);
    res.json({ success: true, user: { username: cleanUsername, name, company, journey } });
});

/**
 * POST /api/login
 * Realiza autenticação com o servidor e opcionalmente retorna todos os dados.
 * Útil se o usuário estiver em um celular novo e quiser baixar o histórico.
 */
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Usuário e senha são obrigatórios.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const users = readUsers();
    const user = users[cleanUsername];

    if (!user) {
        return res.status(404).json({ success: false, message: 'Usuário não encontrado no servidor.' });
    }

    if (user.password !== password) {
        return res.status(401).json({ success: false, message: 'Senha incorreta.' });
    }

    // Carrega pontos para restaurar no novo dispositivo
    const punches = readUserPunches(cleanUsername);
    const { password: _, ...safeUser } = user;

    console.log(`[API] Usuário logado: @${cleanUsername}`);
    res.json({ success: true, user: safeUser, punches });
});

/**
 * POST /api/sync
 * Sincroniza em lote os pontos gerados offline com o servidor e retorna o estado atual consolidado.
 */
app.post('/api/sync', (req, res) => {
    const { username, punches: clientPunches } = req.body;

    if (!username || !Array.isArray(clientPunches)) {
        return res.status(400).json({ success: false, message: 'Dados inválidos para sincronização.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    
    // Verifica se o usuário existe
    const users = readUsers();
    if (!users[cleanUsername]) {
        return res.status(404).json({ success: false, message: 'Usuário não registrado no servidor.' });
    }

    // Lê os pontos já guardados no servidor
    const serverPunches = readUserPunches(cleanUsername);
    const serverMap = new Map(serverPunches.map(p => [p.id, p]));

    // Mescla pontos enviados pelo cliente
    clientPunches.forEach(cliPunch => {
        const srvPunch = serverMap.get(cliPunch.id);

        if (cliPunch.deleted) {
            // Se o cliente marcou como deletado, aplica exclusão lógica ou física
            if (srvPunch) {
                Object.assign(srvPunch, cliPunch);
                srvPunch.synced = true;
                srvPunch.deleted = true;
                srvPunch.updatedAt = new Date().toISOString();
            } else {
                // Caso não existisse no servidor, já marca como deletado no mapa local
                cliPunch.synced = true;
                cliPunch.updatedAt = new Date().toISOString();
                serverMap.set(cliPunch.id, cliPunch);
            }
        } else {
            // Se o ponto não existe no servidor, cria. Se existe, atualiza caso cliente seja mais recente
            if (!srvPunch) {
                cliPunch.synced = true;
                cliPunch.updatedAt = new Date().toISOString();
                serverMap.set(cliPunch.id, cliPunch);
            } else {
                // Em caso de conflito, atualiza os campos, mas mantém integridade
                Object.assign(srvPunch, cliPunch);
                srvPunch.synced = true;
                srvPunch.deleted = false;
                srvPunch.updatedAt = new Date().toISOString();
            }
        }
    });

    // Filtra pontos de exclusão lógica física se necessário, mas mantemos o histórico para retrocompatibilidade
    // Vamos converter o mapa de volta para array
    const mergedPunches = Array.from(serverMap.values());
    
    // Salva o novo array consolidado
    writeUserPunches(cleanUsername, mergedPunches);

    console.log(`[API] Sincronização concluída para @${cleanUsername}. Recebidos: ${clientPunches.length}, Servidor agora tem: ${mergedPunches.length}`);
    
    // Retorna todos os pontos consolidados para o cliente (incluindo deletados para que o cliente limpe o DB local)
    res.json({
        success: true,
        punches: mergedPunches
    });
});

// Inicialização do Servidor
app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`Servidor PontoPessoal rodando na porta ${PORT}`);
    console.log(`Acesse localmente em: http://localhost:${PORT}`);
    console.log(`Diretório de dados: ${DATA_DIR}`);
    console.log(`====================================================`);
});
