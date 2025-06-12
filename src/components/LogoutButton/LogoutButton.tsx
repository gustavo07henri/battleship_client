import { useNavigate } from "react-router-dom";
import { clearLocalStorage } from "../Utils/LocalStorage.tsx";
import 'bulma/css/bulma.min.css'

export function LogoutButton() {
    const navigate = useNavigate();

    const handleLogout = () => {
        clearLocalStorage();
        navigate('/');
    };

    return (
        <div className="container mt-4 has-text-right">
            <button
                className="button is-danger"
                onClick={handleLogout}
            >
                Sair
            </button>
        </div>
    );
}