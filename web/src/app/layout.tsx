import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Meblomat – Panel warsztatu stolarskiego',
  description:
    'Panel startowy dla warsztatu stolarskiego: zlecenia, klienci i zespół w jednym miejscu. Wymaga zalogowania kontem zdefiniowanym w Prisma.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className="bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
