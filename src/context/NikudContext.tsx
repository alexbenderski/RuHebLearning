import React, { createContext, useContext, useState } from 'react';

interface NikudContextValue {
  nikudOn: boolean;
  toggleNikud: () => void;
}

const NikudContext = createContext<NikudContextValue>({ nikudOn: false, toggleNikud: () => {} });

export const NikudProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [nikudOn, setNikudOn] = useState(() => localStorage.getItem('ruheb_nikud') === '1');

  const toggleNikud = () =>
    setNikudOn((prev) => {
      const next = !prev;
      localStorage.setItem('ruheb_nikud', next ? '1' : '0');
      return next;
    });

  return <NikudContext.Provider value={{ nikudOn, toggleNikud }}>{children}</NikudContext.Provider>;
};

export const useNikud = () => useContext(NikudContext);
