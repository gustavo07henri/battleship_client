import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    // Verifica se existe um token de autenticação no localStorage
    const isAuthenticated = localStorage.getItem('playerId') !== null;

    if (!isAuthenticated) {
        // Redireciona para a página de login se não estiver autenticado
        console.log('redirecionado ao login novamente')
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}