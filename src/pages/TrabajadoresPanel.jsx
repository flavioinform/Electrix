import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTrabajadores } from '../services/trabajadorService';
import { formatRut } from '../utils/rutValidator';
import { Search, Shield } from 'lucide-react';
import './FlujoTrabajo.css';

export default function TrabajadoresPanel() {
    const { isSupervisor } = useAuth();
    const [trabajadores, setTrabajadores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadTrabajadores();
    }, []);

    const loadTrabajadores = async () => {
        try {
            const data = await getTrabajadores();
            const staff = data.filter(t => t.rol !== 'cliente');
            setTrabajadores(staff);
        } catch (error) {
            console.error('Error loading trabajadores:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTrabajadores = trabajadores.filter(t =>
        t.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.rut.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.especialidad.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flujo-trabajo-container">
            <section className="glass-card">
                <div className="section-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Shield className="text-primary" size={24} />
                        <h2>Gestión de Equipo</h2>
                    </div>
                </div>

                {/* Instrucciones de Registro */}
                <div className="glass-card" style={{ padding: '20px', marginBottom: '20px', background: 'rgba(59, 130, 246, 0.1)', borderLeft: '4px solid var(--color-primary)' }}>
                    <h3 style={{ marginTop: 0, color: 'var(--color-primary)' }}>📋 Registro de Trabajadores</h3>
                    <p style={{ margin: '10px 0' }}>Los trabajadores deben registrarse usando el siguiente enlace:</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                        <code style={{ flex: 1, color: 'var(--color-success)' }}>{window.location.origin}/registro</code>
                        <button
                            className="btn btn-sm btn-primary"
                            onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/registro`);
                                alert('¡Link copiado al portapapeles!');
                            }}
                        >
                            Copiar Link
                        </button>
                    </div>
                    <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '10px' }}>
                        Una vez registrados, aparecerán automáticamente en esta lista.
                    </p>
                </div>

                {/* Search Bar */}
                <div className="input-group" style={{ marginBottom: '20px' }}>
                    <div className="search-input-wrapper">
                        <Search className="search-icon" size={18} />
                        <input
                            type="text"
                            className="input-field search-field"
                            placeholder="Buscar por nombre, RUT o especialidad..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Workers List */}
                <div className="clientes-list">
                    {loading ? (
                        <div className="loading">Cargando equipo...</div>
                    ) : filteredTrabajadores.length === 0 ? (
                        <div className="no-projects">No se encontraron trabajadores.</div>
                    ) : (
                        <div className="table-responsive">
                            <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--color-text)' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                                        <th style={{ padding: '15px' }}>Nombre</th>
                                        <th style={{ padding: '15px' }}>RUT / Usuario</th>
                                        <th style={{ padding: '15px' }}>Rol</th>
                                        <th style={{ padding: '15px' }}>Especialidad</th>
                                        <th style={{ padding: '15px' }}>Contacto</th>
                                        <th style={{ padding: '15px' }}>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTrabajadores.map(worker => (
                                        <tr key={worker.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '15px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div className="avatar-placeholder">
                                                        {worker.nombre.charAt(0).toUpperCase()}
                                                    </div>
                                                    {worker.nombre}
                                                </div>
                                            </td>
                                            <td style={{ padding: '15px' }}>{formatRut(worker.rut)}</td>
                                            <td style={{ padding: '15px' }}>
                                                <span className={`status-badge ${worker.rol === 'admin' || worker.rol === 'supervisor' ? 'completed' : 'pending'}`}>
                                                    {worker.rol.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={{ padding: '15px' }}>{worker.especialidad}</td>
                                            <td style={{ padding: '15px' }}>{worker.telefono || '-'}</td>
                                            <td style={{ padding: '15px' }}>
                                                {worker.activo ? (
                                                    <span style={{ color: 'var(--color-success)' }}>Activo</span>
                                                ) : (
                                                    <span style={{ color: 'var(--color-error)' }}>Inactivo</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
