import {useState} from "react";
import { useNavigate } from 'react-router-dom';
import { setPlayerId } from "../Utils/LocalStorage.tsx";
// Rota Base da API, Localizada no arquivo .env
const apiUrl = import.meta.env.VITE_API_URL;

export function Login(){
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [erro, setErro] = useState('');
    const urlLogin = `${apiUrl}/game/players/login`;
    const handleSubmit = async (e: { preventDefault: () => void; }) => {
        e.preventDefault();
        setErro('');

        try{
            const response = await fetch(urlLogin, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({name, email}),
            })

            if(!response.ok){
                throw new Error('Falha no Login');
            }

            const data = await response.json();
            
            if (!data.playerId || typeof data.playerId !== 'string') {
                throw new Error('ID do jogador inválido');
            }

            try {
                setPlayerId(data.playerId)
                navigate('/search-game');
                console.log('login bem sucedido')
            } catch (storageError) {
                console.error('Erro ao salvar playerId:', storageError);
                setErro('Erro ao salvar dados do jogador');
            }
        }catch (err){
            setErro('Erro ao realizar login');
            console.error(err);
        }
    }
    return (
        <div className="container">
            <div className="form-wrapper">
                <form className="form-data" onSubmit={handleSubmit}>
                    <h2>Login</h2>

                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        value={email}
                        type="email"
                        onChange={(e) => setEmail(e.target.value)}
                        className="input"
                        required
                    />

                    <label htmlFor="name">Nome</label>
                    <input
                        id="name"
                        value={name}
                        type="text"
                        onChange={(e) => setName(e.target.value)}
                        className="input"
                        required
                    />

                    {erro && <p className="error">{erro}</p>}

                    <button type="submit" className="button">Login</button>
                </form>

                <button
                    type="button"
                    className="button secondary"
                    onClick={() => navigate('/signup')}
                >
                    Criar Conta
                </button>
            </div>
        </div>
    );
}