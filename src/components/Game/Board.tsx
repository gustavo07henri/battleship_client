import {type IMessage } from '@stomp/stompjs';
import {useEffect, useState} from "react";
import {GridGame} from "./Grid.tsx";
import type {CellState, Coordinate, Play} from "../Types/Types.ts";
import {configGame} from "../Configs/Config.ts";
import { useWebSocket } from '../Context/WebSocketContext.tsx';
import { LogoutButton} from "../LogoutButton/LogoutButton.tsx";
import {getBordShipPositions, getGameId, getPlayerId, getTurnPlay} from '../Utils/LocalStorage.tsx';
import { convertShipDtosToBoardState } from '../Utils/BoardUtils.ts';
import 'bulma/css/bulma.min.css'
import { useNavigate } from 'react-router-dom';
import {RefreshButton} from "../../RefreshButton/RefreshButton.tsx";
import {setTurnPlay} from "../Utils/LocalStorage.tsx";
import {ConfirmButton} from "./SearchGame.tsx";


export function Board() {
    const SIZE = 10;
    const navigate = useNavigate();
    const { stompClient, isConnected } = useWebSocket() ?? {};
    const [isPlayerTurn, setIsPlayerTurn] = useState(false);
    const [idGame, setIdGame] = useState<string | null>(null);
    const [idPlayer, setIdPlayer] = useState<string | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState('');
    const [onConfirmCallback, setOnConfirmCallback] = useState<(confirm: boolean) => void>(() => () => {});


    const [myBoard, setMyBoard] = useState<CellState[][]>(
        Array(SIZE).fill(null).map(() => Array(SIZE).fill('empty'))
    );
    const [enemyBoard, setEnemyBoard] = useState<CellState[][]>(
        Array(SIZE).fill(null).map(() => Array(SIZE).fill('empty'))
    );

    useEffect(() => {
        const gameId = getGameId();
        const playerId = getPlayerId();
        const turnPlay = getTurnPlay();
        const shipDtos = getBordShipPositions();

        if (gameId) setIdGame(gameId);
        if (playerId) setIdPlayer(playerId);

        if (turnPlay) {
            setIsPlayerTurn(turnPlay === 'YOUR_TURN');
        } else {
            setIsPlayerTurn(false);
        }

        if (shipDtos) {
            const boardState = convertShipDtosToBoardState(shipDtos);
            setMyBoard(boardState);
        }
    }, []);

    const updateEnemyBoard = (row: number, col : number, newState: CellState) =>{
        setEnemyBoard(prev => {
            const updated = prev.map(inner => [...inner]);
            updated[row][col] = newState;
            return updated;
        })
    }
    const updateMyBoard = (row: number, col : number, newState: CellState) =>{
        setMyBoard(prev => {
            const updated = prev.map(inner => [...inner]);
            updated[row][col] = newState;
            return updated;
        })
    }

    const sendPlay = (rowIndex: number, colIndex: number) => {
        if (!stompClient?.connected) {
            console.error('STOMP não conectado!');
            return;
        }
        if(!idGame || !idPlayer){
            throw Error('Player ID ou Game ID, nulos!!')
        }
        if (!isPlayerTurn) {
            alert('❌ Não é sua vez de jogar!');
            return;
        }

        const jogada = {
            gameId : idGame,
            coordinate: { row: rowIndex, col: colIndex },
            moment: new Date().toISOString(),
            player: idPlayer
        };

        stompClient.publish({
            destination: '/game/new-play',
            body: JSON.stringify(jogada),
            headers: { 'content-type': 'application/json' }
        });

        console.log('📤 Jogada enviada:', jogada);
    };

    const showCustomConfirm = (message: string): Promise<boolean> => {
        return new Promise(resolve => {
            setConfirmMessage(message);
            setShowConfirm(true);
            setOnConfirmCallback(() => (choice: boolean) => {
                setShowConfirm(false);
                resolve(choice);
            });
        });
    };

    useEffect(() => {
        if (!stompClient || !isConnected || !idPlayer) return;

        const playSubscription = stompClient.subscribe('/topics/play', (message: IMessage) => {
            const body = JSON.parse(message.body);
            const {coordinate, result, playerId, target} = body;

            console.log('📥 Mensagem recebida:', body);
            const newState = result === 'HIT' ? 'hit' : 'miss'
            
            if(idPlayer === playerId){
                updateEnemyBoard(coordinate.row, coordinate.col, newState);
                console.log('❌ Atualização enemyBoard:');
            }
            if(idPlayer === target){
                updateMyBoard(coordinate.row, coordinate.col, newState);
                console.log('❌ Atualização myBoard:');
            }

        });
        const notificationSubscription = stompClient.subscribe(`/topics/game-notify/${idPlayer}`, async (message: IMessage) => {
            const body = JSON.parse(message.body);
            console.log('📢 Notificação recebida:', body);
            const { notification } = body;

            switch (notification) {
                case "WINNER": {
                    const decision = await showCustomConfirm('🎉 Parabéns! Você venceu! \n Deseja jogar novamente?');
                    navigate(decision ? '/init' : '/');
                    break;
                }
                case "LOSER": {
                    const decision = await showCustomConfirm('😢 Você perdeu! Melhor sorte na próxima! \n Deseja jogar novamente?');
                    navigate(decision ? '/init' : '/');
                    break;
                }
                case "YOUR_TURN": {
                    console.log('🚀 Agora é sua vez');
                    setIsPlayerTurn(true);
                    setTurnPlay(notification);
                    break;
                }
                case "NOT_YOU_TURN": {
                    console.log('⏳ Aguardando a vez do adversário');
                    setIsPlayerTurn(false);
                    setTurnPlay(notification);
                    break;
                }
                default: {
                    console.warn('⚠️ Notificação desconhecida recebida:', notification);
                    break;
                }
            }
        });

        const rescueSubscription = stompClient.subscribe(`/topics/game-rescue/${idPlayer}`, (message: IMessage) => {
            try{
                const body = JSON.parse(message.body);
                console.log('❌❌❌❌❌❌  CHEGOU AQUI!!!! MSG RECOVERY  ❌❌❌❌❌❌');
                console.log(body);

                const { plays, shipPositions } = body;

                if (plays && Array.isArray(plays)) {
                    setEnemyBoard(Array(SIZE).fill(null).map(() => Array(SIZE).fill('empty')));
                    setMyBoard(prev => {
                        if (shipPositions && Array.isArray(shipPositions) && shipPositions.length) {
                            const shipDtos = shipPositions.map((coord: Coordinate) => ({ coordinates: [coord] }));
                            return convertShipDtosToBoardState(shipDtos);
                        } else {
                            return prev;
                        }
                    });

                    plays.forEach((play: Play) => {
                        const { coordinate, result, playerId, target } = play;
                        const newState = result === 'HIT' ? 'hit' : 'miss';

                        if (idPlayer === playerId) {
                            updateEnemyBoard(coordinate.row, coordinate.col, newState);
                        }
                        if (idPlayer === target) {
                            updateMyBoard(coordinate.row, coordinate.col, newState);
                        }
                    });
                }
            }catch(err){
                console.log('❌ Erro ao processar mensagem STOMP:', err)
            }
        });
        const errorSubscription = stompClient.subscribe('/user/queue/errors', (message: IMessage) => {
            const body = JSON.parse(message.body);
            console.log('❌ Error na requisição:', body.msg);
            alert(`❌ ${body.msg}`);
        });

        return () => {
            playSubscription.unsubscribe();
            errorSubscription.unsubscribe();
            notificationSubscription.unsubscribe();
            rescueSubscription.unsubscribe();
        };
    }, [stompClient, isConnected, idPlayer]);

    return (
        <div itemID='Game'>
            {showConfirm && (
                <div
                    style={{
                        position: "fixed",
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: "rgba(0,0,0,0.5)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 9999,
                    }}
                >
                    <div style={{background: "white", padding: 20, borderRadius: 8}}>
                        <ConfirmButton
                            msg={confirmMessage}
                            onConfirm={onConfirmCallback}
                        />
                    </div>

                </div>
            )}
            <div className="connection-status">
                <LogoutButton/>
                <RefreshButton/>
                Status: {isConnected ? '✅ Conectado' : '❌ Desconectado'}
                <div itemID='boards-for-game'>
                    <GridGame
                        onClickCell={() => {}}
                        isConnected={false}
                        letters={configGame.LETTERS}
                        board={myBoard}
                        mode='game'
                        title={'Tabuleiro de defesa'}
                    />
                    <GridGame
                        onClickCell={sendPlay}
                        isConnected={isConnected}
                        letters={configGame.LETTERS}
                        board={enemyBoard}
                        mode='game'
                        title={'Tabuleiro de Ataque'}
                    />
                </div>
                <div className="turn-status">
                    {isPlayerTurn ?
                        '✅ É sua vez de jogar! Clique em uma célula do tabuleiro de ataque.' :
                        '⏳ Aguarde sua vez...'}
                </div>
            </div>
        </div>
    );
}
