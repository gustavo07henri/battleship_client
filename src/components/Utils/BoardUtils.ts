import {configGame} from "../Configs/Config.ts";
import type {CellState, Orientation, Ship, ShipsPayload, Coordinate, ShipDto} from "../Types/Types.ts";
import type {Dispatch, SetStateAction} from "react";

export function canPlaceShip(
    ship: Ship,
    row: number,
    col: number,
    orientation: Orientation,
    boar: CellState [][]
): boolean{
    for(let i = 0; i < ship.size; i++){
        const r = orientation === 'horizontal' ? row : row +i;
        const c = orientation === 'horizontal' ? col + i : col;

        if(r >= configGame.SIZE || c >= configGame.SIZE)return false;
        if(boar[r][c] === 'ship') return false;
    }
    return true;
}

export function updateMyBoardWithShip(
    ship: Ship,
    row: number,
    col: number,
    setBoard: Dispatch<SetStateAction<CellState[][]>>
): void{
    setBoard(prev => {
        const newBoard = prev.map(inner => [...inner]);
        for(let i = 0; i < ship.size; i++){
            const r = ship.orientation === 'horizontal' ? row : row + i;
            const c = ship.orientation === 'horizontal' ? col + i : col;
            newBoard[r][c] = 'ship';
        }
        return newBoard;
    })
}

export function createShipsPayload(
    ships: Ship[],
    gameId: string,
    playerId: string
): ShipsPayload{
    if(!gameId || !playerId){
        throw new Error('ID do jogo ou jogador não identificado.')
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const shipDtos: ShipDto[] = ships.map(ship =>{
       if(!ship.position){
           throw new Error(`Navio ${ship.id} não possui posição definida.`);
       }
       const coordinates: Coordinate[] = [];
       for (let i = 0; i < ship.size; i++){
           if(ship.orientation === 'horizontal'){
               coordinates.push({col: ship.position.col + i, row: ship.position.row})
           }else {
               coordinates.push({col: ship.position.col, row: ship.position.row + i})
           }
       }
       return {coordinates};
    });

    return { shipDtos, gameId, playerId}
}
