import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Zap, Settings, LogOut, Briefcase, DollarSign, User, Users } from 'lucide-react';
import FlujoTrabajo from './FlujoTrabajo';
import FlujoCaja from './FlujoCaja';
import PerfilTrabajador from './PerfilTrabajador';
import ClienteView from './ClienteView';
import TrabajadoresPanel from './TrabajadoresPanel';
import './Dashboard.css';

export default function Dashboard() {
    const { user, logout, isAdmin, isCliente, isSupervisor, isTrabajador } = useAuth();
    const [activeTab, setActiveTab] = useState(isCliente ? 'cliente' : 'trabajo');

    return (
        <div className="dashboard-container">
            <header className="dashboard-header glass-card">
                <div className="header-left">
                    <div className="header-logo">
                        <Zap size={24} className="logo-icon" />
                    </div>
                    <div className="header-info">
                        <h1 className="header-title">ELECTRIX —</h1>
                        <p className="header-subtitle">Empresa</p>
                        <p className="header-description">
                            {isCliente ? 'Portal de Cliente' : 'Flujo de Caja + Flujo de Trabajo'}
                        </p>
                    </div>
                </div>

                <div className="header-right">
                    {isAdmin && (
                        <button className="btn btn-ghost btn-sm" title="Configuración">
                            <Settings size={18} />
                            Admin
                        </button>
                    )}
                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={logout}
                        title="Cerrar sesión"
                    >
                        <LogOut size={18} />
                        Cerrar sesión
                    </button>
                </div>
            </header>

            <div className="dashboard-content">
                {!isCliente && (
                    <div className="dashboard-tabs">
                        <button
                            className={`tab-button ${activeTab === 'caja' ? 'active' : ''}`}
                            onClick={() => setActiveTab('caja')}
                        >
                            <DollarSign size={20} />
                            Flujo de Caja
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'trabajo' ? 'active' : ''}`}
                            onClick={() => setActiveTab('trabajo')}
                        >
                            <Briefcase size={20} />
                            Flujo de Trabajo
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'perfil' ? 'active' : ''}`}
                            onClick={() => setActiveTab('perfil')}
                        >
                            <User size={20} />
                            Mi Perfil
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'equipo' ? 'active' : ''}`}
                            onClick={() => setActiveTab('equipo')}
                        >
                            <Users size={20} />
                            Equipo
                        </button>
                    </div>
                )}

                <div className="dashboard-main">
                    {isCliente ? (
                        <ClienteView />
                    ) : (
                        <>
                            {activeTab === 'trabajo' && <FlujoTrabajo />}
                            {activeTab === 'caja' && <FlujoCaja />}
                            {activeTab === 'perfil' && <PerfilTrabajador />}
                            {activeTab === 'equipo' && <TrabajadoresPanel />}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
