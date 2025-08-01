import React, { useState, useEffect } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';

interface MenuOption {
    label: string;
    value: string;
    href: string;
    icon: JSX.Element;
}

interface ToggleMenuProps {
    options: MenuOption[];
    isMenuOpen: boolean;
    toggleMenu: () => void;
    onMenuClick: (option: MenuOption) => void;
}

const ToggleMenu: React.FC<ToggleMenuProps> = ({ 
    options,
    isMenuOpen,
    toggleMenu,
    onMenuClick
}) => {
    const [selectedOption, setSelectedOption] = useState<MenuOption | null>(null);

    const handleOptionClick = (option: MenuOption) => {
        setSelectedOption(option);
        onMenuClick(option);
    };

    useEffect(() => {
        if (
            selectedOption?.href === 'https://sgauni.uni.edu.pe/gestion' || 
            selectedOption?.href === 'http://sgauni.uni.edu.pe/gestion'
        ) {
            // window.open(selectedOption.href, '_blank');
        }
    }, [selectedOption]);

    return (
        <div
            className={`flex flex-col h-full transition-all duration-300 ease-in-out shadow-md ${
                isMenuOpen ? 'min-w-52' : 'w-12'
            }`}
            style={{ backgroundColor: '#FFFFFF', overflow: 'hidden' }}
        >
            <div className="flex-grow mt-4 ml-2">
                {options.map((option, index) => (
                    <Tooltip.Provider key={index}>
                        <Tooltip.Root>
                            <Tooltip.Trigger asChild>
                                <button
                                    onClick={() => handleOptionClick(option)}
                                    className={`flex items-center w-full p-1 rounded-lg transition-all ${
                                        isMenuOpen ? 'justify-start' : 'justify-center'
                                    } hover:bg-red-50 ${
                                        selectedOption?.value === option.value
                                            ? 'bg-yellow-200 text-gray-700'
                                            : 'text-gray-500'
                                    }`}
                                    style={{ fontFamily: 'Segoe UI', overflow: 'hidden', whiteSpace: 'nowrap', marginTop: '5px' }}
                                >
                                    <span className="text-xl text-red-800 p-0.5">{option.icon}</span>
                                    {isMenuOpen && (
                                        <span
                                            className={`ml-2 ${
                                                selectedOption?.value === option.value ? 'text-[12px] font-medium' : 'text-[12px] font-medium'
                                            }`}
                                            style={{ fontFamily: 'Segoe UI', whiteSpace: 'nowrap'}}
                                        >
                                            {option.label}
                                        </span>
                                    )}
                                </button>
                            </Tooltip.Trigger>
                            {!isMenuOpen && (
                                <Tooltip.Content side="right" className="ml-2" style={{ zIndex: 50 }}>
                                    <Tooltip.Arrow />
                                    <span className="bg-red-50 text-black rounded shadow-lg" 
                                    style={{ padding: '4px 8px', 
                                            fontSize: '12px', 
                                            lineHeight: '1', 
                                            whiteSpace: 'nowrap'

                                    }}>
                                        {option.label}
                                    </span>
                                </Tooltip.Content>
                            )}
                        </Tooltip.Root>
                    </Tooltip.Provider>
                ))}
            </div>
        </div>
    );
};

export default ToggleMenu;