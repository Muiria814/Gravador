// gerador.js - Cria o instrumental baseado na voz
class GeradorMusical {
    constructor() {
        this.sintetizadores = {};
        this.sequencias = {};
        this.toneIniciado = false;
        this.samples = {
            piano: {},
            bateria: {},
            baixo: {}
        };
        this.vozPlayer = null; // Para guardar o player da voz
    }

    async iniciarTone() {
        if (!this.toneIniciado) {
            await Tone.start();
            this.toneIniciado = true;
        }
    }

    async carregarSamples() {
        console.log('🎹 Carregando samples...');
        
        // Carregar piano samples
        const notasPiano = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'];
        for (const nota of notasPiano) {
            try {
                const response = await fetch(`assets/samples/piano/${nota}.mp3`);
                const buffer = await response.arrayBuffer();
                this.samples.piano[nota] = await Tone.context.decodeAudioData(buffer);
                console.log(`✅ Sample piano ${nota} carregado`);
            } catch (e) {
                console.log(`⚠️ Sample piano ${nota} não encontrado, usando sintetizador`);
            }
        }

        // Carregar bateria samples
        const sonsBateria = ['kick', 'snare', 'hihat', 'crash'];
        for (const som of sonsBateria) {
            try {
                const response = await fetch(`assets/samples/bateria/${som}.mp3`);
                const buffer = await response.arrayBuffer();
                this.samples.bateria[som] = await Tone.context.decodeAudioData(buffer);
                console.log(`✅ Sample bateria ${som} carregado`);
            } catch (e) {
                console.log(`⚠️ Sample bateria ${som} não encontrado`);
            }
        }

        // Carregar baixo samples
        const notasBaixo = ['C2', 'D2', 'E2', 'F2', 'G2', 'A2', 'B2'];
        for (const nota of notasBaixo) {
            try {
                const response = await fetch(`assets/samples/baixo/${nota}.mp3`);
                const buffer = await response.arrayBuffer();
                this.samples.baixo[nota] = await Tone.context.decodeAudioData(buffer);
                console.log(`✅ Sample baixo ${nota} carregado`);
            } catch (e) {
                console.log(`⚠️ Sample baixo ${nota} não encontrado`);
            }
        }
    }

    async gerarMusica(analiseVoz, configuracoes) {
        await this.iniciarTone();
        
        await this.carregarSamples();
        
        // Limpar músicas anteriores
        this.limparTudo();
        
        const instrumentos = [];
        
        // Criar os instrumentos selecionados
        if (configuracoes.piano) {
            instrumentos.push(await this.criarPiano());
        }
        
        if (configuracoes.baixo) {
            instrumentos.push(await this.criarBaixo());
        }
        
        if (configuracoes.bateria) {
            instrumentos.push(await this.criarBateria(configuracoes.bpm));
        }
        
        if (configuracoes.guitarra) {
            instrumentos.push(await this.criarGuitarra());
        }
        
        // ===========================================
        // NOVO: Adicionar a voz gravada à música
        // ===========================================
        if (analiseVoz.audioData) {
            console.log('🎤 Adicionando voz à música...');
            
            // Criar player para a voz
            this.vozPlayer = new Tone.Player(analiseVoz.audioData).toDestination();
            
            // Ajustar volume da voz (opcional)
            this.vozPlayer.volume.value = -3; // Reduzir um pouco para não sobrepor
            
            // Adicionar aos instrumentos
            instrumentos.push(this.vozPlayer);
            
            console.log('✅ Voz adicionada!');
        } else {
            console.log('⚠️ Nenhuma voz encontrada para adicionar');
        }
        
        // Gerar progressão de acordes baseada no estilo
        const acordes = this.gerarAcordes(
            configuracoes.estilo,
            configuracoes.tom,
            analiseVoz
        );
        
        // Gerar melodia baseada na voz (para os instrumentos)
        const melodia = this.adaptarMelodia(
            analiseVoz,
            configuracoes.tom,
            acordes
        );
        
        // Criar as sequências (para os instrumentos)
        this.criarSequencias(instrumentos, acordes, melodia, configuracoes);
        
        // ===========================================
        // NOVO: Iniciar a voz no tempo certo
        // ===========================================
        if (this.vozPlayer) {
            // Começar a voz um pouco depois para sincronizar com os instrumentos
            Tone.Transport.schedule((time) => {
                this.vozPlayer.start(time);
            }, 0);
        }
        
        // Iniciar tudo
        Tone.Transport.start();
        
        return {
            acordes,
            melodia,
            bpm: configuracoes.bpm,
            duracao: analiseVoz.duracao
        };
    }

    // ===========================================
    // MÉTODOS EXISTENTES (mantém iguais)
    // ===========================================
    
    async criarPiano() {
        if (Object.keys(this.samples.piano).length > 0) {
            console.log('🎹 Usando samples reais de piano');
            
            const urls = {};
            for (const nota of Object.keys(this.samples.piano)) {
                urls[nota] = `${nota}.mp3`;
            }
            
            const sampler = new Tone.Sampler({
                urls: urls,
                baseUrl: "assets/samples/piano/",
                attack: 0.01,
                release: 0.5,
                onload: () => console.log('✅ Piano samples carregados')
            }).toDestination();
            
            sampler.volume.value = -5;
            return sampler;
            
        } else {
            console.log('🎹 Usando sintetizador (sem samples)');
            const synth = new Tone.Synth({
                oscillator: {
                    type: 'triangle'
                },
                envelope: {
                    attack: 0.01,
                    decay: 0.1,
                    sustain: 0.3,
                    release: 1
                }
            }).toDestination();
            
            synth.volume.value = -5;
            return synth;
        }
    }

    async criarBaixo() {
        if (Object.keys(this.samples.baixo).length > 0) {
            console.log('🎸 Usando samples reais de baixo');
            
            const urls = {};
            for (const nota of Object.keys(this.samples.baixo)) {
                urls[nota] = `${nota}.mp3`;
            }
            
            const sampler = new Tone.Sampler({
                urls: urls,
                baseUrl: "assets/samples/baixo/",
            }).toDestination();
            
            sampler.volume.value = -3;
            return sampler;
            
        } else {
            console.log('🎸 Usando sintetizador de baixo');
            const baixo = new Tone.MembraneSynth({
                pitchDecay: 0.05,
                octaves: 4,
                envelope: {
                    attack: 0.01,
                    decay: 0.4,
                    sustain: 0.2,
                    release: 1.5
                }
            }).toDestination();
            
            baixo.volume.value = -3;
            return baixo;
        }
    }

    async criarBateria(bpm) {
        if (Object.keys(this.samples.bateria).length > 0) {
            console.log('🥁 Usando samples reais de bateria');
            
            const sampler = new Tone.Sampler({
                urls: {
                    kick: "kick.mp3",
                    snare: "snare.mp3",
                    hihat: "hihat.mp3",
                    crash: "crash.mp3"
                },
                baseUrl: "assets/samples/bateria/",
            }).toDestination();
            
            const padrao = this.gerarPadraoBateria(bpm);
            
            return { sampler, padrao };
            
        } else {
            console.log('🥁 Usando sintetizador de bateria');
            const bateria = new Tone.MembraneSynth().toDestination();
            const padrao = this.gerarPadraoBateria(bpm);
            return { sintetizador: bateria, padrao };
        }
    }

    async criarGuitarra() {
        const guitarra = new Tone.NoiseSynth({
            noise: {
                type: "brown"
            },
            envelope: {
                attack: 0.005,
                decay: 0.1,
                sustain: 0.05,
                release: 0.8
            }
        }).toDestination();
        
        return guitarra;
    }

    gerarAcordes(estilo, tom, analiseVoz) {
        const progressoes = {
            pop: ['C', 'G', 'Am', 'F'],
            rap: ['Dm', 'Am', 'C', 'G'],
            kizomba: ['Em', 'C', 'G', 'D'],
            semba: ['C', 'F', 'G', 'C'],
            afrobeat: ['D', 'G', 'A', 'D'],
            gospel: ['C', 'F', 'G', 'Am'],
            acustico: ['C', 'Am', 'F', 'G']
        };

        const acordesBase = progressoes[estilo] || progressoes.pop;
        
        return acordesBase.map(acorde => 
            this.transporAcorde(acorde, tom)
        );
    }

    transporAcorde(acorde, novoTom) {
        const notas = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        
        const notaBase = acorde.replace(/[^A-G#]/g, '');
        const qualidade = acorde.replace(notaBase, '');
        
        const indiceAtual = notas.indexOf(notaBase);
        const indiceNovo = notas.indexOf(novoTom);
        
        const diferenca = indiceNovo - notas.indexOf('C');
        const novoIndice = (indiceAtual + diferenca + 12) % 12;
        
        return notas[novoIndice] + qualidade;
    }

    adaptarMelodia(analiseVoz, tom, acordes) {
        console.log('🎵 Extraindo melodia real da voz...');
        
        if (!analiseVoz.audioData) {
            console.log('⚠️ Sem dados de áudio, usando melodia genérica');
            return this.gerarMelodiaGenerica(acordes, analiseVoz.duracao || 30);
        }
        
        const notasCantadas = this.extrairNotasDaVoz(analiseVoz.audioData);
        
        if (notasCantadas.length === 0) {
            console.log('⚠️ Nenhuma nota detetada, usando genérica');
            return this.gerarMelodiaGenerica(acordes, analiseVoz.duracao || 30);
        }
        
        console.log(`✅ Detetadas ${notasCantadas.length} notas da voz`);
        
        const melodia = [];
        
        for (let i = 0; i < notasCantadas.length; i++) {
            const nota = notasCantadas[i];
            
            const notaMusical = this.frequenciaParaNota(nota.frequencia);
            
            if (notaMusical) {
                melodia.push({
                    nota: notaMusical,
                    tempo: nota.inicio,
                    duracao: Math.max(0.1, nota.duracao)
                });
            }
        }
        
        if (melodia.length === 0) {
            return this.gerarMelodiaGenerica(acordes, analiseVoz.duracao || 30);
        }
        
        return melodia;
    }

    extrairNotasDaVoz(audioBuffer) {
        const notas = [];
        const channelData = audioBuffer.getChannelData(0);
        const sampleRate = audioBuffer.sampleRate;
        
        const janelaTamanho = 2048;
        const passo = 512;
        const limiarEnergia = 0.01;
        const minimoDuracao = 0.1;
        
        let notaAtual = null;
        
        for (let i = 0; i < channelData.length - janelaTamanho; i += passo) {
            const energia = this.calcularEnergia(channelData, i, janelaTamanho);
            
            if (energia > limiarEnergia) {
                const frequencia = this.detectarFrequencia(
                    channelData, i, janelaTamanho, sampleRate
                );
                
                if (frequencia >= 80 && frequencia <= 1100) {
                    if (!notaAtual) {
                        notaAtual = {
                            frequencia: frequencia,
                            inicio: i / sampleRate,
                            fim: i / sampleRate,
                            energias: [energia]
                        };
                    } else {
                        notaAtual.fim = (i + janelaTamanho) / sampleRate;
                        notaAtual.energias.push(energia);
                        
                        notaAtual.frequencia = 
                            (notaAtual.frequencia * (notaAtual.energias.length - 1) + frequencia) 
                            / notaAtual.energias.length;
                    }
                }
            } else {
                if (notaAtual) {
                    const duracao = notaAtual.fim - notaAtual.inicio;
                    if (duracao >= minimoDuracao) {
                        notas.push(notaAtual);
                    }
                    notaAtual = null;
                }
            }
        }
        
        if (notaAtual) {
            const duracao = notaAtual.fim - notaAtual.inicio;
            if (duracao >= minimoDuracao) {
                notas.push(notaAtual);
            }
        }
        
        return notas;
    }

    calcularEnergia(dados, inicio, tamanho) {
        let soma = 0;
        for (let i = 0; i < tamanho; i++) {
            if (inicio + i < dados.length) {
                soma += dados[inicio + i] * dados[inicio + i];
            }
        }
        return Math.sqrt(soma / tamanho);
    }

    detectarFrequencia(dados, inicio, tamanho, sampleRate) {
        const buffer = [];
        for (let i = 0; i < tamanho; i++) {
            if (inicio + i < dados.length) {
                buffer.push(dados[inicio + i]);
            } else {
                buffer.push(0);
            }
        }
        
        let melhorAtraso = -1;
        let melhorCorrelacao = -1;
        
        const atrasoMin = Math.floor(sampleRate * 0.002);
        const atrasoMax = Math.floor(sampleRate * 0.012);
        
        for (let atraso = atrasoMin; atraso < atrasoMax; atraso++) {
            let correlacao = 0;
            let divisor = 0;
            
            for (let i = 0; i < buffer.length - atraso; i++) {
                correlacao += buffer[i] * buffer[i + atraso];
                divisor += buffer[i] * buffer[i];
            }
            
            if (divisor > 0) {
                correlacao = correlacao / divisor;
                
                if (correlacao > melhorCorrelacao) {
                    melhorCorrelacao = correlacao;
                    melhorAtraso = atraso;
                }
            }
        }
        
        if (melhorAtraso > 0 && melhorCorrelacao > 0.1) {
            return sampleRate / melhorAtraso;
        }
        
        return 0;
    }

    frequenciaParaNota(frequencia) {
        const notas = {
            'C0': 16.35, 'C#0': 17.32, 'D0': 18.35, 'D#0': 19.45, 'E0': 20.60, 'F0': 21.83,
            'F#0': 23.12, 'G0': 24.50, 'G#0': 25.96, 'A0': 27.50, 'A#0': 29.14, 'B0': 30.87,
            'C1': 32.70, 'C#1': 34.65, 'D1': 36.71, 'D#1': 38.89, 'E1': 41.20, 'F1': 43.65,
            'F#1': 46.25, 'G1': 49.00, 'G#1': 51.91, 'A1': 55.00, 'A#1': 58.27, 'B1': 61.74,
            'C2': 65.41, 'C#2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'E2': 82.41, 'F2': 87.31,
            'F#2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'A2': 110.00, 'A#2': 116.54, 'B2': 123.47,
            'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61,
            'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
            'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23,
            'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
            'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46,
            'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77
        };
        
        let melhorNota = null;
        let menorDiferenca = Infinity;
        
        for (const [nota, freq] of Object.entries(notas)) {
            const diferenca = Math.abs(frequencia - freq);
            if (diferenca < menorDiferenca && diferenca < freq * 0.06) {
                menorDiferenca = diferenca;
                melhorNota = nota;
            }
        }
        
        return melhorNota;
    }

    gerarMelodiaGenerica(acordes, duracao) {
        console.log('🎵 Gerando melodia genérica');
        const melodia = [];
        const numNotas = Math.floor(duracao / 0.5);
        
        for (let i = 0; i < numNotas; i++) {
            const acordeAtual = acordes[Math.floor(i / 4) % acordes.length];
            const notaBase = acordeAtual.replace(/[^A-G#]/g, '');
            
            const oitava = Math.random() > 0.7 ? '5' : '4';
            
            melodia.push({
                nota: notaBase + oitava,
                tempo: i * 0.5,
                duracao: 0.25
            });
        }
        
        return melodia;
    }

    gerarPadraoBateria(bpm) {
        const padrao = [];
        
        for (let i = 0; i < 16; i++) {
            if (i % 4 === 0) {
                padrao.push({ tempo: i * 0.25, tipo: 'kick' });
            }
            if (i % 2 === 1) {
                padrao.push({ tempo: i * 0.25, tipo: 'snare' });
            }
            if (i % 1 === 0) {
                padrao.push({ tempo: i * 0.25, tipo: 'hat' });
            }
        }
        
        return padrao;
    }

    criarSequencias(instrumentos, acordes, melodia, config) {
        if (instrumentos[0]) {
            const parteAcordes = new Tone.Part((time, acorde) => {
                if (instrumentos[0].triggerAttackRelease) {
                    instrumentos[0].triggerAttackRelease(acorde + '3', '2n', time);
                }
            }, acordes.map((acorde, i) => [i * 2, acorde]));
            
            parteAcordes.loop = true;
            parteAcordes.loopEnd = '8m';
            parteAcordes.start(0);
        }
        
        if (instrumentos[1]) {
            const notasBaixo = acordes.map(acorde => {
                const notaBase = acorde.replace(/[^A-G#]/g, '');
                return notaBase + '2';
            });
            
            const parteBaixo = new Tone.Part((time, nota) => {
                if (instrumentos[1].triggerAttackRelease) {
                    instrumentos[1].triggerAttackRelease(nota, '4n', time);
                }
            }, notasBaixo.map((nota, i) => [i * 2, nota]));
            
            parteBaixo.loop = true;
            parteBaixo.loopEnd = '8m';
            parteBaixo.start(0);
        }
        
        if (melodia.length > 0 && instrumentos[0]) {
            const parteMelodia = new Tone.Part((time, nota) => {
                if (instrumentos[0].triggerAttackRelease) {
                    instrumentos[0].triggerAttackRelease(nota.nota, nota.duracao, time);
                }
            }, melodia);
            
            parteMelodia.start(0);
        }
    }

    limparTudo() {
        Tone.Transport.stop();
        Tone.Transport.cancel();
        
        // Limpar o player da voz se existir
        if (this.vozPlayer) {
            this.vozPlayer.dispose();
            this.vozPlayer = null;
        }
    }

    tocar() {
        Tone.Transport.start();
    }

    parar() {
        Tone.Transport.stop();
    }
}