import { useState, useCallback, useRef } from 'react';

export function useToast() {
  const [msg, setMsg]     = useState('');
  const [visible, setVisible] = useState(false);
  const timer = useRef(null);

  const toast = useCallback((message) => {
    setMsg(message);
    setVisible(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setVisible(false), 2500);
  }, []);

  return { msg, visible, toast };
}

export default function Toast({ msg, visible }) {
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#111] text-white px-5 py-2.5 rounded-full text-[13px] font-sarabun z-[9999] shadow-xl whitespace-nowrap transition-transform duration-300
      ${visible ? 'translate-y-0' : 'translate-y-20 opacity-0'}`}>
      {msg}
    </div>
  );
}
