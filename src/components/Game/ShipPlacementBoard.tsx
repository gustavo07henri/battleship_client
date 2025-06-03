import { useState, useCallback, useMemo } from 'react';
import {configGame} from "../Configs/Config.ts";
import {canPlaceShip, createShipsPayload, updateMyBoardWithShip} from "../Utils/BoardUtils.ts";
import type {Ship, CellState} from "../Types/Types.ts";
import {GridGame} from "./Grid.tsx";
import { useNavigate } from 'react-router-dom';

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
                    
                </div>
            ))}
            <p>* Clique duas vezes para rotacionar o navio</p>
        </div>
    );
}

// Componente principal
export function ShipPlacementBoard() {
    // Estado do tabuleiro (10x10, inicialmente vazio)
    const navigate = useNavigate();
    const gameId = localStorage.getItem('gameId')
    const playerId = localStorage.getItem('playerId')
    const [myBoard, setMyBoard] = useState<CellState[][]>(
        Array(configGame.SIZE)
            .fill(Array)
            .map(() => Array(configGame.SIZE).fill('empty'))
    );

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
                setShips(prev =>
                    prev.map(s => (s.id === shipId ? { ...s, position: { row, col } } : s))
                );
                updateMyBoardWithShip(ship, row, col, setMyBoard);
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
        // Verifica se todos os navios foram posicionados
        if (ships.some(ship => !ship.position)) {
            alert('🚫 Você precisa posicionar todos os navios antes de enviar.');
            return;
        }

        setIsLoading(true);
        try {
            const payload = createShipsPayload(ships, gameId , playerId);
            console.log(payload)
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
            navigate('/game')
            alert('✅ Frota enviada com sucesso!');
        } catch (err) {
            console.error('Erro ao enviar frota:', err);
            alert('❌ Erro ao enviar frota.');
        } finally {
            setIsLoading(false);
        }
    }, [ships]);

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
        <div className="game-container">
            <h2>Posicione seus navios</h2>

            {/* Componente para exibir os navios disponíveis */}
            <Shipyard ships={ships} onDragStart={handleDragStart} onRotate={rotateShip} />

            {/* Componente para exibir o tabuleiro */}
            <GridGame
                board={myBoard}
                letters={letters}
                mode='placement'
                onDrop={handleDrop}
                onDragOver={handleDragOver}
            />

            {/* Botões de ação */}
            <div className="controls">
                <button onClick={sendFleetToBackend} disabled={isLoading || ships.some(ship => !ship.position)}>
                    {isLoading ? 'Enviando...' : '🚀 Confirmar Posicionamento'}
                </button>
                <button onClick={resetBoard} disabled={isLoading}>
                    🔄 Reiniciar Tabuleiro
                </button>
            </div>
        </div>
    );
}