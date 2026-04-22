import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/navbar';
import { FoundingPopup } from '@/components/founding/founding-popup';

export const metadata: Metadata = {
  title: 'Comuse - Collaborative IP Creation Platform',
  description: 'Create, branch, and collaborate on stories, music, and more.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        {children}
        <FoundingPopup />
      </body>
    </html>
  );
}
