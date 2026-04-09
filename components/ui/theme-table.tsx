import * as React from 'react'

import type { ModuleThemeName } from '@/components/layout/module-theme'
import { Table } from '@/components/ui/table'
import { cn } from '@/lib/utils'

type ThemeTableAlias =
  | 'preventivi'
  | 'clienti'
  | 'magazzino'
  | 'fatture'
  | 'ddt'
  | 'riparazioni'
  | 'pagamenti'
  | 'workflow'

export type ThemeTableName = ModuleThemeName | ThemeTableAlias
export type ThemeTableBadgeTone = 'primary' | 'neutral' | 'success' | 'warning' | 'danger'

const themeAliases: Record<ThemeTableAlias, ModuleThemeName> = {
  preventivi: 'estimates',
  clienti: 'customers',
  magazzino: 'warehouse',
  fatture: 'invoices',
  ddt: 'ddts',
  riparazioni: 'repairs',
  pagamenti: 'payments',
  workflow: 'workflows',
}

interface ThemeTableStyleSet {
  container: string
  header: string
  head: string
  row: string
  selectedRow: string
  stickyCell: string
  stickyCellSelected: string
  actionButton: string
  emptyState: string
  emptyStateAction: string
  paginationButton: string
  paginationActiveButton: string
  primaryBadge: string
}

const themeTableStyles: Record<ModuleThemeName | 'default', ThemeTableStyleSet> = {
  default: {
    container:
      'border-blue-200/80 shadow-[0_14px_34px_-24px_rgba(37,99,235,0.24)] dark:border-blue-900/30 dark:bg-slate-950/80',
    header:
      '[&_tr]:border-b-2 [&_tr]:border-blue-200/80 bg-blue-50/90 dark:[&_tr]:border-blue-900/30 dark:bg-blue-950/20',
    head: 'text-blue-900 dark:text-blue-100',
    row: 'hover:bg-blue-50/40 dark:hover:bg-blue-950/20',
    selectedRow: 'bg-blue-100/90 border-l-4 border-l-blue-600 hover:bg-blue-100 dark:bg-blue-950/30 dark:border-l-blue-400',
    stickyCell: 'bg-white/95 dark:bg-slate-950/90',
    stickyCellSelected: 'bg-blue-100/95 dark:bg-blue-950/30',
    actionButton: 'text-blue-700 hover:bg-blue-100 hover:text-blue-800 dark:text-blue-200 dark:hover:bg-blue-950/30',
    emptyState:
      '[&_.empty-state-shell]:border-blue-200/80 [&_.empty-state-shell]:bg-blue-50/60 [&_.empty-state-icon]:border-blue-200 [&_.empty-state-icon]:bg-white/90 [&_.empty-state-icon]:text-blue-300 [&_.empty-state-title]:text-blue-900 [&_.empty-state-description]:text-blue-700 dark:[&_.empty-state-shell]:border-blue-900/30 dark:[&_.empty-state-shell]:bg-blue-950/20 dark:[&_.empty-state-icon]:border-blue-900/30 dark:[&_.empty-state-icon]:bg-slate-950 dark:[&_.empty-state-icon]:text-blue-400 dark:[&_.empty-state-title]:text-blue-100 dark:[&_.empty-state-description]:text-blue-300',
    emptyStateAction: 'border-blue-200 bg-blue-600 text-white hover:bg-blue-700 hover:text-white dark:border-blue-800',
    paginationButton: 'border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 dark:border-blue-900/30 dark:text-blue-200 dark:hover:bg-blue-950/30',
    paginationActiveButton: 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700 hover:text-white',
    primaryBadge: 'border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-900/30 dark:bg-blue-950/30 dark:text-blue-200',
  },
  warehouse: {
    container:
      'border-orange-200/80 shadow-[0_14px_34px_-24px_rgba(249,115,22,0.26)] dark:border-orange-900/30 dark:bg-slate-950/80',
    header:
      '[&_tr]:border-b-2 [&_tr]:border-orange-200/80 bg-orange-50/90 dark:[&_tr]:border-orange-900/30 dark:bg-orange-950/20',
    head: 'text-orange-900 dark:text-orange-100',
    row: 'hover:bg-orange-50/40 dark:hover:bg-orange-950/20',
    selectedRow: 'bg-orange-100/90 border-l-4 border-l-orange-600 hover:bg-orange-100 dark:bg-orange-950/30 dark:border-l-orange-400',
    stickyCell: 'bg-white/95 dark:bg-slate-950/90',
    stickyCellSelected: 'bg-orange-100/95 dark:bg-orange-950/30',
    actionButton: 'text-orange-700 hover:bg-orange-100 hover:text-orange-800 dark:text-orange-200 dark:hover:bg-orange-950/30',
    emptyState:
      '[&_.empty-state-shell]:border-orange-200/80 [&_.empty-state-shell]:bg-orange-50/60 [&_.empty-state-icon]:border-orange-200 [&_.empty-state-icon]:bg-white/90 [&_.empty-state-icon]:text-orange-300 [&_.empty-state-title]:text-orange-900 [&_.empty-state-description]:text-orange-700 dark:[&_.empty-state-shell]:border-orange-900/30 dark:[&_.empty-state-shell]:bg-orange-950/20 dark:[&_.empty-state-icon]:border-orange-900/30 dark:[&_.empty-state-icon]:bg-slate-950 dark:[&_.empty-state-icon]:text-orange-400 dark:[&_.empty-state-title]:text-orange-100 dark:[&_.empty-state-description]:text-orange-300',
    emptyStateAction: 'border-orange-200 bg-orange-600 text-white hover:bg-orange-700 hover:text-white dark:border-orange-800',
    paginationButton: 'border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800 dark:border-orange-900/30 dark:text-orange-200 dark:hover:bg-orange-950/30',
    paginationActiveButton: 'border-orange-600 bg-orange-600 text-white hover:bg-orange-700 hover:text-white',
    primaryBadge: 'border-orange-200 bg-orange-100 text-orange-800 dark:border-orange-900/30 dark:bg-orange-950/30 dark:text-orange-200',
  },
  ddts: {
    container:
      'border-sky-200/80 shadow-[0_14px_34px_-24px_rgba(14,165,233,0.24)] dark:border-sky-900/30 dark:bg-slate-950/80',
    header:
      '[&_tr]:border-b-2 [&_tr]:border-sky-200/80 bg-sky-50/90 dark:[&_tr]:border-sky-900/30 dark:bg-sky-950/20',
    head: 'text-sky-900 dark:text-sky-100',
    row: 'hover:bg-sky-50/40 dark:hover:bg-sky-950/20',
    selectedRow: 'bg-sky-100/90 border-l-4 border-l-sky-600 hover:bg-sky-100 dark:bg-sky-950/30 dark:border-l-sky-400',
    stickyCell: 'bg-white/95 dark:bg-slate-950/90',
    stickyCellSelected: 'bg-sky-100/95 dark:bg-sky-950/30',
    actionButton: 'text-sky-700 hover:bg-sky-100 hover:text-sky-800 dark:text-sky-200 dark:hover:bg-sky-950/30',
    emptyState:
      '[&_.empty-state-shell]:border-sky-200/80 [&_.empty-state-shell]:bg-sky-50/60 [&_.empty-state-icon]:border-sky-200 [&_.empty-state-icon]:bg-white/90 [&_.empty-state-icon]:text-sky-300 [&_.empty-state-title]:text-sky-900 [&_.empty-state-description]:text-sky-700 dark:[&_.empty-state-shell]:border-sky-900/30 dark:[&_.empty-state-shell]:bg-sky-950/20 dark:[&_.empty-state-icon]:border-sky-900/30 dark:[&_.empty-state-icon]:bg-slate-950 dark:[&_.empty-state-icon]:text-sky-400 dark:[&_.empty-state-title]:text-sky-100 dark:[&_.empty-state-description]:text-sky-300',
    emptyStateAction: 'border-sky-200 bg-sky-600 text-white hover:bg-sky-700 hover:text-white dark:border-sky-800',
    paginationButton: 'border-sky-200 text-sky-700 hover:bg-sky-50 hover:text-sky-800 dark:border-sky-900/30 dark:text-sky-200 dark:hover:bg-sky-950/30',
    paginationActiveButton: 'border-sky-600 bg-sky-600 text-white hover:bg-sky-700 hover:text-white',
    primaryBadge: 'border-sky-200 bg-sky-100 text-sky-800 dark:border-sky-900/30 dark:bg-sky-950/30 dark:text-sky-200',
  },
  estimates: {
    container:
      'border-violet-200/80 shadow-[0_14px_34px_-24px_rgba(139,92,246,0.26)] dark:border-violet-900/30 dark:bg-slate-950/80',
    header:
      '[&_tr]:border-b-2 [&_tr]:border-violet-200/80 bg-violet-50/90 dark:[&_tr]:border-violet-900/30 dark:bg-violet-950/20',
    head: 'text-violet-900 dark:text-violet-100',
    row: 'hover:bg-violet-50/40 dark:hover:bg-violet-950/20',
    selectedRow: 'bg-violet-100/90 border-l-4 border-l-violet-600 hover:bg-violet-100 dark:bg-violet-950/30 dark:border-l-violet-400',
    stickyCell: 'bg-white/95 dark:bg-slate-950/90',
    stickyCellSelected: 'bg-violet-100/95 dark:bg-violet-950/30',
    actionButton: 'text-violet-700 hover:bg-violet-100 hover:text-violet-800 dark:text-violet-200 dark:hover:bg-violet-950/30',
    emptyState:
      '[&_.empty-state-shell]:border-violet-200/80 [&_.empty-state-shell]:bg-violet-50/60 [&_.empty-state-icon]:border-violet-200 [&_.empty-state-icon]:bg-white/90 [&_.empty-state-icon]:text-violet-300 [&_.empty-state-title]:text-violet-900 [&_.empty-state-description]:text-violet-700 dark:[&_.empty-state-shell]:border-violet-900/30 dark:[&_.empty-state-shell]:bg-violet-950/20 dark:[&_.empty-state-icon]:border-violet-900/30 dark:[&_.empty-state-icon]:bg-slate-950 dark:[&_.empty-state-icon]:text-violet-400 dark:[&_.empty-state-title]:text-violet-100 dark:[&_.empty-state-description]:text-violet-300',
    emptyStateAction: 'border-violet-200 bg-violet-600 text-white hover:bg-violet-700 hover:text-white dark:border-violet-800',
    paginationButton: 'border-violet-200 text-violet-700 hover:bg-violet-50 hover:text-violet-800 dark:border-violet-900/30 dark:text-violet-200 dark:hover:bg-violet-950/30',
    paginationActiveButton: 'border-violet-600 bg-violet-600 text-white hover:bg-violet-700 hover:text-white',
    primaryBadge: 'border-violet-200 bg-violet-100 text-violet-800 dark:border-violet-900/30 dark:bg-violet-950/30 dark:text-violet-200',
  },
  invoices: {
    container:
      'border-blue-200/80 shadow-[0_14px_34px_-24px_rgba(37,99,235,0.24)] dark:border-blue-900/30 dark:bg-slate-950/80',
    header:
      '[&_tr]:border-b-2 [&_tr]:border-blue-200/80 bg-blue-50/90 dark:[&_tr]:border-blue-900/30 dark:bg-blue-950/20',
    head: 'text-blue-900 dark:text-blue-100',
    row: 'hover:bg-blue-50/40 dark:hover:bg-blue-950/20',
    selectedRow: 'bg-blue-100/90 border-l-4 border-l-blue-600 hover:bg-blue-100 dark:bg-blue-950/30 dark:border-l-blue-400',
    stickyCell: 'bg-white/95 dark:bg-slate-950/90',
    stickyCellSelected: 'bg-blue-100/95 dark:bg-blue-950/30',
    actionButton: 'text-blue-700 hover:bg-blue-100 hover:text-blue-800 dark:text-blue-200 dark:hover:bg-blue-950/30',
    emptyState:
      '[&_.empty-state-shell]:border-blue-200/80 [&_.empty-state-shell]:bg-blue-50/60 [&_.empty-state-icon]:border-blue-200 [&_.empty-state-icon]:bg-white/90 [&_.empty-state-icon]:text-blue-300 [&_.empty-state-title]:text-blue-900 [&_.empty-state-description]:text-blue-700 dark:[&_.empty-state-shell]:border-blue-900/30 dark:[&_.empty-state-shell]:bg-blue-950/20 dark:[&_.empty-state-icon]:border-blue-900/30 dark:[&_.empty-state-icon]:bg-slate-950 dark:[&_.empty-state-icon]:text-blue-400 dark:[&_.empty-state-title]:text-blue-100 dark:[&_.empty-state-description]:text-blue-300',
    emptyStateAction: 'border-blue-200 bg-blue-600 text-white hover:bg-blue-700 hover:text-white dark:border-blue-800',
    paginationButton: 'border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 dark:border-blue-900/30 dark:text-blue-200 dark:hover:bg-blue-950/30',
    paginationActiveButton: 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700 hover:text-white',
    primaryBadge: 'border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-900/30 dark:bg-blue-950/30 dark:text-blue-200',
  },
  customers: {
    container:
      'border-teal-200/80 shadow-[0_14px_34px_-24px_rgba(20,184,166,0.26)] dark:border-teal-900/30 dark:bg-slate-950/80',
    header:
      '[&_tr]:border-b-2 [&_tr]:border-teal-200/80 bg-teal-50/90 dark:[&_tr]:border-teal-900/30 dark:bg-teal-950/20',
    head: 'text-teal-900 dark:text-teal-100',
    row: 'hover:bg-teal-50/40 dark:hover:bg-teal-950/20',
    selectedRow: 'bg-teal-100/90 border-l-4 border-l-teal-600 hover:bg-teal-100 dark:bg-teal-950/30 dark:border-l-teal-400',
    stickyCell: 'bg-white/95 dark:bg-slate-950/90',
    stickyCellSelected: 'bg-teal-100/95 dark:bg-teal-950/30',
    actionButton: 'text-teal-700 hover:bg-teal-100 hover:text-teal-800 dark:text-teal-200 dark:hover:bg-teal-950/30',
    emptyState:
      '[&_.empty-state-shell]:border-teal-200/80 [&_.empty-state-shell]:bg-teal-50/60 [&_.empty-state-icon]:border-teal-200 [&_.empty-state-icon]:bg-white/90 [&_.empty-state-icon]:text-teal-300 [&_.empty-state-title]:text-teal-900 [&_.empty-state-description]:text-teal-700 dark:[&_.empty-state-shell]:border-teal-900/30 dark:[&_.empty-state-shell]:bg-teal-950/20 dark:[&_.empty-state-icon]:border-teal-900/30 dark:[&_.empty-state-icon]:bg-slate-950 dark:[&_.empty-state-icon]:text-teal-400 dark:[&_.empty-state-title]:text-teal-100 dark:[&_.empty-state-description]:text-teal-300',
    emptyStateAction: 'border-teal-200 bg-teal-600 text-white hover:bg-teal-700 hover:text-white dark:border-teal-800',
    paginationButton: 'border-teal-200 text-teal-700 hover:bg-teal-50 hover:text-teal-800 dark:border-teal-900/30 dark:text-teal-200 dark:hover:bg-teal-950/30',
    paginationActiveButton: 'border-teal-600 bg-teal-600 text-white hover:bg-teal-700 hover:text-white',
    primaryBadge: 'border-teal-200 bg-teal-100 text-teal-800 dark:border-teal-900/30 dark:bg-teal-950/30 dark:text-teal-200',
  },
  suppliers: {
    container:
      'border-slate-300/80 shadow-[0_14px_34px_-24px_rgba(71,85,105,0.24)] dark:border-slate-800/40 dark:bg-slate-950/80',
    header:
      '[&_tr]:border-b-2 [&_tr]:border-slate-300/80 bg-slate-100/85 dark:[&_tr]:border-slate-800/40 dark:bg-slate-900/70',
    head: 'text-slate-900 dark:text-slate-100',
    row: 'hover:bg-slate-100/60 dark:hover:bg-slate-900/70',
    selectedRow: 'bg-slate-200/80 border-l-4 border-l-slate-600 hover:bg-slate-200 dark:bg-slate-900/80 dark:border-l-slate-400',
    stickyCell: 'bg-white/95 dark:bg-slate-950/90',
    stickyCellSelected: 'bg-slate-200/85 dark:bg-slate-900/80',
    actionButton: 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-900/80',
    emptyState:
      '[&_.empty-state-shell]:border-slate-300/80 [&_.empty-state-shell]:bg-slate-50/80 [&_.empty-state-icon]:border-slate-300 [&_.empty-state-icon]:bg-white/90 [&_.empty-state-icon]:text-slate-400 [&_.empty-state-title]:text-slate-900 [&_.empty-state-description]:text-slate-700 dark:[&_.empty-state-shell]:border-slate-800/40 dark:[&_.empty-state-shell]:bg-slate-900/70 dark:[&_.empty-state-icon]:border-slate-800/40 dark:[&_.empty-state-icon]:bg-slate-950 dark:[&_.empty-state-icon]:text-slate-400 dark:[&_.empty-state-title]:text-slate-100 dark:[&_.empty-state-description]:text-slate-300',
    emptyStateAction: 'border-slate-300 bg-slate-700 text-white hover:bg-slate-800 hover:text-white dark:border-slate-700',
    paginationButton: 'border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800/40 dark:text-slate-200 dark:hover:bg-slate-900/70',
    paginationActiveButton: 'border-slate-700 bg-slate-700 text-white hover:bg-slate-800 hover:text-white',
    primaryBadge: 'border-slate-300 bg-slate-100 text-slate-800 dark:border-slate-800/40 dark:bg-slate-900/70 dark:text-slate-200',
  },
  categories: {
    container:
      'border-amber-200/80 shadow-[0_14px_34px_-24px_rgba(245,158,11,0.26)] dark:border-amber-900/30 dark:bg-slate-950/80',
    header:
      '[&_tr]:border-b-2 [&_tr]:border-amber-200/80 bg-amber-50/90 dark:[&_tr]:border-amber-900/30 dark:bg-amber-950/20',
    head: 'text-amber-900 dark:text-amber-100',
    row: 'hover:bg-amber-50/40 dark:hover:bg-amber-950/20',
    selectedRow: 'bg-amber-100/90 border-l-4 border-l-amber-600 hover:bg-amber-100 dark:bg-amber-950/30 dark:border-l-amber-400',
    stickyCell: 'bg-white/95 dark:bg-slate-950/90',
    stickyCellSelected: 'bg-amber-100/95 dark:bg-amber-950/30',
    actionButton: 'text-amber-700 hover:bg-amber-100 hover:text-amber-800 dark:text-amber-200 dark:hover:bg-amber-950/30',
    emptyState:
      '[&_.empty-state-shell]:border-amber-200/80 [&_.empty-state-shell]:bg-amber-50/60 [&_.empty-state-icon]:border-amber-200 [&_.empty-state-icon]:bg-white/90 [&_.empty-state-icon]:text-amber-300 [&_.empty-state-title]:text-amber-900 [&_.empty-state-description]:text-amber-700 dark:[&_.empty-state-shell]:border-amber-900/30 dark:[&_.empty-state-shell]:bg-amber-950/20 dark:[&_.empty-state-icon]:border-amber-900/30 dark:[&_.empty-state-icon]:bg-slate-950 dark:[&_.empty-state-icon]:text-amber-400 dark:[&_.empty-state-title]:text-amber-100 dark:[&_.empty-state-description]:text-amber-300',
    emptyStateAction: 'border-amber-200 bg-amber-600 text-white hover:bg-amber-700 hover:text-white dark:border-amber-800',
    paginationButton: 'border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800 dark:border-amber-900/30 dark:text-amber-200 dark:hover:bg-amber-950/30',
    paginationActiveButton: 'border-amber-600 bg-amber-600 text-white hover:bg-amber-700 hover:text-white',
    primaryBadge: 'border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-900/30 dark:bg-amber-950/30 dark:text-amber-200',
  },
  payments: {
    container:
      'border-emerald-200/80 shadow-[0_14px_34px_-24px_rgba(16,185,129,0.24)] dark:border-emerald-900/30 dark:bg-slate-950/80',
    header:
      '[&_tr]:border-b-2 [&_tr]:border-emerald-200/80 bg-emerald-50/90 dark:[&_tr]:border-emerald-900/30 dark:bg-emerald-950/20',
    head: 'text-emerald-900 dark:text-emerald-100',
    row: 'hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20',
    selectedRow: 'bg-emerald-100/90 border-l-4 border-l-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:border-l-emerald-400',
    stickyCell: 'bg-white/95 dark:bg-slate-950/90',
    stickyCellSelected: 'bg-emerald-100/95 dark:bg-emerald-950/30',
    actionButton: 'text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 dark:text-emerald-200 dark:hover:bg-emerald-950/30',
    emptyState:
      '[&_.empty-state-shell]:border-emerald-200/80 [&_.empty-state-shell]:bg-emerald-50/60 [&_.empty-state-icon]:border-emerald-200 [&_.empty-state-icon]:bg-white/90 [&_.empty-state-icon]:text-emerald-300 [&_.empty-state-title]:text-emerald-900 [&_.empty-state-description]:text-emerald-700 dark:[&_.empty-state-shell]:border-emerald-900/30 dark:[&_.empty-state-shell]:bg-emerald-950/20 dark:[&_.empty-state-icon]:border-emerald-900/30 dark:[&_.empty-state-icon]:bg-slate-950 dark:[&_.empty-state-icon]:text-emerald-400 dark:[&_.empty-state-title]:text-emerald-100 dark:[&_.empty-state-description]:text-emerald-300',
    emptyStateAction: 'border-emerald-200 bg-emerald-600 text-white hover:bg-emerald-700 hover:text-white dark:border-emerald-800',
    paginationButton: 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-900/30 dark:text-emerald-200 dark:hover:bg-emerald-950/30',
    paginationActiveButton: 'border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 hover:text-white',
    primaryBadge: 'border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-900/30 dark:bg-emerald-950/30 dark:text-emerald-200',
  },
  cashBook: {
    container:
      'border-teal-200/80 shadow-[0_14px_34px_-24px_rgba(13,148,136,0.24)] dark:border-teal-900/30 dark:bg-slate-950/80',
    header:
      '[&_tr]:border-b-2 [&_tr]:border-teal-200/80 bg-teal-50/90 dark:[&_tr]:border-teal-900/30 dark:bg-teal-950/20',
    head: 'text-teal-900 dark:text-teal-100',
    row: 'hover:bg-teal-50/40 dark:hover:bg-teal-950/20',
    selectedRow: 'bg-teal-100/90 border-l-4 border-l-teal-600 hover:bg-teal-100 dark:bg-teal-950/30 dark:border-l-teal-400',
    stickyCell: 'bg-white/95 dark:bg-slate-950/90',
    stickyCellSelected: 'bg-teal-100/95 dark:bg-teal-950/30',
    actionButton: 'text-teal-700 hover:bg-teal-100 hover:text-teal-800 dark:text-teal-200 dark:hover:bg-teal-950/30',
    emptyState:
      '[&_.empty-state-shell]:border-teal-200/80 [&_.empty-state-shell]:bg-teal-50/60 [&_.empty-state-icon]:border-teal-200 [&_.empty-state-icon]:bg-white/90 [&_.empty-state-icon]:text-teal-300 [&_.empty-state-title]:text-teal-900 [&_.empty-state-description]:text-teal-700 dark:[&_.empty-state-shell]:border-teal-900/30 dark:[&_.empty-state-shell]:bg-teal-950/20 dark:[&_.empty-state-icon]:border-teal-900/30 dark:[&_.empty-state-icon]:bg-slate-950 dark:[&_.empty-state-icon]:text-teal-400 dark:[&_.empty-state-title]:text-teal-100 dark:[&_.empty-state-description]:text-teal-300',
    emptyStateAction: 'border-teal-200 bg-teal-600 text-white hover:bg-teal-700 hover:text-white dark:border-teal-800',
    paginationButton: 'border-teal-200 text-teal-700 hover:bg-teal-50 hover:text-teal-800 dark:border-teal-900/30 dark:text-teal-200 dark:hover:bg-teal-950/30',
    paginationActiveButton: 'border-teal-600 bg-teal-600 text-white hover:bg-teal-700 hover:text-white',
    primaryBadge: 'border-teal-200 bg-teal-100 text-teal-800 dark:border-teal-900/30 dark:bg-teal-950/30 dark:text-teal-200',
  },
  repairs: {
    container:
      'border-rose-200/80 shadow-[0_14px_34px_-24px_rgba(244,63,94,0.24)] dark:border-rose-900/30 dark:bg-slate-950/80',
    header:
      '[&_tr]:border-b-2 [&_tr]:border-rose-200/80 bg-rose-50/90 dark:[&_tr]:border-rose-900/30 dark:bg-rose-950/20',
    head: 'text-rose-900 dark:text-rose-100',
    row: 'hover:bg-rose-50/40 dark:hover:bg-rose-950/20',
    selectedRow: 'bg-rose-100/90 border-l-4 border-l-rose-600 hover:bg-rose-100 dark:bg-rose-950/30 dark:border-l-rose-400',
    stickyCell: 'bg-white/95 dark:bg-slate-950/90',
    stickyCellSelected: 'bg-rose-100/95 dark:bg-rose-950/30',
    actionButton: 'text-rose-700 hover:bg-rose-100 hover:text-rose-800 dark:text-rose-200 dark:hover:bg-rose-950/30',
    emptyState:
      '[&_.empty-state-shell]:border-rose-200/80 [&_.empty-state-shell]:bg-rose-50/60 [&_.empty-state-icon]:border-rose-200 [&_.empty-state-icon]:bg-white/90 [&_.empty-state-icon]:text-rose-300 [&_.empty-state-title]:text-rose-900 [&_.empty-state-description]:text-rose-700 dark:[&_.empty-state-shell]:border-rose-900/30 dark:[&_.empty-state-shell]:bg-rose-950/20 dark:[&_.empty-state-icon]:border-rose-900/30 dark:[&_.empty-state-icon]:bg-slate-950 dark:[&_.empty-state-icon]:text-rose-400 dark:[&_.empty-state-title]:text-rose-100 dark:[&_.empty-state-description]:text-rose-300',
    emptyStateAction: 'border-rose-200 bg-rose-600 text-white hover:bg-rose-700 hover:text-white dark:border-rose-800',
    paginationButton: 'border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 dark:border-rose-900/30 dark:text-rose-200 dark:hover:bg-rose-950/30',
    paginationActiveButton: 'border-rose-600 bg-rose-600 text-white hover:bg-rose-700 hover:text-white',
    primaryBadge: 'border-rose-200 bg-rose-100 text-rose-800 dark:border-rose-900/30 dark:bg-rose-950/30 dark:text-rose-200',
  },
  orders: {
    container:
      'border-orange-200/80 shadow-[0_14px_34px_-24px_rgba(234,88,12,0.24)] dark:border-orange-900/30 dark:bg-slate-950/80',
    header:
      '[&_tr]:border-b-2 [&_tr]:border-orange-200/80 bg-orange-50/90 dark:[&_tr]:border-orange-900/30 dark:bg-orange-950/20',
    head: 'text-orange-900 dark:text-orange-100',
    row: 'hover:bg-orange-50/40 dark:hover:bg-orange-950/20',
    selectedRow: 'bg-orange-100/90 border-l-4 border-l-orange-600 hover:bg-orange-100 dark:bg-orange-950/30 dark:border-l-orange-400',
    stickyCell: 'bg-white/95 dark:bg-slate-950/90',
    stickyCellSelected: 'bg-orange-100/95 dark:bg-orange-950/30',
    actionButton: 'text-orange-700 hover:bg-orange-100 hover:text-orange-800 dark:text-orange-200 dark:hover:bg-orange-950/30',
    emptyState:
      '[&_.empty-state-shell]:border-orange-200/80 [&_.empty-state-shell]:bg-orange-50/60 [&_.empty-state-icon]:border-orange-200 [&_.empty-state-icon]:bg-white/90 [&_.empty-state-icon]:text-orange-300 [&_.empty-state-title]:text-orange-900 [&_.empty-state-description]:text-orange-700 dark:[&_.empty-state-shell]:border-orange-900/30 dark:[&_.empty-state-shell]:bg-orange-950/20 dark:[&_.empty-state-icon]:border-orange-900/30 dark:[&_.empty-state-icon]:bg-slate-950 dark:[&_.empty-state-icon]:text-orange-400 dark:[&_.empty-state-title]:text-orange-100 dark:[&_.empty-state-description]:text-orange-300',
    emptyStateAction: 'border-orange-200 bg-orange-600 text-white hover:bg-orange-700 hover:text-white dark:border-orange-800',
    paginationButton: 'border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800 dark:border-orange-900/30 dark:text-orange-200 dark:hover:bg-orange-950/30',
    paginationActiveButton: 'border-orange-600 bg-orange-600 text-white hover:bg-orange-700 hover:text-white',
    primaryBadge: 'border-orange-200 bg-orange-100 text-orange-800 dark:border-orange-900/30 dark:bg-orange-950/30 dark:text-orange-200',
  },
  supplierOrders: {
    container:
      'border-amber-300/80 shadow-[0_14px_34px_-24px_rgba(180,83,9,0.24)] dark:border-amber-900/30 dark:bg-slate-950/80',
    header:
      '[&_tr]:border-b-2 [&_tr]:border-amber-300/80 bg-amber-50/90 dark:[&_tr]:border-amber-900/30 dark:bg-amber-950/20',
    head: 'text-amber-900 dark:text-amber-100',
    row: 'hover:bg-amber-50/40 dark:hover:bg-amber-950/20',
    selectedRow: 'bg-amber-100/90 border-l-4 border-l-amber-700 hover:bg-amber-100 dark:bg-amber-950/30 dark:border-l-amber-400',
    stickyCell: 'bg-white/95 dark:bg-slate-950/90',
    stickyCellSelected: 'bg-amber-100/95 dark:bg-amber-950/30',
    actionButton: 'text-amber-700 hover:bg-amber-100 hover:text-amber-800 dark:text-amber-200 dark:hover:bg-amber-950/30',
    emptyState:
      '[&_.empty-state-shell]:border-amber-300/80 [&_.empty-state-shell]:bg-amber-50/60 [&_.empty-state-icon]:border-amber-300 [&_.empty-state-icon]:bg-white/90 [&_.empty-state-icon]:text-amber-400 [&_.empty-state-title]:text-amber-900 [&_.empty-state-description]:text-amber-700 dark:[&_.empty-state-shell]:border-amber-900/30 dark:[&_.empty-state-shell]:bg-amber-950/20 dark:[&_.empty-state-icon]:border-amber-900/30 dark:[&_.empty-state-icon]:bg-slate-950 dark:[&_.empty-state-icon]:text-amber-400 dark:[&_.empty-state-title]:text-amber-100 dark:[&_.empty-state-description]:text-amber-300',
    emptyStateAction: 'border-amber-300 bg-amber-700 text-white hover:bg-amber-800 hover:text-white dark:border-amber-800',
    paginationButton: 'border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800 dark:border-amber-900/30 dark:text-amber-200 dark:hover:bg-amber-950/30',
    paginationActiveButton: 'border-amber-700 bg-amber-700 text-white hover:bg-amber-800 hover:text-white',
    primaryBadge: 'border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-900/30 dark:bg-amber-950/30 dark:text-amber-200',
  },
  workflows: {
    container:
      'border-indigo-200/80 shadow-[0_14px_34px_-24px_rgba(99,102,241,0.24)] dark:border-indigo-900/30 dark:bg-slate-950/80',
    header:
      '[&_tr]:border-b-2 [&_tr]:border-indigo-200/80 bg-indigo-50/90 dark:[&_tr]:border-indigo-900/30 dark:bg-indigo-950/20',
    head: 'text-indigo-900 dark:text-indigo-100',
    row: 'hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20',
    selectedRow: 'bg-indigo-100/90 border-l-4 border-l-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:border-l-indigo-400',
    stickyCell: 'bg-white/95 dark:bg-slate-950/90',
    stickyCellSelected: 'bg-indigo-100/95 dark:bg-indigo-950/30',
    actionButton: 'text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 dark:text-indigo-200 dark:hover:bg-indigo-950/30',
    emptyState:
      '[&_.empty-state-shell]:border-indigo-200/80 [&_.empty-state-shell]:bg-indigo-50/60 [&_.empty-state-icon]:border-indigo-200 [&_.empty-state-icon]:bg-white/90 [&_.empty-state-icon]:text-indigo-300 [&_.empty-state-title]:text-indigo-900 [&_.empty-state-description]:text-indigo-700 dark:[&_.empty-state-shell]:border-indigo-900/30 dark:[&_.empty-state-shell]:bg-indigo-950/20 dark:[&_.empty-state-icon]:border-indigo-900/30 dark:[&_.empty-state-icon]:bg-slate-950 dark:[&_.empty-state-icon]:text-indigo-400 dark:[&_.empty-state-title]:text-indigo-100 dark:[&_.empty-state-description]:text-indigo-300',
    emptyStateAction: 'border-indigo-200 bg-indigo-600 text-white hover:bg-indigo-700 hover:text-white dark:border-indigo-800',
    paginationButton: 'border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 dark:border-indigo-900/30 dark:text-indigo-200 dark:hover:bg-indigo-950/30',
    paginationActiveButton: 'border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700 hover:text-white',
    primaryBadge: 'border-indigo-200 bg-indigo-100 text-indigo-800 dark:border-indigo-900/30 dark:bg-indigo-950/30 dark:text-indigo-200',
  },
  analytics: {
    container:
      'border-purple-200/80 shadow-[0_14px_34px_-24px_rgba(147,51,234,0.24)] dark:border-purple-900/30 dark:bg-slate-950/80',
    header:
      '[&_tr]:border-b-2 [&_tr]:border-purple-200/80 bg-purple-50/90 dark:[&_tr]:border-purple-900/30 dark:bg-purple-950/20',
    head: 'text-purple-900 dark:text-purple-100',
    row: 'hover:bg-purple-50/40 dark:hover:bg-purple-950/20',
    selectedRow: 'bg-purple-100/90 border-l-4 border-l-purple-600 hover:bg-purple-100 dark:bg-purple-950/30 dark:border-l-purple-400',
    stickyCell: 'bg-white/95 dark:bg-slate-950/90',
    stickyCellSelected: 'bg-purple-100/95 dark:bg-purple-950/30',
    actionButton: 'text-purple-700 hover:bg-purple-100 hover:text-purple-800 dark:text-purple-200 dark:hover:bg-purple-950/30',
    emptyState:
      '[&_.empty-state-shell]:border-purple-200/80 [&_.empty-state-shell]:bg-purple-50/60 [&_.empty-state-icon]:border-purple-200 [&_.empty-state-icon]:bg-white/90 [&_.empty-state-icon]:text-purple-300 [&_.empty-state-title]:text-purple-900 [&_.empty-state-description]:text-purple-700 dark:[&_.empty-state-shell]:border-purple-900/30 dark:[&_.empty-state-shell]:bg-purple-950/20 dark:[&_.empty-state-icon]:border-purple-900/30 dark:[&_.empty-state-icon]:bg-slate-950 dark:[&_.empty-state-icon]:text-purple-400 dark:[&_.empty-state-title]:text-purple-100 dark:[&_.empty-state-description]:text-purple-300',
    emptyStateAction: 'border-purple-200 bg-purple-600 text-white hover:bg-purple-700 hover:text-white dark:border-purple-800',
    paginationButton: 'border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800 dark:border-purple-900/30 dark:text-purple-200 dark:hover:bg-purple-950/30',
    paginationActiveButton: 'border-purple-600 bg-purple-600 text-white hover:bg-purple-700 hover:text-white',
    primaryBadge: 'border-purple-200 bg-purple-100 text-purple-800 dark:border-purple-900/30 dark:bg-purple-950/30 dark:text-purple-200',
  },
  reports: {
    container:
      'border-purple-200/80 shadow-[0_14px_34px_-24px_rgba(147,51,234,0.24)] dark:border-purple-900/30 dark:bg-slate-950/80',
    header:
      '[&_tr]:border-b-2 [&_tr]:border-purple-200/80 bg-purple-50/90 dark:[&_tr]:border-purple-900/30 dark:bg-purple-950/20',
    head: 'text-purple-900 dark:text-purple-100',
    row: 'hover:bg-purple-50/40 dark:hover:bg-purple-950/20',
    selectedRow: 'bg-purple-100/90 border-l-4 border-l-purple-600 hover:bg-purple-100 dark:bg-purple-950/30 dark:border-l-purple-400',
    stickyCell: 'bg-white/95 dark:bg-slate-950/90',
    stickyCellSelected: 'bg-purple-100/95 dark:bg-purple-950/30',
    actionButton: 'text-purple-700 hover:bg-purple-100 hover:text-purple-800 dark:text-purple-200 dark:hover:bg-purple-950/30',
    emptyState:
      '[&_.empty-state-shell]:border-purple-200/80 [&_.empty-state-shell]:bg-purple-50/60 [&_.empty-state-icon]:border-purple-200 [&_.empty-state-icon]:bg-white/90 [&_.empty-state-icon]:text-purple-300 [&_.empty-state-title]:text-purple-900 [&_.empty-state-description]:text-purple-700 dark:[&_.empty-state-shell]:border-purple-900/30 dark:[&_.empty-state-shell]:bg-purple-950/20 dark:[&_.empty-state-icon]:border-purple-900/30 dark:[&_.empty-state-icon]:bg-slate-950 dark:[&_.empty-state-icon]:text-purple-400 dark:[&_.empty-state-title]:text-purple-100 dark:[&_.empty-state-description]:text-purple-300',
    emptyStateAction: 'border-purple-200 bg-purple-600 text-white hover:bg-purple-700 hover:text-white dark:border-purple-800',
    paginationButton: 'border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800 dark:border-purple-900/30 dark:text-purple-200 dark:hover:bg-purple-950/30',
    paginationActiveButton: 'border-purple-600 bg-purple-600 text-white hover:bg-purple-700 hover:text-white',
    primaryBadge: 'border-purple-200 bg-purple-100 text-purple-800 dark:border-purple-900/30 dark:bg-purple-950/30 dark:text-purple-200',
  },
  settings: {
    container:
      'border-gray-300/80 shadow-[0_14px_34px_-24px_rgba(107,114,128,0.22)] dark:border-gray-800/40 dark:bg-slate-950/80',
    header:
      '[&_tr]:border-b-2 [&_tr]:border-gray-300/80 bg-gray-50/90 dark:[&_tr]:border-gray-800/40 dark:bg-gray-950/20',
    head: 'text-gray-900 dark:text-gray-100',
    row: 'hover:bg-gray-50/60 dark:hover:bg-gray-950/20',
    selectedRow: 'bg-gray-100/90 border-l-4 border-l-gray-600 hover:bg-gray-100 dark:bg-gray-950/30 dark:border-l-gray-400',
    stickyCell: 'bg-white/95 dark:bg-slate-950/90',
    stickyCellSelected: 'bg-gray-100/95 dark:bg-gray-950/30',
    actionButton: 'text-gray-700 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-200 dark:hover:bg-gray-950/30',
    emptyState:
      '[&_.empty-state-shell]:border-gray-300/80 [&_.empty-state-shell]:bg-gray-50/80 [&_.empty-state-icon]:border-gray-300 [&_.empty-state-icon]:bg-white/90 [&_.empty-state-icon]:text-gray-400 [&_.empty-state-title]:text-gray-900 [&_.empty-state-description]:text-gray-700 dark:[&_.empty-state-shell]:border-gray-800/40 dark:[&_.empty-state-shell]:bg-gray-950/20 dark:[&_.empty-state-icon]:border-gray-800/40 dark:[&_.empty-state-icon]:bg-slate-950 dark:[&_.empty-state-icon]:text-gray-400 dark:[&_.empty-state-title]:text-gray-100 dark:[&_.empty-state-description]:text-gray-300',
    emptyStateAction: 'border-gray-300 bg-gray-700 text-white hover:bg-gray-800 hover:text-white dark:border-gray-700',
    paginationButton: 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-800 dark:border-gray-800/40 dark:text-gray-200 dark:hover:bg-gray-950/20',
    paginationActiveButton: 'border-gray-700 bg-gray-700 text-white hover:bg-gray-800 hover:text-white',
    primaryBadge: 'border-gray-300 bg-gray-100 text-gray-800 dark:border-gray-800/40 dark:bg-gray-950/30 dark:text-gray-200',
  },
  products: {
    container:
      'border-orange-200/80 shadow-[0_14px_34px_-24px_rgba(249,115,22,0.26)] dark:border-orange-900/30 dark:bg-slate-950/80',
    header:
      '[&_tr]:border-b-2 [&_tr]:border-orange-200/80 bg-orange-50/90 dark:[&_tr]:border-orange-900/30 dark:bg-orange-950/20',
    head: 'text-orange-900 dark:text-orange-100',
    row: 'hover:bg-orange-50/40 dark:hover:bg-orange-950/20',
    selectedRow: 'bg-orange-100/90 border-l-4 border-l-orange-600 hover:bg-orange-100 dark:bg-orange-950/30 dark:border-l-orange-400',
    stickyCell: 'bg-white/95 dark:bg-slate-950/90',
    stickyCellSelected: 'bg-orange-100/95 dark:bg-orange-950/30',
    actionButton: 'text-orange-700 hover:bg-orange-100 hover:text-orange-800 dark:text-orange-200 dark:hover:bg-orange-950/30',
    emptyState:
      '[&_.empty-state-shell]:border-orange-200/80 [&_.empty-state-shell]:bg-orange-50/60 [&_.empty-state-icon]:border-orange-200 [&_.empty-state-icon]:bg-white/90 [&_.empty-state-icon]:text-orange-300 [&_.empty-state-title]:text-orange-900 [&_.empty-state-description]:text-orange-700 dark:[&_.empty-state-shell]:border-orange-900/30 dark:[&_.empty-state-shell]:bg-orange-950/20 dark:[&_.empty-state-icon]:border-orange-900/30 dark:[&_.empty-state-icon]:bg-slate-950 dark:[&_.empty-state-icon]:text-orange-400 dark:[&_.empty-state-title]:text-orange-100 dark:[&_.empty-state-description]:text-orange-300',
    emptyStateAction: 'border-orange-200 bg-orange-600 text-white hover:bg-orange-700 hover:text-white dark:border-orange-800',
    paginationButton: 'border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800 dark:border-orange-900/30 dark:text-orange-200 dark:hover:bg-orange-950/30',
    paginationActiveButton: 'border-orange-600 bg-orange-600 text-white hover:bg-orange-700 hover:text-white',
    primaryBadge: 'border-orange-200 bg-orange-100 text-orange-800 dark:border-orange-900/30 dark:bg-orange-950/30 dark:text-orange-200',
  },
}

function resolveThemeTable(theme: ThemeTableName): ModuleThemeName {
  return (theme in themeAliases ? themeAliases[theme as ThemeTableAlias] : theme) as ModuleThemeName
}

export function getThemeTableStyles(theme: ThemeTableName) {
  return themeTableStyles[resolveThemeTable(theme)] || themeTableStyles.default
}

interface ThemeTableProps extends React.ComponentPropsWithoutRef<typeof Table> {
  theme: ThemeTableName
}

export function ThemeTable({ theme, containerClassName, ...props }: ThemeTableProps) {
  const styles = getThemeTableStyles(theme)
  return <Table {...props} containerClassName={cn(styles.container, containerClassName)} />
}

export function getThemeTableHeaderClassName(theme: ThemeTableName, className?: string) {
  return cn(getThemeTableStyles(theme).header, className)
}

export function getThemeTableHeadClassName(theme: ThemeTableName, className?: string) {
  return cn(getThemeTableStyles(theme).head, className)
}

export function getThemeTableRowClassName(
  theme: ThemeTableName,
  options?: { selected?: boolean },
  className?: string,
) {
  const styles = getThemeTableStyles(theme)
  return cn(styles.row, options?.selected && styles.selectedRow, className)
}

export function getThemeTableStickyCellClassName(
  theme: ThemeTableName,
  options?: { selected?: boolean },
  className?: string,
) {
  const styles = getThemeTableStyles(theme)
  return cn(options?.selected ? styles.stickyCellSelected : styles.stickyCell, className)
}

export function getThemeTableActionButtonClassName(theme: ThemeTableName, className?: string) {
  return cn(getThemeTableStyles(theme).actionButton, className)
}

export function getThemeTableEmptyStateClassName(theme: ThemeTableName, className?: string) {
  return cn(getThemeTableStyles(theme).emptyState, className)
}

export function getThemeTableEmptyStateActionClassName(theme: ThemeTableName, className?: string) {
  return cn(getThemeTableStyles(theme).emptyStateAction, className)
}

export function getThemeTablePaginationButtonClassName(
  theme: ThemeTableName,
  options?: { active?: boolean },
  className?: string,
) {
  const styles = getThemeTableStyles(theme)
  return cn(options?.active ? styles.paginationActiveButton : styles.paginationButton, className)
}

export function getThemeTableStatusBadgeClassName(
  theme: ThemeTableName,
  tone: ThemeTableBadgeTone = 'primary',
  className?: string,
) {
  const styles = getThemeTableStyles(theme)

  const toneClassName = {
    primary: styles.primaryBadge,
    neutral:
      'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200',
    success:
      'border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-900/30 dark:bg-emerald-950/30 dark:text-emerald-200',
    warning:
      'border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-900/30 dark:bg-amber-950/30 dark:text-amber-200',
    danger:
      'border-rose-200 bg-rose-100 text-rose-800 dark:border-rose-900/30 dark:bg-rose-950/30 dark:text-rose-200',
  }[tone]

  return cn(
    'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors',
    toneClassName,
    className,
  )
}
