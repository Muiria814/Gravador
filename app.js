// app.js - VERSÃO CORRIGIDA E ESTÁVEL
class VozStudio {
    constructor() {
        console.log('🎵 Criando VozStudio...');

        this.gravador = new GravadorVoz();
        this.analisador = new AnalisadorVoz();

        this.analiseVozAtual = null;
        this.audioUrl = null;
        this.audioContext = null;

        // Garantir limpeza ao sair da página
        window.addEventListener("beforeunload", () => {
            this.pararTodosAudios(true);
        });
    }

    inicializar() {
        this.configurarEventos();
        this.atualizarInterface();
        console.log('✅ VozStudio pronto!');
    }

    configurarEventos() {
        const btnGravar = document.getElementById('btnGravar');
        const btnParar = document.getElementById('btnParar');
        const btnGerar = document.getElementById('btnGerar');

        btnGravar?.addEventListener('click', () => this.iniciarGravacao());
        btnParar?.addEventListener('click', () => this.pararGravacao());
        btnGerar?.addEventListener('click', () => this.gerarMusica());

        document.getElementById('btnMP3')
            ?.addEventListener('click', () => this.exportarMP3());

        document.getElementById('btnWAV')
            ?.addEventListener('click', () => this.exportarWAV());

        document.getElementById('btnCompartilhar')
            ?.addEventListener('click', () => this.compartilhar());

        const bpmSlider = document.getElementById('bpm');
        const bpmValor = document.getElementById('bpmValor');

        bpmSlider?.addEventListener('input', e => {
            bpmValor.textContent = e.target.value + ' BPM';
        });
    }

    /* ==================================================
       PARAR TODOS OS ÁUDIOS (VERSÃO FORTE)
    ================================================== */
    pararTodosAudios(forceClose = false) {
        console.log('🔇 Parando TODOS os áudios...');

        // Tone.js (se existir)
        if (typeof Tone !== "undefined") {
            try {
                Tone.Transport.stop();
                Tone.Transport.cancel();
                Tone.Destination.mute = true;

                if (forceClose && Tone.context) {
                    Tone.context.close();
                }
            } catch {}
        }

        // Player HTML
        const player = document.getElementById('player');
        if (player) {
            player.pause();
            player.src = '';
            player.load();
        }

        // URL antiga
        if (this.audioUrl) {
            URL.revokeObjectURL(this.audioUrl);
            this.audioUrl = null;
        }

        // AudioContext manual
        if (this.audioContext) {
            try {
                this.audioContext.close();
            } catch {}
            this.audioContext = null;
        }

        console.log('✅ Áudio totalmente parado');
    }

    async iniciarGravacao() {
        this.pararTodosAudios();

        try {
            const sucesso = await this.gravador.iniciar();

            if (sucesso) {
                this.gravador.comecarGravacao();

                btnGravar.disabled = true;
                btnParar.disabled = false;
            }
        } catch (erro) {
            console.error(erro);
        }
    }

    pararGravacao() {
        this.gravador.pararGravacao();
        btnGravar.disabled = false;
        btnParar.disabled = true;
    }

    /* ==================================================
       GERAR MÚSICA (SEM LOOP INFINITO)
    ================================================== */
    async gerarMusica() {
        this.pararTodosAudios();

        if (!this.analiseVozAtual) {
            alert('Grava primeiro!');
            return;
        }

        try {
            const duration = Math.min(
                this.analiseVozAtual?.duracao || 5,
                8
            );

            this.audioContext = new AudioContext();

            const sr = this.audioContext.sampleRate;
            const buffer = this.audioContext.createBuffer(
                1,
                sr * duration,
                sr
            );

            const data = buffer.getChannelData(0);

            for (let i = 0; i < data.length; i++) {
                const t = i / sr;
                const freq = 220 + Math.sin(t) * 120;

                data[i] =
                    Math.sin(i * freq * 2 * Math.PI / sr) *
                    Math.max(0, 1 - t / duration);
            }

            const wavBlob = await this.bufferToWAV(buffer);

            this.audioUrl = URL.createObjectURL(wavBlob);

            const player = document.getElementById('player');
            player.src = this.audioUrl;
            player.load();

            // Fechar contexto depois
            setTimeout(() => {
                this.pararTodosAudios();
            }, duration * 1000 + 500);

        } catch (e) {
            console.error(e);
        }
    }

    receberAnaliseVoz(analise) {
        this.analiseVozAtual = analise;
    }

    /* ==================================================
       EXPORTAÇÃO
    ================================================== */
    exportarMP3() {
        if (!this.audioUrl) return alert('Gera música primeiro');

        const a = document.createElement('a');
        a.href = this.audioUrl;
        a.download = `vozstudio-${Date.now()}.mp3`;
        a.click();
    }

    exportarWAV() {
        if (!this.audioUrl) return alert('Gera música primeiro');

        const a = document.createElement('a');
        a.href = this.audioUrl;
        a.download = `vozstudio-${Date.now()}.wav`;
        a.click();
    }

    async compartilhar() {
        if (!navigator.share) {
            alert(location.href);
            return;
        }

        try {
            await navigator.share({
                title: 'VozStudio',
                url: location.href
            });
        } catch {}
    }

    atualizarInterface() {}

    /* ==================================================
       WAV CONVERTER
    ================================================== */
    bufferToWAV(buffer) {
        return new Promise(resolve => {
            const numChannels = buffer.numberOfChannels;
            const sampleRate = buffer.sampleRate;
            const length = buffer.length * numChannels * 2 + 44;

            const arrayBuffer = new ArrayBuffer(length);
            const view = new DataView(arrayBuffer);

            const writeString = (o, s) =>
                [...s].forEach((c, i) =>
                    view.setUint8(o + i, c.charCodeAt(0))
                );

            writeString(0, 'RIFF');
            view.setUint32(4, length - 8, true);
            writeString(8, 'WAVE');
            writeString(12, 'fmt ');

            view.setUint32(16, 16, true);
            view.setUint16(20, 1, true);
            view.setUint16(22, numChannels, true);
            view.setUint32(24, sampleRate, true);
            view.setUint32(28, sampleRate * 2, true);
            view.setUint16(32, 2, true);
            view.setUint16(34, 16, true);

            writeString(36, 'data');
            view.setUint32(40, length - 44, true);

            const data = buffer.getChannelData(0);
            let offset = 44;

            for (let i = 0; i < data.length; i++) {
                const s = Math.max(-1, Math.min(1, data[i]));
                view.setInt16(
                    offset,
                    s < 0 ? s * 0x8000 : s * 0x7fff,
                    true
                );
                offset += 2;
            }

            resolve(new Blob([view], { type: 'audio/wav' }));
        });
    }
}

console.log('📦 app.js corrigido carregado');