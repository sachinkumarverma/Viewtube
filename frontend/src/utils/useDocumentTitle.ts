import { useEffect } from 'react';

/**
 * Sets the document title following the pattern:
 * - Empty / 'Home' -> "ViewTube"
 * - Any string -> "<title> | ViewTube"
 */
export const setDocumentTitle = (title?: string | null) => {
    if (!title || title.trim() === '' || title.toLowerCase() === 'home') {
        document.title = 'ViewTube';
    } else {
        document.title = `${title.trim()} | ViewTube`;
    }
};

export const useDocumentTitle = (title?: string | null) => {
    useEffect(() => {
        setDocumentTitle(title);
    }, [title]);
};
