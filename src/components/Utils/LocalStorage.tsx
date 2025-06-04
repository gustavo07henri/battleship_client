import type {ShipDto} from "../Types/Types.ts";

export function getPlayerId(){
    try {
        return localStorage.getItem('playerId' ) || '';
    }catch (error){
        console.log('Error ao acessar localStorage: ', error);
        return ;
    }
}
export function setPlayerId(id:string){
    try {
        return localStorage.setItem('playerId', id );
    }catch (error){
        console.log('Error ao salvar no localStorage: ', error);
        return;
    }
}

export function getGameId(){
    try {
        return localStorage.getItem('gameId' ) || '';
    }catch (error){
        console.log('Error ao acessar localStorage: ', error);
        return ;
    }
}
export function setGameId(id:string){
    try {
        return localStorage.setItem('gameId', id );
    }catch (error){
        console.log('Error ao salvar no localStorage: ', error);
        return;
    }
}

export function getBordShipPositions(): ShipDto[] | null {
    try {
        const data = localStorage.getItem('data');
        if (!data) return null;
        return JSON.parse(data) as ShipDto[];
    } catch (error) {
        console.log('Error ao acessar localStorage: ', error);
        return null;
    }
}
export function setBordShipPositions(dtos: ShipDto[]) {
    try {
        const jsonString = JSON.stringify(dtos);
        return localStorage.setItem('data', jsonString);
    } catch (error) {
        console.log('Erro ao salvar no localStorage: ', error);
        return;
    }
}


export function clearLocalStorage() {
    try {
        localStorage.removeItem('playerId');
        localStorage.removeItem('gameId');
        localStorage.removeItem('data');
    } catch (error) {
        console.error('Error clearing localStorage:', error);
    }
}