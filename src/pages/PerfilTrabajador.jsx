import { useState, useEffect } from 'react';
import { User, Phone, Briefcase, Save, Edit2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getTrabajadores, createTrabajador, updateTrabajador } from '../services/trabajadorService';
import { formatRut, validateRut } from '../utils/rutValidator';
import './PerfilTrabajador.css';

export default function PerfilTrabajador() {
    const { user } = useAuth();
    const [perfil, setPerfil] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        nombre: '',
        rut: '',
        telefono: '',
        especialidad: 'Electricista'
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        loadPerfil();
    }, [user]);

    const loadPerfil = async () => {
        try {
            // Buscar trabajador por email del usuario autenticado
            const trabajadores = await getTrabajadores();
            const miPerfil = trabajadores.find(t =>
                t.rut === user?.email?.split('@')[0] // El RUT está en el email
            );

            if (miPerfil) {
                setPerfil(miPerfil);
                setFormData({
                    nombre: miPerfil.nombre,
                    rut: miPerfil.rut,
                    telefono: miPerfil.telefono || '',
                    especialidad: miPerfil.especialidad
                });
            } else {
                // No tiene perfil, mostrar formulario de creación
                setEditing(true);
                // Pre-llenar el RUT desde el email
                const rutFromEmail = user?.email?.split('@')[0];
                if (rutFromEmail) {
                    setFormData(prev => ({ ...prev, rut: rutFromEmail }));
                }
            }
        } catch (error) {
            console.error('Error loading perfil:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name === 'rut') {
            const formatted = formatRut(value);
            setFormData(prev => ({ ...prev, [name]: formatted }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.nombre.trim()) {
            newErrors.nombre = 'El nombre es requerido';
        }

        if (!formData.rut.trim()) {
            newErrors.rut = 'El RUT es requerido';
        } else if (!validateRut(formData.rut)) {
            newErrors.rut = 'RUT inválido';
        }

        if (formData.telefono && !formData.telefono.match(/^\+?[0-9]{8,15}$/)) {
            newErrors.telefono = 'Teléfono inválido (ej: +56912345678)';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            const data = {
                nombre: formData.nombre,
                rut: formData.rut.replace(/\./g, '').replace(/-/g, ''), // Guardar sin formato
                telefono: formData.telefono || null,
                especialidad: formData.especialidad,
                activo: true
            };

            if (perfil) {
                // Actualizar perfil existente
                await updateTrabajador(perfil.id, data);
            } else {
                // Crear nuevo perfil
                await createTrabajador(data);
            }

            setEditing(false);
            loadPerfil();
            alert(perfil ? 'Perfil actualizado exitosamente' : 'Perfil creado exitosamente');
        } catch (error) {
            console.error('Error saving perfil:', error);
            alert('Error al guardar el perfil. Verifica que el RUT no esté duplicado.');
        }
    };

    if (loading) {
        return <div className="loading">Cargando perfil...</div>;
    }

    return (
        <div className="perfil-container">
            <div className="perfil-card glass-card">
                <div className="perfil-header">
                    <div className="perfil-avatar">
                        <User size={48} />
                    </div>
                    <h1 className="perfil-title">
                        {perfil ? 'Mi Perfil' : 'Crear Perfil de Trabajador'}
                    </h1>
                    {perfil && !editing && (
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={() => setEditing(true)}
                        >
                            <Edit2 size={16} />
                            Editar
                        </button>
                    )}
                </div>

                {editing ? (
                    <form onSubmit={handleSubmit} className="perfil-form">
                        <div className="input-group">
                            <label className="input-label">
                                <User size={16} />
                                Nombre Completo *
                            </label>
                            <input
                                type="text"
                                name="nombre"
                                className={`input-field ${errors.nombre ? 'input-error' : ''}`}
                                placeholder="Ej: Juan Pérez González"
                                value={formData.nombre}
                                onChange={handleInputChange}
                            />
                            {errors.nombre && <span className="error-text">{errors.nombre}</span>}
                        </div>

                        <div className="input-group">
                            <label className="input-label">
                                <User size={16} />
                                RUT *
                            </label>
                            <input
                                type="text"
                                name="rut"
                                className={`input-field ${errors.rut ? 'input-error' : ''}`}
                                placeholder="12.345.678-9"
                                value={formData.rut}
                                onChange={handleInputChange}
                                disabled={!!perfil} // No permitir cambiar RUT si ya existe
                            />
                            {errors.rut && <span className="error-text">{errors.rut}</span>}
                            {perfil && <span className="help-text">El RUT no se puede modificar</span>}
                        </div>

                        <div className="input-group">
                            <label className="input-label">
                                <Phone size={16} />
                                Teléfono
                            </label>
                            <input
                                type="tel"
                                name="telefono"
                                className={`input-field ${errors.telefono ? 'input-error' : ''}`}
                                placeholder="+56912345678"
                                value={formData.telefono}
                                onChange={handleInputChange}
                            />
                            {errors.telefono && <span className="error-text">{errors.telefono}</span>}
                        </div>

                        <div className="input-group">
                            <label className="input-label">
                                <Briefcase size={16} />
                                Especialidad *
                            </label>
                            <select
                                name="especialidad"
                                className="input-field"
                                value={formData.especialidad}
                                onChange={handleInputChange}
                            >
                                <option value="Electricista">Electricista</option>
                                <option value="Técnico">Técnico</option>
                                <option value="Ayudante">Ayudante</option>
                                <option value="Supervisor">Supervisor</option>
                            </select>
                        </div>

                        <div className="form-actions">
                            {perfil && (
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setEditing(false);
                                        setFormData({
                                            nombre: perfil.nombre,
                                            rut: perfil.rut,
                                            telefono: perfil.telefono || '',
                                            especialidad: perfil.especialidad
                                        });
                                        setErrors({});
                                    }}
                                >
                                    Cancelar
                                </button>
                            )}
                            <button type="submit" className="btn btn-primary">
                                <Save size={16} />
                                {perfil ? 'Guardar Cambios' : 'Crear Perfil'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="perfil-info">
                        <div className="info-item">
                            <div className="info-label">
                                <User size={16} />
                                Nombre
                            </div>
                            <div className="info-value">{perfil?.nombre}</div>
                        </div>

                        <div className="info-item">
                            <div className="info-label">
                                <User size={16} />
                                RUT
                            </div>
                            <div className="info-value">{formatRut(perfil?.rut || '')}</div>
                        </div>

                        <div className="info-item">
                            <div className="info-label">
                                <Phone size={16} />
                                Teléfono
                            </div>
                            <div className="info-value">{perfil?.telefono || 'No especificado'}</div>
                        </div>

                        <div className="info-item">
                            <div className="info-label">
                                <Briefcase size={16} />
                                Especialidad
                            </div>
                            <div className="info-value">
                                <span className={`especialidad-badge ${perfil?.especialidad?.toLowerCase()}`}>
                                    {perfil?.especialidad}
                                </span>
                            </div>
                        </div>

                        <div className="info-item">
                            <div className="info-label">Estado</div>
                            <div className="info-value">
                                <span className={`status-badge ${perfil?.activo ? 'activo' : 'inactivo'}`}>
                                    {perfil?.activo ? 'Activo' : 'Inactivo'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {!perfil && !editing && (
                    <div className="empty-state">
                        <p className="text-muted">No tienes un perfil de trabajador creado.</p>
                        <button
                            className="btn btn-primary"
                            onClick={() => setEditing(true)}
                        >
                            Crear Mi Perfil
                        </button>
                    </div>
                )}
            </div>

            <div className="info-card glass-card">
                <h3>Información Importante</h3>
                <ul className="info-list">
                    <li>Tu perfil te permite ser asignado a viviendas y proyectos</li>
                    <li>Asegúrate de mantener tu información actualizada</li>
                    <li>Tu RUT debe coincidir con el que usas para iniciar sesión</li>
                    <li>La especialidad ayuda a organizar mejor el trabajo</li>
                </ul>
            </div>
        </div>
    );
}
