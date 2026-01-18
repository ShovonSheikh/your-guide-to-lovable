import { useEffect } from 'react';

export function usePageTitle(title: string) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title ? `TipKoro - ${title}` : 'TipKoro - Support Bangladeshi Creators';
    
    return () => {
      document.title = prevTitle;
    };
  }, [title]);
}
