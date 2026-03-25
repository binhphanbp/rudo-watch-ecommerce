'use client';

import { Provider } from 'react-redux';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ReactNode, useEffect } from 'react';
import { store } from '@/store';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadFromStorage } from '@/store/authSlice';
import { fetchCart } from '@/store/cartSlice';

interface ProvidersProps {
  children: ReactNode;
}

function AppInit({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);

  // Load auth state from localStorage on mount
  useEffect(() => {
    dispatch(loadFromStorage());
  }, [dispatch]);

  // Fetch cart when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCart());
    }
  }, [isAuthenticated, dispatch]);

  return <>{children}</>;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <Provider store={store}>
      <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
        <AppInit>{children}</AppInit>
      </NextThemesProvider>
    </Provider>
  );
}
