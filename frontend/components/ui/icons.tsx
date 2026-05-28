"use client";
import React from "react";
import { C } from "@/utils/constants";

interface SvgProps {
  w?: number;
  h?: number;
  vb?: string;
  ch: React.ReactNode;
  style?: React.CSSProperties;
}

export const Svg = ({ w = 24, h = 24, vb = "0 0 24 24", ch, style = {} }: SvgProps) => (
  <svg
    width={w} height={h} viewBox={vb} fill="none"
    strokeLinecap="round" strokeLinejoin="round" style={style}
  >
    {ch}
  </svg>
);

/* ── Nav icons ─────────────────────────────────────────── */
export const HomeIc = ({ a }: { a: boolean }) => (
  <Svg w={22} h={22} ch={
    <>
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
        stroke={a ? C.primary : C.gray} strokeWidth={2} />
      <polyline points="9,22 9,12 15,12 15,22"
        stroke={a ? C.primary : C.gray} strokeWidth={2} />
    </>
  } />
);

export const StoreIc = ({ a }: { a: boolean }) => (
  <Svg w={22} h={22} ch={
    <>
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"
        stroke={a ? C.primary : C.gray} strokeWidth={2} />
      <line x1="3" y1="6" x2="21" y2="6"
        stroke={a ? C.primary : C.gray} strokeWidth={2} />
      <path d="M16 10a4 4 0 01-8 0"
        stroke={a ? C.primary : C.gray} strokeWidth={2} />
    </>
  } />
);

export const LiveIc = ({ a }: { a: boolean }) => (
  <Svg w={22} h={22} ch={
    <>
      <circle cx="12" cy="12" r="2" fill={a ? C.primary : C.gray} />
      <path d="M16.24 7.76a6 6 0 010 8.49M7.76 16.24a6 6 0 010-8.49"
        stroke={a ? C.primary : C.gray} strokeWidth={2} />
      <path d="M19.07 4.93a10 10 0 010 14.14M4.93 19.07a10 10 0 010-14.14"
        stroke={a ? C.primary : C.gray} strokeWidth={2} />
    </>
  } />
);

export const UserIc = ({ a }: { a: boolean }) => (
  <Svg w={22} h={22} ch={
    <>
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
        stroke={a ? C.primary : C.gray} strokeWidth={2} />
      <circle cx="12" cy="7" r="4"
        stroke={a ? C.primary : C.gray} strokeWidth={2} />
    </>
  } />
);

/* ── Action icons ──────────────────────────────────────── */
export const PlayIc = ({ sz = 24, col = "#fff" }: { sz?: number; col?: string }) => (
  <Svg w={sz} h={sz} ch={<polygon points="5,3 19,12 5,21" fill={col} />} />
);

export const HeartIc = ({
  filled, col = "#EF4444", sz = 24,
}: { filled?: boolean; col?: string; sz?: number }) => (
  <Svg w={sz} h={sz} ch={
    <path
      d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
      stroke={col} fill={filled ? col : "none"} strokeWidth={2}
    />
  } />
);

export const ChatIc = ({ col = "#fff", sz = 24 }: { col?: string; sz?: number }) => (
  <Svg w={sz} h={sz} ch={
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
      stroke={col} strokeWidth={2} />
  } />
);

export const BookIc = ({
  filled, col = "#fff", sz = 24,
}: { filled?: boolean; col?: string; sz?: number }) => (
  <Svg w={sz} h={sz} ch={
    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"
      stroke={col} fill={filled ? col : "none"} strokeWidth={2} />
  } />
);

export const BellIc = ({ col = C.dark }: { col?: string }) => (
  <Svg w={22} h={22} ch={
    <>
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"
        stroke={col} strokeWidth={2} />
      <path d="M13.73 21a2 2 0 01-3.46 0" stroke={col} strokeWidth={2} />
    </>
  } />
);

export const SearchIc = ({ col = C.grayLight, sz = 18 }: { col?: string; sz?: number }) => (
  <Svg w={sz} h={sz} ch={
    <>
      <circle cx="11" cy="11" r="8" stroke={col} strokeWidth={2} />
      <line x1="21" y1="21" x2="16.65" y2="16.65" stroke={col} strokeWidth={2} />
    </>
  } />
);

export const ChevDIc = ({ col = "rgba(255,255,255,0.85)" }: { col?: string }) => (
  <Svg w={18} h={18} ch={
    <polyline points="6,9 12,15 18,9" stroke={col} strokeWidth={2.5} />
  } />
);

export const TrendIc = ({ col = "#fff", sz = 11 }: { col?: string; sz?: number }) => (
  <Svg w={sz} h={sz} ch={
    <>
      <polyline points="23,6 13.5,15.5 8.5,10.5 1,18" stroke={col} strokeWidth={2} />
      <polyline points="17,6 23,6 23,12" stroke={col} strokeWidth={2} />
    </>
  } />
);

export const StarIc = () => (
  <Svg w={13} h={13} ch={
    <polygon
      points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
      fill="#F59E0B" stroke="#F59E0B" strokeWidth={1}
    />
  } />
);

export const PinIc = ({ col = C.gray }: { col?: string }) => (
  <Svg w={13} h={13} ch={
    <>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"
        stroke={col} strokeWidth={2} />
      <circle cx="12" cy="10" r="3" stroke={col} strokeWidth={2} />
    </>
  } />
);

export const PeopleIc = ({ col = C.gray, sz = 13 }: { col?: string; sz?: number }) => (
  <Svg w={sz} h={sz} ch={
    <>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke={col} strokeWidth={2} />
      <circle cx="9" cy="7" r="4" stroke={col} strokeWidth={2} />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
        stroke={col} strokeWidth={2} />
    </>
  } />
);

export const EditIc = ({ col = C.dark }: { col?: string }) => (
  <Svg w={14} h={14} ch={
    <>
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
        stroke={col} strokeWidth={2} />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4z"
        stroke={col} strokeWidth={2} />
    </>
  } />
);

export const GearIc = ({ col = C.dark }: { col?: string }) => (
  <Svg w={16} h={16} ch={
    <>
      <circle cx="12" cy="12" r="3" stroke={col} strokeWidth={2} />
      <path
        d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
        stroke={col} strokeWidth={2}
      />
    </>
  } />
);

export const ImgIc = () => (
  <Svg w={46} h={46} ch={
    <>
      <rect x="3" y="3" width="18" height="18" rx="2"
        stroke="#C4C4C4" strokeWidth={1.5} />
      <circle cx="8.5" cy="8.5" r="1.5" stroke="#C4C4C4" strokeWidth={1.5} />
      <polyline points="21,15 16,10 5,21" stroke="#C4C4C4" strokeWidth={1.5} />
    </>
  } />
);

export const VolIc = ({
  muted, col = "#fff", sz = 18,
}: { muted?: boolean; col?: string; sz?: number }) =>
  muted ? (
    <Svg w={sz} h={sz} ch={
      <>
        <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" fill={col} />
        <line x1="23" y1="9" x2="17" y2="15" stroke={col} strokeWidth={2} />
        <line x1="17" y1="9" x2="23" y2="15" stroke={col} strokeWidth={2} />
      </>
    } />
  ) : (
    <Svg w={sz} h={sz} ch={
      <>
        <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" fill={col} />
        <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"
          stroke={col} strokeWidth={2} />
      </>
    } />
  );

export const ShareIc = ({ col = "#fff", sz = 24 }: { col?: string; sz?: number }) => (
  <Svg w={sz} h={sz} ch={
    <>
      <circle cx="18" cy="5" r="3" stroke={col} strokeWidth={2} />
      <circle cx="6" cy="12" r="3" stroke={col} strokeWidth={2} />
      <circle cx="18" cy="19" r="3" stroke={col} strokeWidth={2} />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke={col} strokeWidth={2} />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke={col} strokeWidth={2} />
    </>
  } />
);
