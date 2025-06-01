// Imports necessários para a função
import SockJS from 'sockjs-client';
import { Client, type IMessage } from '@stomp/stompjs';
import {useEffect, useState} from "react";
import {GridGame} from "./Grid.tsx";
import type {CellState} from "./CellState.ts";
import {configGame} from "../Configs/Config.ts";

// Variáveis de ambiente
const playerId = import.meta.env.VITE_ID_PLAYER;
const gameId = import.meta.env.VITE_ID_GAME;
const apiUrl = import.meta.env.VITE_API_URL;


export function Board() {
    const SIZE = 10;
    const [stompClient, setStompClient] = useState<Client | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const[myboard, setMyBoard] =useState<CellState[][]>(
        Array(SIZE).fill(null).map(() => Array(SIZE).fill('empty'))
    );
    const[enemyboard, setEnemyBoard] =useState<CellState[][]>(
        Array(SIZE).fill(null).map(() => Array(SIZE).fill('empty'))
    );

    // Conecta ao STOMP quando o componente é montado
    useEffect(() => {
        connectStomp();
        return () => {
            if (stompClient) {
                stompClient.deactivate();
                console.log('🔌 Conexão STOMP encerrada');
            }
        };
    }, []);

    const connectStomp = () => {
        const client = new Client({
            webSocketFactory: () => new SockJS(`${apiUrl}/battleship-main-server`),
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            debug: (str) => console.log(str),
            onConnect: () => {
                console.log('✅ Conectado ao STOMP');
                setIsConnected(true);

                client.subscribe('/topics/play', (message: IMessage) => {
                    const body = JSON.parse(message.body);
                    const {coordinate, result, player, target} = body;
                    console.log('📥 Mensagem recebida:', body);
                    if(player === playerId){
                        updateEnemyBoard(coordinate.row, coordinate.col, result === 'HIT'? 'hit': 'miss');
                    }else if(player === target){
                        updateMyBoard(coordinate.row, coordinate.col, result === 'HIT'? 'hit' : 'miss');
                    }
                    // Aqui você pode processar a mensagem recebida
                });
                client.subscribe('/user/queue/errors', (message: IMessage)=>{
                    const body = JSON.parse(message.body);
                    console.log('❌ Error na requisição:', body)
                    // Tratamento para erros recebidos
                });
            },
            onDisconnect: () => {
                setIsConnected(false);
                console.log('⚠️ Desconectado do STOMP');
            },
            onStompError: (frame) => {
                console.error('❌ Erro STOMP:', frame.headers?.message || 'Erro desconhecido');
            }
        });
        client.activate();
        setStompClient(client);
    };
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

        const jogada = {
            gameId : gameId,
            coordinate: { row: rowIndex, col: colIndex },
            moment: new Date().toISOString(),
            player: playerId
        };

        stompClient.publish({
            destination: '/game/new-play',
            body: JSON.stringify(jogada),
            headers: { 'content-type': 'application/json' }
        });

        console.log('📤 Jogada enviada:', jogada);
        updateEnemyBoard(rowIndex, colIndex, 'ship');
    };

    return (
        <div className="game-container">
            <div className="connection-status">
                Status: {isConnected ? '✅ Conectado' : '❌ Desconectado'}
            </div>
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
    );
}
