'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FaUserCircle, FaPowerOff, FaChevronRight, FaChevronLeft, FaSearch, FaPlay } from 'react-icons/fa';
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
  const [establecimientoListState, setEstablecimientoList] = useState<string[]>([...initialEstablecimientoList]);

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
      const movedItemsWithOriginalIndices = sortedIndices
        .filter((index) => index >= establecimientoListState.length)
        .map((index) => {
          const originalIndex = initialEstablecimientoList.indexOf(newSelectedItems[index - establecimientoListState.length]);
          return { item: newSelectedItems[index - establecimientoListState.length], originalIndex };
        });

      sortedIndices.forEach((index) => {
        if (index >= establecimientoListState.length) {
          newSelectedItems.splice(index - establecimientoListState.length, 1);
        }
      });

      let newEstablecimientoList = [...establecimientoListState];
      movedItemsWithOriginalIndices.forEach(({ item, originalIndex }) => {
        newEstablecimientoList.splice(originalIndex, 0, item);
      });

      setEstablecimientoList(newEstablecimientoList);
      setSelectedItems(newSelectedItems);
      setSelectedItemsIndices([]);
    }
  };

  const togglePlayPause = () => {
    moveToRight();
  };

  const cyRef = useRef<any>(null);

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
                  'shape': 'roundrectangle', // Cuadrado redondeado para INICIO
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
                  'shape': 'roundrectangle', // Cuadrado redondeado para FIN
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

          cyRef.current.on('tap', 'node', function(evt: any) {
            console.log('Nodo clickeado:', evt.target.data('id'));
          });

          cyRef.current.on('drag', 'node', function(evt: any) {
            console.log('Nodo siendo arrastrado:', evt.target.data('id'));
          });
        }

        if (cyRef.current) {

          const allNodes = [
            { 
              data: { id: 'INICIO', label: 'INICIO' },
              position: { x: 150, y: 200 }
            },
            { 
              data: { id: 'FIN', label: 'FIN' },
              position: { x: 1000, y: 200 }
            },
            ...selectedItems.map((item, index) => ({ 
              data: { id: item, label: item },
              position: { x: 350 + (index * 150), y: 200 }
            })),
          ];
          const allEdges = edges.map((edge) => ({ data: { source: edge.source, target: edge.target } }));

          console.log('Actualizando grafo con nodos:', allNodes.map(n => n.data.id));
          console.log('Actualizando grafo con aristas:', allEdges); 

          // Guardar posiciones actuales antes de limpiar
          const currentPositions: { [key: string]: { x: number; y: number } } = {};
          cyRef.current.nodes().forEach((node: any) => {
            const pos = node.position();
            currentPositions[node.id()] = { x: pos.x, y: pos.y };
          });

          cyRef.current.elements().remove();
          
          // Restaurar posiciones guardadas o usar posiciones por defecto
          const nodesWithPositions = allNodes.map(node => {
            if (currentPositions[node.data.id]) {
              return {
                ...node,
                position: currentPositions[node.data.id]
              };
            }
            return node;
          });
          
          cyRef.current.add([...nodesWithPositions, ...allEdges]);
          

          // Solo aplicar layout y centrar la primera vez
          if (selectedItems.length === 0 && edges.length === 0) {
            cyRef.current.layout({ 
              name: 'preset',
              padding: 30
            }).run();
            // Zoom inicial más alejado
            cyRef.current.fit(cyRef.current.elements(), 80);
            cyRef.current.zoom(0.6); // Zoom al 60%
          }
        }
      });
    }
  }, [selectedItems, edges]);

  const addEdge = (source: string, target: string) => {
    console.log('Intentando conectar:', source, '->', target); 
    if (source !== target && !edges.some((e) => e.source === source && e.target === target)) {
      setEdges((prevEdges) => {
        const newEdges = [...prevEdges, { source, target }];
        console.log('Nuevas aristas:', newEdges); 
        return newEdges;
      });
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

      {/* Main Layout: Sidebar + Content */}
      <div className="flex flex-1 mt-10" style={{ position: 'relative', zIndex: 20, width: '100%' }}>
        {/* Sidebar Toggle Button */}
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

        {/* Sidebar */}
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

        {/* Main Content */}
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
                >
                  <option
                    style={{ fontFamily: 'Segoe UI',}}
                    value=""
                  >Seleccione</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <label style={{ marginRight: '2.6rem' }}>Descripción</label>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <textarea
                className="input-vigencia"
                style={{
                  width: '73%',
                  padding: '0.5rem',
                  height: '2.3rem',
                  border: '0.5px solid #9a9a9a6c',
                  outline: 'none',
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', width: '190px', marginLeft: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <label>Vigencia</label>
                  <input
                    type="text"
                    className="input-vigencia"
                    style={{
                      width: '50px',
                      padding: '0.5rem',
                      border: '0.5px solid #9a9a9a6c',
                      height: '1.8rem',
                      marginLeft: '1.5rem',
                      outline: 'none',
                    }}
                  />
                  <input
                    type="text"
                    className="input-vigencia"
                    style={{
                      width: '50px',
                      padding: '0.5rem',
                      border: '0.5px solid #9a9a9a6c',
                      height: '1.8rem',
                      outline: 'none'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <label>Plazo (Días)</label>
                  <input
                    type="text"
                    className="input-vigencia"
                    style={{
                      width: '110px',
                      padding: '0.5rem',
                      border: '0.5px solid #9a9a9a6c',
                      height: '1.8rem',
                      outline: 'none'
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
                className="checkbox-red"
                style={{ marginRight: '1rem', verticalAlign: 'middle' }}
              />

              <div style={{ display: 'flex', alignItems: 'center', marginTop: '1rem', gap: '1rem' }}>
                  <div style={{ flex: '0 0 200px' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Disponibles</h3>
                    <div
                      style={{
                        border: '1px solid #ccc',
                        padding: '0.5rem',
                        height: '450px',
                        overflowY: 'auto',
                        backgroundColor: '#fff',
                      }}
                    >
                      {establecimientoListState.map((item, index) => (
                        <div
                          key={index}
                          onClick={() => handleItemClick(index, false)}
                          style={{
                            padding: '0.25rem',
                            borderBottom: '1px solid #eee',
                            cursor: 'pointer',
                            backgroundColor: selectedItemsIndices.includes(index) ? '#d14c4c' : 'transparent',
                            transition: 'background-color 0.2s',
                          }}
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <button
                      onClick={moveToRight}
                      style={{
                        background: '#ccc',
                        border: 'none',
                        padding: '0.5rem',
                        marginBottom: '0.5rem',
                        cursor: 'pointer',
                      }}
                    >
                      <FaChevronRight />
                    </button>
                    <button
                      onClick={togglePlayPause}
                      style={{
                        background: '#ccc',
                        border: 'none',
                        padding: '0.5rem',
                        marginBottom: '0.5rem',
                        cursor: 'pointer',
                      }}
                    >
                      <FaPlay />
                    </button>
                    <button
                      onClick={moveToLeft}
                      style={{
                        background: '#ccc',
                        border: 'none',
                        padding: '0.5rem',
                        cursor: 'pointer',
                      }}
                    >
                      <FaChevronLeft />
                    </button>
                  </div>

                  <div style={{ flex: '0 0 200px' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Seleccionados</h3>
                    <div
                      style={{
                        border: '1px solid #ccc',
                        padding: '0.5rem',
                        height: '450px',
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
                            backgroundColor: selectedItemsIndices.includes(index + establecimientoListState.length) ? '#d14c4c' : 'transparent',
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
                              cyRef.current.zoom(0.6); // Zoom al 60%
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
                    <div style={{ marginTop: '1rem' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Conectar nodos</h3>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                      <select
                        id="sourceSelect"
                        style={{ padding: '0.2rem', border: '0.5px solid #9a9a9a6c', height: '2rem', minWidth: '120px' }}
                        onChange={(e) => {
                          const source = e.target.value;
                          console.log('Origen seleccionado:', source);
                          if (source) document.getElementById('targetSelect')?.focus();
                        }}
                      >
                        <option value="">Seleccione origen</option>
                        {['INICIO', ...selectedItems, 'FIN'].map((item) => (
                          <option key={item} value={item}>{item}</option>
                        ))}
                      </select>
                      <span>→</span>
                      <select
                        id="targetSelect"
                        style={{ padding: '0.2rem', border: '1px solid #9a9a9a6c', height: '2rem', minWidth: '120px' }}
                        onChange={(e) => {
                          const target = e.target.value;
                          console.log('Destino seleccionado:', target); 
                          const sourceSelect = document.getElementById('sourceSelect') as HTMLSelectElement;
                          const source = sourceSelect?.value;
                          if (source && target) {
                            console.log('Conectando:', source, '->', target); 
                            addEdge(source, target);
                            sourceSelect.value = '';
                            e.target.value = '';
                          }
                        }}
                      >
                        <option value="">Seleccione destino</option>
                        {['INICIO', ...selectedItems, 'FIN'].map((item) => (
                          <option key={item} value={item}>{item}</option>
                        ))}
                      </select>
                      
                    </div>

                    {edges.length > 0 && (
                      <div style={{ marginBottom: '1rem' }}>
                        <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Conexiones actuales:</h4>
                        <div style={{ 
                          border: '1px solid #ccc', 
                          padding: '0.5rem', 
                          maxHeight: '100px', 
                          overflowY: 'auto',
                          backgroundColor: '#ffffff'
                        }}>
                          {edges.map((edge, index) => (
                            <div key={index} style={{ fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                              {edge.source} → {edge.target}
                              <button
                                onClick={() => {
                                  setEdges(prev => prev.filter((_, i) => i !== index));
                                }}
                                style={{
                                  marginLeft: '0.5rem',
                                  background: '#99020B',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '2px',
                                  padding: '0.1rem 0.3rem',
                                  fontSize: '0.7rem',
                                  cursor: 'pointer'
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                    <div 
                      id="cy" 
                      style={{ 
                        width: '100%', 
                        height: '350px', 
                        border: '1px solid #ccc', 
                        marginTop: '0.5rem',
                        borderRadius: '8px',
                        backgroundColor: '#f8f9fa'
                      }}
                    ></div>
                    <div style={{ 
                      color: '#ffffff', 
                      marginTop: '0.5rem',
                    }}>
                    </div>
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