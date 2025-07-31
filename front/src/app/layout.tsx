import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'UNI - GESTOR DE RUTAS',
  description: 'Sistema de Gestión de Rutas de la Universidad Nacional de Ingeniería',
};

export default function RootLayout({
    children
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="es">
            <head> 
                <meta charSet="UTF-8"></meta>
                <meta name="viewport" content="width=device-width, initial-scale=1.0"></meta>
            </head>
            <body className={`${inter.className} bg-white`} style={{fontFamily:'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'}}>
                {children}
            </body>
        </html>
    );
}
