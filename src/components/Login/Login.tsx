import {useState} from "react";
import { useNavigate } from 'react-router-dom';
import { setPlayerId } from "../Utils/LocalStorage.tsx";
import 'bulma/css/bulma.min.css';
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
                navigate('/init');
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
        <div className="container mt-5">
            <div className="box" style={{ maxWidth: '400px', margin: '0 auto' }}>
                <form onSubmit={handleSubmit}>
                    <h2 className="title is-4 has-text-centered">Login</h2>

                    <div className="field">
                        <label htmlFor="email" className="label">Email</label>
                        <div className="control">
                            <input
                                id="email"
                                value={email}
                                type="email"
                                onChange={(e) => setEmail(e.target.value)}
                                className="input"
                                required
                            />
                        </div>
                    </div>

                    <div className="field">
                        <label htmlFor="name" className="label">Nome</label>
                        <div className="control">
                            <input
                                id="name"
                                value={name}
                                type="text"
                                onChange={(e) => setName(e.target.value)}
                                className="input"
                                required
                            />
                        </div>
                    </div>

                    {erro && <p className="notification is-danger is-light">{erro}</p>}

                    <div className="field">
                        <button type="submit" className="button is-primary is-fullwidth">Login</button>
                    </div>
                </form>

                <div className="field">
                    <button
                        type="button"
                        className="button is-light is-fullwidth"
                        onClick={() => navigate('/signup')}
                    >
                        Criar Conta
                    </button>
                </div>
            </div>
        </div>
    );

}