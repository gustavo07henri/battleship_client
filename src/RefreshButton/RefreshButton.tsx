import { useEffect, useState } from "react";
import { getGameId, getPlayerId } from "../components/Utils/LocalStorage.tsx";
import { configGame } from "../components/Configs/Config.ts";

export function RefreshButton() {  // Nome corrigido para PascalCase
    const [idGame, setIdGame] = useState<string | null>(null);
    const [idPlayer, setIdPlayer] = useState<string | null>(null);

    useEffect(() => {
        const gameId = getGameId();
        const playerId = getPlayerId();
        if (gameId) {
            setIdGame(gameId);
        }
        if (playerId) {
            setIdPlayer(playerId);
        }
    }, []);

    const handleSubmit = async (e: React.MouseEvent) => {  // Tipo corrigido
        e.preventDefault();

        if (!idPlayer || !idGame) {  // Validação adicionada
            console.error('Player ID ou Game ID não encontrados');
            return;
        }

        try {
            const response = await fetch(`${configGame.apiUrl}/game/init/refresh-game`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId: idPlayer, gameId: idGame }),
            });

            if (!response.ok) {
                throw new Error(`Falha no refresh: ${response.status}`);
            }
            console.log('Refresh bem sucedido');

        } catch (err) {
            console.error('Refresh mal sucedido', err);
        }
    }

    return (
        <div className="container mt-4 has-text-right">
            <button
                onClick={handleSubmit}  // Removido a chamada direta para evitar problemas
                className='button is-medium is-link'
                disabled={!idPlayer || !idGame}  // Desabilita se IDs não estiverem disponíveis
            >
                Recarregar
            </button>
        </div>
    );
}