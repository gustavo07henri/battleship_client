import './App.css'
import {Board} from "./components/Game/Board.tsx";
import {BrowserRouter, Routes, Route} from "react-router-dom";
import {Login} from "./components/Login/Login.tsx";
import {Signup} from "./components/Signup/Signup.tsx";
import {ShipPlacementBoard} from "./components/Game/ShipPlacementBoard.tsx";

function App() {

  return (
      <>
          <BrowserRouter>
              <Routes>
                  <Route path={'/login'} element={<Login/>}/>
                  <Route path={'/signup'} element={<Signup/>}/>
                  <Route path={'/game'} element={<Board/>}/>
                  <Route path={'/'} element={<ShipPlacementBoard/>}/>
              </Routes>
                <ShipPlacementBoard/>
          </BrowserRouter>

      </>


  )
}

export default App
