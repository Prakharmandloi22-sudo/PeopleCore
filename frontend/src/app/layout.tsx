import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PeopleCore | Workforce Management & Payroll Platform',
  description: 'Enterprise Employee Lifecycle, Attendance, Leave & Decimal Payroll System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-blue-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
