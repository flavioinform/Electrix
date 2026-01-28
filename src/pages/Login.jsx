import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatRut, validateRut, cleanRut } from '../utils/rutValidator';
import { Zap, Lock, User, Mail } from 'lucide-react';
import './Login.css';

export default function Login() {
    const { login, isAuthenticated } = useAuth();
    const [identifier, setIdentifier] = useState(''); // Can be RUT or Email
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Redirect if already authenticated
    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    const handleIdentifierChange = (e) => {
        const val = e.target.value;
        // Check if it looks like a RUT (numbers, dot, dash, k) vs Email (has @)
        // If it looks like inputting a RUT, try to format it
        if (!val.includes('@') && /^[0-9kK\-. ]+$/.test(val)) {
            const formatted = formatRut(val);
            setIdentifier(formatted);
        } else {
            setIdentifier(val);
        }
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!identifier) {
            setError('Por favor ingresa tu RUT o Email.');
            return;
        }

        if (!password) {
            setError('Por favor ingresa tu contraseña.');
            return;
        }

        let loginValue = identifier;

        // If it's not an email, assume it's a RUT or Custom ID (Client)
        if (!identifier.includes('@')) {
            // We used to strictly validate RUT here. 
            // Now we relax it to allow simple Client usernames (e.g. "2121").
            // We still clean it (remove dots/dashes) just in case.
            loginValue = cleanRut(identifier);
        }

        setLoading(true);

        try {
            const result = await login(loginValue, password);

            if (!result.success) {
                setError(result.error);
            }
        } catch (err) {
            setError('Error al iniciar sesión. Por favor intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-background">
                <div className="login-glow login-glow-1"></div>
                <div className="login-glow login-glow-2"></div>
            </div>

            <div className="login-card glass-card">
                <div className="login-header">
                    <div className="login-logo">
                        <Zap size={40} className="logo-icon" />
                    </div>
                    <h1 className="login-title">ELECTRIX</h1>
                    <p className="login-subtitle">Empresa de Servicio Eléctrico</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="input-group">
                        <label htmlFor="identifier" className="input-label">
                            <User size={16} />
                            RUT / Usuario
                        </label>
                        <input
                            id="identifier"
                            type="text"
                            className="input-field"
                            placeholder="RUT (12.345.678-9) o Usuario"
                            value={identifier}
                            onChange={handleIdentifierChange}
                            autoComplete="username"
                            disabled={loading}
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="password" className="input-label">
                            <Lock size={16} />
                            Contraseña
                        </label>
                        <input
                            id="password"
                            type="password"
                            className="input-field"
                            placeholder="Ingresa tu contraseña"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setError('');
                            }}
                            autoComplete="current-password"
                            disabled={loading}
                        />
                    </div>

                    {error && (
                        <div className="login-error fade-in">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg w-full"
                        disabled={loading}
                    >
                        {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </button>
                </form>

                {/* <div className="login-footer">
                    <p className="text-muted">
                        ¿Eres trabajador? <Link to="/registro" className="link-primary">Regístrate aquí</Link>
                    </p>
                    <p className="text-muted" style={{ marginTop: 'var(--spacing-sm)', fontSize: '0.75rem' }}>
                        Sistema de gestión para 6-10 usuarios
                    </p>
                </div> */}
            </div>
        </div>
    );
}
