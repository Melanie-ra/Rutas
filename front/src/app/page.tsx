'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FaUserCircle, FaPowerOff, FaChevronRight, FaChevronLeft, FaSearch, FaPlay, FaFastForward, FaFastBackward } from 'react-icons/fa';
import * as Tooltip from '@radix-ui/react-tooltip';
import ToggleMenu from '../Components/common/ToggleMenu';

interface User {
  fullName: string;
}

interface MenuOption {
  label: string;
  value: string;
  href: string;
  icon: JSX.Element;
}

interface Node {
  id: number;
  name: string;
}

interface Edge {
  source: number;
  target: number;
  tiempo?: number;
  accion?: string;
  accion_texto?: string;
}

interface GraphData {
  idRuta: number;
  codigoRuta: string;
  nombreRuta: string;
  idDependenciaEntrada: number;
  idDependenciaReferencia: number;
  idVersion: number;
  numeroVersion: number;
  graph: {
    elements: {
      nodes: Node[];
      edges: Edge[];
    };
  };
}

const Page: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [loggedUser, setLoggedUser] = useState<User | null>({ fullName: 'Usuario Demo' });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState('Motor de rutas');
  const [iframeSrc, setIframeSrc] = useState('');
  const [isObligatoria, setIsObligatoria] = useState(false);
  const [selectedItemsIndices, setSelectedItemsIndices] = useState<number[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [edges, setEdges] = useState<{ source: string; target: string }[]>([]);
  const [isLoadingApi, setIsLoadingApi] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [nombreRuta, setNombreRuta] = useState<string>('');
  const [selectedClasificador, setSelectedClasificador] = useState<string>('');

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const menuOptions: MenuOption[] = [
    {
      label: 'Motor de rutas',
      value: 'search',
      href: '/',
      icon: <FaSearch />,
    },
  ];

  const handleMenuClick = (option: MenuOption) => {
    setSelectedOption(option.label);
    setIframeSrc(option.href);
  };

  const initialEstablecimientoList = Array(10)
    .fill('Establecimiento')
    .map((item, index) => `${item} ${index + 1}`);
  const [establecimientoListState, setEstablecimientoList] = useState<string[]>([]);

  const handleItemClick = (index: number, isRightList: boolean) => {
    const baseIndex = isRightList ? establecimientoListState.length : 0;
    const adjustedIndex = index + (isRightList ? baseIndex : 0);
    setSelectedItemsIndices((prev) =>
      prev.includes(adjustedIndex)
        ? prev.filter((i) => i !== adjustedIndex)
        : [...prev, adjustedIndex]
    );
  };

  const moveToRight = () => {
    if (selectedItemsIndices.length > 0) {
      const sortedIndices = [...selectedItemsIndices].sort((a, b) => b - a);
      let newEstablecimientoList = [...establecimientoListState];
      const movedItems = sortedIndices
        .filter((index) => index < establecimientoListState.length)
        .map((index) => newEstablecimientoList[index]);

      sortedIndices.forEach((index) => {
        if (index < newEstablecimientoList.length) {
          newEstablecimientoList.splice(index, 1);
        }
      });

      setEstablecimientoList(newEstablecimientoList);
      setSelectedItems([...selectedItems, ...movedItems]);
      setSelectedItemsIndices([]);
    }
  };

  const moveToLeft = () => {
    if (selectedItemsIndices.length > 0) {
      const sortedIndices = [...selectedItemsIndices].sort((a, b) => b - a);
      let newSelectedItems = [...selectedItems];
      const movedItems: string[] = [];

      const selectedListIndices = sortedIndices.filter((index) => index >= establecimientoListState.length);
      
      selectedListIndices.forEach((index) => {
        const realIndex = index - establecimientoListState.length;
        if (realIndex >= 0 && realIndex < newSelectedItems.length) {
          movedItems.push(newSelectedItems[realIndex]);
          newSelectedItems.splice(realIndex, 1);
        }
      });

      const newEstablecimientoList = [...establecimientoListState, ...movedItems];

      console.log('Moviendo elementos de vuelta:', movedItems);
      setEstablecimientoList(newEstablecimientoList);
      setSelectedItems(newSelectedItems);
      setSelectedItemsIndices([]);

      const newEdges = edges.filter(edge => 
        !movedItems.includes(edge.source) && !movedItems.includes(edge.target)
      );
      if (newEdges.length !== edges.length) {
        console.log('Limpiando conexiones de elementos movidos');
        setEdges(newEdges);
      }
    }
  };

  const togglePlayPause = () => {
    moveToRight();
  };

  const moveAllToRight = () => {
    if (establecimientoListState.length > 0) {
      console.log('📤 Moviendo todos los elementos disponibles a seleccionados');
      setSelectedItems([...selectedItems, ...establecimientoListState]);
      setEstablecimientoList([]);
      setSelectedItemsIndices([]);
    }
  };

  const moveAllToLeft = () => {
    if (selectedItems.length > 0) {
      console.log('📥 Moviendo todos los elementos seleccionados a disponibles');
      const newEstablecimientoList = [...establecimientoListState, ...selectedItems];
      setEstablecimientoList(newEstablecimientoList);
      setSelectedItems([]);
      setSelectedItemsIndices([]);
      
      // Limpiar todas las conexiones cuando se mueven todos los elementos
      console.log('🧹 Limpiando todas las conexiones');
      setEdges([]);
    }
  };

  const cyRef = useRef<any>(null);

  const reloadApiData = async () => {
    console.log('🔄 Recargando datos de la API manualmente...');
    setIsLoadingApi(true);
    setApiError(null);
    
    try {
      const response = await fetch('https://sgduni.uni.edu.pe/rutas-server/api/free/rutas/1', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: GraphData = await response.json();
      
      if (data.graph && data.graph.elements && data.graph.elements.nodes.length > 0) {
        const nodes = data.graph.elements.nodes.map((node) => node.name);
        console.log('✅ Datos recargados exitosamente:', nodes.length, 'nodos');
        console.log('📝 Nombre de ruta obtenido:', data.nombreRuta);
        setEstablecimientoList(nodes);
        setNombreRuta(data.nombreRuta || '');
        setIsLoadingApi(false);
        setApiError(null);
        return true;
      }
      
      throw new Error('Datos inválidos recibidos');
    } catch (error) {
      console.error('❌ Error al recargar datos:', error);
      setApiError('Error al cargar datos de la API');
      setEstablecimientoList(['Error al cargar datos']);
      setNombreRuta('');
      setSelectedClasificador('');
      setIsLoadingApi(false);
      return false;
    }
  };

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    console.log('Iniciando fetch de datos de la API...');
    setIsLoadingApi(true);
    setApiError(null);

    const fetchWithFallback = async () => {
      const urls = [
        'https://sgduni.uni.edu.pe/rutas-server/api/free/rutas/1',
        '/api/rutas/free/rutas/1'
      ];
      
      for (const url of urls) {
        try {
          console.log(`Intentando fetch con URL: ${url}`);
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            mode: 'cors'
          });
          
          console.log('Respuesta recibida:', response);
          console.log('Status:', response.status);
          console.log('URL utilizada:', url);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data: GraphData = await response.json();
          console.log('Datos recibidos de la API:', data);
          
          if (!data.graph || !data.graph.elements) {
            console.error('Estructura de datos inválida:', data);
            continue;
          }
          
          const nodes = data.graph.elements.nodes.map((node) => node.name);
          console.log('Nodos extraídos:', nodes);
          
          if (nodes.length > 0) {
            console.log('✅ API funcionó correctamente, cargando', nodes.length, 'nodos');
            console.log('📝 Nombre de ruta obtenido:', data.nombreRuta);
            setEstablecimientoList(nodes);
            setNombreRuta(data.nombreRuta || '');
            setIsLoadingApi(false);
            setApiError(null);
            console.log('Datos cargados en disponibles, manteniendo seleccionados y conexiones existentes');
          }
          
          return; 
          
        } catch (error) {
          console.error(`❌ Error con URL ${url}:`, error);
          console.error('Detalles del error:', error instanceof Error ? error.message : String(error));
          continue; 
        }
      }
     
      console.log('⚠️ Todas las URLs fallaron, usando datos de ejemplo como fallback');
      setApiError('No se pudo conectar con la API, usando datos de ejemplo');
      setEstablecimientoList(['Mesa de Partes', 'Área Académica', 'Dirección', 'Secretaría']);
      setNombreRuta('Ruta de Ejemplo - Sin conexión API');
      setSelectedClasificador('');
      setIsLoadingApi(false);
    };
    
    fetchWithFallback();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('cytoscape').then((cytoscape) => {
        if (!cyRef.current) {
          cyRef.current = cytoscape.default({
            container: document.getElementById('cy'),
            elements: [
              { 
                data: { id: 'INICIO', label: 'INICIO' },
                position: { x: 150, y: 200 }
              },
              { 
                data: { id: 'FIN', label: 'FIN' },
                position: { x: 1500, y: 200 }
              },
            ],
            style: [
              {
                selector: 'node',
                style: {
                  label: 'data(label)',
                  'text-valign': 'top',
                  'text-halign': 'center',
                  'background-color': (ele: any) => 
                    ele.data('id') === 'INICIO' ? '#007bff' : 
                    ele.data('id') === 'FIN' ? '#dc3545' : '#28a745',
                  'width': '80px',
                  'height': '80px',
                  'color': '#148a16ff',
                  'font-size': '16px',
                  'font-weight': 'bold',
                  'font-family': 'Segoe UI, Arial, sans-serif',
                  'text-background-color': 'rgba(0, 0, 0, 0.7)',
                  'text-background-shape': 'roundrectangle',
                  'text-background-padding': '4px',
                  'border-width': '3px',
                  'border-color': '#ffffff',
                  'border-style': 'solid',
                  'shape': 'ellipse',
                  'events': 'yes',
                  'overlay-padding': '6px',
                },
              },
              {
                selector: 'node[id = "INICIO"]',
                style: {
                  'background-color': '#007bff',
                  'border-color': '#0056b3',
                  'font-size': '16px',
                  'font-weight': 'bold',
                  'text-background-color': 'rgba(0, 0, 0, 0.7)',
                  'text-background-shape': 'roundrectangle',
                  'text-background-padding': '5px',
                  'shape': 'roundrectangle',
                },
              },
              {
                selector: 'node[id = "FIN"]',
                style: {
                  'background-color': '#dc3545',
                  'border-color': '#c82333',
                  'font-size': '16px',
                  'font-weight': 'bold',
                  'text-background-color': 'rgba(0, 0, 0, 0.7)',
                  'text-background-shape': 'roundrectangle',
                  'text-background-padding': '5px',
                  'shape': 'roundrectangle',
                  'overlay-padding': '8px',
                  'overlay-color': '#dc3545',
                  'overlay-opacity': 0.1,
                },
              },
              {
                selector: 'edge',
                style: {
                  'curve-style': 'bezier',
                  'target-arrow-shape': 'triangle',
                  'line-color': '#00f',
                  'target-arrow-color': '#00f',
                  'width': '3px',
                },
              },
              {
                selector: 'node.source-selected',
                style: {
                  'border-width': '5px',
                  'border-color': '#ff6b35',
                  'overlay-padding': '10px',
                  'overlay-color': '#ff6b35',
                  'overlay-opacity': 0.2,
                },
              },
              {
                selector: 'node.potential-target',
                style: {
                  'border-width': '4px',
                  'border-color': '#28a745',
                  'overlay-padding': '8px',
                  'overlay-color': '#28a745',
                  'overlay-opacity': 0.15,
                },
              },
            ],
            layout: { 
              name: 'preset',
              padding: 20
            },
            userZoomingEnabled: true,
            userPanningEnabled: true,
            boxSelectionEnabled: false,
            autoungrabify: false,
            autounselectify: false,
          });
        } else {
          // Si ya existe, limpiar completamente el grafo
          console.log('🧹 Limpiando grafo existente...');
          cyRef.current.elements().remove();
          cyRef.current.add([
            { 
              data: { id: 'INICIO', label: 'INICIO' },
              position: { x: 150, y: 200 }
            },
            { 
              data: { id: 'FIN', label: 'FIN' },
              position: { x: 1500, y: 200 }
            },
          ]);
        }

        // Limpiar eventos anteriores para evitar duplicados
        cyRef.current.removeAllListeners();

        let sourceNode: any = null;
        let isConnecting = false;

        cyRef.current.on('tap', 'node', (event: any) => {
          const targetNode = event.target;
          const targetId = targetNode.data('id');
          const originalEvent = event.originalEvent;
          const isCtrlPressed = originalEvent && (originalEvent.ctrlKey || originalEvent.metaKey);
          
          console.log('Tap en nodo:', targetId, 'isConnecting:', isConnecting, 'Ctrl pressed:', isCtrlPressed);
          
          // Si ya tenemos un nodo origen seleccionado
          if (sourceNode && isConnecting) {
            if (sourceNode === targetNode) {
              // Si haces clic en el mismo nodo, cancelar la conexión
              console.log('⚠️ Clic en el mismo nodo, cancelando conexión');
              cyRef.current.nodes().removeClass('source-selected potential-target');
              sourceNode = null;
              isConnecting = false;
              return;
            }
            
            // Si es un nodo diferente y se presiona Ctrl, crear la conexión
            if (isCtrlPressed) {
              const sourceId = sourceNode.data('id');
              console.log('🔗 Ctrl + Clic: Intentando conectar:', sourceId, '->', targetId);

              // Verificar si la conexión ya existe y agregar si no existe
              const connectionExists = edges.some((e) => e.source === sourceId && e.target === targetId);
              if (!connectionExists) {
                const edgeId = `${sourceId}-${targetId}`;
                
                // Verificar también si ya existe en el grafo de Cytoscape usando método más robusto
                const edgeExistsInGraph = cyRef.current.edges(`[id="${edgeId}"]`).length > 0;
                
                console.log('🔍 Verificando arista:', edgeId);
                console.log('  - Existe en React state:', connectionExists);
                console.log('  - Existe en Cytoscape:', edgeExistsInGraph);
                console.log('  - Total aristas en grafo:', cyRef.current.edges().length);
                
                if (!edgeExistsInGraph) {
                  setEdges((prevEdges) => {
                    const newEdges = [...prevEdges, { source: sourceId, target: targetId }];
                    console.log('✅ Nueva arista añadida:', sourceId, '->', targetId);
                    
                    // Agregar la arista directamente al grafo sin reconstruir todo
                    try {
                      if (cyRef.current) {
                        cyRef.current.add({
                          group: 'edges',
                          data: { 
                            id: edgeId,
                            source: sourceId, 
                            target: targetId 
                          }
                        });
                        console.log('🔗 Arista agregada directamente al grafo con ID:', edgeId);
                      }
                    } catch (error) {
                      console.error('❌ Error al agregar arista:', error);
                      console.log('Intentando remover arista existente y reagregar...');
                      cyRef.current.remove(`edge[id="${edgeId}"]`);
                      cyRef.current.add({
                        group: 'edges',
                        data: { 
                          id: edgeId,
                          source: sourceId, 
                          target: targetId 
                        }
                      });
                    }
                    
                    return newEdges;
                  });
                } else {
                  console.log('⚠️ La arista ya existe en el grafo de Cytoscape');
                }
                
                // Limpiar estado de conexión después de crear la conexión
                cyRef.current.nodes().removeClass('source-selected potential-target');
                sourceNode = null;
                isConnecting = false;
                console.log('🎉 Conexión creada y estado limpiado');
              } else {
                console.log('⚠️ La conexión ya existe en el estado de React');
              }
            } else {
              // Sin Ctrl, mostrar feedback visual que este nodo puede ser destino
              console.log('💡 Clic simple en posible destino. Presiona Ctrl + Clic para confirmar');
              // Mantener el estado visual
            }
          } else {
            // No hay nodo origen seleccionado, este será el nodo origen
            if (targetId !== 'FIN') {
              sourceNode = targetNode;
              isConnecting = true;
              console.log('🔗 Nodo origen seleccionado:', targetId);
              
              // Limpiar clases anteriores y aplicar nueva selección
              cyRef.current.nodes().removeClass('source-selected potential-target');
              sourceNode.addClass('source-selected');
              
              // Resaltar posibles nodos objetivo
              cyRef.current.nodes().forEach((node: any) => {
                const nodeId = node.data('id');
                const connectionExists = edges.some((e) => e.source === targetId && e.target === nodeId);
                if (nodeId !== targetId && !connectionExists) {
                  node.addClass('potential-target');
                  console.log('🎯 Nodo objetivo disponible:', nodeId);
                }
              });
            } else {
              console.log('⚠️ "FIN" no puede ser origen de una conexión');
            }
          }
          
          // Prevenir propagación para evitar conflictos
          event.stopPropagation();
        });

        cyRef.current.on('tap', (event: any) => {
          if (event.target === cyRef.current) {
            // Limpiar efectos visuales y estado de conexión
            cyRef.current.nodes().removeClass('source-selected potential-target');
            sourceNode = null;
            isConnecting = false;
            console.log('Click en el fondo, reseteando selección');
          }
        });

        // Evento para eliminar aristas con doble clic
        cyRef.current.on('dblclick', 'edge', (event: any) => {
          const edge = event.target;
          const edgeId = edge.id();
          const sourceId = edge.source().id();
          const targetId = edge.target().id();
          
          console.log('🗑️ Doble clic en arista:', edgeId, 'De:', sourceId, 'A:', targetId);
          
          // Remover del estado de React
          setEdges((prevEdges) => {
            const newEdges = prevEdges.filter(e => !(e.source === sourceId && e.target === targetId));
            console.log('✅ Arista eliminada del estado React');
            return newEdges;
          });
          
          // Remover del grafo de Cytoscape
          try {
            cyRef.current.remove(edge);
            console.log('✅ Arista eliminada del grafo');
          } catch (error) {
            console.error('❌ Error al eliminar arista del grafo:', error);
          }
          
          event.stopPropagation();
        });

        // Eventos de arrastre separados sin interferir con la conexión
        cyRef.current.on('grab', 'node', function(evt: any) {
          console.log('Nodo agarrado para arrastrar:', evt.target.data('id'));
        });

        cyRef.current.on('drag', 'node', function(evt: any) {
          console.log('Nodo siendo arrastrado:', evt.target.data('id'));
        });

        cyRef.current.on('free', 'node', function(evt: any) {
          console.log('Nodo soltado después de arrastrar:', evt.target.data('id'));
        });

        if (cyRef.current) {
          const allNodes = [
            { 
              data: { id: 'INICIO', label: 'INICIO' },
              position: { x: 150, y: 200 }
            },
            { 
              data: { id: 'FIN', label: 'FIN' },
              position: { x: 1500, y: 200 }
            },
            ...selectedItems.map((item, index) => ({ 
              data: { id: item, label: item },
              position: { x: 350 + (index * 150), y: 200 }
            })),
          ];

          console.log('Actualizando grafo con nodos:', allNodes.map(n => n.data.id));

          const currentPositions: { [key: string]: { x: number; y: number } } = {};
          cyRef.current.nodes().forEach((node: any) => {
            const pos = node.position();
            currentPositions[node.data.id] = { x: pos.x, y: pos.y };
          });

          const existingNodeIds = cyRef.current.nodes().map((node: any) => node.id());
          const newNodeIds = allNodes.map(n => n.data.id).filter(id => !existingNodeIds.includes(id));
          const removedNodeIds = existingNodeIds.filter((id: string) => !allNodes.some(n => n.data.id === id));
          
          // Remover nodos que ya no están en selectedItems
          if (removedNodeIds.length > 0) {
            console.log('Removiendo nodos:', removedNodeIds);
            removedNodeIds.forEach((nodeId: string) => {
              cyRef.current.remove(`node[id="${nodeId}"]`);
            });
          }
          
          // Agregar solo los nodos nuevos
          if (newNodeIds.length > 0) {
            console.log('Agregando nodos nuevos:', newNodeIds);
            const newNodes = allNodes.filter(node => newNodeIds.includes(node.data.id));
            cyRef.current.add(newNodes);
          }
          
          // Restaurar las aristas existentes que puedan haberse perdido
          const currentEdgeIds = cyRef.current.edges().map((edge: any) => edge.id());
          const missingEdges = edges.filter(edge => {
            const edgeId = `${edge.source}-${edge.target}`;
            return !currentEdgeIds.includes(edgeId);
          });
          
          if (missingEdges.length > 0) {
            console.log('🔗 Restaurando aristas perdidas:', missingEdges);
            missingEdges.forEach(edge => {
              const edgeId = `${edge.source}-${edge.target}`;
              try {
                cyRef.current.add({
                  group: 'edges',
                  data: { 
                    id: edgeId,
                    source: edge.source, 
                    target: edge.target 
                  }
                });
                console.log('✅ Arista restaurada:', edgeId);
              } catch (error) {
                console.log('⚠️ No se pudo restaurar arista:', edgeId, error);
              }
            });
          }
          
          // Actualizar posiciones de nodos existentes
          cyRef.current.nodes().forEach((node: any) => {
            const nodeId = node.data('id');
            if (currentPositions[nodeId]) {
              node.position(currentPositions[nodeId]);
            }
            node.ungrabify(false);
            node.unselectify(false);
            node.grabify();
          });
          
          // Solo ejecutar layout si hay nodos nuevos
          if (newNodeIds.length > 0 && selectedItems.length > 0) {
            console.log('Ejecutando layout solo para nodos nuevos:', newNodeIds);
            cyRef.current.fit(cyRef.current.elements(), 80);
            cyRef.current.zoom(0.6);
          } else if (selectedItems.length === 0) {
            cyRef.current.fit(cyRef.current.elements(), 80);
            cyRef.current.zoom(0.6);
          }
          
          console.log('Grafo actualizado - Nodos:', cyRef.current.nodes().length, 'Aristas:', cyRef.current.edges().length);
        }
      });
    }
  }, [selectedItems]); // Solo depende de selectedItems, no de edges

  // useEffect separado para manejar la limpieza de aristas
  useEffect(() => {
    if (cyRef.current && edges.length === 0) {
      // Solo remover aristas si el array está vacío (cuando se presiona "Limpiar")
      cyRef.current.edges().remove();
      console.log('🧹 Todas las aristas han sido limpiadas');
    }
  }, [edges.length === 0]); // Solo se ejecuta cuando edges se vacía completamente

  const addEdge = (source: string, target: string) => {
    console.log('Intentando conectar:', source, '->', target); 
    if (source && target && source !== target && !edges.some((e) => e.source === source && e.target === target)) {
      setEdges((prevEdges) => {
        const newEdges = [...prevEdges, { source, target }];
        console.log('✅ Nueva conexión agregada:', source, '->', target); 
        console.log('Total de conexiones:', newEdges.length);
        return newEdges;
      });
    } else {
      if (source === target) {
        console.log('⚠️ No se puede conectar un nodo consigo mismo');
      } else if (edges.some((e) => e.source === source && e.target === target)) {
        console.log('⚠️ La conexión ya existe');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ position: 'relative', zIndex: 10 }}>
      <div
        style={{
          left: 0,
          position: 'fixed',
          right: 0,
          top: 0,
          zIndex: 1037,
          height: '3rem',
          background: '#99020B',
          display: 'flex',
          alignItems: 'center',
          padding: '0 1rem',
          justifyContent: 'flex-start',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img
            src="/img/uni_blanco.ico"
            style={{ width: '2.3rem', marginLeft: '1rem' }}
            alt="logouni"
          />
          <img
            src="/img/slasch.ico"
            style={{ width: '2.3rem', marginLeft: '0rem' }}
            alt="slasch"
          />
          <div
            style={{
              marginLeft: '0rem',
              verticalAlign: 'middle',
              fontFamily: 'Segoe UI',
            }}
          >
            <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>
              UNI - Motor de Rutas
            </span>
          </div>
        </div>
        <div className="ml-auto flex items-center">
          <FaUserCircle style={{ marginRight: '12px', fontSize: '24px', color: 'white' }} />
          <div
            style={{
              marginRight: '2rem',
              verticalAlign: 'middle',
              fontFamily: 'Segoe UI',
            }}
          >
            <span
              style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}
            >
              Usuario: {loggedUser?.fullName}
            </span>
          </div>
          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button
                  onClick={() => {
                    setIsAuthenticated(false);
                    setLoggedUser(null);
                    document.cookie = 'loginUser=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                  }}
                  className="p-2 bg-red-800 hover:bg-red-700 rounded-md mr-2 transition-colors duration-200 border-none cursor-pointer"
                >
                  <FaPowerOff className="text-xl text-white" />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Content side="bottom" style={{ zIndex: 50 }}>
                <Tooltip.Arrow />
                <span
                  className="bg-red-50 text-gray-700 rounded shadow-lg"
                  style={{
                    padding: '4px 8px',
                    fontSize: '12px',
                    lineHeight: '1',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Cerrar sesión
                </span>
              </Tooltip.Content>
            </Tooltip.Root>
          </Tooltip.Provider>
        </div>
      </div>

      <div className="flex flex-1 mt-10" style={{ position: 'relative', zIndex: 20, width: '100%' }}>
        <div style={{ position: 'fixed', top: '3rem', zIndex: 40 }}>
          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button
                  onClick={toggleMenu}
                  className="p-0.5 bg-red-800 rounded-md hover:bg-red-700 transition-colors h-6 items-center"
                  style={{
                    marginLeft: isMenuOpen ? '13.2rem' : '0.5rem',
                    transition: 'margin-left 0.3s ease-in-out',
                  }}
                >
                  {isMenuOpen ? (
                    <FaChevronLeft className="text-m text-white" />
                  ) : (
                    <FaChevronRight className="text-m text-white" />
                  )}
                </button>
              </Tooltip.Trigger>
              <Tooltip.Content side="bottom" className="ml-2" style={{ zIndex: 50 }}>
                <Tooltip.Arrow />
                <span
                  className="bg-red-50 text-gray-700 rounded shadow-lg"
                  style={{
                    padding: '4px 8px',
                    fontSize: '12px',
                    lineHeight: '1',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
                </span>
              </Tooltip.Content>
            </Tooltip.Root>
          </Tooltip.Provider>
        </div>

        <div
          style={{
            position: 'fixed',
            top: '2rem',
            height: 'calc(100vh - 3rem)',
            background: '#ffffff',
            width: '10rem',
            transform: isMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.3s ease-in-out',
            zIndex: 30,
          }}
        >
          <ToggleMenu
            options={menuOptions}
            isMenuOpen={isMenuOpen}
            toggleMenu={toggleMenu}
            onMenuClick={handleMenuClick}
          />
        </div>

        <main
          style={{
            marginLeft: isMenuOpen ? '14rem' : '1rem',
            paddingLeft: '1rem',
            overflow: 'auto',
            height: 'calc(100vh - 3rem)',
            zIndex: 31,
            transition: 'margin-left 0.3s ease-in-out',
            width: '98.5%',
          }}
        >
          <h2 className="subtitulos">Motor de Rutas</h2>
          <div
            style={{
              border: '1px solid #ccc',
              padding: '1rem',
              borderRadius: '5px',
              backgroundColor: '#ffffff',
            }}
          >
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
              <div style={{ flex: '1' }}>
                <label className="mr-6">Clasificador de trámites</label>
                <select
                  style={{
                    width: '62.5%',
                    border: '0.5px solid #9a9a9a6c',
                    height: '2rem',
                    padding: '0.2rem',
                  }}
                  value={selectedClasificador}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedClasificador(value);
                    console.log('📋 Clasificador seleccionado:', value);
                    
                    // Si se deselecciona, limpiar items seleccionados y conexiones
                    if (!value) {
                      setSelectedItems([]);
                      setEdges([]);
                      setSelectedItemsIndices([]);
                      console.log('🧹 Limpiando selección porque no hay clasificador seleccionado');
                    }
                  }}
                >
                  <option
                    style={{ fontFamily: 'Segoe UI' }}
                    value=""
                  >Seleccione</option>
                  {nombreRuta && (
                    <option
                      style={{ fontFamily: 'Segoe UI' }}
                      value={nombreRuta}
                    >
                      {nombreRuta}
                    </option>
                  )}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <label style={{ marginRight: '2.6rem' }}>Descripción</label>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <textarea
                style={{
                  width: '73%',
                  padding: '0.5rem',
                  height: '2.3rem',
                  border: '0.5px solid #9a9a9a6c',
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', width: '190px', marginLeft: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <label>Vigencia</label>
                  <input
                    type="text"
                    style={{
                      width: '50px',
                      padding: '0.5rem',
                      border: '0.5px solid #9a9a9a6c',
                      height: '1.8rem',
                      marginLeft: '1.5rem',
                    }}
                  />
                  <input
                    type="text"
                    style={{
                      width: '50px',
                      padding: '0.5rem',
                      border: '0.5px solid #9a9a9a6c',
                      height: '1.8rem',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <label>Plazo (Días)</label>
                  <input
                    type='text'
                    style={{
                      width: '110px',
                      padding: '0.5rem',
                      border: '0.5px solid #9a9a9a6c',
                      height: '1.8rem',
                    }}
                  />
                </div>
              </div>
              <button
                type="submit"
                style={{
                  background: '#99020B',
                  color: 'white',
                  padding: '0.2rem 0.8rem',
                  borderRadius: '6px',
                  alignSelf: 'flex-start',
                }}
              >
                Enviar
              </button>
            </div>
            <div style={{ marginTop: '2rem' }}>
              <label style={{ marginRight: '1rem' }}>Obligatoria</label>
              <input
                type="checkbox"
                checked={isObligatoria}
                onChange={() => setIsObligatoria(!isObligatoria)}
                style={{ marginRight: '1rem', verticalAlign: 'middle' }}
              />

              <div style={{ display: 'flex', alignItems: 'center', marginTop: '1rem', gap: '1rem' }}>
                <div style={{ flex: '0 0 200px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1rem', margin: 0 }}>Disponibles</h3>
                    <button
                      onClick={reloadApiData}
                      disabled={isLoadingApi || !selectedClasificador}
                      style={{
                        background: (isLoadingApi || !selectedClasificador) ? '#6c757d' : '#99020B',
                        color: 'white',
                        padding: '0.2rem 0.4rem',
                        borderRadius: '3px',
                        border: 'none',
                        cursor: (isLoadingApi || !selectedClasificador) ? 'not-allowed' : 'pointer',
                        fontSize: '0.7rem',
                        opacity: (isLoadingApi || !selectedClasificador) ? 0.6 : 1
                      }}
                      title={
                        !selectedClasificador ? 'Selecciona un clasificador primero' :
                        isLoadingApi ? 'Cargando...' : 'Recargar datos de la API'
                      }
                    >
                      {isLoadingApi ? '⏳' : '🔄'}
                    </button>
                  </div>
                  <div
                    style={{
                      border: '1px solid #ccc',
                      padding: '0.5rem',
                      height: '400px',
                      overflowY: 'auto',
                      backgroundColor: '#fff',
                    }}
                  >
                    {isLoadingApi ? (
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        height: '100%',
                        color: '#666'
                      }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          border: '4px solid #f3f3f3',
                          borderTop: '4px solid #99020B',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite',
                          marginBottom: '1rem'
                        }}></div>
                        <span style={{ fontSize: '0.9rem' }}>Cargando datos...</span>
                      </div>
                    ) : apiError ? (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        color: '#dc3545',
                        textAlign: 'center',
                        padding: '1rem'
                      }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
                        <div style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>{apiError}</div>
                        <button
                          onClick={reloadApiData}
                          style={{
                            background: '#99020B',
                            color: 'white',
                            padding: '0.3rem 0.6rem',
                            borderRadius: '3px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.7rem'
                          }}
                        >
                          Reintentar
                        </button>
                      </div>
                    ) : (
                      selectedClasificador ? (
                        establecimientoListState.map((item, index) => (
                          <div
                            key={index}
                            onClick={() => handleItemClick(index, false)}
                            style={{
                              padding: '0.25rem',
                              borderBottom: '1px solid #eee',
                              cursor: 'pointer',
                              backgroundColor: selectedItemsIndices.includes(index) ? '#f0f0f0' : 'transparent',
                              transition: 'background-color 0.2s',
                            }}
                          >
                            {item}
                          </div>
                        ))
                      ) : (
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: '100%',
                          color: '#6c757d',
                          textAlign: 'center',
                          padding: '2rem'
                        }}>
                          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📋</div>
                          <div style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>
                            Selecciona un clasificador de trámites para ver los campos disponibles
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <button
                    onClick={moveAllToRight}
                    disabled={!selectedClasificador || establecimientoListState.length === 0}
                    style={{
                      background: (!selectedClasificador || establecimientoListState.length === 0) ? '#d6d6d6' : '#99020B',
                      color: (!selectedClasificador || establecimientoListState.length === 0) ? '#999' : 'white',
                      border: 'none',
                      padding: '0.5rem',
                      marginBottom: '0.5rem',
                      cursor: (!selectedClasificador || establecimientoListState.length === 0) ? 'not-allowed' : 'pointer',
                      borderRadius: '4px',
                      opacity: (!selectedClasificador || establecimientoListState.length === 0) ? 0.6 : 1
                    }}
                    title="Mover todos los disponibles a seleccionados"
                  >
                    <FaFastForward />
                  </button>
                  <button
                    onClick={moveToRight}
                    disabled={!selectedClasificador || selectedItemsIndices.length === 0}
                    style={{
                      background: (!selectedClasificador || selectedItemsIndices.length === 0) ? '#d6d6d6' : '#ccc',
                      color: (!selectedClasificador || selectedItemsIndices.length === 0) ? '#999' : '#333',
                      border: 'none',
                      padding: '0.5rem',
                      marginBottom: '0.5rem',
                      cursor: (!selectedClasificador || selectedItemsIndices.length === 0) ? 'not-allowed' : 'pointer',
                      borderRadius: '4px',
                      opacity: (!selectedClasificador || selectedItemsIndices.length === 0) ? 0.6 : 1
                    }}
                    title="Mover seleccionados a la derecha"
                  >
                    <FaChevronRight />
                  </button>
                  <button
                    onClick={togglePlayPause}
                    disabled={!selectedClasificador || selectedItemsIndices.length === 0}
                    style={{
                      background: (!selectedClasificador || selectedItemsIndices.length === 0) ? '#d6d6d6' : '#ccc',
                      color: (!selectedClasificador || selectedItemsIndices.length === 0) ? '#999' : '#333',
                      border: 'none',
                      padding: '0.5rem',
                      marginBottom: '0.5rem',
                      cursor: (!selectedClasificador || selectedItemsIndices.length === 0) ? 'not-allowed' : 'pointer',
                      borderRadius: '4px',
                      opacity: (!selectedClasificador || selectedItemsIndices.length === 0) ? 0.6 : 1
                    }}
                    title="Mover y reproducir"
                  >
                    <FaPlay />
                  </button>
                  <button
                    onClick={moveToLeft}
                    disabled={!selectedClasificador || selectedItemsIndices.length === 0}
                    style={{
                      background: (!selectedClasificador || selectedItemsIndices.length === 0) ? '#d6d6d6' : '#ccc',
                      color: (!selectedClasificador || selectedItemsIndices.length === 0) ? '#999' : '#333',
                      border: 'none',
                      padding: '0.5rem',
                      marginBottom: '0.5rem',
                      cursor: (!selectedClasificador || selectedItemsIndices.length === 0) ? 'not-allowed' : 'pointer',
                      borderRadius: '4px',
                      opacity: (!selectedClasificador || selectedItemsIndices.length === 0) ? 0.6 : 1
                    }}
                    title="Mover seleccionados a la izquierda"
                  >
                    <FaChevronLeft />
                  </button>
                  <button
                    onClick={moveAllToLeft}
                    disabled={!selectedClasificador || selectedItems.length === 0}
                    style={{
                      background: (!selectedClasificador || selectedItems.length === 0) ? '#d6d6d6' : '#99020B',
                      color: (!selectedClasificador || selectedItems.length === 0) ? '#999' : 'white',
                      border: 'none',
                      padding: '0.5rem',
                      cursor: (!selectedClasificador || selectedItems.length === 0) ? 'not-allowed' : 'pointer',
                      borderRadius: '4px',
                      opacity: (!selectedClasificador || selectedItems.length === 0) ? 0.6 : 1
                    }}
                    title="Mover todos los seleccionados a disponibles"
                  >
                    <FaFastBackward />
                  </button>
                </div>

                <div style={{ flex: '0 0 200px' }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Seleccionados</h3>
                  <div
                    style={{
                      border: '1px solid #ccc',
                      padding: '0.5rem',
                      height: '400px',
                      overflowY: 'auto',
                      backgroundColor: '#fff',
                    }}
                  >
                    {selectedItems.map((item, index) => (
                      <div
                        key={index}
                        onClick={() => handleItemClick(index, true)}
                        style={{
                          padding: '0.25rem',
                          borderBottom: '1px solid #eee',
                          cursor: 'pointer',
                          backgroundColor: selectedItemsIndices.includes(index + establecimientoListState.length) ? '#ffffff' : 'transparent',
                          transition: 'background-color 0.2s',
                        }}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ flex: '1', minWidth: '600px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1rem', margin: 0 }}>Diagrama de Flujo</h3>
                    <div>
                      <button
                        onClick={() => {
                          if (cyRef.current) {
                            cyRef.current.fit(cyRef.current.elements(), 80);
                            cyRef.current.zoom(0.6);
                          }
                        }}
                        style={{
                          background: '#99020B',
                          color: 'white',
                          padding: '0.4rem 0.4rem',
                          borderRadius: '4px',
                          border: 'none',
                          cursor: 'pointer',
                          marginRight: '0.5rem',
                        }}
                      >
                        Centrar
                      </button>
                      <button
                        onClick={() => {
                          setEdges([]);
                          if (cyRef.current) {
                            cyRef.current.elements('edge').remove();
                          }
                        }}
                        style={{
                          background: '#99020B',
                          color: 'white',
                          padding: '0.4rem 0.4rem',
                          borderRadius: '4px',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        Limpiar
                      </button>
                    </div>
                  </div>

                  <div 
                    id="cy" 
                    style={{ 
                      width: '100%', 
                      height: '400px', 
                      border: '1px solid #ccc', 
                      marginTop: '0.5rem',
                      borderRadius: '8px',
                      backgroundColor: '#ffffff'
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Page;