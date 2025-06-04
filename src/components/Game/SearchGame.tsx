import {useEffect, useState} from "react";
import { configGame } from "../Configs/Config";
import { useNavigate } from "react-router-dom";
import {useWebSocket} from "../Context/WebSocketContext.tsx";
import type {IMessage} from "@stomp/stompjs";
import { getPlayerId, setGameId } from "../Utils/LocalStorage.tsx";

export function SearchGame() {

    const playerId = getPlayerId();
    const navigate = useNavigate();
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { stompClient, isConnected } = useWebSocket() ?? {};

    const handleSearch = async () => {
        setIsLoading(true);
        setError('');
        setSuccess('');
        try {
            const response = await fetch(`${configGame.apiUrl}/game/init/search-game`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ playerId }),
        
            });
            
            if (response.ok) {
                setIsLoading(true);
            }

        } catch (error) {
            setError('Erro ao buscar jogo');
            console.log(error)
        } finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
        if(!isConnected || !stompClient) return;
        const gameStarted = stompClient.subscribe(`/topics/game-started/${playerId}`, async (message: IMessage) => {

            const body = JSON.parse(message.body);
            setGameId(body.gameId);
            
            const response = 'Iniciando jogo...';
            setSuccess(response);
            navigate('/init');
            console.log(`✅ mensagem recebida: ${body}`)
        });
        const errorSubscription = stompClient.subscribe('/user/queue/errors', (message: IMessage) => {
            const body = JSON.parse(message.body);
            console.log('❌ Error na requisição:', body)
            // Tratamento para erros recebidos
        });

        return () => {
            gameStarted.unsubscribe();
            errorSubscription.unsubscribe();
        };
    }, []);


    return (
        <div className="search-game-container">
            <h1>Search Game</h1>
            <button onClick={handleSearch} disabled={isLoading}>Search</button>
            {error && <p className="error-message">{error}</p>}
            {isLoading && <p className="loading-message">Buscando jogo...</p>}
            {success && <p className="success-message">{success}</p>}
        </div>
    );
}