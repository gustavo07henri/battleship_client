export type CellState = 'empty' | 'ship' | 'hit' | 'miss';
export type Orientation = 'horizontal' | 'vertical';
export interface Coordinate {
    row : number;
    col : number;
}
export interface Ship {
    id: string;
    size: number;
    position: Coordinate | null;
    orientation: Orientation;
}
export interface ShipDto{
    coodinates: Coordinate[];
}

export interface ShipsPayload{
    shipDtos : ShipDto [];
    gameId : string;
    playerId: string;
}