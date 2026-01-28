import { useState, useEffect } from 'react';
import { Plus, ChevronDown, ChevronUp, Search, Users, UserPlus, X, MessageSquare, Image as ImageIcon, User, Lock } from 'lucide-react';
import { getClientes, createCliente, subscribeToClientes, createClientUser } from '../services/clienteService';
import { getProyectosByCliente, createProyecto, createVivienda, getViviendas, updateVivienda } from '../services/proyectoService';
import { getTrabajadores, getTrabajadoresByVivienda, asignarTrabajador, removerTrabajador } from '../services/trabajadorService';
import { uploadViviendaImagen, getViviendaImagenes, deleteViviendaImagen } from '../services/viviendaImagenService';
import { formatRut, cleanRut } from '../utils/rutValidator';
import './FlujoTrabajo.css';

export default function FlujoTrabajo() {
    const [clientes, setClientes] = useState([]);
    const [selectedTipo, setSelectedTipo] = useState('Constructora');
    const [selectedCliente, setSelectedCliente] = useState(null);
    const [proyectos, setProyectos] = useState([]);
    const [expandedProyecto, setExpandedProyecto] = useState(null);
    const [viviendas, setViviendas] = useState({});
    const [loading, setLoading] = useState(true);
    const [showClienteModal, setShowClienteModal] = useState(false);
    const [showProyectoModal, setShowProyectoModal] = useState(false);
    const [showViviendaModal, setShowViviendaModal] = useState(false);
    const [currentProyecto, setCurrentProyecto] = useState(null);
    const [newClienteNombre, setNewClienteNombre] = useState('');
    const [newProyectoNombre, setNewProyectoNombre] = useState('');
    const [newViviendaNombre, setNewViviendaNombre] = useState('');
    const [trabajadores, setTrabajadores] = useState([]);
    const [viviendaTrabajadores, setViviendaTrabajadores] = useState({});
    const [showTrabajadoresModal, setShowTrabajadoresModal] = useState(false);
    const [currentVivienda, setCurrentVivienda] = useState(null);

    // Comment and image states
    const [viviendaImagenes, setViviendaImagenes] = useState({});
    const [showComentariosModal, setShowComentariosModal] = useState(false);
    const [showImagenesModal, setShowImagenesModal] = useState(false);
    const [currentViviendaForEdit, setCurrentViviendaForEdit] = useState(null);
    const [comentarioTemp, setComentarioTemp] = useState('');
    const [selectedImages, setSelectedImages] = useState([]);
    const [uploadingImages, setUploadingImages] = useState(false);

    // User creation states
    const [showUserModal, setShowUserModal] = useState(false);
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [creatingUser, setCreatingUser] = useState(false);
    const [selectedClienteForUser, setSelectedClienteForUser] = useState(null);

    const handleCreateUser = async () => {
        if (!newUserEmail || !newUserPassword || !selectedClienteForUser) return;

        try {
            setCreatingUser(true);

            // Auto-append domain if missing (simulating RUT-based auth)
            // CRITICAL: We must CLEAN the RUT (remove dots/dashes) before creating the account
            // to match Login.jsx behavior which also cleans it.
            let loginIdentifier = newUserEmail;
            if (!newUserEmail.includes('@')) {
                loginIdentifier = cleanRut(newUserEmail);
            }

            const finalEmail = loginIdentifier.includes('@') ? loginIdentifier : `${loginIdentifier}@electrix.cl`;

            await createClientUser(finalEmail, newUserPassword, selectedClienteForUser.id);
            alert(`Usuario creado exitosamente para ${selectedClienteForUser.nombre}`);
            setShowUserModal(false);
            setNewUserEmail('');
            setNewUserPassword('');
        } catch (error) {
            console.error('Error creating user:', error);
            alert('Error al crear usuario: ' + error.message);
        } finally {
            setCreatingUser(false);
        }
    };


    useEffect(() => {
        loadClientes();
        loadTrabajadores();

        // Subscribe to real-time updates
        const unsubscribe = subscribeToClientes(() => {
            loadClientes();
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (selectedCliente) {
            loadProyectos();
        }
    }, [selectedCliente]);

    const loadClientes = async () => {
        try {
            const data = await getClientes();
            setClientes(data);
            if (data.length > 0 && !selectedCliente) {
                setSelectedCliente(data[0]);
            }
        } catch (error) {
            console.error('Error loading clientes:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadProyectos = async () => {
        if (!selectedCliente) return;

        try {
            const data = await getProyectosByCliente(selectedCliente.id);
            setProyectos(data);
        } catch (error) {
            console.error('Error loading proyectos:', error);
        }
    };

    const loadViviendas = async (proyectoId) => {
        try {
            const data = await getViviendas(proyectoId);
            setViviendas(prev => ({ ...prev, [proyectoId]: data }));
            // Load trabajadores and images for each vivienda
            data.forEach(async vivienda => {
                loadTrabajadoresVivienda(vivienda.id);
                const imagenes = await getViviendaImagenes(vivienda.id);
                setViviendaImagenes(prev => ({ ...prev, [vivienda.id]: imagenes }));
            });
        } catch (error) {
            console.error('Error loading viviendas:', error);
        }
    };

    const loadTrabajadores = async () => {
        try {
            const data = await getTrabajadores(true); // Solo activos
            setTrabajadores(data);
        } catch (error) {
            console.error('Error loading trabajadores:', error);
        }
    };

    const loadTrabajadoresVivienda = async (viviendaId) => {
        try {
            const data = await getTrabajadoresByVivienda(viviendaId);
            setViviendaTrabajadores(prev => ({ ...prev, [viviendaId]: data }));
        } catch (error) {
            console.error('Error loading trabajadores vivienda:', error);
        }
    };

    const handleAsignarTrabajador = async (trabajadorId) => {
        if (!currentVivienda) return;

        try {
            await asignarTrabajador({
                vivienda_id: currentVivienda.id,
                trabajador_id: trabajadorId
            });
            loadTrabajadoresVivienda(currentVivienda.id);
        } catch (error) {
            console.error('Error asignando trabajador:', error);
            alert('Error al asignar trabajador. Puede que ya esté asignado.');
        }
    };

    const handleRemoverTrabajador = async (trabajadorId) => {
        if (!currentVivienda) return;

        try {
            await removerTrabajador(currentVivienda.id, trabajadorId);
            loadTrabajadoresVivienda(currentVivienda.id);
        } catch (error) {
            console.error('Error removiendo trabajador:', error);
        }
    };

    const handleAddCliente = async () => {
        if (!newClienteNombre.trim()) return;

        try {
            await createCliente({
                nombre: newClienteNombre,
                tipo: selectedTipo
            });
            setNewClienteNombre('');
            setShowClienteModal(false);
            loadClientes();
        } catch (error) {
            console.error('Error creating cliente:', error);
        }
    };

    const handleAddProyecto = async () => {
        if (!newProyectoNombre.trim() || !selectedCliente) return;

        try {
            await createProyecto({
                nombre: newProyectoNombre,
                cliente_id: selectedCliente.id
            });
            setNewProyectoNombre('');
            setShowProyectoModal(false);
            loadProyectos();
        } catch (error) {
            console.error('Error creating proyecto:', error);
        }
    };

    const handleAddVivienda = async () => {
        if (!newViviendaNombre.trim() || !currentProyecto) return;

        try {
            await createVivienda({
                nombre: newViviendaNombre,
                proyecto_id: currentProyecto.id,
                factibilidad: false,
                te1: false,
                empalme: false,
                tda: false,
                canalizacion: false,
                cableado: false
            });
            setNewViviendaNombre('');
            setShowViviendaModal(false);
            loadViviendas(currentProyecto.id);
        } catch (error) {
            console.error('Error creating vivienda:', error);
        }
    };

    const toggleProyecto = (proyectoId) => {
        if (expandedProyecto === proyectoId) {
            setExpandedProyecto(null);
        } else {
            setExpandedProyecto(proyectoId);
            if (!viviendas[proyectoId]) {
                loadViviendas(proyectoId);
            }
        }
    };

    const handleCheckboxChange = async (viviendaId, field, currentValue) => {
        try {
            await updateVivienda(viviendaId, { [field]: !currentValue });
            // Reload viviendas for the current proyecto
            const proyectoId = Object.keys(viviendas).find(pid =>
                viviendas[pid].some(v => v.id === viviendaId)
            );
            if (proyectoId) {
                loadViviendas(proyectoId);
            }
        } catch (error) {
            console.error('Error updating vivienda:', error);
        }
    };

    if (loading) {
        return <div className="loading">Cargando...</div>;
    }

    return (
        <div className="flujo-trabajo-container">
            <section className="clientes-section glass-card">
                <div className="section-header">
                    <h2>Clientes</h2>
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setShowClienteModal(true)}
                    >
                        <Plus size={16} />
                        Agregar
                    </button>
                </div>

                <div className="input-group">
                    <label className="input-label">Tipo</label>
                    <select
                        className="input-field"
                        value={selectedTipo}
                        onChange={(e) => setSelectedTipo(e.target.value)}
                    >
                        <option value="Constructora">Constructora</option>
                        <option value="Particular">Particular</option>
                        <option value="Empresa">Empresa</option>
                    </select>
                </div>

                <div className="input-group">
                    <label className="input-label">Nombre del cliente</label>
                    <div className="search-wrapper">
                        <Search size={16} className="search-icon" />
                        <select
                            className="input-field"
                            value={selectedCliente?.id || ''}
                            onChange={(e) => {
                                const cliente = clientes.find(c => c.id === e.target.value);
                                setSelectedCliente(cliente);
                            }}
                        >
                            <option value="">Seleccionar cliente...</option>
                            {clientes.filter(c => c.tipo === selectedTipo).map(cliente => (
                                <option key={cliente.id} value={cliente.id}>
                                    {cliente.nombre}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {selectedCliente && (
                    <div className="selected-cliente" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3>{selectedCliente.nombre}</h3>
                            <p className="text-muted">{selectedCliente.tipo}</p>
                        </div>
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => {
                                setSelectedClienteForUser(selectedCliente);
                                setShowUserModal(true);
                            }}
                        >
                            <Lock size={16} />
                            Crear Acceso
                        </button>
                    </div>
                )}
            </section>

            {selectedCliente && (
                <section className="proyectos-section glass-card">
                    <div className="section-header">
                        <h2>Proyectos de {selectedCliente.nombre}</h2>
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={() => setShowProyectoModal(true)}
                        >
                            <Plus size={16} />
                            Agregar proyecto
                        </button>
                    </div>

                    <div className="proyectos-list">
                        {proyectos.length === 0 ? (
                            <p className="text-muted text-center">No hay proyectos registrados</p>
                        ) : (
                            proyectos.map(proyecto => (
                                <div key={proyecto.id} className="proyecto-card glass-card">
                                    <div
                                        className="proyecto-header"
                                        onClick={() => toggleProyecto(proyecto.id)}
                                    >
                                        <h3>{proyecto.nombre}</h3>
                                        <div className="proyecto-actions">
                                            <button
                                                className="btn btn-primary btn-sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setCurrentProyecto(proyecto);
                                                    setShowViviendaModal(true);
                                                }}
                                            >
                                                <Plus size={16} />
                                                Agregar vivienda
                                            </button>
                                            {expandedProyecto === proyecto.id ? (
                                                <ChevronUp size={20} />
                                            ) : (
                                                <ChevronDown size={20} />
                                            )}
                                        </div>
                                    </div>

                                    {expandedProyecto === proyecto.id && (
                                        <div className="viviendas-list">
                                            {viviendas[proyecto.id]?.map(vivienda => (
                                                <div key={vivienda.id} className="vivienda-card">
                                                    <h4>{vivienda.nombre}</h4>
                                                    <div className="vivienda-checkboxes">
                                                        <label className="checkbox-label">
                                                            <input
                                                                type="checkbox"
                                                                checked={vivienda.factibilidad}
                                                                onChange={() => handleCheckboxChange(vivienda.id, 'factibilidad', vivienda.factibilidad)}
                                                            />
                                                            Factibilidad
                                                        </label>
                                                        <label className="checkbox-label">
                                                            <input
                                                                type="checkbox"
                                                                checked={vivienda.te1}
                                                                onChange={() => handleCheckboxChange(vivienda.id, 'te1', vivienda.te1)}
                                                            />
                                                            TE1
                                                        </label>
                                                        <label className="checkbox-label">
                                                            <input
                                                                type="checkbox"
                                                                checked={vivienda.empalme}
                                                                onChange={() => handleCheckboxChange(vivienda.id, 'empalme', vivienda.empalme)}
                                                            />
                                                            Empalme
                                                        </label>
                                                        <label className="checkbox-label">
                                                            <input
                                                                type="checkbox"
                                                                checked={vivienda.tda}
                                                                onChange={() => handleCheckboxChange(vivienda.id, 'tda', vivienda.tda)}
                                                            />
                                                            TDA
                                                        </label>
                                                        <label className="checkbox-label">
                                                            <input
                                                                type="checkbox"
                                                                checked={vivienda.canalizacion}
                                                                onChange={() => handleCheckboxChange(vivienda.id, 'canalizacion', vivienda.canalizacion)}
                                                            />
                                                            Canalización
                                                        </label>
                                                        <label className="checkbox-label">
                                                            <input
                                                                type="checkbox"
                                                                checked={vivienda.cableado}
                                                                onChange={() => handleCheckboxChange(vivienda.id, 'cableado', vivienda.cableado)}
                                                            />
                                                            Cableado
                                                        </label>
                                                        <label className="checkbox-label">
                                                            <input
                                                                type="checkbox"
                                                                checked={vivienda.bomba_agua}
                                                                onChange={() => handleCheckboxChange(vivienda.id, 'bomba_agua', vivienda.bomba_agua)}
                                                            />
                                                            Bomba de agua
                                                        </label>
                                                        <label className="checkbox-label">
                                                            <input
                                                                type="checkbox"
                                                                checked={vivienda.soldadura}
                                                                onChange={() => handleCheckboxChange(vivienda.id, 'soldadura', vivienda.soldadura)}
                                                            />
                                                            Soldadura
                                                        </label>
                                                        <label className="checkbox-label">
                                                            <input
                                                                type="checkbox"
                                                                checked={vivienda.artefactado}
                                                                onChange={() => handleCheckboxChange(vivienda.id, 'artefactado', vivienda.artefactado)}
                                                            />
                                                            Artefactado
                                                        </label>
                                                        <label className="checkbox-label">
                                                            <input
                                                                type="checkbox"
                                                                checked={vivienda.pruebas_electricas}
                                                                onChange={() => handleCheckboxChange(vivienda.id, 'pruebas_electricas', vivienda.pruebas_electricas)}
                                                            />
                                                            Pruebas eléctricas
                                                        </label>
                                                        <label className="checkbox-label">
                                                            <input
                                                                type="checkbox"
                                                                checked={vivienda.rotulado}
                                                                onChange={() => handleCheckboxChange(vivienda.id, 'rotulado', vivienda.rotulado)}
                                                            />
                                                            Rotulado
                                                        </label>
                                                    </div>
                                                    {vivienda.detalles && (
                                                        <div className="vivienda-detalles">
                                                            <p className="text-muted">Detalles</p>
                                                            <p>{vivienda.detalles}</p>
                                                        </div>
                                                    )}

                                                    {/* Comentarios e Imágenes */}
                                                    <div className="vivienda-actions" style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                                        <button
                                                            className="btn btn-ghost btn-sm"
                                                            onClick={() => {
                                                                setCurrentViviendaForEdit(vivienda);
                                                                setComentarioTemp(vivienda.comentarios || '');
                                                                setShowComentariosModal(true);
                                                            }}
                                                        >
                                                            <MessageSquare size={16} />
                                                            Comentarios
                                                        </button>
                                                        <button
                                                            className="btn btn-ghost btn-sm"
                                                            onClick={() => {
                                                                setCurrentViviendaForEdit(vivienda);
                                                                setShowImagenesModal(true);
                                                            }}
                                                        >
                                                            <ImageIcon size={16} />
                                                            Imágenes ({viviendaImagenes[vivienda.id]?.length || 0})
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </section>
            )}

            {/* Modal Crear Usuario Cliente */}
            {showUserModal && selectedClienteForUser && (
                <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Crear Acceso para {selectedClienteForUser.nombre}</h2>
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => setShowUserModal(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="alert-info" style={{ marginBottom: '15px', padding: '10px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '6px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                <p style={{ fontSize: '0.9rem' }}>Esto creará un usuario para que el cliente pueda entrar y ver sus proyectos.</p>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Usuario (RUT)</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Ej: 12345678-9"
                                    value={newUserEmail}
                                    onChange={(e) => {
                                        const formatted = formatRut(e.target.value);
                                        setNewUserEmail(formatted);
                                    }}
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Contraseña</label>
                                <input
                                    type="password"
                                    className="input-field"
                                    placeholder="Mínimo 6 caracteres"
                                    value={newUserPassword}
                                    onChange={(e) => setNewUserPassword(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowUserModal(false)}
                            >
                                Cancelar
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleCreateUser}
                                disabled={creatingUser}
                            >
                                {creatingUser ? 'Creando...' : 'Crear Usuario'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Cliente Modal */}
            {showClienteModal && (
                <div className="modal-overlay" onClick={() => setShowClienteModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Agregar Cliente</h2>
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => setShowClienteModal(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="input-group">
                                <label className="input-label">Nombre del cliente</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Ej: Constructora Sygma"
                                    value={newClienteNombre}
                                    onChange={(e) => setNewClienteNombre(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowClienteModal(false)}
                            >
                                Cancelar
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleAddCliente}
                            >
                                Agregar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Proyecto Modal */}
            {showProyectoModal && (
                <div className="modal-overlay" onClick={() => setShowProyectoModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Agregar Proyecto</h2>
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => setShowProyectoModal(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="input-group">
                                <label className="input-label">Nombre del proyecto</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Ej: Viviendas boyeco 4"
                                    value={newProyectoNombre}
                                    onChange={(e) => setNewProyectoNombre(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowProyectoModal(false)}
                            >
                                Cancelar
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleAddProyecto}
                            >
                                Agregar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Vivienda Modal */}
            {showViviendaModal && (
                <div className="modal-overlay" onClick={() => setShowViviendaModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Agregar Vivienda</h2>
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => setShowViviendaModal(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="input-group">
                                <label className="input-label">Nombre de la vivienda</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Ej: Vivienda 2"
                                    value={newViviendaNombre}
                                    onChange={(e) => setNewViviendaNombre(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowViviendaModal(false)}
                            >
                                Cancelar
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleAddVivienda}
                            >
                                Agregar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Asignar Trabajadores Modal */}
            {showTrabajadoresModal && currentVivienda && (
                <div className="modal-overlay" onClick={() => setShowTrabajadoresModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Trabajadores - {currentVivienda.nombre}</h2>
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => setShowTrabajadoresModal(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="trabajadores-asignados">
                                <h3 style={{ fontSize: '1rem', marginBottom: 'var(--spacing-md)' }}>Asignados</h3>
                                {viviendaTrabajadores[currentVivienda.id]?.length > 0 ? (
                                    <div className="trabajadores-grid">
                                        {viviendaTrabajadores[currentVivienda.id].map(asignacion => (
                                            <div key={asignacion.id} className="trabajador-item">
                                                <div>
                                                    <p style={{ fontWeight: 600 }}>{asignacion.trabajador.nombre}</p>
                                                    <p className="text-muted" style={{ fontSize: '0.75rem' }}>{asignacion.trabajador.especialidad}</p>
                                                </div>
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    onClick={() => handleRemoverTrabajador(asignacion.trabajador.id)}
                                                    title="Remover"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted">No hay trabajadores asignados</p>
                                )}
                            </div>

                            <div className="trabajadores-disponibles" style={{ marginTop: 'var(--spacing-xl)' }}>
                                <h3 style={{ fontSize: '1rem', marginBottom: 'var(--spacing-md)' }}>Disponibles</h3>
                                <div className="trabajadores-grid">
                                    {trabajadores
                                        .filter(t => !viviendaTrabajadores[currentVivienda.id]?.some(vt => vt.trabajador.id === t.id))
                                        .map(trabajador => (
                                            <div key={trabajador.id} className="trabajador-item">
                                                <div>
                                                    <p style={{ fontWeight: 600 }}>{trabajador.nombre}</p>
                                                    <p className="text-muted" style={{ fontSize: '0.75rem' }}>{trabajador.especialidad}</p>
                                                </div>
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() => handleAsignarTrabajador(trabajador.id)}
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn btn-primary"
                                onClick={() => setShowTrabajadoresModal(false)}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Comentarios */}
            {showComentariosModal && currentViviendaForEdit && (
                <div className="modal-overlay" onClick={() => setShowComentariosModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Comentarios - {currentViviendaForEdit.nombre}</h2>
                            <button className="btn btn-ghost btn-sm" onClick={() => setShowComentariosModal(false)}>
                                ✕
                            </button>
                        </div>
                        <div className="modal-body">
                            <textarea
                                className="input-field"
                                rows="6"
                                placeholder="Agregar comentarios sobre el progreso de la vivienda..."
                                value={comentarioTemp}
                                onChange={(e) => setComentarioTemp(e.target.value)}
                                style={{ width: '100%', resize: 'vertical' }}
                            />
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowComentariosModal(false)}>
                                Cancelar
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={async () => {
                                    await updateVivienda(currentViviendaForEdit.id, { comentarios: comentarioTemp });
                                    loadViviendas(currentViviendaForEdit.proyecto_id);
                                    setShowComentariosModal(false);
                                }}
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Imágenes */}
            {showImagenesModal && currentViviendaForEdit && (
                <div className="modal-overlay" onClick={() => setShowImagenesModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">Imágenes - {currentViviendaForEdit.nombre}</h2>
                            <button className="btn btn-ghost btn-sm" onClick={() => setShowImagenesModal(false)}>
                                ✕
                            </button>
                        </div>
                        <div className="modal-body">
                            {/* Galería de imágenes existentes */}
                            <div style={{ marginBottom: '20px' }}>
                                <h3 style={{ fontSize: '1rem', marginBottom: '10px' }}>Imágenes actuales</h3>
                                {viviendaImagenes[currentViviendaForEdit.id]?.length > 0 ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
                                        {viviendaImagenes[currentViviendaForEdit.id].map((img) => (
                                            <div key={img.id} style={{ position: 'relative' }}>
                                                <img
                                                    src={img.imagen_url}
                                                    alt="Vivienda"
                                                    style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '4px' }}
                                                />
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(0,0,0,0.7)', padding: '5px' }}
                                                    onClick={async () => {
                                                        if (confirm('¿Eliminar esta imagen?')) {
                                                            await deleteViviendaImagen(img.id, img.imagen_url);
                                                            const imagenes = await getViviendaImagenes(currentViviendaForEdit.id);
                                                            setViviendaImagenes(prev => ({ ...prev, [currentViviendaForEdit.id]: imagenes }));
                                                        }
                                                    }}
                                                >
                                                    <X size={16} color="white" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted">No hay imágenes cargadas</p>
                                )}
                            </div>

                            {/* Subir nuevas imágenes */}
                            <div>
                                <h3 style={{ fontSize: '1rem', marginBottom: '10px' }}>Subir nuevas imágenes</h3>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={(e) => setSelectedImages(Array.from(e.target.files))}
                                    style={{ marginBottom: '10px' }}
                                />
                                {selectedImages.length > 0 && (
                                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                                        {selectedImages.length} imagen(es) seleccionada(s)
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => {
                                setShowImagenesModal(false);
                                setSelectedImages([]);
                            }}>
                                Cerrar
                            </button>
                            {selectedImages.length > 0 && (
                                <button
                                    className="btn btn-primary"
                                    disabled={uploadingImages}
                                    onClick={async () => {
                                        setUploadingImages(true);
                                        try {
                                            for (const file of selectedImages) {
                                                await uploadViviendaImagen(currentViviendaForEdit.id, file);
                                            }
                                            const imagenes = await getViviendaImagenes(currentViviendaForEdit.id);
                                            setViviendaImagenes(prev => ({ ...prev, [currentViviendaForEdit.id]: imagenes }));
                                            setSelectedImages([]);
                                        } catch (error) {
                                            console.error('Error uploading images:', error);
                                            alert('Error al subir imágenes. Verifica que el bucket "viviendas" esté configurado.');
                                        } finally {
                                            setUploadingImages(false);
                                        }
                                    }}
                                >
                                    {uploadingImages ? 'Subiendo...' : 'Subir Imágenes'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
