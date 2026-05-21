/**
 * camera.js - Controle de Captura e Redimensionamento de Imagem
 * Gerencia o redimensionamento de fotos da câmera e galeria usando HTML5 Canvas
 * para reduzir drasticamente o espaço ocupado no banco de dados e servidor.
 */

class CameraService {
    /**
     * Lê um arquivo de imagem, redimensiona proporcionalmente mantendo a proporção
     * e o comprime no formato JPEG com qualidade controlada.
     * 
     * @param {File} file Arquivo original selecionado (Câmera ou Galeria)
     * @param {number} maxWidth Largura máxima permitida (padrão: 800px)
     * @param {number} maxHeight Altura máxima permitida (padrão: 800px)
     * @param {number} quality Qualidade da compressão de 0.0 a 1.0 (padrão: 0.7)
     * @returns {Promise<string>} String Base64 da imagem comprimida em JPEG
     */
    resizeAndCompress(file, maxWidth = 800, maxHeight = 800, quality = 0.7) {
        return new Promise((resolve, reject) => {
            // Verifica se é mesmo uma imagem
            if (!file.type.startsWith('image/')) {
                return reject("O arquivo selecionado não é uma imagem válida.");
            }

            const reader = new FileReader();
            reader.readAsDataURL(file);

            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;

                img.onload = () => {
                    let width = img.width;
                    let height = img.height;

                    // Calcula novas dimensões mantendo a proporção
                    if (width > height) {
                        if (width > maxWidth) {
                            height = Math.round((height * maxWidth) / width);
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = Math.round((width * maxHeight) / height);
                            height = maxHeight;
                        }
                    }

                    // Cria o canvas fora da tela
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Converte para JPEG com a qualidade desejada
                    // Isso gera uma string base64 compactada
                    const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                    
                    // Estatísticas de compressão para debug no console
                    const originalSizeKB = Math.round(file.size / 1024);
                    // Base64 é ~33% maior que o binário, calculamos o tamanho real comprimido:
                    const compressedSizeKB = Math.round((compressedBase64.length * 3) / 4 / 1024);
                    console.log(`Compressão: ${originalSizeKB}KB -> ${compressedSizeKB}KB (${Math.round((1 - compressedSizeKB/originalSizeKB)*100)}% de redução)`);

                    resolve(compressedBase64);
                };

                img.onerror = (err) => {
                    reject("Erro ao processar imagem para redimensionamento.");
                };
            };

            reader.onerror = (err) => {
                reject("Erro ao ler o arquivo de imagem: " + err);
            };
        });
    }

    /**
     * Helper para formatar a entrada nativa de captura.
     * Retorna os atributos necessários para acionar a câmera nos dispositivos móveis.
     */
    getCameraInputAttributes() {
        return {
            type: 'file',
            accept: 'image/*',
            capture: 'environment' // Direciona para a câmera traseira do celular por padrão
        };
    }
}

// Expõe a instância globalmente
window.cameraService = new CameraService();
