import { useNavigate } from "react-router-dom";
import { clearLocalStorage } from "../Utils/LocalStorage.tsx";

export function LogoutButton() {
    const navigate = useNavigate();

    const handleLogout = () => {
        clearLocalStorage();
        navigate('/');
    };

    return (
        <div className="logout-button-container">
            <button 
                className="button" 
                onClick={handleLogout}
            >
                Sair
            </button>
        </div>
    );
}