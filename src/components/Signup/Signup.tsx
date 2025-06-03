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
        <div>
            <form
                className={'form_data'}
                onSubmit={handleSubmit}
            >
                <label>E-mail</label>
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
                >Cadastro</button>
            </form>
        </div>
    );
}