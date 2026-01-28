import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import supabase from '../utils/supabase';
import { getProyectos } from '../services/proyectoService';
import { getViviendas } from '../services/proyectoService';
import { getViviendaImagenes } from '../services/viviendaImagenService';
import { ChevronDown, ChevronUp, Image as ImageIcon, CheckCircle, Circle } from 'lucide-react';
import './ClienteView.css';

export default function ClienteView() {
    const { userProfile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [proyectos, setProyectos] = useState([]);
    const [selectedProyecto, setSelectedProyecto] = useState(null);
    const [viviendas, setViviendas] = useState([]);
    const [viviendaImagenes, setViviendaImagenes] = useState({});
    const [puedeVerFotos, setPuedeVerFotos] = useState(false);
    const [expandedVivienda, setExpandedVivienda] = useState(null);

    useEffect(() => {
        loadData();
    }, [userProfile?.id]);

    const loadData = async () => {
        try {
            if (!userProfile?.id) {
                setLoading(false);
                return;
            }

            const { data: clienteData, error: clienteError } = await supabase
                .from('clientes')
                .select('*')
                .eq('usuario_id', userProfile.id)
                .single();

            if (clienteError || !clienteData) {
                setLoading(false);
                return;
            }

            setPuedeVerFotos(clienteData.puede_ver_fotos || false);

            const proyectosData = await getProyectos();
            const clienteProyectos = proyectosData.filter(p => p.cliente_id === clienteData.id);
            setProyectos(clienteProyectos);

            if (clienteProyectos.length > 0) {
                setSelectedProyecto(clienteProyectos[0]);
                await loadViviendas(clienteProyectos[0].id);
            }

            setLoading(false);
        } catch (error) {
            console.error('Error loading client data:', error);
            setLoading(false);
        }
    };

    const loadViviendas = async (proyectoId) => {
        try {
            const data = await getViviendas(proyectoId);
            setViviendas(data);

            // Auto-select first vivienda
            if (data.length > 0) {
                setExpandedVivienda(data[0].id);
            }

            if (puedeVerFotos) {
                const imagenesMap = {};
                for (const vivienda of data) {
                    const imgs = await getViviendaImagenes(vivienda.id);
                    if (imgs.length > 0) {
                        imagenesMap[vivienda.id] = imgs;
                    }
                }
                setViviendaImagenes(imagenesMap);
            }
        } catch (error) {
            console.error('Error loading viviendas:', error);
        }
    };

    const handleProyectoChange = async (proyectoId) => {
        const proyecto = proyectos.find(p => p.id === proyectoId);
        setSelectedProyecto(proyecto);
        if (proyecto) {
            await loadViviendas(proyecto.id);
        }
    };

    const renderStatusItem = (label, isCompleted) => (
        <div className={`status-item ${isCompleted ? 'active' : ''}`}>
            <div className="status-icon">
                {isCompleted ? <CheckCircle size={16} /> : <Circle size={16} />}
            </div>
            <span>{label}</span>
        </div>
    );

    if (loading) return <div className="loading">Cargando...</div>;

    if (proyectos.length === 0) {
        return (
            <div className="cliente-view-container">
                <div className="cliente-proyectos-section" style={{ textAlign: 'center' }}>
                    <h2>No hay proyectos asignados</h2>
                    <p className="text-muted">Contacta al administrador para obtener acceso a tus proyectos.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="cliente-view-container">
            <section className="cliente-proyectos-section">
                <div className="section-header">
                    <h2>Mis Proyectos</h2>
                </div>

                <div className="project-selector">
                    <label className="input-label">Seleccionar Proyecto</label>
                    <select
                        className="input-field"
                        value={selectedProyecto?.id || ''}
                        onChange={(e) => handleProyectoChange(e.target.value)}
                    >
                        {proyectos.map(proyecto => (
                            <option key={proyecto.id} value={proyecto.id}>
                                {proyecto.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                {selectedProyecto && (
                    <div style={{ marginTop: '20px' }}>
                        {viviendas.length === 0 ? (
                            <p className="text-muted">No hay viviendas en este proyecto</p>
                        ) : (
                            <div>
                                {/* Tabs Navigation */}
                                <div className="viviendas-tabs-nav">
                                    {viviendas.map(vivienda => (
                                        <button
                                            key={vivienda.id}
                                            className={`vivienda-tab-btn ${expandedVivienda === vivienda.id ? 'active' : ''}`}
                                            onClick={() => setExpandedVivienda(vivienda.id)}
                                        >
                                            {vivienda.nombre}
                                        </button>
                                    ))}
                                </div>

                                {/* Content Panel */}
                                {viviendas.map(vivienda => {
                                    if (vivienda.id !== expandedVivienda) return null;

                                    return (
                                        <div key={vivienda.id} className="vivienda-details-panel">
                                            <div className="section-title">Estado del Proyecto</div>
                                            <div className="status-grid">
                                                {renderStatusItem('Factibilidad', vivienda.factibilidad)}
                                                {renderStatusItem('TE1', vivienda.te1)}
                                                {renderStatusItem('Empalme', vivienda.empalme)}
                                                {renderStatusItem('TDA', vivienda.tda)}
                                                {renderStatusItem('Canalización', vivienda.canalizacion)}
                                                {renderStatusItem('Cableado', vivienda.cableado)}
                                                {renderStatusItem('Bomba de agua', vivienda.bomba_agua)}
                                                {renderStatusItem('Soldadura', vivienda.soldadura)}
                                                {renderStatusItem('Artefactado', vivienda.artefactado)}
                                                {renderStatusItem('Pruebas eléctricas', vivienda.pruebas_electricas)}
                                                {renderStatusItem('Rotulado', vivienda.rotulado)}
                                            </div>

                                            {/* Imágenes */}
                                            {puedeVerFotos && viviendaImagenes[vivienda.id]?.length > 0 && (
                                                <div style={{ marginTop: '20px' }}>
                                                    <div className="section-title">
                                                        <ImageIcon size={14} />
                                                        Imágenes ({viviendaImagenes[vivienda.id].length})
                                                    </div>
                                                    <div className="images-grid">
                                                        {viviendaImagenes[vivienda.id].map((img) => (
                                                            <img
                                                                key={img.id}
                                                                src={img.imagen_url}
                                                                alt="Progreso"
                                                                className="image-card"
                                                                onClick={() => window.open(img.imagen_url, '_blank')}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {!puedeVerFotos && (
                                                <p className="text-muted" style={{ fontSize: '0.8rem', fontStyle: 'italic', marginTop: '10px' }}>
                                                    No tienes permiso para ver las imágenes.
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </section>
        </div>
    );
}
