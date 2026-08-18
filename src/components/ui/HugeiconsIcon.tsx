import React from "react";
import { cn } from "@/lib/utils";

export interface HugeiconsIconProps extends React.SVGProps<SVGSVGElement> {
  icon: string;
  size?: number | string;
  strokeWidth?: number;
  className?: string;
  color?: string;
}

/**
 * High-quality Stroke-Rounded SVG Icons matching https://hugeicons.com/icons/stroke-rounded
 * Uses stroke-linecap="round" and stroke-linejoin="round" with custom stroke width.
 * All icons are pure SVG vectors (not selectable text glyphs).
 */
const ICONS: Record<string, (props: { strokeWidth: number }) => React.ReactNode> = {
  // AI & Magic / Sparkles
  "ai-beautify": ({ strokeWidth }) => (
    <>
      <path d="M21.0039 21L9.00391 9" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.00391 3V5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.00391 13V15" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 9.00586L13 9.00586" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 9.00586L3 9.00586" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.0041 5L11.8242 6.17984" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.16748 11.8359L5.00391 13.0005" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.16797 6.17969L5.00391 5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "ai-refine": ({ strokeWidth }) => (
    <>
      <path d="M19.5 3.9375V5.5M19.5 5.5V7.0625M19.5 5.5H18.25M19.5 5.5H20.75M22 5.5L20.9156 5.13852C20.4179 4.97263 20.0274 4.58211 19.8615 4.08443L19.5 3L19.1385 4.08443C18.9726 4.58211 18.5821 4.97263 18.0844 5.13852L17 5.5L18.0844 5.86148C18.5821 6.02737 18.9726 6.41789 19.1385 6.91557L19.5 8L19.8615 6.91557C20.0274 6.41789 20.4179 6.02737 20.9156 5.86148L22 5.5Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 12.8598C4.81875 10.0939 11.44 4.44194 13.275 6.40605C15.5938 8.88796 3.40937 15.1646 5.28854 17.93C7.2734 20.851 14.2146 10.5543 16.5635 12.3982C18.9125 14.2422 10.926 18.391 12.8052 20.696C13.5569 21.6179 15.6239 20.235 16.5635 19.313" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "ai-magic": ({ strokeWidth }) => (
    <>
      <path d="M19.5 3.9375V5.5M19.5 5.5V7.0625M19.5 5.5H18.25M19.5 5.5H20.75M22 5.5L20.9156 5.13852C20.4179 4.97263 20.0274 4.58211 19.8615 4.08443L19.5 3L19.1385 4.08443C18.9726 4.58211 18.5821 4.97263 18.0844 5.13852L17 5.5L18.0844 5.86148C18.5821 6.02737 18.9726 6.41789 19.1385 6.91557L19.5 8L19.8615 6.91557C20.0274 6.41789 20.4179 6.02737 20.9156 5.86148L22 5.5Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 12.8598C4.81875 10.0939 11.44 4.44194 13.275 6.40605C15.5938 8.88796 3.40937 15.1646 5.28854 17.93C7.2734 20.851 14.2146 10.5543 16.5635 12.3982C18.9125 14.2422 10.926 18.391 12.8052 20.696C13.5569 21.6179 15.6239 20.235 16.5635 19.313" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "ai-spark": ({ strokeWidth }) => (
    <>
      <path d="M12 2L14.4 8.6L21 11L14.4 13.4L12 20L9.6 13.4L3 11L9.6 8.6L12 2Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18.5 2.5L19.5 5.5L22.5 6.5L19.5 7.5L18.5 10.5L17.5 7.5L14.5 6.5L17.5 5.5L18.5 2.5Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 16.5L6.25 18.5L8.25 19.25L6.25 20L5.5 22L4.75 20L2.75 19.25L4.75 18.5L5.5 16.5Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "auto-awesome": ({ strokeWidth }) => (
    <>
      <path d="M12 2L14.2 8.8L21 11L14.2 13.2L12 20L9.8 13.2L3 11L9.8 8.8L12 2Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18.5 2.5L19.5 5.5L22.5 6.5L19.5 7.5L18.5 10.5L17.5 7.5L14.5 6.5L17.5 5.5L18.5 2.5Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "sparkles": ({ strokeWidth }) => (
    <>
      <path d="M12 2L14.2 8.8L21 11L14.2 13.2L12 20L9.8 13.2L3 11L9.8 8.8L12 2Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18.5 2.5L19.5 5.5L22.5 6.5L19.5 7.5L18.5 10.5L17.5 7.5L14.5 6.5L17.5 5.5L18.5 2.5Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "smart-toy": ({ strokeWidth }) => (
    <>
      <rect x="4" y="8" width="16" height="12" rx="3" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="13" r="1.5" fill="currentColor" />
      <circle cx="15" cy="13" r="1.5" fill="currentColor" />
      <path d="M10 17H14" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 4V8M8 4H16" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),

  // Flash / Lightning / Background Task
  "flash": ({ strokeWidth }) => (
    <path d="M13 2L4 13.5H11.5L10 22L20 9.5H13L13 2Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  ),
  "bolt": ({ strokeWidth }) => (
    <path d="M13 2L4 13.5H11.5L10 22L20 9.5H13L13 2Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  ),

  // Info & Help
  "information-circle": ({ strokeWidth }) => (
    <>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 11V16" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="7.5" r="0.75" fill="currentColor" />
    </>
  ),
  "info": ({ strokeWidth }) => (
    <>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 11V16" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="7.5" r="0.75" fill="currentColor" />
    </>
  ),
  "lightbulb": ({ strokeWidth }) => (
    <>
      <path d="M9 18H15M10 21H14" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 2C8.13401 2 5 5.13401 5 9C5 11.3867 6.19561 13.494 8 14.7374V16C8 16.5523 8.44772 17 9 17H15C15.5523 17 16 16.5523 16 16V14.7374C17.8044 13.494 19 11.3867 19 9C19 5.13401 15.866 2 12 2Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),

  // Cancel / Stop / Close / Delete
  "cancel-circle": ({ strokeWidth }) => (
    <>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 9L15 15M15 9L9 15" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "cancel": ({ strokeWidth }) => (
    <>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 9L15 15M15 9L9 15" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "close": ({ strokeWidth }) => (
    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  ),
  "delete": ({ strokeWidth }) => (
    <>
      <path d="M4 7H20M10 11V17M14 11V17M5 7L6 19C6 20.1046 6.89543 21 8 21H16C17.1046 21 18 20.1046 18 19L19 7M9 7V4C9 3.44772 9.44772 3 10 3H14C14.5523 3 15 3.44772 15 4V7" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "trash": ({ strokeWidth }) => (
    <>
      <path d="M4 7H20M10 11V17M14 11V17M5 7L6 19C6 20.1046 6.89543 21 8 21H16C17.1046 21 18 20.1046 18 19L19 7M9 7V4C9 3.44772 9.44772 3 10 3H14C14.5523 3 15 3.44772 15 4V7" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),

  // Check / Success
  "checkmark-circle-02": ({ strokeWidth }) => (
    <>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 12.5L10.5 15L16 9" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "check-circle": ({ strokeWidth }) => (
    <>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 12.5L10.5 15L16 9" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "check": ({ strokeWidth }) => (
    <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  ),

  // Add / Plus / Minus
  "add": ({ strokeWidth }) => (
    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  ),
  "plus": ({ strokeWidth }) => (
    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  ),
  "remove": ({ strokeWidth }) => (
    <path d="M5 12H19" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  ),

  // Arrows / Navigation
  "arrow-right-01": ({ strokeWidth }) => (
    <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  ),
  "arrow-right": ({ strokeWidth }) => (
    <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  ),
  "arrow-forward": ({ strokeWidth }) => (
    <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  ),
  "refresh": ({ strokeWidth }) => (
    <>
      <path d="M20 11A8.1 8.1 0 0 0 4.5 8.5L2 11M4 13A8.1 8.1 0 0 0 19.5 15.5L22 13" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 4V11H9M22 20V13H15" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),

  // Globe / Language / Translate
  "ai-translate": ({ strokeWidth }) => (
    <>
      <path d="M19 21L15.7004 13.4581C15.5787 13.1798 15.3037 13 15 13C14.6963 13 14.4213 13.1798 14.2996 13.4581L11 21M13 18H17" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 6H13" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 6V4" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 6C10.4 8.5 7.76 14.2 2 17" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 14.5C7.95951 12.8751 6.48993 11.1805 5.5 9.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19.5 5.9375V7.5M19.5 7.5V9.0625M19.5 7.5H18.25M19.5 7.5H20.75M22 7.5L20.9156 7.13852C20.4179 6.97263 20.0274 6.58211 19.8615 6.08443L19.5 5L19.1385 6.08443C18.9726 6.58211 18.5821 6.97263 18.0844 7.13852L17 7.5L18.0844 7.86148C18.5821 8.02737 18.9726 8.41789 19.1385 8.91557L19.5 10L19.8615 8.91557C20.0274 8.41789 20.4179 8.02737 20.9156 7.86148L22 7.5Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "globe-02": ({ strokeWidth }) => (
    <>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.5 12H21.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 2C14.5 5 16 8.5 16 12C16 15.5 14.5 19 12 22C9.5 19 8 15.5 8 12C8 8.5 9.5 5 12 2Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "translate": ({ strokeWidth }) => (
    <>
      <path d="M19 21L15.7004 13.4581C15.5787 13.1798 15.3037 13 15 13C14.6963 13 14.4213 13.1798 14.2996 13.4581L11 21M13 18H17" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 6H13" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 6V4" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 6C10.4 8.5 7.76 14.2 2 17" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 14.5C7.95951 12.8751 6.48993 11.1805 5.5 9.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19.5 5.9375V7.5M19.5 7.5V9.0625M19.5 7.5H18.25M19.5 7.5H20.75M22 7.5L20.9156 7.13852C20.4179 6.97263 20.0274 6.58211 19.8615 6.08443L19.5 5L19.1385 6.08443C18.9726 6.58211 18.5821 6.97263 18.0844 7.13852L17 7.5L18.0844 7.86148C18.5821 8.02737 18.9726 8.41789 19.1385 8.91557L19.5 10L19.8615 8.91557C20.0274 8.41789 20.4179 8.02737 20.9156 7.86148L22 7.5Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),

  // Users & Actors & Roles
  "user": ({ strokeWidth }) => (
    <>
      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 21V19C4 16.7909 5.79086 15 8 15H16C18.2091 15 20 16.7909 20 19V21" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "person": ({ strokeWidth }) => (
    <>
      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 21V19C4 16.7909 5.79086 15 8 15H16C18.2091 15 20 16.7909 20 19V21" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "group": ({ strokeWidth }) => (
    <>
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 21V19C2 16.7909 3.79086 15 6 15H12C14.2091 15 16 16.7909 16 19V21" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 3.13C17.2 3.59 18 4.7 18 6C18 7.3 17.2 8.41 16 8.87M22 21V19C22 17.22 20.9 15.69 19.33 15.18" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "groups": ({ strokeWidth }) => (
    <>
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 21V19C2 16.7909 3.79086 15 6 15H12C14.2091 15 16 16.7909 16 19V21" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 3.13C17.2 3.59 18 4.7 18 6C18 7.3 17.2 8.41 16 8.87M22 21V19C22 17.22 20.9 15.69 19.33 15.18" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "supervisor-account": ({ strokeWidth }) => (
    <>
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 21V19C2 16.7909 3.79086 15 6 15H12C14.2091 15 16 16.7909 16 19V21" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 3.13C17.2 3.59 18 4.7 18 6C18 7.3 17.2 8.41 16 8.87M22 21V19C22 17.22 20.9 15.69 19.33 15.18" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "admin-panel-settings": ({ strokeWidth }) => (
    <>
      <path d="M12 2L4 5V11.09C4 16.14 7.41 20.85 12 22C16.59 20.85 20 16.14 20 11.09V5L12 2Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.5 16.5C8.5 14.5 10 13.5 12 13.5C14 13.5 15.5 14.5 15.5 16.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "school": ({ strokeWidth }) => (
    <>
      <path d="M2 9L12 4L22 9L12 14L2 9Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 11.5V16.5C6 16.5 8 19 12 19C16 19 18 16.5 18 16.5V11.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 9V16" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "business-center": ({ strokeWidth }) => (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 7V5C8 3.89543 8.89543 3 10 3H14C15.1046 3 16 3.89543 16 5V7" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 12H21" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 12V14H14V12" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "api": ({ strokeWidth }) => (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 14L7 10" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 10L9 10C9.6 10 10 10.4 10 11V11C10 11.6 9.6 12 9 12L7 12" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 10V14" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 14V10L17 14V10" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "devices": ({ strokeWidth }) => (
    <>
      <rect x="2" y="5" width="14" height="11" rx="1.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <rect x="14" y="9" width="8" height="11" rx="1.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 19H12" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="18" cy="17" r="0.75" fill="currentColor" />
    </>
  ),
  "database": ({ strokeWidth }) => (
    <>
      <ellipse cx="12" cy="5" rx="8" ry="3" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 5V12C4 13.66 7.58 15 12 15C16.42 15 20 13.66 20 12V5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 12V19C4 20.66 7.58 22 12 22C16.42 22 20 20.66 20 19V12" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "sensors": ({ strokeWidth }) => (
    <>
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.76 7.76C6.35 9.17 5.5 11.08 5.5 13.2C5.5 15.32 6.35 17.23 7.76 18.64" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16.24 7.76C17.65 9.17 18.5 11.08 18.5 13.2C18.5 15.32 17.65 17.23 16.24 18.64" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.93 4.93C2.88 6.98 1.62 9.8 1.62 12.92C1.62 16.04 2.88 18.86 4.93 20.91" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19.07 4.93C21.12 6.98 22.38 9.8 22.38 12.92C22.38 16.04 21.12 18.86 19.07 20.91" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "search": ({ strokeWidth }) => (
    <>
      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "web": ({ strokeWidth }) => (
    <>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 12H22M12 2C14.5 5 16 8.5 16 12C16 15.5 14.5 19 12 22C9.5 19 8 15.5 8 12C8 8.5 9.5 5 12 2Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "apps": ({ strokeWidth }) => (
    <>
      <rect x="4" y="4" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <rect x="14" y="4" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <rect x="4" y="14" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <rect x="14" y="14" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "science": ({ strokeWidth }) => (
    <>
      <path d="M9 3H15M10 3V8L4.5 18C3.8 19.2 4.7 21 6.1 21H17.9C19.3 21 20.2 19.2 19.5 18L14 8V3" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 16H18" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "cloud": ({ strokeWidth }) => (
    <path d="M6.5 19C4.01 19 2 16.99 2 14.5C2 12.16 3.79 10.24 6.1 10.03C6.6 6.64 9.5 4 13 4C17.08 4 20.44 7.15 20.94 11.16C21.57 11.53 22 12.22 22 13C22 14.1 21.1 15 20 15H19M6.5 19H19" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  ),
  "analytics": ({ strokeWidth }) => (
    <>
      <path d="M4 20H20" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 16V12M12 16V8M17 16V4" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),

  // Edit / Pen
  "edit": ({ strokeWidth }) => (
    <path d="M16.5 3.5L20.5 7.5L7 21H3V17L16.5 3.5Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  ),

  // Code / Tech / Object
  "code": ({ strokeWidth }) => (
    <>
      <path d="M16 18L22 12L16 6M8 6L2 12L8 18" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "data-object": ({ strokeWidth }) => (
    <>
      <path d="M8 4C6 4 5 5 5 7V10C5 11 4 12 2 12C4 12 5 13 5 14V17C5 19 6 20 8 20" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 4C18 4 19 5 19 7V10C19 11 20 12 22 12C20 12 19 13 19 14V17C19 19 18 20 16 20" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),

  // Diagrams / Structure / Backlog
  "account-tree": ({ strokeWidth }) => (
    <>
      <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <rect x="3" y="17" width="6" height="4" rx="1" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <rect x="15" y="17" width="6" height="4" rx="1" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 7V12M12 12H6V17M12 12H18V17" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "layers": ({ strokeWidth }) => (
    <>
      <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "presentation": ({ strokeWidth }) => (
    <>
      <rect x="3" y="4" width="18" height="13" rx="2" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 21L12 17L16 21M12 4V2" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "play-circle": ({ strokeWidth }) => (
    <>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <polygon points="10,8 16,12 10,16" fill="currentColor" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "download": ({ strokeWidth }) => (
    <>
      <path d="M12 3V15M12 15L7 10M12 15L17 10M4 19H20" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "clock": ({ strokeWidth }) => (
    <>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "mic": ({ strokeWidth }) => (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10C5 13.866 8.13401 17 12 17C15.866 17 19 13.866 19 10M12 17V21M8 21H16" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
};

export default function HugeiconsIcon({
  icon,
  size = 18,
  strokeWidth = 1.5,
  className,
  color,
  ...props
}: HugeiconsIconProps) {
  if (typeof icon === "function") {
    const Component = icon as React.ComponentType<any>;
    return <Component size={size} strokeWidth={strokeWidth} className={className} color={color} {...props} />;
  }

  const normalizedKey = String(icon || "").toLowerCase().replace(/_/g, "-");
  const renderer = ICONS[normalizedKey];

  if (renderer) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("inline-block shrink-0 select-none", className)}
        style={{ color: color || "currentColor" }}
        {...props}
      >
        {renderer({ strokeWidth })}
      </svg>
    );
  }

  // Fallback to stroke-rounded Material Symbol
  return (
    <span
      className={cn("material-symbols-outlined inline-flex items-center justify-center shrink-0 select-none", className)}
      style={{ fontSize: typeof size === "number" ? `${size}px` : size, color }}
    >
      {icon}
    </span>
  );
}

export const AiBeautifyIcon = ({ size = 18, strokeWidth = 1.5, className, color, ...props }: Omit<HugeiconsIconProps, "icon">) => (
  <HugeiconsIcon icon="ai-beautify" size={size} strokeWidth={strokeWidth} className={className} color={color} {...props} />
);

export const AiRefineIcon = ({ size = 18, strokeWidth = 1.5, className, color, ...props }: Omit<HugeiconsIconProps, "icon">) => (
  <HugeiconsIcon icon="ai-refine" size={size} strokeWidth={strokeWidth} className={className} color={color} {...props} />
);

export const AiTranslateIcon = ({ size = 18, strokeWidth = 1.5, className, color, ...props }: Omit<HugeiconsIconProps, "icon">) => (
  <HugeiconsIcon icon="ai-translate" size={size} strokeWidth={strokeWidth} className={className} color={color} {...props} />
);

export { HugeiconsIcon };

