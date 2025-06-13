import {useEffect, useState} from "react";
import { configGame } from "../Configs/Config";
import {useWebSocket} from "../Context/WebSocketContext.tsx";
import type {IMessage} from "@stomp/stompjs";
import { getPlayerId, setGameId } from "../Utils/LocalStorage.tsx";
import 'bulma/css/bulma.min.css';
import {useNavigate} from "react-router-dom";

export function SearchGame({ onGameFound }: { onGameFound: () => void }) {

    const idPlayer = getPlayerId();

    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'error' | 'info' | 'success', text: string } | null>(null);
    const {stompClient, isConnected } = useWebSocket() ?? {};
    const [showConfirm, setShowConfirm] = useState(false);
    const navigate = useNavigate();
    const [confirmHandler, setConfirmHandler] = useState<((value: boolean) => void) | null>(null);
    const [confirmMessage, setConfirmMessage] = useState('');

    const handleSearch = async () => {
        try {
            const response = await fetch(`${configGame.apiUrl}/game/init/search-game`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ playerId: idPlayer }),
        
            });
            
            if (response.ok) {
                setIsLoading(true);
            }
            if (response.status == 409){
                const userChoice = await askForConfirmation('Você tem um jogo em aberto, deseja continuar?');
                const status = userChoice ? 'YES' : 'NOT';
                const response = await fetch(`${configGame.apiUrl}/game/init/rescue-game`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ playerId: idPlayer, statusForRescue: status }),
                });

                if(!response.ok){
                    console.log('deu errado');
                }
                setShowConfirm(false);
            }
            if (response.status == 422){
                const userChoice = await askForConfirmation('Você já esta aguardando um jogo, deseja continuar?');
                const status = userChoice ? 'YES' : 'NOT';
                const response = await fetch(`${configGame.apiUrl}/game/init/waiting-handle-game`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ playerId: idPlayer, statusForRescue: status }),
                });

                if(!response.ok){
                    console.log('deu errado');
                }
                setShowConfirm(false);
            }

        } catch (error) {
            setMessage({ type: 'error', text: 'Erro ao buscar jogo' });
            console.log(error)
        }
    };

    const askForConfirmation = (message: string): Promise<boolean> => {
        return new Promise((resolve) => {
            setConfirmMessage(message);
            const handleConfirm = (resposta: boolean) => {
                setShowConfirm(false);
                resolve(resposta);
            };

            setShowConfirm(() => {
                setConfirmHandler(() => handleConfirm);
                return true;
            });
        });
    };
    
    useEffect(() => {
        if(!isConnected || !stompClient) return;
        const gameStartedSubscription = stompClient.subscribe(`/topics/game-started/${idPlayer}`, async (message: IMessage) => {
            console.log('✅✅✅ game started message')

            const body = JSON.parse(message.body);
            setGameId(body.gameId);

            setMessage({ type: 'success', text: 'Iniciando jogo...' });
            onGameFound()
            console.log(`✅ mensagem recebida: ${body}`)
        });

        const errorSubscription = stompClient.subscribe('/user/queue/errors', (message: IMessage) => {
            const body = JSON.parse(message.body);
            console.log('❌ Error na requisição:', body)
            // Tratamento para erros recebidos
        });

        const notificationSubscription = stompClient.subscribe(`/topics/game-notify/${idPlayer}`, (message: IMessage) =>{
            const body = JSON.parse(message.body);

            const {notification, gameId} = body;
            console.log(body)
            if(notification === "RESUMED"){
                setMessage({ type: 'success', text: 'Iniciando jogo...' });
                setGameId(gameId);
                setIsLoading(false)
                navigate('/game')
            }
            if(notification === "CANCELLED"){
                setMessage({ type: 'info', text: 'Jogo Cancelado' });
                setIsLoading(false)
            }
            if(notification === "WAITING_OTHER_PLAYER"){
                setMessage({ type: 'info', text: 'Aguardando outro jogador' });
                setIsLoading(true);
            }
        });

        return () => {
            gameStartedSubscription.unsubscribe();
            errorSubscription.unsubscribe();
            notificationSubscription.unsubscribe();
        };
    }, [onGameFound]);

    return (
        <div itemID="search-container">
            {!showConfirm && <div itemID="teste">
                <h1 className="title is-3">Procurar Partida</h1>
                <button
                    className="button is-link is-medium"
                    title="Disabled button"
                    onClick={handleSearch}
                    disabled={isLoading}
                >
                    Procurar Jogo
                </button>
            </div>}

            {message && (
                <p className={`notification is-${message.type} mt-3`}>
                    {message.text}
                </p>
            )}
            {showConfirm && confirmHandler && ( <ConfirmButton onConfirm={confirmHandler} msg={confirmMessage} />)}
        </div>
    );

}

export function ConfirmButton(
    {
        onConfirm,
        msg
    }: {
        onConfirm: (confirm: boolean) => void;
        msg:string
    }) {
    return (
        <div itemID="confirm-buttons">
            <h1 className="title is-5" >{msg}</h1>
            <div itemID="style-buttons">
                <button 
                className="button is-danger is-large"
                onClick={() => onConfirm(false)}>NÃO</button>
                <button 
                className="button is-success is-large"
                onClick={() => onConfirm(true)}>SIM</button>
            </div>
        </div>
    );
}