import { ReactNode } from 'react';

interface AuthLayoutProps {
    children: ReactNode;
}

export default function AuthLayout({
    children,
}: AuthLayoutProps) {
    return (
        <div className='flex h-screen w-screen items-center justify-center'>
            {children}
        </div>
    )
}