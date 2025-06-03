import {useState} from "react";
import { useNavigate } from 'react-router-dom';
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
                localStorage.setItem('playerId', data.playerId);
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
        <div>
            <form
                className='form-data'
                onSubmit={handleSubmit}
            >
                <label>{'Email'}</label>
                <input
                    value={email}
                    type="email"
                    onChange={(e) => setEmail(e.target.value)}
                    className="Email"
                />
                <label>Nome</label>
                <input
                    value={name}
                    type="name"
                    onChange={(e) => setName(e.target.value)}
                    className="Nome"
                />
                {erro && (
                    <p className="error">{erro}</p>
                )}
                <button
                    className={'default_button'}
                    type="submit"
                >Login</button>
            </form>
            <div>
                <button
                    className="default_button"
                    type="button"
                    onClick={() => navigate('/signup')}
                >
                    Criar Conta
                </button>
            </div>
        </div>
    );
}