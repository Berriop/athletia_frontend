import React from 'react';

interface ListStatusProps {
  isLoading: boolean;
  isEmpty: boolean;
  emptyText: string;
}

export const ListStatus: React.FC<ListStatusProps> = ({ isLoading, isEmpty, emptyText }) => {
  if (isLoading && isEmpty) return <p>Cargando...</p>;
  if (!isLoading && isEmpty) return <p>{emptyText}</p>;
  return null;
};
