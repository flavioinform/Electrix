import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, User, Lock, Phone, Briefcase, ArrowLeft } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { createTrabajador } from '../services/trabajadorService';
import { formatRut, validateRut, cleanRut } from '../utils/rutValidator';
import './Registro.css';

export default function Registro() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        nombre: '',
        rut: '',
        telefono: '',
        especialidad: 'Electricista',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});

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

        if (!formData.password) {
            newErrors.password = 'La contraseña es requerida';
        } else if (formData.password.length < 6) {
            newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Las contraseñas no coinciden';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const rutLimpio = cleanRut(formData.rut);
            const email = `${rutLimpio}@electrix.cl`;

            // 1. Crear usuario en Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password: formData.password,
                options: {
                    emailRedirectTo: undefined,
                    data: {
                        nombre: formData.nombre,
                        rut: rutLimpio
                    }
                }
            });

            if (authError) {
                if (authError.message.includes('already registered')) {
                    throw new Error('Este RUT ya está registrado. Intenta iniciar sesión.');
                }
                throw authError;
            }

            // 2. Crear perfil de trabajador
            await createTrabajador({
                nombre: formData.nombre,
                rut: rutLimpio,
                telefono: formData.telefono || null,
                especialidad: formData.especialidad,
                activo: true
            });

            alert('¡Registro exitoso! Ahora puedes iniciar sesión.');
            navigate('/login');
        } catch (error) {
            console.error('Error en registro:', error);
            setErrors({
                general: error.message || 'Error al registrarse. Intenta nuevamente.'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="registro-container">
            <div className="registro-card glass-card">
                <div className="registro-header">
                    <div className="logo">
                        <Zap size={48} />
                    </div>
                    <h1 className="title">ELECTRIX</h1>
                    <p className="subtitle">Registro de Trabajador</p>
                </div>

                {errors.general && (
                    <div className="alert alert-error">
                        {errors.general}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="registro-form">
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
                            disabled={loading}
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
                            disabled={loading}
                        />
                        {errors.rut && <span className="error-text">{errors.rut}</span>}
                        <span className="help-text">Usarás tu RUT para iniciar sesión</span>
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
                            disabled={loading}
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
                            disabled={loading}
                        >
                            <option value="Electricista">Electricista</option>
                            <option value="Técnico">Técnico</option>
                            <option value="Ayudante">Ayudante</option>
                            <option value="Supervisor">Supervisor</option>
                        </select>
                    </div>

                    <div className="input-group">
                        <label className="input-label">
                            <Lock size={16} />
                            Contraseña *
                        </label>
                        <input
                            type="password"
                            name="password"
                            className={`input-field ${errors.password ? 'input-error' : ''}`}
                            placeholder="Mínimo 6 caracteres"
                            value={formData.password}
                            onChange={handleInputChange}
                            disabled={loading}
                        />
                        {errors.password && <span className="error-text">{errors.password}</span>}
                    </div>

                    <div className="input-group">
                        <label className="input-label">
                            <Lock size={16} />
                            Confirmar Contraseña *
                        </label>
                        <input
                            type="password"
                            name="confirmPassword"
                            className={`input-field ${errors.confirmPassword ? 'input-error' : ''}`}
                            placeholder="Repite tu contraseña"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            disabled={loading}
                        />
                        {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        disabled={loading}
                    >
                        {loading ? 'Registrando...' : 'Registrarse'}
                    </button>
                </form>

                <div className="registro-footer">
                    <button
                        className="btn btn-ghost"
                        onClick={() => navigate('/login')}
                        disabled={loading}
                    >
                        <ArrowLeft size={16} />
                        Volver al inicio de sesión
                    </button>
                </div>
            </div>

            <p className="sistema-info">Sistema de gestión para 6-10 usuarios</p>
        </div>
    );
}
