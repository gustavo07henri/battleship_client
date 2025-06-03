import './Global.css'
import {Board} from "./components/Game/Board.tsx";
import {BrowserRouter, Routes, Route} from "react-router-dom";
import {Login} from "./components/Login/Login.tsx";
import {Signup} from "./components/Signup/Signup.tsx";
import {ShipPlacementBoard} from "./components/Game/ShipPlacementBoard.tsx";
import { ProtectedRoute } from './components/Routes/ProtectedRout.tsx';
import { SearchGame } from './components/Game/SearchGame.tsx';
import { WebSocketProvider } from './components/Context/WebSocketContext.tsx';

function App() {

  return (
      <>
          <BrowserRouter>
            <WebSocketProvider>
              <Routes>
                  <Route path={'/'} element={<Login/>}/>
                  <Route path={'/signup'} element={<Signup/>}/>
                  <Route path={'/search-game'} element={
                    <ProtectedRoute><SearchGame/></ProtectedRoute>}/>
                  <Route path={'/game'} element=
                  { <ProtectedRoute><Board/></ProtectedRoute>}/>
                  <Route path={'/init'} element={
                    <ProtectedRoute><ShipPlacementBoard/></ProtectedRoute>}/>
              </Routes>
            </WebSocketProvider>
          </BrowserRouter>

      </>


  )
}

export default App
