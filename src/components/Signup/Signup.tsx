import {useState} from "react";
import { useNavigate } from 'react-router-dom';
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
        <div className="container">
            <div className="form-wrapper">
                <form
                    className={'form_data'}
                    onSubmit={handleSubmit}
                >
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
                    <button
                        className="button"
                        type="submit"
                    >Cadastro</button>
                </form>
            </div>
        </div>
    );
}