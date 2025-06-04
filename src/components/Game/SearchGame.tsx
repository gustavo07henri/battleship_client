import {useEffect, useState} from "react";
import { configGame } from "../Configs/Config";
//import { useNavigate } from "react-router-dom";
import {useWebSocket} from "../Context/WebSocketContext.tsx";
import type {IMessage} from "@stomp/stompjs";
import { getPlayerId, setGameId } from "../Utils/LocalStorage.tsx";
import 'bulma/css/bulma.min.css';

export function SearchGame({ onGameFound }: { onGameFound: () => void }) {

    const playerId = getPlayerId();
    //const navigate = useNavigate();
    
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
            //navigate('/init');
            onGameFound()
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
    }, [onGameFound]);


    return (
        <div className="container mt-5">
            <h1 className="title is-3">Procurar Partida</h1>
            <button
                className="button is-link is-medium"
                title="Disabled button"
                onClick={handleSearch}
                disabled={isLoading}
            >
                Search
            </button>

            {error && <p className="notification is-danger mt-3">{error}</p>}
            {isLoading && <p className="notification is-info mt-3">Buscando jogo...</p>}
            {success && <p className="notification is-success mt-3">{success}</p>}
        </div>
    );

}