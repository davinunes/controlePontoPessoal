# Controle de Ponto Pessoal - PontoPessoal

Este é um aplicativo responsivo (mobile-first) de controle de ponto pessoal. CLT workers que recebem comprovantes impressos em papel podem registrar seus horários batidos, tirar fotos dos comprovantes e organizar seus pontos em formato de **Folha de Ponto Mensal** e de **Álbum de Figurinhas** de comprovantes.

O aplicativo possui arquitetura **Dual-Mode**, permitindo rodar de forma independente 100% local no seu navegador ou sincronizado com um servidor em Node.js.

---

## 🚀 Como Executar o Aplicativo

### Método 1: Modo 100% Local (Navegador - Sem Instalar Nada)
Se você não tem o Node.js instalado, você pode utilizar o aplicativo diretamente no navegador do seu celular ou computador:

1. Navegue até a pasta `ControlePontoPessoal/public/`.
2. Dê um duplo clique no arquivo **`index.html`** (ou arraste-o para o navegador).
3. **Pronto!** O aplicativo está ativo e totalmente funcional.

> **💡 Como funciona?** 
> O aplicativo faz uso do banco de dados **IndexedDB** interno do navegador. Diferente do LocalStorage que limita os dados a apenas 5MB, o IndexedDB permite o armazenamento de centenas de megabytes, o que possibilita armazenar as fotos dos seus comprovantes de papel diretamente no banco de dados local do seu navegador. O aplicativo é 100% offline nesse modo.

---

### Método 2: Modo Sincronizado (Com Servidor Node.js)
Se no futuro você instalar o Node.js e quiser que seus dados sejam salvos no computador (servidor local) e sincronizados automaticamente:

1. Abra o terminal (PowerShell ou Prompt) na pasta raiz `ControlePontoPessoal/`.
2. Execute o comando para instalar as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor local:
   ```bash
   npm start
   ```
4. O servidor estará ativo em: **`http://localhost:3000`**
5. Abra este endereço no navegador do seu computador ou no celular (caso estejam conectados na mesma rede Wi-Fi).

> **💡 Como funciona a sincronização?**
> - Quando você estiver conectado à internet (e o servidor estiver ativo), o aplicativo sincroniza automaticamente seus pontos em segundo plano.
> - Se você registrar pontos offline (ex: no caminho do trabalho), eles ficam guardados com segurança no banco do navegador e são marcados como "Aguardando Sincronização". Assim que o app detectar rede e o servidor ativo, ele faz o upload em lote.
> - Os dados do servidor são persistidos na pasta `data/` em arquivos JSON (`data/users.json` para usuários e `data/punches_<username>.json` para os pontos de cada pessoa).

---

## 🛠️ Principais Recursos e Tecnologias

### 1. Banco de Horas e Cálculos CLT
* **Jornada Customizável:** Na tela de cadastro ou ajustes, configure sua jornada diária (Ex: 8h, 6h, 8h 48m, etc.).
* **Cálculo Diário:** O aplicativo calcula os períodos trabalhados com base nos pares ordenados de registros (Entrada 1 ➔ Saída 1, Entrada 2 ➔ Saída 2). Pontos ímpares (ainda não finalizados) não são contabilizados no saldo até que a saída correspondente seja registrada.
* **Cálculo Mensal:** O saldo diário (trabalhado - jornada) é acumulado. Dias sem registros (como folgas ou finais de semana) não deduzem saldo, evitando saldos negativos indevidos.

### 2. Captura e Redimensionamento Inteligente de Comprovantes
* O aplicativo permite usar a **câmera direta do celular** ou carregar da **galeria de fotos**.
* Para economizar armazenamento e banda de internet, antes de salvar, a foto passa por um compressor em canvas HTML5:
  * Redimensiona proporcionalmente para largura/altura máxima de **800px**.
  * Comprime a qualidade da imagem JPEG em **70%**.
  * Reduz arquivos de fotos originais de **4MB-10MB** para **~60KB**, mantendo a leitura do comprovante nítida e economizando muito espaço.

### 3. Álbum de Figurinhas de Comprovantes
* Uma visão elegante no estilo "álbum" que apresenta os dias do mês em linhas.
* Todas as fotos de comprovantes registradas no dia aparecem lado a lado em um carrossel horizontal.
* Clique na miniatura para abrir um visualizador em tela cheia (**Lightbox**) com zoom e detalhes do ponto correspondente.

### 4. Gestão Multiusuário (Várias Pessoas)
* Crie perfis independentes com usuário e senha.
* Cada perfil gera um banco de dados IndexedDB e arquivo JSON individual.
* Alterne rapidamente entre os perfis cadastrados na aba **Ajustes**, facilitando o uso compartilhado no mesmo aparelho com total isolamento de dados.

---

## 📂 Estrutura do Projeto

```
ControlePontoPessoal/
├── data/                    # Criado pelo servidor (JSONs de usuários e pontos)
├── public/                  # Arquivos do Frontend (SPA)
│   ├── css/
│   │   └── styles.css       # Design System Escuro & Glassmorphism
│   ├── js/
│   │   ├── db.js            # Interface IndexedDB (Banco Local do Navegador)
│   │   ├── camera.js        # Redimensionamento e compressão de imagens via Canvas
│   │   ├── sync.js          # Motor de sincronização offline/online
│   │   └── app.js           # Lógica SPA, cálculos de horas, roteamento e eventos
│   └── index.html           # Layout HTML estrutural com SVGs inline
├── server.js                # Servidor Express.js (Sincronização opcional)
├── package.json             # Definição de dependências do Node.js
└── README.md                # Instruções de configuração e uso
```

---

## 🎨 Design System e Visual Premium (Wow-Factor)
* **Tema Escuro Nativo:** Reduz a fadiga ocular, ideal para uso diário ao iniciar/encerrar a jornada.
* **Glassmorphism:** Visual moderno usando filtros de desfoque (`backdrop-filter: blur(12px)`) e bordas translúcidas simulando vidro jateado.
* **Feedback Tátil:** Micro-animações e transições suaves ao alternar abas, clicar em botões e abrir caixas de diálogo.
* **Responsividade Extrema:** Adaptado de forma nativa para celular. No desktop, restringe a visualização a uma moldura central simulando um dispositivo móvel premium.
