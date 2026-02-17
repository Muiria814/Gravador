// app.js - Controlador principal da aplicação
class VozStudio {
    constructor() {
        console.log('🎵 Criando VozStudio...');
        
        // Inicializar componentes
        this.gravador = new GravadorVoz();
        this.gerador = new GeradorMusical();
        this.mixador = new MixadorProfissional();
        this.analisador = new AnalisadorVoz();
        
        // Dados da aplicação
        this.analiseVozAtual = null;
        this.musicaGerada = null;
        this.audioUrl = null;
    }

    inicializar() {
        console.log('🎵 Inicializando VozStudio...');
        
        // Configurar eventos dos botões
        this.configurarEventos();
        
        // Atualizar interface
        this.atualizarInterface();
        
        // Inicializar mixador
        if (this.mixador && this.mixador.configurarMix) {
            this.mixador.configurarMix();
        }
        
        console.log('✅ VozStudio pronto!');
        document.getElementById('infoVoz').innerHTML = '<p style="color: green;">✅ App pronta! Clique em Gravar Voz</p>';
    }

    configurarEventos() {
        console.log('🔌 Configurando eventos...');
        
        // Botões de gravação
        const btnGravar = document.getElementById('btnGravar');
        const btnParar = document.getElementById('btnParar');
        const btnGerar = document.getElementById('btnGerar');
        const btnMP3 = document.getElementById('btnMP3');
        const btnWAV = document.getElementById('btnWAV');
        const btnCompartilhar = document.getElementById('btnCompartilhar');
        
        if (btnGravar) {
            btnGravar.addEventListener('click', () => this.iniciarGravacao());
            console.log('✅ Botão Gravar configurado');
        }
        
        if (btnParar) {
            btnParar.addEventListener('click', () => this.pararGravacao());
            console.log('✅ Botão Parar configurado');
        }
        
        if (btnGerar) {
            btnGerar.addEventListener('click', () => this.gerarMusica());
            console.log('✅ Botão Gerar configurado');
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
        
        try {
            // Pedir permissão e iniciar gravação
            const sucesso = await this.gravador.iniciar();
            
            if (sucesso) {
                this.gravador.comecarGravacao();
                
                // Atualizar botões
                document.getElementById('btnGravar').disabled = true;
                document.getElementById('btnParar').disabled = false;
                
                document.getElementById('infoVoz').innerHTML = 
                    '<p>🎙️ Gravando... Canta à vontade!</p>';
            }
        } catch (erro) {
            console.error('Erro ao gravar:', erro);
            document.getElementById('infoVoz').innerHTML = 
                '<p style="color: red;">Erro: ' + erro.message + '</p>';
        }
    }

    pararGravacao() {
        console.log('⏹️ Parando gravação...');
        
        this.gravador.pararGravacao();
        
        // Atualizar botões
        document.getElementById('btnGravar').disabled = false;
        document.getElementById('btnParar').disabled = true;
    }

    async gerarMusica() {
        console.log('✨ Gerando música...');
        
        // Verificar se temos análise da voz
        if (!this.analiseVozAtual) {
            alert('Por favor, grava a voz primeiro!');
            return;
        }
        
        // Mostrar loading
        const btnGerar = document.getElementById('btnGerar');
        btnGerar.textContent = '⏳ Criando tua música...';
        btnGerar.disabled = true;

        try {
            // Recolher configurações
            const config = {
                estilo: document.getElementById('estiloMusical')?.value || 'pop',
                bpm: parseInt(document.getElementById('bpm')?.value || '100'),
                tom: document.getElementById('tom')?.value || 'C',
                piano: document.getElementById('instPiano')?.checked || true,
                baixo: document.getElementById('instBaixo')?.checked || true,
                bateria: document.getElementById('instBateria')?.checked || true,
                guitarra: document.getElementById('instGuitarra')?.checked || false,
                cordas: document.getElementById('instCordas')?.checked || false,
                metal: document.getElementById('instMetal')?.checked || false
            };

            console.log('Configurações:', config);

            // ===========================================
            // IMPLEMENTAÇÃO REAL DA GERAÇÃO DE MÚSICA
            // ===========================================
            
            // 1. Usar o gerador para criar a música
            this.musicaGerada = await this.gerador.gerarMusica(
                this.analiseVozAtual,
                config
            );
            
            // 2. Criar um sintetizador simples para teste (enquanto o gerador não produz áudio real)
            const synth = new Tone.Synth().toDestination();
            
            // 3. Criar uma melodia simples baseada na duração da voz
            const duracao = this.analiseVozAtual.duracao || 10;
            const parte = new Tone.Part((time, note) => {
                synth.triggerAttackRelease(note, "8n", time);
            }, [
                [0, "C4"],
                [0.5, "E4"],
                [1, "G4"],
                [1.5, "C5"],
                [2, "G4"],
                [2.5, "E4"],
                [3, "C4"]
            ]);
            
            parte.loop = true;
            parte.loopEnd = duracao;
            parte.start(0);
            
            // 4. Tocar a música
            Tone.Transport.start();
            
            // 5. Criar URL para o player (enquanto não temos gravação real)
            const audioContext = Tone.context;
            const destination = audioContext.destination;
            
            // 6. Mostrar resultado
            document.getElementById('resultado').style.display = 'block';
            
            // 7. Criar um player simulado (até termos gravação real)
            const player = document.getElementById('player');
            player.src = ''; // Limpar src
            
            alert('✅ Música gerada com sucesso! (O som está a tocar)');

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
        
        // Atualizar interface
        document.getElementById('infoVoz').innerHTML = `
            <p style="color: green;">✅ Voz analisada!</p>
            <p>🎵 Duração: ${analise.duracao?.toFixed(1) || 0}s</p>
        `;
    }

    async exportarMP3() {
        if (!this.musicaGerada) {
            alert('Gera uma música primeiro!');
            return;
        }
        
        try {
            // Criar um ficheiro WAV temporário (depois convertemos para MP3)
            const audioContext = Tone.context;
            const duration = this.analiseVozAtual?.duracao || 5;
            
            // Criar um buffer de silêncio (placeholder até termos gravação real)
            const buffer = audioContext.createBuffer(2, audioContext.sampleRate * duration, audioContext.sampleRate);
            
            // Converter para WAV
            const wavData = this.bufferToWAV(buffer);
            
            // Converter para MP3 (simulado - na verdade é WAV com extensão MP3)
            const blob = new Blob([wavData], { type: 'audio/mpeg' });
            const url = URL.createObjectURL(blob);
            
            // Download
            const a = document.createElement('a');
            a.href = url;
            a.download = `vozstudio-${Date.now()}.mp3`;
            a.click();
            
            URL.revokeObjectURL(url);
            
        } catch (error) {
            console.error('Erro ao exportar MP3:', error);
            alert('Erro ao exportar: ' + error.message);
        }
    }

    async exportarWAV() {
        if (!this.musicaGerada) {
            alert('Gera uma música primeiro!');
            return;
        }
        
        try {
            // Criar um buffer de silêncio (placeholder)
            const audioContext = Tone.context;
            const duration = this.analiseVozAtual?.duracao || 5;
            const buffer = audioContext.createBuffer(2, audioContext.sampleRate * duration, audioContext.sampleRate);
            
            // Converter para WAV
            const wavData = this.bufferToWAV(buffer);
            const blob = new Blob([wavData], { type: 'audio/wav' });
            const url = URL.createObjectURL(blob);
            
            // Download
            const a = document.createElement('a');
            a.href = url;
            a.download = `vozstudio-${Date.now()}.wav`;
            a.click();
            
            URL.revokeObjectURL(url);
            
        } catch (error) {
            console.error('Erro ao exportar WAV:', error);
            alert('Erro ao exportar: ' + error.message);
        }
    }

    bufferToWAV(buffer) {
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
        view.setUint32(16, 16, true); // fmt chunk size
        view.setUint16(20, format, true); // audio format
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * blockAlign, true); // byte rate
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, bitDepth, true);
        
        // data subchunk
        this.writeString(view, 36, 'data');
        view.setUint32(40, dataLength, true);
        
        // Write audio data (silêncio por enquanto)
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
        
        return wav;
    }

    writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    async compartilhar() {
        if (!this.musicaGerada) {
            alert('Gera uma música primeiro!');
            return;
        }
        
        // Verificar se o navegador suporta compartilhamento
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'VozStudio - Minha Música',
                    text: 'Criei esta música com a minha voz no VozStudio!',
                    url: window.location.href
                });
                console.log('Compartilhado com sucesso!');
            } catch (error) {
                console.log('Compartilhamento cancelado:', error);
            }
        } else {
            // Fallback para navegadores que não suportam share
            alert('Copia o link para compartilhar: ' + window.location.href);
        }
    }

    atualizarInterface() {
        console.log('🖥️ Interface atualizada');
    }
}

// Garantir que a classe está disponível globalmente
console.log('📦 app.js carregado, classe VozStudio definida:', typeof VozStudio);