/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

export type SortDirection = 'asc' | 'desc' | null;

export interface SortState<K extends string = string> {
  key: K | null;
  direction: SortDirection;
}

export function createInitialSortState<K extends string = string>(): SortState<K> {
  return { key: null, direction: null };
}

export function toggleSortState<K extends string>(
  prev: SortState<K>,
  key: K
): SortState<K> {
  if (prev.key !== key) {
    return { key, direction: 'asc' };
  }
  if (prev.direction === 'asc') {
    return { key, direction: 'desc' };
  }
  return { key: null, direction: null };
}

export function sortRows<T>(
  rows: T[],
  sortState: SortState<string>,
  accessors: Record<string, (row: T) => string | number | boolean | null | undefined>
): T[] {
  if (!sortState.key || !sortState.direction) return rows;
  const getter = accessors[sortState.key];
  if (!getter) return rows;

  const multiplier = sortState.direction === 'asc' ? 1 : -1;

  return [...rows].sort((a, b) => {
    const valA = getter(a);
    const valB = getter(b);

    const emptyA = valA === null || valA === undefined || valA === '';
    const emptyB = valB === null || valB === undefined || valB === '';
    if (emptyA && emptyB) return 0;
    if (emptyA) return 1;
    if (emptyB) return -1;

    if (typeof valA === 'number' && typeof valB === 'number') {
      return (valA - valB) * multiplier;
    }

    if (typeof valA === 'boolean' && typeof valB === 'boolean') {
      return ((valA === valB ? 0 : valA ? 1 : -1) * multiplier);
    }

    return (
      String(valA).localeCompare(String(valB), 'id', {
        numeric: true,
        sensitivity: 'base',
      }) * multiplier
    );
  });
}

interface SortableThProps {
  label: string;
  sortKey: string;
  sortState: SortState<any>;
  onSort: (key: any) => void;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export const SortableTh: React.FC<SortableThProps> = ({
  label,
  sortKey,
  sortState,
  onSort,
  align = 'left',
  className = 'py-2.5 px-3',
}) => {
  const isActive = sortState.key === sortKey && sortState.direction !== null;
  const direction = isActive ? sortState.direction : null;

  const justifyClass =
    align === 'center'
      ? 'justify-center'
      : align === 'right'
      ? 'justify-end'
      : 'justify-start';

  const nextActionText =
    direction === 'asc'
      ? `Urutkan ${label} Descending (Z-A / Turun)`
      : direction === 'desc'
      ? `Reset urutan ${label}`
      : `Urutkan ${label} Ascending (A-Z / Naik)`;

  return (
    <th className={`${className} select-none`}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        title={nextActionText}
        aria-label={nextActionText}
        className={`inline-flex items-center gap-1.5 w-full ${justifyClass} group hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer`}
      >
        <span className={isActive ? 'text-indigo-600 dark:text-indigo-400 font-bold' : ''}>
          {label}
        </span>
        <span
          className={`inline-flex items-center justify-center rounded p-0.5 transition-colors ${
            isActive
              ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
              : 'text-slate-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400'
          }`}
        >
          {direction === 'asc' ? (
            <ArrowUp className="w-3.5 h-3.5" />
          ) : direction === 'desc' ? (
            <ArrowDown className="w-3.5 h-3.5" />
          ) : (
            <ArrowUpDown className="w-3.5 h-3.5 opacity-75 group-hover:opacity-100" />
          )}
        </span>
      </button>
    </th>
  );
};
