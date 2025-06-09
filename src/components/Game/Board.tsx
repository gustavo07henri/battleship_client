// Imports necessários para a função
import {type IMessage } from '@stomp/stompjs';
import {useEffect, useState} from "react";
import {GridGame} from "./Grid.tsx";
import type {CellState, Coordinate} from "../Types/Types.ts";
import {configGame} from "../Configs/Config.ts";
import { useWebSocket } from '../Context/WebSocketContext.tsx';
import { LogoutButton} from "../LogoutButton/LogoutButton.tsx";
import { getBordShipPositions, getGameId, getPlayerId } from '../Utils/LocalStorage.tsx';
import { convertShipDtosToBoardState } from '../Utils/BoardUtils.ts';
import 'bulma/css/bulma.min.css'
import { useNavigate } from 'react-router-dom';




export function Board() {
    const SIZE = 10;
    const navigate = useNavigate();
    const { stompClient, isConnected } = useWebSocket() ?? {};
    const [isPlayerTurn, setIsPlayerTurn] = useState(true);
    const [idGame, setIdGame] = useState<string | null>(null);
    const [idPlayer, setIdPlayer] = useState<string | null>(null);


    const [myboard, setMyBoard] = useState<CellState[][]>(
        Array(SIZE).fill(null).map(() => Array(SIZE).fill('empty'))
    );
    const [enemyboard, setEnemyBoard] = useState<CellState[][]>(
        Array(SIZE).fill(null).map(() => Array(SIZE).fill('empty'))
    );

    // Carrega as posições dos navios do localStorage ao iniciar
    useEffect(() => {
        const gameId = getGameId();
        const playerId = getPlayerId();
        
        if (gameId) {
            setIdGame(gameId);
        }
        if (playerId) {
            setIdPlayer(playerId);
        }
        const shipDtos = getBordShipPositions();
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
        const notificationSubscription = stompClient.subscribe(`/topics/game-notify/${idPlayer}`, (message: IMessage) =>{
            const body = JSON.parse(message.body);
            console.log(body)
            const {notification} = body;
            if(notification === "WINNER"){
                const decision = confirm('🎉 Parabéns! Você venceu! \n Deseja Jogar novamente?');
                (decision) ? navigate('/init') : navigate('/');
            }
            if(notification === "LOSER"){
                const decision = confirm('😢 Você perdeu! Melhor sorte na próxima!');
                (decision) ? navigate('/init') : navigate('/');
            }
            if(notification === "YOUR_TURN"){
                setIsPlayerTurn(true);
            }
            if(notification === "NOT_YOUR_TURN"){
                setIsPlayerTurn(false);
            }
        });

        const rescueSubscription = stompClient.subscribe(`/topics/game-rescue/${idPlayer}`, (message: IMessage) => {
            try{
                const body = JSON.parse(message.body);
                console.log('❌❌❌❌❌❌  CHEGOU AQUI!!!! MSG RECOVERY  ❌❌❌❌❌❌');
                console.log(body);

                const { plays, shipPositions } = body;

                // Atualiza os tabuleiros com base nas jogadas
                if (plays && Array.isArray(plays)) {
                    // Limpa os tabuleiros antes de aplicar as jogadas
                    setEnemyBoard(Array(SIZE).fill(null).map(() => Array(SIZE).fill('empty')));
                    setMyBoard(prev => {
                        if (shipPositions && Array.isArray(shipPositions) && shipPositions.length) {
                            const shipDtos = shipPositions.map((coord: Coordinate) => ({ coordinates: [coord] }));
                            return convertShipDtosToBoardState(shipDtos);
                        } else {
                            return prev;
                        }
                    });

                    plays.forEach((play: any) => {
                        const { coordinate, result, playerId, target } = play;
                        const newState = result === 'HIT' ? 'hit' : 'miss';

                        if (idPlayer === playerId) {
                            // Atualiza o tabuleiro de ataque
                            updateEnemyBoard(coordinate.row, coordinate.col, newState);
                        }
                        if (idPlayer === target) {
                            // Atualiza o tabuleiro de defesa
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
            // Tratamento para erros recebidos
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

            <div className="connection-status">
                <LogoutButton/>
                Status: {isConnected ? '✅ Conectado' : '❌ Desconectado'}
                <div itemID='boards-for-game'>
                    <GridGame
                        onClickCell={() => {}}
                        isConnected={false}
                        letters={configGame.LETTERS}
                        board={myboard}
                        mode='game'
                        title={'Tabuleiro de defesa'}
                    />
                    <GridGame
                        onClickCell={sendPlay}
                        isConnected={isConnected}
                        letters={configGame.LETTERS}
                        board={enemyboard}
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
