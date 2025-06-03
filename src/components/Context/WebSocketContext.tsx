// src/context/WebSocketContext.tsx
import { createContext, useContext, useEffect, useState } from "react";
import { Client } from "@stomp/stompjs";
import { configGame } from "../Configs/Config";
import SockJS from "sockjs-client";


interface WebSocketContextType {
  stompClient: Client | null;
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
  children: React.ReactNode;
}

export const WebSocketProvider = ({ children }: WebSocketProviderProps) => {
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(`${configGame.apiUrl}/battleship-main-server`),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => {
        if(!str.includes('PING') && !str.includes('PONG')){
          console.log(str);
        };
      },
      onConnect: () => setIsConnected(true),
      onDisconnect: () => setIsConnected(false),
      onStompError: (frame) => console.error('❌ Erro STOMP:', frame.headers?.message || 'Erro desconhecido')
    });
    client.activate();
    setStompClient(client);

    return () => {
      client.deactivate();
    };
  }, []);
  return (
    <WebSocketContext.Provider value={{ stompClient, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
};
export const useWebSocket = () => useContext(WebSocketContext);