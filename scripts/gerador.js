class GeradorMusical {
    constructor() {
        this.sintetizadores = {};
        this.sequencias = {};
        this.toneIniciado = false;
    }

    async iniciarTone() {
        if (!this.toneIniciado) {
            await Tone.start();
            this.toneIniciado = true;
        }
    }

    async gerarMusica(analiseVoz, configuracoes) {
        await this.iniciarTone();
        
        // Limpar músicas anteriores
        this.limparTudo();
        
        // Criar os instrumentos selecionados
        const instrumentos = [];
        
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
        
        // Gerar progressão de acordes baseada no estilo
        const acordes = this.gerarAcordes(
            configuracoes.estilo,
            configuracoes.tom,
            analiseVoz
        );
        
        // Gerar melodia baseada na voz
        const melodia = this.adaptarMelodia(
            analiseVoz,
            configuracoes.tom,
            acordes
        );
        
        // Criar as sequências
        this.criarSequencias(instrumentos, acordes, melodia, configuracoes);
        
        return {
            acordes,
            melodia,
            bpm: configuracoes.bpm,
            duracao: analiseVoz.duracao
        };
    }

    async criarPiano() {
        const piano = new Tone.Sampler({
            urls: {
                C4: "C4.mp3",
                "D#4": "Ds4.mp3",
                "F#4": "Fs4.mp3",
                A4: "A4.mp3",
            },
            baseUrl: "https://tonejs.github.io/audio/salamander/",
        }).toDestination();
        
        piano.volume.value = -5;
        return piano;
    }

    async criarBaixo() {
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

    async criarBateria(bpm) {
        const bateria = new Tone.MembraneSynth().toDestination();
        
        // Criar padrão baseado no BPM
        const padrao = this.gerarPadraoBateria(bpm);
        
        return { sintetizador: bateria, padrao };
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
        // Progressões de acordes para diferentes estilos
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
        
        // Adaptar ao tom escolhido
        return acordesBase.map(acorde => 
            this.transporAcorde(acorde, tom)
        );
    }

    transporAcorde(acorde, novoTom) {
        const notas = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        
        // Extrair nota base do acorde (ex: "Am" -> "A")
        const notaBase = acorde.replace(/[^A-G#]/g, '');
        const qualidade = acorde.replace(notaBase, '');
        
        const indiceAtual = notas.indexOf(notaBase);
        const indiceNovo = notas.indexOf(novoTom);
        
        const diferenca = indiceNovo - notas.indexOf('C');
        const novoIndice = (indiceAtual + diferenca + 12) % 12;
        
        return notas[novoIndice] + qualidade;
    }

    adaptarMelodia(analiseVoz, tom, acordes) {
        // Aqui implementarias a lógica para extrair
        // a melodia real da voz gravada
        
        // Por agora, geramos uma melodia simples baseada nos acordes
        const melodia = [];
        const duracao = analiseVoz.duracao || 30;
        
        for (let i = 0; i < 16; i++) {
            const acordeAtual = acordes[Math.floor(i / 4) % acordes.length];
            const notaBase = acordeAtual.replace(/[^A-G#]/g, '');
            melodia.push({
                nota: notaBase + '4',
                tempo: i * 0.5,
                duracao: 0.25
            });
        }
        
        return melodia;
    }

    gerarPadraoBateria(bpm) {
        // Criar ritmo baseado no estilo
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
        // Criar sequência de piano/acordes
        if (instrumentos[0]) {
            const parteAcordes = new Tone.Part((time, acorde) => {
                instrumentos[0].triggerAttackRelease(acorde + '3', '2n', time);
            }, acordes.map((acorde, i) => [i * 2, acorde]));
            
            parteAcordes.loop = true;
            parteAcordes.loopEnd = '8m';
            parteAcordes.start(0);
        }
        
        // Criar sequência de baixo
        if (instrumentos[1]) {
            const notasBaixo = acordes.map(acorde => {
                const notaBase = acorde.replace(/[^A-G#]/g, '');
                return notaBase + '2';
            });
            
            const parteBaixo = new Tone.Part((time, nota) => {
                instrumentos[1].triggerAttackRelease(nota, '4n', time);
            }, notasBaixo.map((nota, i) => [i * 2, nota]));
            
            parteBaixo.loop = true;
            parteBaixo.loopEnd = '8m';
            parteBaixo.start(0);
        }
        
        // Criar melodia
        if (melodia.length > 0 && instrumentos[0]) {
            const parteMelodia = new Tone.Part((time, nota) => {
                instrumentos[0].triggerAttackRelease(nota.nota, nota.duracao, time);
            }, melodia);
            
            parteMelodia.start(0);
        }
    }

    limparTudo() {
        Tone.Transport.stop();
        Tone.Transport.cancel();
    }

    tocar() {
        Tone.Transport.start();
    }

    parar() {
        Tone.Transport.stop();
    }
}