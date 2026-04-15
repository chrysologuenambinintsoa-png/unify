
'use client';

import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
  forwardRef,
  useImperativeHandle
} from 'react';
import { createPortal } from 'react-dom';
import { GroupPageSkeleton } from '../../Skeleton';

/* ============================================
   Constants
   ============================================ */
const REACTION_EMOJIS = [
  { emoji: '👍', label: "J'aime", color: '#003d5c' },
  { emoji: '❤️', label: 'J\'adore', color: '#F33E58' },
  { emoji: '😂', label: 'Haha', color: '#F7B125' },
  { emoji: '😮', label: 'Wouah', color: '#F7B125' },
  { emoji: '😢', label: 'Triste', color: '#F7B125' },
  { emoji: '😡', label: 'Grrr', color: '#F33E58' },
];

const PRIVACY_TYPES = {
  public: { label: 'Public', icon: '🌐' },
  private: { label: 'Privé', icon: '🔒' },
  visible: { label: 'Visible', icon: '👥' },
};

const TABS = [
  { id: 'discussion', label: 'Discussion' },
  { id: 'members', label: 'Membres' },
  { id: 'events', label: 'Événements' },
  { id: 'photos', label: 'Photos' },
  { id: 'files', label: 'Fichiers' },
  { id: 'about', label: 'À propos' },
];

const ROLES = {
  admin: { label: 'Admin', color: '#003d5c' },
  moderator: { label: 'Modérateur', color: '#45BD62' },
  member: { label: 'Membre', color: '#65676B' },
};

const ROLE_ICONS = {
  admin: '🛡️',
  moderator: '✋',
  member: '',
};

const POST_VISIBILITY = {
  all: 'Tous les membres',
  admin: 'Admins et modérateurs uniquement',
};

/* ============================================
   Utility Functions
   ============================================ */
const formatNumber = (num) => {
  if (!num && num !== 0) return '';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'A l\'instant';
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `Il y a ${Math.floor(diff / 86400)} j`;
  if (diff < 2592000) return `Il y a ${Math.floor(diff / 604800)} sem`;
  return `Il y a ${Math.floor(diff / 2592000)} m`;
};

const generateId = () => Math.random().toString(36).substr(2, 9);

/* ============================================
   Icons (inline SVG)
   ============================================ */
const Icons = {
  Globe: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  Lock: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  Users: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Plus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Image: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
    </svg>
  ),
  Video: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
    </svg>
  ),
  Smile: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
    </svg>
  ),
  ThumbsUp: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
    </svg>
  ),
  Comment: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  Share: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  ),
  MoreHorizontal: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
    </svg>
  ),
  Bookmark: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  Search: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  Bell: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  Settings: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  Send: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  X: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  ChevronDown: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  Calendar: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  FileText: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  Folder: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  MapPin: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  Link: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  ),
  Award: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
    </svg>
  ),
  Flag: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
    </svg>
  ),
  Eye: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  EyeOff: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ),
  UserPlus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
    </svg>
  ),
  ThreeDots: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>
    </svg>
  ),
  Pinned: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24z"/>
    </svg>
  ),
  BarChart: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>
    </svg>
  ),
  Edit: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  Hash: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/>
    </svg>
  ),
  Camera: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
    </svg>
  ),
  Mic: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
    </svg>
  ),
  Poll: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  Gift: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
    </svg>
  ),
  Tag: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  ),
  Heart: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
  Mail: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
    </svg>
  ),
  ArrowLeft: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
    </svg>
  ),
  Filter: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  ),
  Sort: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="16" y2="6"/><line x1="4" y1="12" x2="12" y2="12"/><line x1="4" y1="18" x2="8" y2="18"/>
    </svg>
  ),
  Grid: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  List: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  ),
  Info: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
};

/* ============================================
   Sub-Components
   ============================================ */

/* --- Reaction Tooltip --- */
const ReactionTooltip = ({ show, onReaction, onClose }) => {
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose();
      }
    };
    if (show) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div ref={ref} className="ug-reaction-tooltip">
      {REACTION_EMOJIS.map((r) => (
        <button
          key={r.emoji}
          className="ug-reaction-tooltip-item"
          onClick={() => onReaction(r.emoji)}
          title={r.label}
        >
          <span className="ug-reaction-emoji">{r.emoji}</span>
          <span className="ug-reaction-label">{r.label}</span>
        </button>
      ))}
    </div>
  );
};

/* --- Comment Item --- */
const CommentItem = ({ comment, onLike, onReply, currentUserId, depth = 0 }) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReactionTooltip, setShowReactionTooltip] = useState(false);

  const handleReply = () => {
    if (replyText.trim()) {
      onReply(comment.id, replyText.trim());
      setReplyText('');
      setShowReplyInput(false);
    }
  };

  return (
    <div className={`ug-comment ${depth > 0 ? 'ug-comment-reply' : ''}`}>
      <div className="ug-comment-avatar">
        <img src={comment.author.avatar} alt={comment.author.name} />
        {comment.author.online && <span className="ug-online-dot" />}
      </div>
      <div className="ug-comment-content">
        <div className="ug-comment-bubble">
          <div className="ug-comment-header">
            <span className="ug-comment-author">{comment.author.name}</span>
            {comment.author.role && comment.author.role !== 'member' && (
              <span className="ug-role-badge" style={{ backgroundColor: ROLES[comment.author.role]?.color }}>
                {ROLE_ICONS[comment.author.role]} {ROLES[comment.author.role]?.label}
              </span>
            )}
          </div>
          <p className="ug-comment-text">{comment.text}</p>
          {comment.attachment && (
            <div className="ug-comment-attachment">
              <img src={comment.attachment} alt="Attachment" />
            </div>
          )}
          <div className="ug-comment-meta">
            <span className="ug-comment-time">{formatTimeAgo(comment.createdAt)}</span>
            <button className="ug-comment-action-btn" onClick={() => onLike(comment.id)}>
              {comment.liked ? 'J\'aime · ' : 'J\'aime'}
            </button>
            {comment.likes > 0 && <span className="ug-comment-likes-count">{comment.likes}</span>}
            {depth < 2 && (
              <button
                className="ug-comment-action-btn"
                onClick={() => setShowReplyInput(!showReplyInput)}
              >
                Repondre
              </button>
            )}
          </div>
        </div>

        {/* Reply Input */}
        {showReplyInput && (
          <div className="ug-reply-input-wrap">
            <img
              src={currentUserId ? '/api/placeholder/32/32' : '/api/placeholder/32/32'}
              alt="You"
              className="ug-reply-avatar"
            />
            <div className="ug-reply-input">
              <input
                type="text"
                placeholder="Repondre..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                autoFocus
              />
              <button onClick={handleReply} disabled={!replyText.trim()}>
                <Icons.Send />
              </button>
            </div>
          </div>
        )}

        {/* Nested replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="ug-comment-replies">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                onLike={onLike}
                onReply={onReply}
                currentUserId={currentUserId}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* --- Member Item --- */
const MemberItem = ({ member, onRemove, onRoleChange, currentUser }) => {
  const [showMenu, setShowMenu] = useState(false);
  const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'moderator');

  return (
    <div className="ug-member-item">
      <div className="ug-member-avatar">
        <img src={member.avatar} alt={member.name} />
        {member.online && <span className="ug-online-dot" />}
      </div>
      <div className="ug-member-info">
        <div className="ug-member-name-row">
          <span className="ug-member-name">{member.name}</span>
          {member.role && member.role !== 'member' && (
            <span className="ug-role-badge" style={{ backgroundColor: ROLES[member.role]?.color }}>
              {ROLE_ICONS[member.role]} {ROLES[member.role]?.label}
            </span>
          )}
          {member.verified && (
            <span className="ug-verified-badge"><Icons.Check /></span>
          )}
        </div>
        <span className="ug-member-mutual">{member.mutualFriends || ''}</span>
      </div>
      {isAdmin && member.id !== currentUser?.id && (
        <div className="ug-member-actions">
          <button className="ug-icon-btn" onClick={() => setShowMenu(!showMenu)}>
            <Icons.MoreHorizontal />
          </button>
          {showMenu && (
            <>
              <div className="ug-overlay" onClick={() => setShowMenu(false)} />
              <div className="ug-dropdown-menu ug-dropdown-right">
                {onRoleChange && member.role !== 'admin' && (
                  <>
                    {member.role !== 'moderator' && (
                      <button onClick={() => { onRoleChange(member.id, 'moderator'); setShowMenu(false); }}>
                        <Icons.Award /> Promouvoir modÃ©rateur
                      </button>
                    )}
                    {member.role === 'moderator' && (
                      <button onClick={() => { onRoleChange(member.id, 'member'); setShowMenu(false); }}>
                        <Icons.Award /> Retirer modÃ©rateur
                      </button>
                    )}
                  </>
                )}
                {onRemove && (
                  <button className="ug-dropdown-danger" onClick={() => { onRemove(member.id); setShowMenu(false); }}>
                    <Icons.X /> Retirer du groupe
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
      {!isAdmin && member.role === 'member' && (
        <div className="ug-member-actions">
          <button className="ug-member-add-btn"><Icons.UserPlus /></button>
        </div>
      )}
    </div>
  );
};

/* --- Event Item --- */
const EventItem = ({ event }) => (
  <div className="ug-event-item">
    <div className="ug-event-date">
      <span className="ug-event-month">
        {new Date(event.date).toLocaleDateString('fr-FR', { month: 'short' })}
      </span>
      <span className="ug-event-day">
        {new Date(event.date).getDate()}
      </span>
    </div>
    <div className="ug-event-info">
      <p className="ug-event-title">{event.title}</p>
      <p className="ug-event-time">
        {new Date(event.date).toLocaleDateString('fr-FR', {
          weekday: 'long',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </p>
      {event.location && (
        <p className="ug-event-location">
          <Icons.MapPin /> {event.location}
        </p>
      )}
      <div className="ug-event-interested">
        <div className="ug-event-avatars">
          {(event.interestedUsers || []).slice(0, 3).map((u, i) => (
            <img key={i} src={u.avatar} alt={u.name} className="ug-event-avatar" />
          ))}
        </div>
        <span>{event.interestedCount || 0} intÃ©ressÃ©s</span>
      </div>
    </div>
    <button className="ug-event-join-btn">IntÃ©ressÃ©(e)</button>
  </div>
);

/* --- Photo Grid Item --- */
const PhotoGrid = ({ photos }) => (
  <div className="ug-photo-grid">
    {photos.map((photo, idx) => (
      <div key={idx} className="ug-photo-item">
        <img src={photo.url} alt={photo.caption || ''} />
        <div className="ug-photo-overlay">
          <span className="ug-photo-likes"><Icons.Heart /> {photo.likes || 0}</span>
          {photo.caption && <span className="ug-photo-caption">{photo.caption}</span>}
        </div>
      </div>
    ))}
  </div>
);

/* --- File Item --- */
const FileItem = ({ file }) => (
  <div className="ug-file-item">
    <div className="ug-file-icon">
      {file.type === 'pdf' ? <Icons.FileText /> : <Icons.Folder />}
    </div>
    <div className="ug-file-info">
      <p className="ug-file-name">{file.name}</p>
      <p className="ug-file-meta">
        {file.size} · {formatTimeAgo(file.uploadedAt)} · par {file.uploadedBy}
      </p>
    </div>
    <button className="ug-file-download">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
    </button>
  </div>
);

/* ============================================
   Main Group Component
   ============================================ */
const UnifyGroup = forwardRef(function UnifyGroup(props, ref) {
  const {
    /* Group Data */
    group = {},
    currentUser = null,
    members = [],
    posts = [],
    events = [],
    photos = [],
    files = [],
    suggestedGroups = [],

    /* Config */
    className = '',
    showSuggestions = true,
    showOnlineMembers = true,
    showSearch = true,
    enablePolls = true,
    enableEvents = true,
    enablePhotos = true,
    enableFiles = true,
    loading = false,

    /* Callbacks */
    onJoin,
    onLeave,
    onPostCreate,
    onPostReaction,
    onPostComment,
    onCommentLike,
    onCommentReply,
    onPostSave,
    onPostDelete,
    onMemberRemove,
    onMemberRoleChange,
    onSearch,
    onTabChange,
    onNotificationToggle,
    onSettingsClick,
  } = props;

  /* --- State --- */
  const [activeTab, setActiveTab] = useState('discussion');
  const [isMember, setIsMember] = useState(group.isMember || false);
  const [showJoinOverlay, setShowJoinOverlay] = useState(false);
  const [showPostComposer, setShowPostComposer] = useState(false);
  const [postText, setPostText] = useState('');
  const [postImages, setPostImages] = useState([]);
  const [showMemberSearch, setShowMemberSearch] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberSort, setMemberSort] = useState('newest');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [localPosts, setLocalPosts] = useState(posts);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [showComposerTypeMenu, setShowComposerTypeMenu] = useState(false);
  const [composerType, setComposerType] = useState('post');
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharedPostId, setSharedPostId] = useState(null);
  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);
  // avatar supprimé : le groupe n'a qu'une couverture
  const [uploadModal, setUploadModal] = useState({ show: false, type: null });

  // Ajout automatique de la classe body.modal-open quand le modal d'upload est ouvert
  useEffect(() => {
    if (uploadModal && uploadModal.show) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [uploadModal && uploadModal.show]);
  const [selectedFile, setSelectedFile] = useState(null);
  // avatar supprimé : le groupe n'a qu'une couverture
  const [coverPreviewUrl, setCoverPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [localGroup, setLocalGroup] = useState(group);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    setLocalGroup(group);
  }, [group]);

  /* --- Derived data --- */
  const onlineMembers = useMemo(
    () => members.filter((m) => m.online),
    [members]
  );

  const filteredMembers = useMemo(() => {
    let filtered = [...members];
    if (memberSearch) {
      const q = memberSearch.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          (m.role && m.role.toLowerCase().includes(q))
      );
    }
    switch (memberSort) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt));
        break;
      case 'admin':
        filtered.sort((a, b) => {
          const order = { admin: 0, moderator: 1, member: 2 };
          return (order[a.role] || 2) - (order[b.role] || 2);
        });
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }
    return filtered;
  }, [members, memberSearch, memberSort]);

  const filteredPosts = useMemo(() => {
    let filtered = [...localPosts];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.content.toLowerCase().includes(q) ||
          p.author.name.toLowerCase().includes(q) ||
          (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'top':
        filtered.sort(
          (a, b) =>
            (b.reactions?.length || 0) +
            (b.comments?.length || 0) -
            ((a.reactions?.length || 0) + (a.comments?.length || 0))
        );
        break;
      default:
        break;
    }
    return filtered;
  }, [localPosts, searchQuery, sortBy]);

  const privacyInfo = PRIVACY_TYPES[group.privacy] || PRIVACY_TYPES.public;

  /* --- Imperative Handle --- */
  useImperativeHandle(ref, () => ({
    setActiveTab,
    createPost: (text) => {
      setPostText(text);
      setShowPostComposer(true);
    },
    getGroupData: () => group,
    getMembers: () => members,
    getPosts: () => localPosts,
    refreshPosts: () => setLocalPosts(posts),
  }));

  /* --- Callbacks (declared early) --- */
  const handleJoin = useCallback(() => {
    setIsMember(true);
    setShowJoinOverlay(false);
    onJoin?.();
  }, [onJoin]);

  const handleLeave = useCallback(() => {
    setIsMember(false);
    onLeave?.();
  }, [onLeave]);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  }, [onTabChange]);

  const handleCreatePost = useCallback(() => {
    if (!postText.trim() && postImages.length === 0) return;
    const newPost = {
      id: generateId(),
      author: currentUser || {
        id: 'me',
        name: 'Vous',
        avatar: '/api/placeholder/40/40',
        role: 'member',
      },
      content: postText.trim(),
      images: postImages.length > 0 ? postImages : undefined,
      reactions: [],
      comments: [],
      shares: 0,
      createdAt: new Date().toISOString(),
      saved: false,
      pinned: false,
    };
    setLocalPosts((prev) => [newPost, ...prev]);
    setPostText('');
    setPostImages([]);
    setShowPostComposer(false);
    setComposerType('post');
    onPostCreate?.(newPost);
  }, [postText, postImages, currentUser, onPostCreate]);

  const handlePostReaction = useCallback((postId, emoji) => {
    setLocalPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        if (!emoji) {
          return { ...post, userReaction: null, reactions: post.reactions.filter((r) => r !== post.userReaction) };
        }
        return {
          ...post,
          userReaction: emoji,
          reactions: post.userReaction
            ? [...post.reactions.filter((r) => r !== post.userReaction), emoji]
            : [...post.reactions, emoji],
        };
      })
    );
    onPostReaction?.(postId, emoji);
  }, [onPostReaction]);

  const handlePostComment = useCallback((postId, text) => {
    const newComment = {
      id: generateId(),
      author: currentUser || {
        id: 'me',
        name: 'Vous',
        avatar: '/api/placeholder/32/32',
        role: 'member',
      },
      text,
      likes: 0,
      liked: false,
      replies: [],
      createdAt: new Date().toISOString(),
    };
    setLocalPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        return { ...post, comments: [...(post.comments || []), newComment] };
      })
    );
    onPostComment?.(postId, newComment);
  }, [currentUser, onPostComment]);

  const handleCommentLike = useCallback((postId, commentId) => {
    setLocalPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        return {
          ...post,
          comments: post.comments.map((c) =>
            c.id === commentId
              ? { ...c, liked: !c.liked, likes: c.liked ? c.likes - 1 : c.likes + 1 }
              : c
          ),
        };
      })
    );
    onCommentLike?.(postId, commentId);
  }, [onCommentLike]);

  const handleCommentReply = useCallback((postId, commentId, text) => {
    const newReply = {
      id: generateId(),
      author: currentUser || {
        id: 'me',
        name: 'Vous',
        avatar: '/api/placeholder/32/32',
      },
      text,
      likes: 0,
      liked: false,
      createdAt: new Date().toISOString(),
    };
    setLocalPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        return {
          ...post,
          comments: post.comments.map((c) =>
            c.id === commentId
              ? { ...c, replies: [...(c.replies || []), newReply] }
              : c
          ),
        };
      })
    );
    onCommentReply?.(postId, commentId, newReply);
  }, [currentUser, onCommentReply]);

  const handleToggleSave = useCallback((postId) => {
    setLocalPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, saved: !post.saved } : post
      )
    );
    onPostSave?.(postId);
  }, [onPostSave]);

  const handleDeletePost = useCallback((postId) => {
    setLocalPosts((prev) => prev.filter((p) => p.id !== postId));
    onPostDelete?.(postId);
  }, [onPostDelete]);

  const handleSearch = useCallback((e) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch?.(query);
  }, [onSearch]);

  const handleImageUpload = useCallback((e) => {
    const files = Array.from(e.target.files || []);
    const newImages = files.map((f) => URL.createObjectURL(f));
    setPostImages((prev) => [...prev, ...newImages]);
  }, []);

  const removeImage = useCallback((index) => {
    setPostImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleNotificationToggle = useCallback(() => {
    setNotificationsEnabled((prev) => !prev);
    onNotificationToggle?.(!notificationsEnabled);
  }, [notificationsEnabled, onNotificationToggle]);

  const handleOpenUploadModal = useCallback((type) => {
    setUploadModal({ show: true, type });
    setUploadError('');
  }, []);

  const handleCloseUploadModal = useCallback(() => {
    setUploadModal({ show: false, type: null });
    setSelectedFile(null);
    setUploadError('');
  }, []);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Veuillez sélectionner une image');
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setCoverPreviewUrl(event.target.result);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadError('');
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const res = await fetch(`/api/groupes/${group.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateCover', cover: selectedFile.name })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la mise à jour');
      }
      const data = await res.json();
      setLocalGroup(prev => ({ ...prev, cover: data.groupe?.cover || '' }));
      handleCloseUploadModal();
    } catch (err) {
      setUploadError(err.message || 'Erreur lors de la mise à jour de l\'image');
    } finally {
      setUploading(false);
    }
  }, [selectedFile, group.id, handleCloseUploadModal]);

  /* --- Render --- */
  if (loading) {
    return <GroupPageSkeleton />;
  }

  return (
	<div className={`ug-container ${className}`}>
	  {/* ====== GROUP COVER ====== */}
	  <div className="ug-cover">
    <div className="ug-cover-image" style={{ backgroundImage: `url(${localGroup.cover || 'https://picsum.photos/seed/group-cover/1200/350'})` }}>
		  <div className="ug-cover-gradient" />
          {currentUser?.role === 'admin' && !uploadModal.show && (
            <button
              className="ug-cover-edit-btn"
              style={{ position: 'absolute', top: 16, right: 16, zIndex: 2, background: '#fff', border: 'none', borderRadius: '50%', padding: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer' }}
              onClick={() => handleOpenUploadModal('cover')}
              title="Changer la couverture"
            >
              <Icons.Camera />
            </button>
          )}
		</div>
	  </div>

      {/* ====== GROUP INFO BAR ====== */}
      <div className="ug-info-bar">
        <div className="ug-info-left">
          {/* Avatar supprimé : le groupe n'a qu'une couverture */}

                {/* ====== UPLOAD MODAL (ALWAYS RENDERED AT ROOT) ====== */}
                {uploadModal.show && typeof window !== 'undefined' && createPortal(
                  <div className="ug-modal-overlay" onClick={handleCloseUploadModal}>
                    <div className="ug-modal" onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: 24, minWidth: 320, maxWidth: 420, width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
                          Modifier la couverture
                        </h2>
                        <button className="ug-icon-btn" onClick={handleCloseUploadModal} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                          <Icons.X />
                        </button>
                      </div>
                      <div style={{ marginBottom: 20, textAlign: 'center' }}>
                        <div style={{ width: '100%', height: 150, borderRadius: 12, overflow: 'hidden', background: '#f5f7fa' }}>
                          {coverPreviewUrl || localGroup.cover ? (
                            <img src={coverPreviewUrl || localGroup.cover} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <Icons.Image />
                          )}
                        </div>
                      </div>
                      <input
                        ref={coverInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                      />
                      <div style={{ marginBottom: 16 }}>
                        <button
                          onClick={() => coverInputRef.current?.click()}
                          style={{ width: '100%', padding: '12px 20px', borderRadius: 8, background: '#f5f7fa', border: '1px solid #d1d5db', color: '#1e293b', fontWeight: 600, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                        >
                          <Icons.Camera />
                          Choisir une image
                        </button>
                      </div>
                      {uploadError && (
                        <div style={{ color: '#dc2626', marginBottom: 16, fontSize: 14, textAlign: 'center' }}>{uploadError}</div>
                      )}
                      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                        <button
                          onClick={handleCloseUploadModal}
                          disabled={uploading}
                          style={{ padding: '10px 20px', borderRadius: 8, background: '#f5f7fa', color: '#1e293b', border: '1px solid #d1d5db', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}
                        >
                          Annuler
                        </button>
                        <button
                          onClick={handleUpload}
                          disabled={uploading || !selectedFile}
                          style={{ padding: '10px 24px', borderRadius: 8, background: uploading || !selectedFile ? '#94a3b8' : 'linear-gradient(90deg,#2563eb,#1e40af)', color: '#fff', border: 'none', fontWeight: 700, fontSize: 15, cursor: uploading || !selectedFile ? 'not-allowed' : 'pointer' }}
                        >
                          {uploading ? 'Envoi...' : 'Enregistrer'}
                        </button>
                      </div>
                    </div>
                  </div>,
                  document.body
                )}
          <div className="ug-group-details">
            <div className="ug-group-name-row">
              <h1 className="ug-group-name">{group.name || 'Mon Groupe'}</h1>
              {group.verified && (
                <span className="ug-verified-badge ug-verified-lg">
                  <Icons.Check />
                </span>
              )}
            </div>
            <div className="ug-group-meta">
              <span className="ug-privacy-badge">
                {privacyInfo.icon} {privacyInfo.label}
              </span>
              {group.membersCount > 0 && <span className="ug-meta-sep">·</span>}
              {group.membersCount > 0 && (
                <span className="ug-members-count">
                  <Icons.Users /> {formatNumber(group.membersCount)} membres
                </span>
              )}
              <span className="ug-meta-sep">·</span>
              <span className="ug-posts-count">
                {formatNumber(group.postsPerDay || 15)} publications / jour
              </span>
            </div>
          </div>
        </div>
        <div className="ug-info-right">
          <div className="ug-info-actions" style={{display:'flex',gap:14,alignItems:'center',background:'#f5f7fa',borderRadius:12,padding:'10px 22px',boxShadow:'0 2px 8px rgba(30,41,59,0.07)'}}>
            <button
              className="ug-icon-btn"
              onClick={handleNotificationToggle}
              title={notificationsEnabled ? 'Désactiver les notifications' : 'Activer les notifications'}
              style={{background:notificationsEnabled?'#2563eb':'#fff',color:notificationsEnabled?'#fff':'#1e293b',border:'none',borderRadius:8,padding:10,fontSize:20,cursor:'pointer',transition:'background 0.2s'}}
            >
              <Icons.Bell />
            </button>

            <button className="ug-icon-btn" onClick={() => {}} title="Rechercher" style={{background:'#fff',color:'#1e293b',border:'none',borderRadius:8,padding:10,fontSize:20,cursor:'pointer'}}>
              <Icons.Search />
            </button>

            {currentUser?.role === 'admin' && (
              <button className="ug-icon-btn" onClick={onSettingsClick} title="Paramètres du groupe" style={{background:'#fff',color:'#2563eb',border:'none',borderRadius:8,padding:10,fontSize:20,cursor:'pointer'}}>
                <Icons.Settings />
              </button>
            )}

            {!isMember ? (
              <button className="ug-join-btn ug-join-btn-primary" onClick={handleJoin} style={{background:'linear-gradient(90deg,#2563eb,#1e40af)',color:'#fff',border:'none',borderRadius:8,padding:'10px 22px',fontWeight:700,display:'flex',alignItems:'center',gap:8,boxShadow:'0 2px 8px rgba(37,99,235,0.08)',fontSize:16,cursor:'pointer'}}>
                <Icons.UserPlus />
                <span>Rejoindre le groupe</span>
              </button>
            ) : (
              <button className="ug-join-btn ug-join-btn-joined" onClick={handleLeave} style={{background:'#1e293b',color:'#fff',border:'none',borderRadius:8,padding:'10px 22px',fontWeight:700,display:'flex',alignItems:'center',gap:8,boxShadow:'0 2px 8px rgba(30,41,59,0.08)',fontSize:16,cursor:'pointer'}}>
                <Icons.Check />
                <span>Membre</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ====== TABS NAVIGATION ====== */}
      <nav className="ug-tabs">
        <div className="ug-tabs-inner">
          {TABS.map((tab) => {
            const showTab =
              (tab.id === 'events' && enableEvents) ||
              (tab.id === 'photos' && enablePhotos) ||
              (tab.id === 'files' && enableFiles) ||
              ['discussion', 'members', 'about'].includes(tab.id);

            if (!showTab) return null;

            const getTabIcon = () => {
              switch(tab.id) {
                case 'discussion': return <Icons.Comment />;
                case 'members': return <Icons.Users />;
                case 'events': return <Icons.Calendar />;
                case 'photos': return <Icons.Image />;
                case 'files': return <Icons.Folder />;
                case 'about': return <Icons.Info />;
                default: return null;
              }
            };

            return (
              <button
                key={tab.id}
                className={`ug-tab ${activeTab === tab.id ? 'is-active' : ''}`}
                onClick={() => handleTabChange(tab.id)}
              >
                <span className="ug-tab-icon">{getTabIcon()}</span>
                <span className="ug-tab-label">{tab.label}</span>
                {tab.id === 'members' && members.length > 0 && (
                  <span className="ug-tab-count">{formatNumber(members.length)}</span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ====== MAIN CONTENT ====== */}
      <div className="ug-main">
        {/* Content Area */}
        <div className="ug-content">
          {/* ---- DISCUSSION TAB ---- */}
          {activeTab === 'discussion' && (
            <div className="ug-discussion">
              {/* Search & Sort Bar */}
              {showSearch && (
                <div className="ug-search-bar">
                  <div className="ug-search-input">
                    <Icons.Search />
                    <input
                      type="text"
                      placeholder="Rechercher dans le groupe..."
                      value={searchQuery}
                      onChange={handleSearch}
                    />
                    {searchQuery && (
                      <button className="ug-search-clear" onClick={() => setSearchQuery('')}>
                        <Icons.X />
                      </button>
                    )}
                  </div>
                  <div className="ug-search-actions">
                    <div className="ug-sort-dropdown">
                      <button className="ug-sort-btn" onClick={() => setSortBy(sortBy === 'recent' ? 'top' : 'recent')}>
                        <Icons.Sort />
                        <span>{sortBy === 'recent' ? 'Plus rÃ©cent' : 'Plus populaires'}</span>
                        <Icons.ChevronDown />
                      </button>
                    </div>
                    <button className="ug-filter-btn">
                      <Icons.Filter />
                      <span className="ug-filter-label">Filtres</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Post Composer */}
              {isMember && (
                <div className="ug-composer">
                  {!showPostComposer ? (
                    <div className="ug-composer-collapsed" onClick={() => setShowPostComposer(true)}>
                      <div className="ug-composer-avatar">
                        <img src={currentUser?.avatar || '/api/placeholder/40/40'} alt="" />
                      </div>
                      <span className="ug-composer-placeholder">
                        Publier quelque chose dans {group.name || 'ce groupe'}...
                      </span>
                    </div>
                  ) : (
                    <div className="ug-composer-expanded">
                      <div className="ug-composer-header">
                        <div className="ug-composer-avatar">
                          <img src={currentUser?.avatar || '/api/placeholder/40/40'} alt="" />
                        </div>
                        <div className="ug-composer-type">
                          <button
                            className={`ug-composer-type-btn ${composerType === 'post' ? 'is-active' : ''}`}
                            onClick={() => setComposerType('post')}
                          >
                            <Icons.Edit /> Publication
                          </button>
                          {enablePolls && (
                            <button
                              className={`ug-composer-type-btn ${composerType === 'poll' ? 'is-active' : ''}`}
                              onClick={() => setComposerType('poll')}
                            >
                              <Icons.Poll /> Sondage
                            </button>
                          )}
                          {enableEvents && (
                            <button
                              className={`ug-composer-type-btn ${composerType === 'event' ? 'is-active' : ''}`}
                              onClick={() => setComposerType('event')}
                            >
                              <Icons.Calendar /> Ã‰vÃ©nement
                            </button>
                          )}
                          <button
                            className={`ug-composer-type-btn ${composerType === 'announcement' ? 'is-active' : ''}`}
                            onClick={() => setComposerType('announcement')}
                          >
                            <Icons.Flag /> Annonce
                          </button>
                        </div>
                        <button className="ug-composer-close" onClick={() => { setShowPostComposer(false); setPostText(''); setPostImages([]); setComposerType('post'); }}>
                          <Icons.X />
                        </button>
                      </div>

                      <textarea
                        className="ug-composer-textarea"
                        placeholder={`Qu'avez-vous en tÃªte, ${currentUser?.name?.split(' ')[0] || ''} ?`}
                        value={postText}
                        onChange={(e) => setPostText(e.target.value)}
                        autoFocus
                        rows={3}
                      />

                      {/* Image Previews */}
                      {postImages.length > 0 && (
                        <div className="ug-composer-images">
                          {postImages.map((img, idx) => (
                            <div key={idx} className="ug-composer-image-preview">
                              <img src={img} alt="" />
                              <button className="ug-composer-image-remove" onClick={() => removeImage(idx)}>
                                <Icons.X />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="ug-composer-footer">
                        <div className="ug-composer-tools">
                          <button className="ug-composer-tool" onClick={() => fileInputRef.current?.click()}>
                            <Icons.Image />
                            <span>Photo/VidÃ©o</span>
                          </button>
                          <button className="ug-composer-tool">
                            <Icons.Tag />
                            <span>Taguer</span>
                          </button>
                          <button className="ug-composer-tool">
                            <Icons.Smile />
                            <span>Humeur</span>
                          </button>
                          <button className="ug-composer-tool">
                            <Icons.MapPin />
                            <span>Lieu</span>
                          </button>
                          <button className="ug-composer-tool">
                            <Icons.Link />
                            <span>Lien</span>
                          </button>
                          <button className="ug-composer-tool">
                            <Icons.Gift />
                            <span>Cadeau</span>
                          </button>
                        </div>
                        <div className="ug-composer-submit">
                          <select className="ug-composer-visibility">
                            <option>ðŸŒ Tous les membres</option>
                            <option>ðŸ”’ Admins uniquement</option>
                          </select>
                          <button
                            className="ug-composer-publish"
                            onClick={handleCreatePost}
                            disabled={!postText.trim() && postImages.length === 0}
                          >
                            Publier
                          </button>
                        </div>
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        style={{ display: 'none' }}
                        onChange={handleImageUpload}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Posts Feed */}
              <div className="ug-feed">
                {!isMember && (
                  <div className="ug-join-prompt">
                    <div className="ug-join-prompt-icon">
                      <Icons.Users />
                    </div>
                    <h3>Rejoignez ce groupe pour voir les publications</h3>
                    <p>
                      {group.description
                        ? group.description.substring(0, 150) + '...'
                        : 'DÃ©couvrez des discussions intÃ©ressantes et partagez avec la communautÃ©.'}
                    </p>
                    <button className="ug-join-btn ug-join-btn-primary" onClick={handleJoin}>
                      <Icons.UserPlus />
                      <span>Rejoindre le groupe</span>
                    </button>
                  </div>
                )}

                {isMember && filteredPosts.length === 0 && (
                  <div className="ug-empty-state">
                    <div className="ug-empty-icon">ðŸ’¬</div>
                    <h3>Aucune publication pour le moment</h3>
                    <p>Soyez le premier Ã  publier dans ce groupe !</p>
                  </div>
                )}

                {isMember && filteredPosts.map((post) => (
                  <PostItem
                    key={post.id}
                    post={post}
                    currentUser={currentUser}
                    onReaction={handlePostReaction}
                    onComment={handlePostComment}
                    onLikeComment={handleCommentLike}
                    onReplyComment={handleCommentReply}
                    onToggleSave={handleToggleSave}
                    onDelete={handleDeletePost}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ---- MEMBERS TAB ---- */}
          {activeTab === 'members' && (
            <div className="ug-members-panel">
              <div className="ug-members-header">
                <h2 className="ug-members-title">
                  <Icons.Users /> Membres
                </h2>
                <div className="ug-members-controls">
                  <div className="ug-member-search">
                    <Icons.Search />
                    <input
                      type="text"
                      placeholder="Rechercher des membres..."
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                    />
                  </div>
                  <div className="ug-member-filter">
                    <button className="ug-sort-btn">
                      <Icons.Sort />
                      <select
                        value={memberSort}
                        onChange={(e) => setMemberSort(e.target.value)}
                      >
                        <option value="newest">Plus rÃ©cents</option>
                        <option value="admin">Admins d'abord</option>
                        <option value="name">Par nom</option>
                      </select>
                    </button>
                  </div>
                </div>
              </div>

              {/* Online Members */}
              {showOnlineMembers && onlineMembers.length > 0 && (
                <div className="ug-online-section">
                  <h3 className="ug-section-title">
                    <span className="ug-online-indicator" />
                    En ligne â€” {onlineMembers.length}
                  </h3>
                  <div className="ug-members-online-list">
                    {onlineMembers.map((member) => (
                      <div key={member.id} className="ug-member-online-chip">
                        <div className="ug-member-avatar-sm">
                          <img src={member.avatar} alt={member.name} />
                          <span className="ug-online-dot ug-online-dot-sm" />
                        </div>
                        <span className="ug-member-name-sm">{member.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All Members */}
              <div className="ug-section-title">
                <h3>Tous les membres</h3>
                <span className="ug-members-total">{filteredMembers.length}</span>
              </div>
              <div className="ug-members-list">
                {filteredMembers.map((member) => (
                  <MemberItem
                    key={member.id}
                    member={member}
                    currentUser={currentUser}
                    onRemove={onMemberRemove}
                    onRoleChange={onMemberRoleChange}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ---- EVENTS TAB ---- */}
          {activeTab === 'events' && (
            <div className="ug-events-panel">
              <div className="ug-events-header">
                <h2 className="ug-events-title">
                  <Icons.Calendar /> Ã‰vÃ©nements
                </h2>
                {isMember && currentUser?.role === 'admin' && (
                  <button className="ug-create-event-btn">
                    <Icons.Plus /> CrÃ©er un Ã©vÃ©nement
                  </button>
                )}
              </div>

              {events.length === 0 ? (
                <div className="ug-empty-state">
                  <div className="ug-empty-icon">ðŸ“…</div>
                  <h3>Aucun Ã©vÃ©nement Ã  venir</h3>
                  <p>CrÃ©ez le premier Ã©vÃ©nement pour ce groupe !</p>
                </div>
              ) : (
                <div className="ug-events-list">
                  {events.map((event, idx) => (
                    <EventItem key={idx} event={event} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ---- PHOTOS TAB ---- */}
          {activeTab === 'photos' && (
            <div className="ug-photos-panel">
              <div className="ug-photos-header">
                <h2 className="ug-photos-title">
                  <Icons.Image /> Photos
                </h2>
                <div className="ug-photos-actions">
                  <button className={`ug-photos-view-btn ${true ? 'is-active' : ''}`}>
                    <Icons.Grid />
                  </button>
                  <button className="ug-photos-view-btn">
                    <Icons.List />
                  </button>
                </div>
              </div>

              {photos.length === 0 ? (
                <div className="ug-empty-state">
                  <div className="ug-empty-icon">ðŸ–¼ï¸</div>
                  <h3>Aucune photo partagÃ©e</h3>
                  <p>Partagez la premiÃ¨re photo dans ce groupe !</p>
                </div>
              ) : (
                <PhotoGrid photos={photos} />
              )}
            </div>
          )}

          {/* ---- FILES TAB ---- */}
          {activeTab === 'files' && (
            <div className="ug-files-panel">
              <div className="ug-files-header">
                <h2 className="ug-files-title">
                  <Icons.Folder /> Fichiers
                </h2>
                {isMember && (
                  <button className="ug-upload-file-btn">
                    <Icons.Plus /> Ajouter un fichier
                  </button>
                )}
              </div>

              {files.length === 0 ? (
                <div className="ug-empty-state">
                  <div className="ug-empty-icon">ðŸ“</div>
                  <h3>Aucun fichier partagÃ©</h3>
                  <p>Partagez le premier fichier dans ce groupe !</p>
                </div>
              ) : (
                <div className="ug-files-list">
                  {files.map((file, idx) => (
                    <FileItem key={idx} file={file} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ---- ABOUT TAB ---- */}
          {activeTab === 'about' && (
            <div className="ug-about-panel">
              <div className="ug-about-header">
                <h2 className="ug-about-title">
                  <Icons.Users /> A propos
                </h2>
              </div>

              <div className="ug-about-content">
                <div className="ug-about-section">
                  <h3 className="ug-about-section-title">Description</h3>
                  <p className="ug-about-description">
                    {group.description || 'Aucune description fournie pour ce groupe.'}
                  </p>
                </div>

                <div className="ug-about-section">
                  <h3 className="ug-about-section-title">Informations gÃ©nÃ©rales</h3>
                  <div className="ug-about-info-grid">
                    <div className="ug-about-info-item">
                      <Icons.Globe />
                      <div>
                        <span className="ug-about-label">VisibilitÃ©</span>
                        <span className="ug-about-value">{privacyInfo.icon} {privacyInfo.label}</span>
                      </div>
                    </div>
                    <div className="ug-about-info-item">
                      <Icons.Users />
                      <div>
                        <span className="ug-about-label">Membres</span>
                        <span className="ug-about-value">{formatNumber(group.membersCount || members.length)}</span>
                      </div>
                    </div>
                    <div className="ug-about-info-item">
                      <Icons.Calendar />
                      <div>
                        <span className="ug-about-label">CrÃ©Ã© le</span>
                        <span className="ug-about-value">
                          {group.createdAt
                            ? new Date(group.createdAt).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })
                            : 'Date inconnue'}
                        </span>
                      </div>
                    </div>
                    {group.location && (
                      <div className="ug-about-info-item">
                        <Icons.MapPin />
                        <div>
                          <span className="ug-about-label">Lieu</span>
                          <span className="ug-about-value">{group.location}</span>
                        </div>
                      </div>
                    )}
                    {group.category && (
                      <div className="ug-about-info-item">
                        <Icons.Tag />
                        <div>
                          <span className="ug-about-label">CatÃ©gorie</span>
                          <span className="ug-about-value">{group.category}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {group.rules && group.rules.length > 0 && (
                  <div className="ug-about-section">
                    <h3 className="ug-about-section-title">
                      <Icons.Flag /> RÃ¨gles du groupe
                    </h3>
                    <div className="ug-rules-list">
                      {group.rules.map((rule, idx) => (
                        <div key={idx} className="ug-rule-item">
                          <span className="ug-rule-number">{idx + 1}</span>
                          <p className="ug-rule-text">{rule}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Admins section */}
                <div className="ug-about-section">
                  <h3 className="ug-about-section-title">Admins</h3>
                  <div className="ug-admins-list">
                    {members
                      .filter((m) => m.role === 'admin' || m.role === 'moderator')
                      .map((admin) => (
                        <div key={admin.id} className="ug-admin-item">
                          <div className="ug-admin-avatar">
                            <img src={admin.avatar} alt={admin.name} />
                            {admin.online && <span className="ug-online-dot" />}
                          </div>
                          <div className="ug-admin-info">
                            <span className="ug-admin-name">{admin.name}</span>
                            <span className="ug-admin-role" style={{ color: ROLES[admin.role]?.color }}>
                              {ROLE_ICONS[admin.role]} {ROLES[admin.role]?.label}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ====== RIGHT SIDEBAR ====== */}
        {showSuggestions && (
          <aside className="ug-sidebar">
            {/* Group Description */}
            <div className="ug-sidebar-card">
              <h3 className="ug-sidebar-title">A propos</h3>
              <p className="ug-sidebar-description">
                {group.description
                  ? group.description.length > 120
                    ? group.description.substring(0, 120) + '...'
                    : group.description
                  : 'Aucune description disponible.'}
              </p>
            </div>

            {/* Online Members */}
            {showOnlineMembers && onlineMembers.length > 0 && (
              <div className="ug-sidebar-card">
                <h3 className="ug-sidebar-title">
                  <span className="ug-online-indicator" />
                  Membres en ligne
                </h3>
                <div className="ug-sidebar-online">
                  {onlineMembers.slice(0, 6).map((member) => (
                    <div key={member.id} className="ug-sidebar-member">
                      <div className="ug-sidebar-member-avatar">
                        <img src={member.avatar} alt={member.name} />
                        <span className="ug-online-dot" />
                      </div>
                      <span className="ug-sidebar-member-name">{member.name}</span>
                    </div>
                  ))}
                  {onlineMembers.length > 6 && (
                    <button
                      className="ug-sidebar-see-all"
                      onClick={() => handleTabChange('members')}
                    >
                      Voir tout ({onlineMembers.length})
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Group Stats */}
            <div className="ug-sidebar-card">
              <h3 className="ug-sidebar-title">
                <Icons.BarChart /> Statistiques
              </h3>
              <div className="ug-sidebar-stats">
                <div className="ug-stat-item">
                  <span className="ug-stat-number">{formatNumber(members.length)}</span>
                  <span className="ug-stat-label">Membres</span>
                </div>
                <div className="ug-stat-item">
                  <span className="ug-stat-number">{formatNumber(localPosts.length)}</span>
                  <span className="ug-stat-label">Publications</span>
                </div>
                <div className="ug-stat-item">
                  <span className="ug-stat-number">{formatNumber(group.postsPerDay || 15)}/j</span>
                  <span className="ug-stat-label">ActivitÃ©</span>
                </div>
              </div>
            </div>

            {/* Suggested Groups */}
            {suggestedGroups.length > 0 && (
              <div className="ug-sidebar-card">
                <h3 className="ug-sidebar-title">Groupes suggÃ©rÃ©s</h3>
                <div className="ug-suggested-groups">
                  {suggestedGroups.map((sg, idx) => (
                    <div key={idx} className="ug-suggested-group">
                      <div
                        className="ug-suggested-group-avatar"
                        style={{ backgroundImage: `url(${sg.avatar})` }}
                      />
                      <div className="ug-suggested-group-info">
                        <p className="ug-suggested-group-name">{sg.name}</p>
                        <p className="ug-suggested-group-members">
                          <Icons.Users /> {formatNumber(sg.membersCount)} membres
                        </p>
                      </div>
                      <button className="ug-join-btn-sm">Rejoindre</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* ====== SHARE MODAL ====== */}
      {showShareModal && (
        <div className="ug-modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="ug-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ug-modal-header">
              <h2>Partager la publication</h2>
              <button className="ug-icon-btn" onClick={() => setShowShareModal(false)}>
                <Icons.X />
              </button>
            </div>
            <div className="ug-modal-body">
              <div className="ug-share-options">
                <button className="ug-share-option" style={{ '--share-color': '#003d5c' }}>
                  <span className="ug-share-icon">ðŸ“˜</span>
                  <span>Partager sur Facebook</span>
                </button>
                <button className="ug-share-option" style={{ '--share-color': '#1DA1F2' }}>
                  <span className="ug-share-icon">ðŸ¦</span>
                  <span>Partager sur Twitter</span>
                </button>
                <button className="ug-share-option" style={{ '--share-color': '#25D366' }}>
                  <span className="ug-share-icon">ðŸ’¬</span>
                  <span>Partager sur WhatsApp</span>
                </button>
                <button className="ug-share-option" style={{ '--share-color': '#0077B5' }}>
                  <span className="ug-share-icon">ðŸ’¼</span>
                  <span>Partager sur LinkedIn</span>
                </button>
                <button className="ug-share-option" style={{ '--share-color': '#FF4500' }}>
                  <span className="ug-share-icon">ðŸ”´</span>
                  <span>Partager sur Reddit</span>
                </button>
                <button className="ug-share-option" style={{ '--share-color': '#65676B' }}>
                  <span className="ug-share-icon">ðŸ”—</span>
                  <span>Copier le lien</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default UnifyGroup;


