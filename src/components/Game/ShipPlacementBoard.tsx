import {useState, useCallback, useMemo, useEffect} from 'react';
import {configGame} from "../Configs/Config.ts";
import {canPlaceShip, createShipsPayload, updateMyBoardWithShip} from "../Utils/BoardUtils.ts";
import type {Ship, CellState} from "../Types/Types.ts";
import {GridGame} from "./Grid.tsx";
import { useNavigate } from 'react-router-dom';
import {LogoutButton} from "../LogoutButton/LogoutButton.tsx";
import {getGameId, getPlayerId, setBordShipPositions} from "../Utils/LocalStorage.tsx";
import 'bulma/css/bulma.min.css';
import {SearchGame} from "./SearchGame.tsx";
import type {IMessage} from "@stomp/stompjs";
import {useWebSocket} from "../Context/WebSocketContext.tsx";
import {setTurnPlay} from "../Utils/LocalStorage.tsx";

// Interface para a resposta da API
interface ApiResponse {
    success: boolean;
    message?: string;
}

// Componente para renderizar a lista de navios
function Shipyard({
                      ships,
                      onDragStart,
                      onRotate,
                  }: {
    ships: Ship[];
    onDragStart: (e: React.DragEvent, ship: Ship) => void;
    onRotate: (shipId: string) => void;
}) {
    return (
        <div className="shipyard">
            <h3>Navios disponíveis:</h3>
            {ships.filter(ship => !ship.position).map(ship => (
                <div
                    key={ship.id}
                    draggable
                    onDragStart={e => onDragStart(e, ship)}
                    onDoubleClick={() => onRotate(ship.id)}
                    className={`ship ship-${ship.size} ${ship.orientation}`}
                    title={`Navio: ${ship.id} (${ship.size} células)`}
                    style={{
                        '--size': ship.size
                    } as React.CSSProperties}
                >
                    {Array.from({ length: ship.size }).map((_, idx) => (
                        <div key={idx} />
                    ))}
                </div>
            ))}
            <p>* Clique duas vezes para rotacionar o navio</p>
        </div>
    );
}

// Componente principal
export function ShipPlacementBoard() {

    const [searchingGame, setSearchingGame] = useState(true);
    const [gameFound, setGameFound] = useState(false);
    const [gameLoadingStatus, setGameLoadingStatus] = useState<string | null>(null);
    const idGame = getGameId();
    const idPlayer = getPlayerId();
    const navigate = useNavigate();
    const { stompClient, isConnected } = useWebSocket() ?? {};
    const [myBoard, setMyBoard] = useState<CellState[][]>(
        Array(configGame.SIZE)
            .fill(Array)
            .map(() => Array(configGame.SIZE).fill('empty'))
    );

    const handleGameFound = () => {
        setGameFound(true);
        setSearchingGame(false);
    };

    // Estado da lista de navios
    const [ships, setShips] = useState<Ship[]>([
        { id: 'carrier', size: 5, position: null, orientation: 'horizontal' },
        { id: 'battleship', size: 4, position: null, orientation: 'horizontal' },
        { id: 'cruiser', size: 3, position: null, orientation: 'horizontal' },
        { id: 'submarine', size: 3, position: null, orientation: 'horizontal' },
        { id: 'destroyer', size: 2, position: null, orientation: 'horizontal' },
    ]);

    // Estado para indicar carregamento durante a requisição ao backend
    const [isLoading, setIsLoading] = useState(false);

    // Letras para rotular as linhas do tabuleiro (A-J)
    const letters = useMemo(() => ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'], []);

    // Manipula o início do arrastar de um navio
    const handleDragStart = useCallback((e: React.DragEvent, ship: Ship) => {
        e.dataTransfer.setData('shipId', ship.id);
    }, []);

    // Manipula o evento de arrastar sobre uma célula
    const handleDragOver = useCallback(
        (e: React.DragEvent, row: number, col: number) => {
            e.preventDefault();
            const shipId = e.dataTransfer.getData('shipId');
            const ship = ships.find(s => s.id === shipId);

            if (ship && canPlaceShip(ship, row, col, ship.orientation, myBoard)) {
                e.currentTarget.classList.add('valid-drop');
            } else {
                e.currentTarget.classList.add('invalid-drop');
            }
        },
        [ships, myBoard]
    );

    // Manipula o evento de soltar um navio no tabuleiro
    const handleDrop = useCallback(
        (e: React.DragEvent, row: number, col: number) => {
            e.preventDefault();
            e.currentTarget.classList.remove('valid-drop', 'invalid-drop');
            const shipId = e.dataTransfer.getData('shipId');
            const ship = ships.find(s => s.id === shipId);
            if (!ship) return;
            if (ship.position) {
                alert('Este navio já foi posicionado!');
                return;
            }

            if (canPlaceShip(ship, row, col, ship.orientation, myBoard)) {
                const updatedShip = {
                    ...ship,
                    position: { row, col },
                    orientation: ship.orientation
                };
            
                setShips(prev =>
                    prev.map(s => (s.id === shipId ? updatedShip : s))
                );
            
                updateMyBoardWithShip(updatedShip, row, col, setMyBoard);
            } else {
                alert('❌ Posição inválida para este navio!');
            }
            
        },
        [ships, myBoard]
    );

    // Rotaciona a orientação de um navio (horizontal <-> vertical)
    const rotateShip = useCallback((shipId: string) => {
        setShips(prev =>
            prev.map(ship =>
                ship.id === shipId
                    ? { ...ship, orientation: ship.orientation === 'horizontal' ? 'vertical' : 'horizontal' }
                    : ship
            )
        );
    }, []);

    // Envia a frota para o backend
    const sendFleetToBackend = useCallback(async () => {
        console.log('Ships before send:', ships);

        // Verifica se todos os navios foram posicionados
        if (ships.some(ship => !ship.position)) {
            alert('🚫 Você precisa posicionar todos os navios antes de enviar.');
            console.log(ships)
            return;
        }

        setIsLoading(true);
        try {
            console.log("Enviando frota com idGame:", idGame, "idPlayer:", idPlayer);
            const payload = createShipsPayload(ships, idGame ?? null, idPlayer ?? null);
            
            setBordShipPositions(payload.shipDtos);

            const response = await fetch(`${configGame.apiUrl}/game/init/create-board`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data: ApiResponse = await response.json();
            if (!response.ok) {
               console.log(data.message || '❌ Falha ao enviar Board');
            }

            console.log('✅ Criação bem sucedida:', data);
            alert('✅ Frota enviada com sucesso!');
        } catch (err) {
            console.error('Erro ao enviar frota:', err);
            alert('❌ Erro ao enviar frota.');
        } finally {
            setIsLoading(false);
        }
    }, [ships, idGame, idPlayer, navigate]);

    useEffect(() => {
        if (!stompClient || !isConnected || !idPlayer) return;

        const notificationSubscription = stompClient.subscribe(`/topics/game-notify/${idPlayer}`, (message: IMessage) =>{
            const body = JSON.parse(message.body);
            console.log(body)
            const {notification} = body;
            if(notification === 'YOUR_TURN' || notification === 'NOT_YOU_TURN'){
                setTurnPlay(notification)
                console.log('Turno de jogada salvo')
            }
            if(notification === "WAITING_OTHER_PLAYER"){
                setGameLoadingStatus(`WAITING_OTHER_PLAYER`)
                console.log('✅✅✅✅ chego em WAITING_OTHER_PLAYER', notification)
            }
            if(notification === "RESUMED"){
                setGameLoadingStatus('RESUMED')
                console.log('✅✅✅✅ chego em Resumed' , notification)
                navigate('/game')
            }
        });

        const errorSubscription = stompClient.subscribe('/user/queue/errors', (message: IMessage) => {
            const body = JSON.parse(message.body);
            console.log('❌ Error na requisição:', body.msg);
            alert(`❌ ${body.msg}`);
            // Tratamento para erros recebidos
        });

        return () => {
            errorSubscription.unsubscribe();
            notificationSubscription.unsubscribe();
        };
    }, [stompClient, isConnected, idPlayer]);

    // Reseta o tabuleiro e as posições dos navios
    const resetBoard = useCallback(() => {
        setMyBoard(
            Array(configGame.SIZE)
                .fill(null)
                .map(() => Array(configGame.SIZE).fill('empty'))
        );
        setShips(prev =>
            prev.map(ship => ({ ...ship, position: null, orientation: 'horizontal' }))
        );
    }, []);

    return (
        <div itemID="Init">
            <LogoutButton />
            <div className="turn-status">
                {gameLoadingStatus === `WAITING_OTHER_PLAYER` ?
                    '⏳ Aguardando outro jogador' :
                    '✅ Iniciando jogo'}
            </div>
            {searchingGame && (
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
                        <SearchGame onGameFound={handleGameFound} />
                    </div>

                </div>
            )}
            {gameFound && <p>Jogo encontrado! Carregando...</p>}
            <div className="box">
                <div itemID="posicionamento">
                    <div>
                        <div className="is-flex is-justify-content-space-between is-align-items-center mb-4">
                            <h2 className="title is-4">Posicione seus navios</h2>

                        </div>

                        <div className="mb-5">
                            <Shipyard
                                ships={ships}
                                onDragStart={handleDragStart}
                                onRotate={rotateShip}
                            />
                        </div>
                    </div>
                    <div className="mb-5">
                        <GridGame
                            board={myBoard}
                            letters={letters}
                            mode="placement"
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                        />
                    </div>
                </div>

            </div>
            <div className="buttons">
                <button
                    className="button is-link"
                    onClick={sendFleetToBackend}
                    disabled={isLoading || ships.some((ship) => !ship.position)}
                >
                    {isLoading ? 'Enviando...' : '🚀 Confirmar Posicionamento'}
                </button>

                <button
                    className="button is-warning"
                    onClick={resetBoard}
                    disabled={isLoading}
                >
                    🔄 Reiniciar Tabuleiro
                </button>
            </div>
        </div>
    );
}