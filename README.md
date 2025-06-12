
# BattleShip Client

Front-end do projeto **BattleShip**, um jogo de Batalha Naval multiplayer, desenvolvido como parte de um estudo de aplicações distribuídas, com foco em comunicação em tempo real e integração de múltiplos protocolos de rede.

##  Tecnologias Utilizadas

- **React.js** — biblioteca principal para construção da interface
- **Bulma CSS** — framework leve de estilização
- **REST API (HTTP)** — integração com serviços de backend
- **WebSocket (STOMP)** — comunicação em tempo real para eventos in-game e notificações

##  Funcionalidades

- Comunicação em tempo real entre os jogadores.
- Notificações instantâneas de ações durante a partida via WebSocket.
- Integração direta com o backend REST para manipulação de estados do jogo.

##  Instalação e Execução

Para rodar o projeto localmente:

```bash
# Clone o repositório
git clone https://github.com/gustavo07henri/battleship_client.git

# Acesse o diretório
cd battleship_client

# Instale as dependências
npm install

# Execute o servidor de desenvolvimento
npm run dev
```

Após a execução, o sistema estará disponível geralmente em `http://localhost:5173` (ou conforme indicado no terminal).

##  Backend Necessário

Este cliente depende do backend principal para o funcionamento completo do jogo. O repositório do backend está disponível em:

[BattleShip Main Server - GitHub](https://github.com/gustavo07henri/BattleShip_Main_Server)

##  Pré-requisitos

- Node.js (recomenda-se a versão 18 ou superior)
- npm

##  Sobre o Projeto

O **BattleShip Client** foi desenvolvido como parte do portfólio acadêmico, explorando:

- Comunicação assíncrona em tempo real
- Integração de diferentes protocolos de comunicação
- Arquitetura distribuída
- Desenvolvimento full stack com foco em sistemas interativos multiplayer

##  Autor

**Gustavo Henrique**

[LinkedIn](https://www.linkedin.com/in/gustavo-santos-633a21246)
