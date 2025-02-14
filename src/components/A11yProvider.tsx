import React, { createContext, useContext, useState, useCallback } from 'react';

interface A11yContextType {
  announceMessage: (message: string) => void;
  setFocus: (elementId: string) => void;
  messages: string[];
}

const A11yContext = createContext<A11yContextType>({
  announceMessage: () => {},
  setFocus: () => {},
  messages: []
});

export const useA11y = () => useContext(A11yContext);

export function A11yProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<string[]>([]);

  const announceMessage = useCallback((message: string) => {
    setMessages(prev => [...prev, message]);
    // Clean up old messages after 5 seconds
    setTimeout(() => {
      setMessages(prev => prev.filter(m => m !== message));
    }, 5000);
  }, []);

  const setFocus = useCallback((elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.focus();
    }
  }, []);

  return (
    <A11yContext.Provider value={{ announceMessage, setFocus, messages }}>
      {children}
      {/* Live region for screen reader announcements */}
      <div
        role="status"
        aria-live="polite"
        className="sr-only"
      >
        {messages.map((message, index) => (
          <div key={index}>{message}</div>
        ))}
      </div>
    </A11yContext.Provider>
  );
}