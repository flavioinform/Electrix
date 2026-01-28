import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Upload, X, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { getTransaccionesByMonth, createTransaccion, getMonthlyBalance, subscribeToTransacciones, getTransaccionImagenes, uploadTransaccionImagen } from '../services/transaccionService';
import { getClientes } from '../services/clienteService';
import { getProyectos } from '../services/proyectoService';
import { useAuth } from '../context/AuthContext';
import './FlujoCaja.css';

export default function FlujoCaja() {
    const { isAdmin, isTrabajador, isSupervisor } = useAuth();
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [transacciones, setTransacciones] = useState([]);
    const [balance, setBalance] = useState({ ingresos: 0, gastos: 0, balance: 0 });
    const [clientes, setClientes] = useState([]);
    const [proyectos, setProyectos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [uploadingImages, setUploadingImages] = useState(false);

    // Filters
    const [searchText, setSearchText] = useState('');
    const [filterTipo, setFilterTipo] = useState('todas');
    const [filterCliente, setFilterCliente] = useState('todos');
    const [filterProyecto] = useState('todos');
    const [filterProyectoId, setFilterProyectoId] = useState('todos'); // Fixed variable name if needed, but sticking to existing pattern

    // New transaction form
    const [newTransaccion, setNewTransaccion] = useState({
        tipo: 'ingreso',
        monto: '',
        descripcion: '',
        fecha: new Date().toISOString().split('T')[0],
        cliente: '',
        proyecto: '',
        categoria_gasto: '',
        comentarios: '',
        imagenes: []
    });

    useEffect(() => {
        loadData();

        // Subscribe to real-time updates
        const unsubscribe = subscribeToTransacciones(() => {
            loadTransacciones();
        });

        return () => unsubscribe();
    }, [selectedMonth]);

    useEffect(() => {
        loadClientes();
        loadProyectos();
    }, []);

    const loadData = async () => {
        await Promise.all([loadTransacciones(), loadBalance()]);
        setLoading(false);
    };

    const loadTransacciones = async () => {
        try {
            const [year, month] = selectedMonth.split('-');
            const data = await getTransaccionesByMonth(year, month);
            setTransacciones(data);
        } catch (error) {
            console.error('Error loading transacciones:', error);
            setTransacciones([]); // Set empty array on error
        }
    };

    const loadBalance = async () => {
        try {
            const [year, month] = selectedMonth.split('-');
            const data = await getMonthlyBalance(year, month);
            setBalance(data);
        } catch (error) {
            console.error('Error loading balance:', error);
            setBalance({ ingresos: 0, gastos: 0, balance: 0 }); // Set default on error
        }
    };

    const loadClientes = async () => {
        try {
            const data = await getClientes();
            setClientes(data);
        } catch (error) {
            console.error('Error loading clientes:', error);
        }
    };

    const loadProyectos = async () => {
        try {
            const data = await getProyectos();
            setProyectos(data);
        } catch (error) {
            console.error('Error loading proyectos:', error);
        }
    };

    const handleAddTransaccion = async () => {
        if (!newTransaccion.monto || !newTransaccion.descripcion) {
            alert('Por favor completa todos los campos requeridos');
            return;
        }

        try {
            // Create transaction - only use fields that exist in current schema
            const transaccionData = {
                tipo: newTransaccion.tipo,
                monto: parseFloat(newTransaccion.monto),
                descripcion: newTransaccion.descripcion,
                fecha: newTransaccion.fecha,
                cliente_id: newTransaccion.cliente || null,
                proyecto_id: newTransaccion.proyecto || null
            };

            // Only add new fields if they're supported (after migration)
            if (newTransaccion.tipo === 'gasto' && newTransaccion.categoria_gasto) {
                transaccionData.categoria_gasto = newTransaccion.categoria_gasto;
            }
            if (newTransaccion.comentarios) {
                transaccionData.comentarios = newTransaccion.comentarios;
            }

            const transaccion = await createTransaccion(transaccionData);

            // Upload images if any (only if table exists)
            if (newTransaccion.imagenes.length > 0) {
                try {
                    setUploadingImages(true);
                    for (const file of newTransaccion.imagenes) {
                        await uploadTransaccionImagen(transaccion.id, file);
                    }
                    setUploadingImages(false);
                } catch (imageError) {
                    console.error('Error uploading images (table may not exist yet):', imageError);
                    setUploadingImages(false);
                }
            }

            setNewTransaccion({
                tipo: 'ingreso',
                monto: '',
                descripcion: '',
                fecha: new Date().toISOString().split('T')[0],
                categoria_gasto: '',
                comentarios: '',
                cliente: '',
                proyecto: '',
                imagenes: []
            });
            setShowModal(false);
            loadData();
        } catch (error) {
            console.error('Error creating transaccion:', error);
            alert('Error al crear la transacción');
            setUploadingImages(false);
        }
    };

    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files);
        setNewTransaccion({ ...newTransaccion, imagenes: [...newTransaccion.imagenes, ...files] });
    };

    const handleRemoveImage = (index) => {
        const newImagenes = [...newTransaccion.imagenes];
        newImagenes.splice(index, 1);
        setNewTransaccion({ ...newTransaccion, imagenes: newImagenes });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP'
        }).format(amount);
    };

    const filteredTransacciones = transacciones.filter(t => {
        // HIDE INCOME FOR REGULAR WORKERS (Non-Supervisors)
        if (!isAdmin && !isSupervisor && t.tipo === 'ingreso') {
            return false;
        }

        if (searchText && !t.descripcion.toLowerCase().includes(searchText.toLowerCase())) {
            return false;
        }
        if (filterTipo !== 'todas' && t.tipo !== filterTipo) {
            return false;
        }
        if (filterCliente !== 'todos' && t.cliente !== filterCliente) {
            return false;
        }
        if (filterProyecto !== 'todos' && t.proyecto !== filterProyecto) { // Using filterProyecto as defined in state
            return false;
        }
        return true;
    });

    if (loading) {
        return <div className="loading">Cargando...</div>;
    }

    return (
        <div className="flujo-caja-container">
            <div className="caja-header">
                <div className="month-selector">
                    <label className="input-label">Mes</label>
                    <input
                        type="month"
                        className="input-field"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                    />
                </div>

                <div className="balance-cards">
                    {(isAdmin || isSupervisor) && (
                        <div className="balance-card glass-card">
                            <p className="balance-label">Ingresos ({selectedMonth})</p>
                            <p className="balance-amount ingreso">{formatCurrency(balance.ingresos)}</p>
                        </div>
                    )}
                    <div className="balance-card glass-card">
                        <p className="balance-label">Gastos ({selectedMonth})</p>
                        <p className="balance-amount gasto">{formatCurrency(balance.gastos)}</p>
                    </div>
                    {(isAdmin || isSupervisor) && (
                        <div className="balance-card glass-card">
                            <p className="balance-label">Balance ({selectedMonth})</p>
                            <p className={`balance-amount ${balance.balance >= 0 ? 'ingreso' : 'gasto'}`}>
                                {formatCurrency(balance.balance)}
                            </p>
                        </div>
                    )}
                </div>

                <button
                    className="btn btn-primary btn-lg nueva-transaccion-btn"
                    onClick={() => setShowModal(true)}
                >
                    <Plus size={20} />
                    Nueva transacción
                </button>
            </div>

            <div className="filters-section glass-card">
                <div className="filters-grid">
                    <div className="input-group">
                        <label className="input-label">
                            <Search size={16} />
                            Buscar
                        </label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Texto..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Tipo</label>
                        <select
                            className="input-field"
                            value={filterTipo}
                            onChange={(e) => setFilterTipo(e.target.value)}
                        >
                            <option value="todas">Todas</option>
                            <option value="ingreso">Ingreso</option>
                            <option value="gasto">Gasto</option>
                        </select>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Cliente</label>
                        <select
                            className="input-field"
                            value={filterCliente}
                            onChange={(e) => setFilterCliente(e.target.value)}
                        >
                            <option value="todos">Todos</option>
                            {clientes.map(c => (
                                <option key={c.id} value={c.id}>{c.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Proyecto</label>
                        <select
                            className="input-field"
                            value={filterProyecto}
                            onChange={(e) => setFilterProyecto(e.target.value)}
                        >
                            <option value="todos">Todos</option>
                            {proyectos.map(p => (
                                <option key={p.id} value={p.id}>{p.nombre}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                        setSearchText('');
                        setFilterTipo('todas');
                        setFilterCliente('todos');
                        setFilterProyecto('todos');
                    }}
                >
                    Limpiar filtros
                </button>
            </div>

            <div className="transacciones-section glass-card">
                <div className="transacciones-table">
                    <div className="table-header">
                        <div className="table-cell">Fecha</div>
                        <div className="table-cell">Tipo</div>
                        <div className="table-cell">Categoría</div>
                        <div className="table-cell">Cliente</div>
                        <div className="table-cell">Proyecto</div>
                        <div className="table-cell">Descripción</div>
                        <div className="table-cell">Comentarios</div>
                        <div className="table-cell">Imágenes</div>
                        <div className="table-cell">Monto</div>
                    </div>

                    {filteredTransacciones.length === 0 ? (
                        <div className="empty-state">
                            <p className="text-muted">No hay movimientos para este mes.</p>
                        </div>
                    ) : (
                        filteredTransacciones.map(t => (
                            <TransaccionRow key={t.id} transaccion={t} formatCurrency={formatCurrency} />
                        ))
                    )}
                </div>
            </div>

            {/* Add Transaction Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Nueva Transacción</h2>
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => setShowModal(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="input-group">
                                <label className="input-label">Tipo</label>
                                <select
                                    className="input-field"
                                    value={newTransaccion.tipo}
                                    onChange={(e) => setNewTransaccion({ ...newTransaccion, tipo: e.target.value })}
                                >
                                    <option value="ingreso">Ingreso</option>
                                    <option value="gasto">Gasto</option>
                                </select>
                            </div>

                            {newTransaccion.tipo === 'gasto' && (
                                <div className="input-group">
                                    <label className="input-label">Categoría de Gasto</label>
                                    <select
                                        className="input-field"
                                        value={newTransaccion.categoria_gasto}
                                        onChange={(e) => setNewTransaccion({ ...newTransaccion, categoria_gasto: e.target.value })}
                                    >
                                        <option value="">Seleccionar categoría</option>
                                        <option value="bomba_agua">Bomba de agua</option>
                                        <option value="soldadura">Soldadura</option>
                                        <option value="artefactado">Artefactado</option>
                                        <option value="pruebas_electricas">Pruebas eléctricas</option>
                                        <option value="rotulado">Rotulado</option>
                                        <option value="otro">Otro</option>
                                    </select>
                                </div>
                            )}

                            <div className="input-group">
                                <label className="input-label">Monto *</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    placeholder="0"
                                    value={newTransaccion.monto}
                                    onChange={(e) => setNewTransaccion({ ...newTransaccion, monto: e.target.value })}
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Descripción *</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Descripción de la transacción"
                                    value={newTransaccion.descripcion}
                                    onChange={(e) => setNewTransaccion({ ...newTransaccion, descripcion: e.target.value })}
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Comentarios</label>
                                <textarea
                                    className="input-field"
                                    placeholder="Comentarios adicionales..."
                                    rows="3"
                                    value={newTransaccion.comentarios}
                                    onChange={(e) => setNewTransaccion({ ...newTransaccion, comentarios: e.target.value })}
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Fecha</label>
                                <input
                                    type="date"
                                    className="input-field"
                                    value={newTransaccion.fecha}
                                    onChange={(e) => setNewTransaccion({ ...newTransaccion, fecha: e.target.value })}
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Cliente (opcional)</label>
                                <select
                                    className="input-field"
                                    value={newTransaccion.cliente}
                                    onChange={(e) => setNewTransaccion({ ...newTransaccion, cliente: e.target.value })}
                                >
                                    <option value="">Sin cliente</option>
                                    {clientes.map(c => (
                                        <option key={c.id} value={c.id}>{c.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="input-group">
                                <label className="input-label">Proyecto (opcional)</label>
                                <select
                                    className="input-field"
                                    value={newTransaccion.proyecto}
                                    onChange={(e) => setNewTransaccion({ ...newTransaccion, proyecto: e.target.value })}
                                >
                                    <option value="">Sin proyecto</option>
                                    {proyectos.map(p => (
                                        <option key={p.id} value={p.id}>{p.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="input-group">
                                <label className="input-label">
                                    <Upload size={16} />
                                    Imágenes (opcional)
                                </label>
                                <input
                                    type="file"
                                    className="input-field"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageSelect}
                                />
                                {newTransaccion.imagenes.length > 0 && (
                                    <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                        {newTransaccion.imagenes.map((file, index) => (
                                            <div key={index} style={{ position: 'relative', display: 'inline-block' }}>
                                                <img
                                                    src={URL.createObjectURL(file)}
                                                    alt={`Preview ${index}`}
                                                    style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }}
                                                />
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    style={{ position: 'absolute', top: '-5px', right: '-5px', padding: '2px' }}
                                                    onClick={() => handleRemoveImage(index)}
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowModal(false)}
                            >
                                Cancelar
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleAddTransaccion}
                                disabled={uploadingImages}
                            >
                                {uploadingImages ? 'Subiendo imágenes...' : 'Crear Transacción'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper component to display transaction row with images
function TransaccionRow({ transaccion: t, formatCurrency }) {
    const [imagenes, setImagenes] = useState([]);
    const [showImages, setShowImages] = useState(false);

    useEffect(() => {
        if (t.id) {
            getTransaccionImagenes(t.id).then(setImagenes).catch(console.error);
        }
    }, [t.id]);

    const getCategoriaLabel = (categoria) => {
        const labels = {
            'bomba_agua': 'Bomba de agua',
            'soldadura': 'Soldadura',
            'artefactado': 'Artefactado',
            'pruebas_electricas': 'Pruebas eléctricas',
            'rotulado': 'Rotulado',
            'otro': 'Otro'
        };
        return labels[categoria] || '-';
    };

    return (
        <>
            <div className="table-row">
                <div className="table-cell">{format(new Date(t.fecha), 'dd/MM/yyyy')}</div>
                <div className="table-cell">
                    <span className={`tipo-badge ${t.tipo}`}>
                        {t.tipo === 'ingreso' ? 'Ingreso' : 'Gasto'}
                    </span>
                </div>
                <div className="table-cell">
                    {t.tipo === 'gasto' ? getCategoriaLabel(t.categoria_gasto) : '-'}
                </div>
                <div className="table-cell">{t.cliente?.nombre || '-'}</div>
                <div className="table-cell">{t.proyecto?.nombre || '-'}</div>
                <div className="table-cell">{t.descripcion}</div>
                <div className="table-cell" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.comentarios || '-'}
                </div>
                <div className="table-cell">
                    {imagenes.length > 0 ? (
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setShowImages(!showImages)}
                        >
                            <ImageIcon size={16} />
                            {imagenes.length}
                        </button>
                    ) : '-'}
                </div>
                <div className="table-cell">
                    <span className={`monto ${t.tipo}`}>
                        {t.tipo === 'ingreso' ? '+' : '-'}{formatCurrency(t.monto)}
                    </span>
                </div>
            </div>
            {showImages && imagenes.length > 0 && (
                <div className="table-row" style={{ backgroundColor: '#f5f5f5' }}>
                    <div className="table-cell" style={{ gridColumn: '1 / -1', padding: '15px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                            {imagenes.map((img) => (
                                <a key={img.id} href={img.imagen_url} target="_blank" rel="noopener noreferrer">
                                    <img
                                        src={img.imagen_url}
                                        alt="Transacción"
                                        style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' }}
                                    />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
