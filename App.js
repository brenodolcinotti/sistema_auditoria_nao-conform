import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Button, TouchableOpacity, Alert } from 'react-native';
// Módulos nativos de hardware específicos do Expo para câmera e microfone
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
// Módulos modernos de reprodução de vídeo
import { VideoView, useVideoPlayer } from 'expo-video';

export default function App() {
  // --- ESTADOS DE PERMISSÃO ---
  const [permissaoCamera, pedirPermissaoCamera] = useCameraPermissions();
  const [permissaoAudio, pedirPermissaoAudio] = useMicrophonePermissions();
  
  // --- ESTADOS DO APLICATIVO ---
  const [gravando, setGravando] = useState(false);
  const [uriVideo, setUriVideo] = useState(null);
  
  // --- REFERÊNCIAS ---
  const cameraRef = useRef(null);

  // --- CONFIGURAÇÃO DO PLAYER ---
  const player = useVideoPlayer(uriVideo, (playerInstance) => {
    playerInstance.loop = true; // Mantém o vídeo em loop para o inspetor analisar
    playerInstance.play();
  });

  // --- EFEITO COLATERAL PARA PEDIR PERMISSÕES AO INICIAR ---
  useEffect(() => {
    pedirPermissaoCamera();
    pedirPermissaoAudio();
  }, []);

  // --- VALIDAÇÃO DE ESTADO DE CARREGAMENTO DAS PERMISSÕES ---
  if (!permissaoCamera || !permissaoAudio) {
    return (
      <View style={styles.containerLoad}>
        <Text style={styles.textoCarregando}>Carregando módulo de auditoria...</Text>
      </View>
    );
  }

  // --- TELA DE BLOQUEIO CASO O INSPETOR NEGUE AS PERMISSÕES ---
  if (!permissaoCamera.granted || !permissaoAudio.granted) {
    return (
      <View style={styles.containerLoad}>
        <Text style={styles.textoErro}>
          Acesso obrigatório: Precisamos da câmera e microfone para registrar a Não-Conformidade.
        </Text>
        <Button 
          title="Conceder Permissões" 
          onPress={() => { pedirPermissaoCamera(); pedirPermissaoAudio(); }} 
        />
      </View>
    );
  }

  // --- FUNÇÕES DE CONTROLE DE GRAVAÇÃO E FLUXO ---
  const alternarGravacao = async () => {
    if (cameraRef.current) {
      if (!gravando) {
        try {
          setGravando(true);
          // Gravação assíncrona com limite forçado conforme requisito
          const dadosVideo = await cameraRef.current.recordAsync({
            maxDuration: 15, // Limite de 15 segundos imposto
          });
          setUriVideo(dadosVideo.uri);
          setGravando(false);
        } catch (erro) {
          console.error("Erro ao gravar prova de falha:", erro);
          setGravando(false);
        }
      } else {
        // Para a gravação manualmente antes dos 15 segundos, se desejado
        cameraRef.current.stopRecording();
        setGravando(false);
      }
    }
  };

  const descartarVideo = () => {
    // Limpa o estado voltando para a Câmera
    setUriVideo(null);
  };

  const confirmarEnvio = () => {
    // Simula o envio para a engenharia de produto
    Alert.alert(
      "Relatório Enviado", 
      "O vídeo da Não-Conformidade foi transferido para o setor de Engenharia com sucesso!"
    );
    // Limpa a tela para a próxima inspeção
    setUriVideo(null);
  };

  // --- RENDERIZAÇÃO CONDICIONAL DA INTERFACE ---
  return (
    <View style={styles.container}>
      {uriVideo ? (
        // ==========================================
        // MODO DE REVISÃO (PLAYER ATIVO)
        // ==========================================
        <View style={styles.containerMidia}>
          <VideoView
            player={player}
            style={styles.midia}
            allowsFullscreen
            allowsPictureInPicture
          />
          <View style={styles.painelAcoesPlayer}>
            <TouchableOpacity style={styles.botaoConfirmar} onPress={confirmarEnvio}>
              <Text style={styles.textoBotaoAcao}>Confirmar Envio</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.botaoDescartar} onPress={descartarVideo}>
              <Text style={styles.textoBotaoAcao}>Descartar e Gravar Novamente</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        // ==========================================
        // MODO DE INSPEÇÃO (CÂMERA ATIVA)
        // ==========================================
        <View style={styles.containerMidia}>
          <CameraView
            style={styles.midia}
            ref={cameraRef}
            mode="video"
          />
          
          <View style={styles.containerBotaoCamera}>
            <TouchableOpacity
              style={[styles.botaoGravar, gravando && styles.botaoGravando]}
              onPress={alternarGravacao}
            >
              <Text style={styles.textoBotaoGravar}>
                {gravando ? 'PARAR GRAVAÇÃO' : 'INICIAR GRAVAÇÃO (Máx 15s)'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// --- ESTILOS ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  containerLoad: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  containerMidia: {
    flex: 1,
    justifyContent: 'center',
  },
  midia: {
    flex: 1,
    width: '100%',
  },
  containerBotaoCamera: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
  },
  botaoGravar: {
    backgroundColor: '#28a745', // Verde indicando que está pronto para gravar
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#fff',
  },
  botaoGravando: {
    backgroundColor: '#ff3b30', // Vermelho forte indicando atenção (gravando)
  },
  textoBotaoGravar: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  painelAcoesPlayer: {
    position: 'absolute',
    bottom: 30,
    width: '100%',
    paddingHorizontal: 20,
    gap: 15, // Espaçamento entre os botões
  },
  botaoConfirmar: {
    backgroundColor: '#007aff', // Azul corporativo para envio
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  botaoDescartar: {
    backgroundColor: '#ff3b30', // Vermelho para descartar
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  textoBotaoAcao: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  textoCarregando: {
    fontSize: 16,
    color: '#333',
  },
  textoErro: {
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
    fontWeight: 'bold',
  }
});