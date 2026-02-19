// app.js - Controlador principal da aplicação (VERSÃO SIMPLIFICADA)
class VozStudio {
    constructor() {
        console.log('🎵 Criando VozStudio...');

        // Inicializar componentes
        this.gravador = new GravadorVoz();
        this.analisador = new AnalisadorVoz();

        // Dados da aplicação
        this.analiseVozAtual = null;
        this.audioUrl = null;
        this.audioContext = null;
    }

    inicializar() {
        console.log('🎵 Inicializando VozStudio...');
        this.configurarEventos();
        this.atualizarInterface();

        console.log('✅ VozStudio pronto!');
        document.getElementById('infoVoz').innerHTML = '<p style="color: green;">✅ App pronta! Clique em Gravar Voz</p>';
    }

    configurarEventos() {
        console.log('🔌 Configurando eventos...');

        const btnGravar = document.getElementById('btnGravar');
        const btnParar = document.getElementById('btnParar');
        const btnGerar = document.getElementById('btnGerar');
        const btnMP3 = document.getElementById('btnMP3');
        const btnWAV = document.getElementById('btnWAV');
        const btnCompartilhar = document.getElementById('btnCompartilhar');

        if (btnGravar) {
            btnGravar.addEventListener('click', () => this.iniciarGravacao());
        }

        if (btnParar) {
            btnParar.addEventListener('click', () => this.pararGravacao());
        }

        if (btnGerar) {
            btnGerar.addEventListener('click', () => this.gerarMusica());
        }

        if (btnMP3) {
            btnMP3.addEventListener('click', () => this.exportarMP3());
        }

        if (btnWAV) {
            btnWAV.addEventListener('click', () => this.exportarWAV());
        }

        if (btnCompartilhar) {
            btnCompartilhar.addEventListener('click', () => this.compartilhar());
        }

        // Slider BPM
        const bpmSlider = document.getElementById('bpm');
        const bpmValor = document.getElementById('bpmValor');

        if (bpmSlider && bpmValor) {
            bpmSlider.addEventListener('input', (e) => {
                bpmValor.textContent = e.target.value + ' BPM';
            });
        }
    }

    async iniciarGravacao() {
        console.log('🎤 Iniciando gravação...');
        
        // Parar qualquer áudio que esteja a tocar
        this.pararTodosAudios();

        try {
            const sucesso = await this.gravador.iniciar();

            if (sucesso) {
                this.gravador.comecarGravacao();

                document.getElementById('btnGravar').disabled = true;
                document.getElementById('btnParar').disabled = false;
                document.getElementById('infoVoz').innerHTML = '<p>🎙️ Gravando... Canta à vontade!</p>';
            }
        } catch (erro) {
            console.error('Erro ao gravar:', erro);
        }
    }

    pararGravacao() {
        console.log('⏹️ Parando gravação...');
        this.gravador.pararGravacao();

        document.getElementById('btnGravar').disabled = false;
        document.getElementById('btnParar').disabled = true;
    }

    // ===========================================
    // NOVO: Parar todos os áudios
    // ===========================================
    pararTodosAudios() {
        console.log('🔇 Parando todos os áudios...');
        
        // Parar o player
        const player = document.getElementById('player');
        if (player) {
            player.pause();
            player.currentTime = 0;
            player.src = '';
            player.load();
        }
        
        // Limpar URL anterior
        if (this.audioUrl) {
            URL.revokeObjectURL(this.audioUrl);
            this.audioUrl = null;
        }
        
        // Fechar contexto de áudio
        if (this.audioContext) {
            try {
                this.audioContext.close();
            } catch (e) {}
            this.audioContext = null;
        }
        
        console.log('✅ Todos os áudios parados');
    }

    async gerarMusica() {
        console.log('✨ Gerando música...');
        
        // ===========================================
        // CRÍTICO: Parar todos os sons anteriores
        // ===========================================
        this.pararTodosAudios();

        if (!this.analiseVozAtual) {
            alert('Por favor, grava a voz primeiro!');
            return;
        }

        const btnGerar = document.getElementById('btnGerar');
        btnGerar.textContent = '⏳ Criando tua música...';
        btnGerar.disabled = true;

        try {
            // Mostrar resultado
            document.getElementById('resultado').style.display = 'block';
            
            // GERAR TOM DE TESTE (SIMPLES)
            const duration = Math.min(this.analiseVozAtual?.duracao || 5, 10);
            
            // Criar um ficheiro WAV simples
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const sampleRate = this.audioContext.sampleRate;
            const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
            const channelData = buffer.getChannelData(0);
            
            // Gerar onda senoidal
            for (let i = 0; i < buffer.length; i++) {
                const t = i / sampleRate;
                // Notas simples: Dó, Ré, Mi, Fá, Sol
                const notes = [261.63, 293.66, 329.63, 349.23, 392.00];
                const noteIndex = Math.floor(t * 2) % notes.length;
                const frequency = notes[noteIndex];
                
                channelData[i] = Math.sin(i * frequency * 2 * Math.PI / sampleRate) * 
                                Math.max(0, 1 - t / duration);
            }
            
            // Converter para WAV
            const wavBlob = await this.bufferToWAV(buffer);
            const audioUrl = URL.createObjectURL(wavBlob);
            
            // Carregar no player
            const player = document.getElementById('player');
            
            if (this.audioUrl) {
                URL.revokeObjectURL(this.audioUrl);
            }
            
            this.audioUrl = audioUrl;
            player.src = audioUrl;
            player.controls = true;
            player.load();
            
            // Fechar contexto para não gastar bateria
            setTimeout(() => {
                if (this.audioContext) {
                    this.audioContext.close();
                    this.audioContext = null;
                }
            }, duration * 1000 + 1000);
            
            alert(`✅ Música gerada com sucesso! (${duration}s)`);

        } catch (error) {
            console.error('Erro ao gerar música:', error);
            alert('❌ Erro: ' + error.message);
        } finally {
            btnGerar.textContent = '✨ Criar Música Completa ✨';
            btnGerar.disabled = false;
        }
    }

    // Recebe análise do gravador
    receberAnaliseVoz(analise) {
        console.log('📊 Análise recebida:', analise);
        this.analiseVozAtual = analise;

        document.getElementById('infoVoz').innerHTML = `
            <p style="color: green;">✅ Voz analisada!</p>
            <p>🎵 Duração: ${analise.duracao?.toFixed(1) || 0}s</p>
        `;
    }

    // ===========================================
    // CONVERSOR DE WAV
    // ===========================================
    bufferToWAV(buffer) {
        return new Promise((resolve) => {
            const numChannels = buffer.numberOfChannels;
            const sampleRate = buffer.sampleRate;
            const format = 1; // PCM
            const bitDepth = 16;

            const bytesPerSample = bitDepth / 8;
            const blockAlign = numChannels * bytesPerSample;

            const dataLength = buffer.length * blockAlign;
            const headerLength = 44;
            const totalLength = headerLength + dataLength;

            const wav = new ArrayBuffer(totalLength);
            const view = new DataView(wav);

            // RIFF header
            this.writeString(view, 0, 'RIFF');
            view.setUint32(4, totalLength - 8, true);
            this.writeString(view, 8, 'WAVE');

            // fmt subchunk
            this.writeString(view, 12, 'fmt ');
            view.setUint32(16, 16, true);
            view.setUint16(20, format, true);
            view.setUint16(22, numChannels, true);
            view.setUint32(24, sampleRate, true);
            view.setUint32(28, sampleRate * blockAlign, true);
            view.setUint16(32, blockAlign, true);
            view.setUint16(34, bitDepth, true);

            // data subchunk
            this.writeString(view, 36, 'data');
            view.setUint32(40, dataLength, true);

            // Write audio data
            const channelData = buffer.getChannelData(0);
            let offset = 44;
            
            for (let i = 0; i < buffer.length; i++) {
                for (let channel = 0; channel < numChannels; channel++) {
                    const sample = Math.max(-1, Math.min(1, channelData[i]));
                    const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
                    view.setInt16(offset, intSample, true);
                    offset += 2;
                }
            }

            resolve(new Blob([wav], { type: 'audio/wav' }));
        });
    }

    writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    async exportarMP3() {
        if (!this.analiseVozAtual) {
            alert('Gera uma música primeiro!');
            return;
        }

        if (!this.audioUrl) {
            alert('Nenhuma música para exportar!');
            return;
        }

        // Download (como WAV com extensão MP3)
        const a = document.createElement('a');
        a.href = this.audioUrl;
        a.download = `vozstudio-${Date.now()}.mp3`;
        a.click();
    }

    async exportarWAV() {
        if (!this.analiseVozAtual) {
            alert('Gera uma música primeiro!');
            return;
        }

        if (!this.audioUrl) {
            alert('Nenhuma música para exportar!');
            return;
        }

        const a = document.createElement('a');
        a.href = this.audioUrl;
        a.download = `vozstudio-${Date.now()}.wav`;
        a.click();
    }

    async compartilhar() {
        if (!this.analiseVozAtual) {
            alert('Gera uma música primeiro!');
            return;
        }

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'VozStudio - Minha Música',
                    text: 'Criei esta música com a minha voz no VozStudio!',
                    url: window.location.href
                });
            } catch (error) {
                console.log('Compartilhamento cancelado:', error);
            }
        } else {
            alert('Copia o link para compartilhar: ' + window.location.href);
        }
    }

    atualizarInterface() {
        console.log('🖥️ Interface atualizada');
    }
}

// Garantir que a classe está disponível globalmente
console.log('📦 app.js carregado');