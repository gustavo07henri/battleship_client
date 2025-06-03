import * as React from "react";
import type {CellState} from "../Types/Types.ts";
import './Board.Component.css'

interface BoardProps{
    board: CellState [][];
    letters: string[];
    mode: 'placement'| 'game';
    title?: string;
    isConnected?: boolean;
    onDrop?: (e: React.DragEvent, row: number, col: number) => void;
    onDragOver?: (e: React.DragEvent, row: number, col: number) => void;
    onClickCell?: (row: number, col: number) => void;
}

export function GridGame({
    board,
    letters,
    mode,
    title,
    isConnected = true,
    onDrop,
    onDragOver,
    onClickCell,
                         }: BoardProps){
    return (
        <div className="grid">
            {title && <h2>{title}</h2>}
            <table>
                <tbody>
                {board.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                        {row.map((cell, colIndex) => (
                            <td
                                key={`${rowIndex}-${colIndex}`}
                                className={`cell cell-${letters[rowIndex]}-${colIndex}`}
                                data-state={cell}
                                onClick={() =>
                                    mode === 'game' &&
                                    isConnected &&
                                    onClickCell?.(rowIndex, colIndex)
                                }
                                onDragOver={e =>
                                    mode === 'placement' &&
                                    onDragOver?.(e, rowIndex, colIndex)
                                }
                                onDrop={e =>
                                    mode === 'placement' &&
                                    onDrop?.(e, rowIndex, colIndex)
                                }
                            >
                                {letters[rowIndex]}{colIndex}
                            </td>
                        ))}
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}