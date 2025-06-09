import {useEffect, useState} from "react";
import { configGame } from "../Configs/Config";
import {useWebSocket} from "../Context/WebSocketContext.tsx";
import type {IMessage} from "@stomp/stompjs";
import { getPlayerId, setGameId } from "../Utils/LocalStorage.tsx";
import 'bulma/css/bulma.min.css';
import {useNavigate} from "react-router-dom";

export function SearchGame({ onGameFound }: { onGameFound: () => void }) {

    const idPlayer = getPlayerId();
    //const navigate = useNavigate();
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [waitingPlayer, setWaitingPlayer] = useState('');
    const [gameCanceled, setGameCanceled] = useState('');
    const {stompClient, isConnected } = useWebSocket() ?? {};
    const [showConfirm, setShowConfirm] = useState(false);
    const [resposta, setResposta] = useState<boolean | null>(null);
    const [confirmHandler, setConfirmHandler] = useState<((value: boolean) => void) | null>(null);
    const navigate = useNavigate();

    const handleConfirm = (valor: boolean) => {
        setResposta(valor);
    };

    const handleSearch = async () => {
        setIsLoading(true);
        setError('');
        setSuccess('');
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
                const userChoice = await askForConfirmation(); // Aguarda a resposta do usuário
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

        } catch (error) {
            setError('Erro ao buscar jogo');
            console.log(error)
        } finally {
            setIsLoading(false);
        }
    };

    const askForConfirmation = (): Promise<boolean> => {
        return new Promise((resolve) => {
            const handleConfirm = (resposta: boolean) => {
                setShowConfirm(false);
                resolve(resposta);
            };
    
            setShowConfirm(() => {
                // Envia o confirm handler como um closure que resolve a promise
                setConfirmHandler(() => handleConfirm);
                return true;
            });
        });
    };
    
    useEffect(() => {
        if(!isConnected || !stompClient) return;
        const gameStartedSubscription = stompClient.subscribe(`/topics/game-started/${idPlayer}`, async (message: IMessage) => {

            const body = JSON.parse(message.body);
            setGameId(body.gameId);
            
            const response = 'Iniciando jogo...';
            setSuccess(response);
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

            const {notification} = body;
           
            if(notification === "RESUMED"){
                setSuccess('Iniciando jogo...');
                navigate('/game')
            }
            if(notification === "CANCELLED"){
                setGameCanceled('Jogo Cancelado');
            }
            if(notification === "WAITING_OTHER_PLAYER"){
                setWaitingPlayer('Aguardando outro jogador')
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

            {error && <p className="notification is-danger mt-3">{error}</p>}
            {isLoading && !showConfirm && <p className="notification is-info mt-3">Buscando jogo...</p>}
            {waitingPlayer && <p className="notification is-info mt-3">{waitingPlayer}</p>}
            {gameCanceled && <p className="notification is-info mt-3">{gameCanceled}</p>}
            {success && <p className="notification is-success mt-3">{success}</p>}
            {showConfirm && confirmHandler && ( <ConfirmButton onConfirm={confirmHandler} />)}
        </div>
    );

}

export function ConfirmButton({ onConfirm }: { onConfirm: (confirm: boolean) => void }) {
    return (
        <div itemID="confirm-buttons">
            <h1 className="title is-5" >Você tem um jogo em aberto, deseja continuar?</h1>
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