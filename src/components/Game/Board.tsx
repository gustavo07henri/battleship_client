// Imports necessários para a função
import {type IMessage } from '@stomp/stompjs';
import {useEffect, useState} from "react";
import {GridGame} from "./Grid.tsx";
import type {CellState} from "../Types/Types.ts";
import {configGame} from "../Configs/Config.ts";
import { useWebSocket } from '../Context/WebSocketContext.tsx';
import { LogoutButton} from "../LogoutButton/LogoutButton.tsx";
import { getBordShipPositions, getGameId, getPlayerId } from '../Utils/LocalStorage.tsx';
import { convertShipDtosToBoardState } from '../Utils/BoardUtils.ts';
import 'bulma/css/bulma.min.css'

// Variáveis de ambiente
const idPlayer = getPlayerId();
const idGame = getGameId();


export function Board() {
    const SIZE = 10;
    const { stompClient, isConnected } = useWebSocket() ?? {};
    const [isPlayerTurn, setIsPlayerTurn] = useState(false);

    const [myboard, setMyBoard] = useState<CellState[][]>(
        Array(SIZE).fill(null).map(() => Array(SIZE).fill('empty'))
    );
    const [enemyboard, setEnemyBoard] = useState<CellState[][]>(
        Array(SIZE).fill(null).map(() => Array(SIZE).fill('empty'))
    );

    // Carrega as posições dos navios do localStorage ao iniciar
    useEffect(() => {
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
        if (!stompClient || !isConnected) return;

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
            const {msg} = body;
            if(msg === "WINNER"){
                alert('🎉 Parabéns! Você venceu!');
            }
            if(msg === "LOSER"){
                alert('😢 Você perdeu! Melhor sorte na próxima!');
            }
            if(msg === "YOUR_TURN"){
                setIsPlayerTurn(true);
            }
            if(msg === "NOT_YOUR_TURN"){
                setIsPlayerTurn(false);
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
        };
    }, [stompClient, isConnected]);

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
