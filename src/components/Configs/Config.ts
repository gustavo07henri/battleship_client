// Configurações globais do jogo
export const configGame = {
    SIZE: 10, // Tamanho do tabuleiro (10x10)
    LETTERS: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
    playerId: localStorage.getItem('playerId') || '', // ID do jogador, obtido do ambiente
    gameId: import.meta.env.VITE_ID_GAME || '', // ID do jogo, obtido do ambiente
    apiUrl: import.meta.env.VITE_API_URL || '', // URL da API, obtida do ambiente
};