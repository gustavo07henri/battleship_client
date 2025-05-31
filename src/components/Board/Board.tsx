import SockJS from 'sockjs-client';
import { Client, type IMessage } from '@stomp/stompjs';
import {useEffect, useState} from "react";

const playerId = import.meta.env.VITE_ID_PLAYER;
const gameId = import.meta.env.VITE_ID_GAME;
const apiUrl = import.meta.env.VITE_API_URL;

type CellState = 'empty' | 'hit' | 'miss' | 'ship'; // estados para uma celula

function CreateGrid({
        sendPlay,
        isConnected,
        cellStates
    }: {
    sendPlay: (row: number, col: number) => void;
    isConnected: boolean;
    cellStates: CellState[][];
}) {
    // Constante que seta o tamanho do tabuleiro
    const SIZE = 10;
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']; // array com as letras para representar linhas e ajudar na diferenciação.

    return (
        <div className="grid">
            <table>
                <tbody>
                {Array(SIZE).fill(0).map((_, rowIndex) => (
                    <tr key={rowIndex}>
                        {Array(SIZE).fill(0).map((_, colIndex) => {
                            const state = cellStates[rowIndex][colIndex];
                            return (
                                <td
                                    key={`${colIndex}${rowIndex}`}
                                    className={`cell-${colIndex}-${letters[rowIndex]}`}
                                    data-state={state}
                                    onClick={() => isConnected && sendPlay(rowIndex, colIndex)}
                                >
                                    {colIndex}{letters[rowIndex]}
                                </td>
                            );
                        })}
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}

export function Board() {
    const SIZE = 10;
    const [stompClient, setStompClient] = useState<Client | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [cellStates, setCellStates] = useState<CellState[][]>(
        Array(SIZE).fill(null).map(() => Array(SIZE).fill('empty'))
    )

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
                    console.log('📥 Mensagem recebida:', body);

                    const{coordinate, result} = body;
                    updateCellState(coordinate.row, coordinate.col, result === 'HIT' ? 'hit': 'miss')
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
    const updateCellState = (row: number, col : number, newState: CellState) =>{
        setCellStates(prev => {
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
        updateCellState(rowIndex, colIndex, 'ship');
    };

    return (
        <div className="game-container">
            <div className="connection-status">
                Status: {isConnected ? '✅ Conectado' : '❌ Desconectado'}
            </div>
            <CreateGrid sendPlay={sendPlay} isConnected={isConnected} cellStates={cellStates} />
        </div>
    );
}