"use client";

import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './index';

export function StoreProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    console.clear();
  }, []);

  return <Provider store={store}>{children}</Provider>;
}
