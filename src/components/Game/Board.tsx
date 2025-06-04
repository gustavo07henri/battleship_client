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

// Variáveis de ambiente
const playerId2 = getPlayerId();
const gameId = getGameId();


export function Board() {
    const SIZE = 10;
    const { stompClient, isConnected } = useWebSocket() ?? {};

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
        if(!gameId || !playerId2){
            throw Error('Player ID ou Game ID, nulos!!')
        }

        const jogada = {
            gameId : gameId,
            coordinate: { row: rowIndex, col: colIndex },
            moment: new Date().toISOString(),
            player: playerId2
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
            
            if(playerId2 === playerId){
                updateEnemyBoard(coordinate.row, coordinate.col, newState);
                console.log('❌ Atualização enemyBoard:');
            }
            if(playerId2 === target){
                updateMyBoard(coordinate.row, coordinate.col, newState);
                console.log('❌ Atualização myBoard:');
            }
            // Aqui você pode processar a mensagem recebida
                
        });
        const errorSubscription = stompClient.subscribe('/user/queue/errors', (message: IMessage) => {
            const body = JSON.parse(message.body);
            const { err, msg, errorCode } = body;
            console.log('❌ Error na requisição:', body);
            alert(`❌ ${msg}`);
            // Tratamento para erros recebidos
        });

        return () => {
            playSubscription.unsubscribe();
            errorSubscription.unsubscribe();
        };
    }, [stompClient, isConnected]);

    return (
        <div className="game-container">
            <LogoutButton/>
            <div className="connection-status">
                Status: {isConnected ? '✅ Conectado' : '❌ Desconectado'}
                <div itemID={'boards-for-game'}>
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
            </div>
        </div>
    );
}
