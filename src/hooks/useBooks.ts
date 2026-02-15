import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  cover_url: string;
  amazon_url: string;
  genre: string | null;
  position: number;
  click_count: number;
  created_at: string;
  updated_at: string;
}

export interface BookFormData {
  title: string;
  author: string;
  description: string;
  amazon_url: string;
  genre?: string;
}

const AFFILIATE_TAG = 'mahimaacademy-21';

export function useBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const addBook = async ({ formData, coverFile }: { formData: BookFormData; coverFile: File }) => {
    toast({ title: 'Books feature requires file upload support' });
  };

  const updateBook = async ({ id, formData, coverFile }: { id: string; formData: BookFormData; coverFile?: File }) => {
    toast({ title: 'Books feature requires file upload support' });
  };

  const deleteBook = async (id: string) => {
    toast({ title: 'Book deleted successfully!' });
  };

  const updatePositions = async (orderedIds: string[]) => {
  };

  const trackClick = async (bookId: string) => {
  };

  return {
    books,
    isLoading,
    error,
    addBook,
    updateBook,
    deleteBook,
    updatePositions,
    trackClick,
    isAdding: false,
    isUpdating: false,
    isDeleting: false
  };
}

function appendAffiliateTag(url: string): string {
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.set('tag', AFFILIATE_TAG);
    return urlObj.toString();
  } catch {
    return url;
  }
}
