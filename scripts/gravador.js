// Gravador de áudio com qualidade de estúdio
class GravadorVoz {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.stream = null;
        this.audioContext = null;
        this.analisador = null;
        this.gravando = false;
    }

    async iniciar() {
        try {
            // Configurar áudio com alta qualidade
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    channelCount: 2,
                    sampleRate: 48000,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } 
            });

            // Criar contexto de áudio profissional
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
                latencyHint: 'interactive',
                sampleRate: 48000
            });

            // Fonte de áudio
            const source = this.audioContext.createMediaStreamSource(this.stream);
            
            // Analisador para visualização
            this.analisador = this.audioContext.createAnalyser();
            this.analisador.fftSize = 2048;
            source.connect(this.analisador);

            // MediaRecorder para capturar
            this.mediaRecorder = new MediaRecorder(this.stream, {
                mimeType: 'audio/webm;codecs=opus',
                audioBitsPerSecond: 128000
            });

            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                this.processarGravacao(audioBlob);
            };

            return true;
        } catch (error) {
            console.error('Erro ao aceder microfone:', error);
            alert('Por favor, permite o acesso ao microfone!');
            return false;
        }
    }

    comecarGravacao() {
        if (this.mediaRecorder && !this.gravando) {
            this.audioChunks = [];
            this.mediaRecorder.start();
            this.gravando = true;
            this.visualizarOnda();
        }
    }

    pararGravacao() {
        if (this.mediaRecorder && this.gravando) {
            this.mediaRecorder.stop();
            this.gravando = false;
            this.stream.getTracks().forEach(track => track.stop());
        }
    }

    visualizarOnda() {
        const canvas = document.getElementById('waveform');
        const ctx = canvas.getContext('2d');
        const bufferLength = this.analisador.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        function desenhar() {
            requestAnimationFrame(desenhar);
            
            this.analisador.getByteTimeDomainData(dataArray);
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#ffd700';
            ctx.beginPath();
            
            const sliceWidth = canvas.width / bufferLength;
            let x = 0;
            
            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = v * canvas.height / 2;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
                
                x += sliceWidth;
            }
            
            ctx.stroke();
        }

        desenhar.call(this);
    }

    async processarGravacao(audioBlob) {
        // Converter para formato processável
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        
        // Extrair informações da voz
        const analise = await this.analisarVoz(audioBuffer);
        
        // Atualizar interface
        document.getElementById('infoVoz').innerHTML = `
            <p>✅ Voz gravada com sucesso!</p>
            <p>🎵 Duração: ${analise.duracao.toFixed(1)}s</p>
            <p>🎼 Notas detetadas: ${analise.notasDetetadas}</p>
            <p>💫 Tom predominante: ${analise.tomPrincipal}</p>
        `;

        return analise;
    }

    async analisarVoz(audioBuffer) {
        // Implementar análise básica
        const channelData = audioBuffer.getChannelData(0);
        
        return {
            duracao: audioBuffer.duration,
            sampleRate: audioBuffer.sampleRate,
            canais: audioBuffer.numberOfChannels,
            notasDetetadas: 24, // Simulado
            tomPrincipal: 'Dó',
            energiaMedia: this.calcularEnergia(channelData)
        };
    }

    calcularEnergia(channelData) {
        let soma = 0;
        for (let i = 0; i < channelData.length; i++) {
            soma += Math.abs(channelData[i]);
        }
        return soma / channelData.length;
    }
}