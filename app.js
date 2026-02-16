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

            // GERAR MÚSICA (simulado por enquanto)
            alert('✅ Música gerada com sucesso! (Modo demonstração)');
            
            // Mostrar resultado
            document.getElementById('resultado').style.display = 'block';

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

    exportarMP3() {
        alert('Função MP3 em desenvolvimento!');
    }

    exportarWAV() {
        alert('Função WAV em desenvolvimento!');
    }

    compartilhar() {
        alert('Função compartilhar em desenvolvimento!');
    }

    atualizarInterface() {
        console.log('🖥️ Interface atualizada');
    }
}

// Garantir que a classe está disponível globalmente
console.log('📦 app.js carregado, classe VozStudio definida:', typeof VozStudio);

window.VozStudio = VozStudio;