import './Global.css'
import {Board} from "./components/Game/Board.tsx";
import {BrowserRouter, Routes, Route} from "react-router-dom";
import {Login} from "./components/Login/Login.tsx";
import {Signup} from "./components/Signup/Signup.tsx";
import {ShipPlacementBoard} from "./components/Game/ShipPlacementBoard.tsx";
import { ProtectedRoute } from './components/Routes/ProtectedRout.tsx';
import { WebSocketProvider } from './components/Context/WebSocketContext.tsx';
import 'bulma/css/bulma.min.css'
import logo from './assets/logo.webp';

function App() {

  return (
      <>
          <BrowserRouter>
            <WebSocketProvider>
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <img src={logo} alt="Logo do Jogo" style={{ maxWidth: '200px' }}/>
                </div>
              <Routes>
                  <Route path={'/'} element={<Login/>}/>
                  <Route path={'/signup'} element={<Signup/>}/>
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
