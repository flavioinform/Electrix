import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';
import { getTrabajadores, createTrabajadorUser } from '../services/trabajadorService';
import { formatRut, cleanRut } from '../utils/rutValidator';
import { Plus, Search, User, Shield, Briefcase, Mail, Phone, Lock, X } from 'lucide-react';
import './FlujoTrabajo.css'; // Reusing existing styles for consistency

export default function TrabajadoresPanel() {
    const { isSupervisor } = useAuth();
    const [trabajadores, setTrabajadores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [creating, setCreating] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        nombre: '',
        rut: '',
        email: '',
        password: '',
        telefono: '',
        especialidad: 'Electricista',
        rol: 'trabajador'
    });

    useEffect(() => {
        loadTrabajadores();
    }, []);

    const loadTrabajadores = async () => {
        try {
            const data = await getTrabajadores();
            // Filter out 'cliente' role if you don't want to see them mixed in
            const staff = data.filter(t => t.rol !== 'cliente');
            setTrabajadores(staff);
        } catch (error) {
            console.error('Error loading trabajadores:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setCreating(true);

        try {
            // CRITICAL: Save current supervisor session BEFORE creating new user
            const { data: { session: supervisorSession } } = await supabase.auth.getSession();

            // Clean RUT for email
            const cleanId = cleanRut(formData.rut);
            const email = `${cleanId}@electrix.cl`;

            // 1. Create Auth user (this will AUTO-LOGIN the new user, logging out supervisor)
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password: formData.password,
                options: {
                    emailRedirectTo: undefined,
                    data: {
                        nombre: formData.nombre,
                        rut: cleanId,
                        rol: formData.rol
                    }
                }
            });

            if (authError) {
                if (authError.message.includes('already registered')) {
                    throw new Error('Este RUT ya está registrado.');
                }
                throw authError;
            }

            // 2. Create trabajador profile
            const { error: profileError } = await supabase
                .from('trabajadores')
                .insert([{
                    id: authData.user.id,
                    nombre: formData.nombre,
                    rut: cleanId,
                    rol: formData.rol || 'trabajador',
                    especialidad: formData.especialidad,
                    telefono: formData.telefono || null,
                    activo: true
                }]);

            if (profileError) throw profileError;

            // CRITICAL: Restore supervisor session immediately
            if (supervisorSession) {
                console.log('[TrabajadoresPanel] Restoring supervisor session...');
                await supabase.auth.setSession(supervisorSession);
            }

            alert(`Trabajador creado exitosamente.\n\nCredenciales de acceso:\nUsuario (RUT): ${formatRut(cleanId)}\nContraseña: ${formData.password}`);

            // Reload page to restore supervisor session cleanly
            window.location.reload();
        } catch (error) {
            // If error occurs, try to restore session anyway
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                console.error('[TrabajadoresPanel] Session lost, attempting recovery...');
                window.location.reload(); // Force reload to restore session
            }
            alert('Error al crear trabajador: ' + error.message);
        } finally {
            setCreating(false);
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
                    {isSupervisor && (
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                            <Plus size={18} />
                            Agregar Trabajador
                        </button>
                    )}
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

            {/* Modal Crear Trabajador */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content glass-card">
                        <div className="modal-header">
                            <h3>Registrar Nuevo Trabajador</h3>
                            <button className="btn-icon" onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="modal-form">
                            <div className="input-group">
                                <label className="input-label"><User size={16} /> Nombre Completo</label>
                                <input
                                    required
                                    className="input-field"
                                    value={formData.nombre}
                                    onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                                    placeholder="Juan Pérez"
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label"><Shield size={16} /> RUT / Usuario</label>
                                <input
                                    required
                                    className="input-field"
                                    value={formData.rut}
                                    onChange={e => setFormData({ ...formData, rut: formatRut(e.target.value) })}
                                    placeholder="12.345.678-9"
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label"><Mail size={16} /> Email (Opcional)</label>
                                <input
                                    type="email"
                                    className="input-field"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="correo@ejemplo.com"
                                />
                                <small className="text-muted">Si se deja vacío, se usará [RUT]@electrix.cl</small>
                            </div>

                            <div className="input-group">
                                <label className="input-label"><Lock size={16} /> Contraseña</label>
                                <input
                                    required
                                    type="password"
                                    className="input-field"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="Mínimo 6 caracteres"
                                    minLength={6}
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label"><Phone size={16} /> Teléfono</label>
                                <input
                                    className="input-field"
                                    value={formData.telefono}
                                    onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                                    placeholder="+56 9 1234 5678"
                                />
                            </div>

                            <div className="form-row">
                                <div className="input-group">
                                    <label className="input-label"><Briefcase size={16} /> Especialidad</label>
                                    <select
                                        className="input-field"
                                        value={formData.especialidad}
                                        onChange={e => setFormData({ ...formData, especialidad: e.target.value })}
                                    >
                                        <option value="Electricista">Electricista</option>
                                        <option value="Ayudante">Ayudante</option>
                                        <option value="Técnico">Técnico</option>
                                        <option value="Supervisor">Supervisor</option>
                                        <option value="Administrativo">Administrativo</option>
                                    </select>
                                </div>

                                <div className="input-group">
                                    <label className="input-label"><Shield size={16} /> Rol de Sistema</label>
                                    <select
                                        className="input-field"
                                        value={formData.rol}
                                        onChange={e => setFormData({ ...formData, rol: e.target.value })}
                                    >
                                        <option value="trabajador">Trabajador</option>
                                        <option value="supervisor">Supervisor</option>
                                        <option value="admin">Administrador</option>
                                    </select>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={creating}>
                                    {creating ? 'Creando...' : 'Crear Trabajador'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
