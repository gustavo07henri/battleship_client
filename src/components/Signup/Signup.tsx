import {useState} from "react";
import { useNavigate } from 'react-router-dom';
import 'bulma/css/bulma.min.css';
// Rota Base da API, Localizada no arquivo .env
const apiUrl = import.meta.env.VITE_API_URL;

export function Signup(){
    const navigate = useNavigate();
    const [email, setEmail] = useState('')
    const [name, setName] = useState('')
    const [erro, setErro] = useState('')

    const urlLogin = `${apiUrl}/game/players/signup`;
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
                throw new Error('Falha no cadastro')
            }

            const data = await response.json();
            console.log('Cadastro realizado: ', data);
            alert('✅ Cadastro realizado com sucesso!')
            navigate('/');
        }catch (err){
            setErro('Erro ao realizar cadastro');
            console.error(err);
        }
    }
    return (
        <div className="container mt-5">
            <div className="box" style={{ maxWidth: '400px', margin: '0 auto' }}>
                <form onSubmit={handleSubmit}>
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
                        <button
                            className="button is-success is-fullwidth"
                            type="submit"
                        >
                            Cadastro
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}