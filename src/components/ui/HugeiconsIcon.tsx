import React from "react";
import { cn } from "@/lib/utils";

export interface HugeiconsIconProps extends Omit<React.SVGProps<SVGSVGElement>, "color"> {
  icon?: string | React.ComponentType<any> | any;
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

  // Navigation & Menus & Sidebar
  "sidebar-left": ({ strokeWidth }) => (
    <>
      <rect x="3" y="4" width="18" height="16" rx="3" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 4V20" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 10L12 12L14 14" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "sidebar-right": ({ strokeWidth }) => (
    <>
      <rect x="3" y="4" width="18" height="16" rx="3" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 4V20" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 10L12 12L10 14" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "menu-01": ({ strokeWidth }) => (
    <>
      <path d="M3 6H21M3 12H21M3 18H21" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "menu": ({ strokeWidth }) => (
    <>
      <path d="M3 6H21M3 12H21M3 18H21" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "arrow-right-01": ({ strokeWidth }) => (
    <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  ),
  "arrow-right": ({ strokeWidth }) => (
    <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  ),
  "arrow-forward": ({ strokeWidth }) => (
    <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  ),
  "arrow-left": ({ strokeWidth }) => (
    <path d="M19 12H5M5 12L11 6M5 12L11 18" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  ),
  "arrow-right-02": ({ strokeWidth }) => (
    <path d="M3 12H21M21 12L15 6M21 12L15 18" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  ),
  "command": ({ strokeWidth }) => (
    <>
      <path d="M6.5 9A2.5 2.5 0 1 1 9 6.5V17.5A2.5 2.5 0 1 1 6.5 15H17.5A2.5 2.5 0 1 1 15 17.5V6.5A2.5 2.5 0 1 1 17.5 9H6.5Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "folder-01": ({ strokeWidth }) => (
    <>
      <path d="M2.5 7.5C2.5 6.11929 3.61929 5 5 5H9.17157C9.70201 5 10.2107 5.21071 10.5858 5.58579L12.4142 7.41421C12.7893 7.78929 13.298 8 13.8284 8H19C20.3807 8 21.5 9.11929 21.5 10.5V17.5C21.5 18.8807 20.3807 20 19 20H5C3.61929 20 2.5 18.8807 2.5 17.5V7.5Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "folder": ({ strokeWidth }) => (
    <>
      <path d="M2.5 7.5C2.5 6.11929 3.61929 5 5 5H9.17157C9.70201 5 10.2107 5.21071 10.5858 5.58579L12.4142 7.41421C12.7893 7.78929 13.298 8 13.8284 8H19C20.3807 8 21.5 9.11929 21.5 10.5V17.5C21.5 18.8807 20.3807 20 19 20H5C3.61929 20 2.5 18.8807 2.5 17.5V7.5Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "file-01": ({ strokeWidth }) => (
    <>
      <path d="M4 4C4 2.89543 4.89543 2 6 2H14L20 8V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V4Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 2V8H20" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "notification-02": ({ strokeWidth }) => (
    <>
      <path d="M12 2C8.13401 2 5 5.13401 5 9V14.2C5 14.8 4.7 15.4 4.2 15.8L3.2 16.6C2.6 17.1 2.9 18 3.7 18H20.3C21.1 18 21.4 17.1 20.8 16.6L19.8 15.8C19.3 15.4 19 14.8 19 14.2V9C19 5.13401 15.866 2 12 2Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 19C9.4 20.2 10.6 21 12 21C13.4 21 14.6 20.2 15 19" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "notifications": ({ strokeWidth }) => (
    <>
      <path d="M12 2C8.13401 2 5 5.13401 5 9V14.2C5 14.8 4.7 15.4 4.2 15.8L3.2 16.6C2.6 17.1 2.9 18 3.7 18H20.3C21.1 18 21.4 17.1 20.8 16.6L19.8 15.8C19.3 15.4 19 14.8 19 14.2V9C19 5.13401 15.866 2 12 2Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 19C9.4 20.2 10.6 21 12 21C13.4 21 14.6 20.2 15 19" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "bell": ({ strokeWidth }) => (
    <>
      <path d="M12 2C8.13401 2 5 5.13401 5 9V14.2C5 14.8 4.7 15.4 4.2 15.8L3.2 16.6C2.6 17.1 2.9 18 3.7 18H20.3C21.1 18 21.4 17.1 20.8 16.6L19.8 15.8C19.3 15.4 19 14.8 19 14.2V9C19 5.13401 15.866 2 12 2Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 19C9.4 20.2 10.6 21 12 21C13.4 21 14.6 20.2 15 19" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "time-02": ({ strokeWidth }) => (
    <>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "history": ({ strokeWidth }) => (
    <>
      <path d="M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C8.04 21 4.7 18.45 3.46 15" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 8V12H7" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 7V12L15 14" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "lock": ({ strokeWidth }) => (
    <>
      <path d="M16.4964 9V6.5C16.4964 4.01472 14.4817 2 11.9964 2C9.51112 2 7.4964 4.01472 7.4964 6.5V9" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.4958 9H10.4964C8.16158 9 6.99417 9 6.11049 9.47237C5.41275 9.84535 4.84128 10.4169 4.46837 11.1146C3.99608 11.9984 3.99619 13.1658 3.99641 15.5006C3.99662 17.835 3.99673 19.0023 4.46907 19.8858C4.84203 20.5835 5.41347 21.1548 6.11115 21.5277C6.99475 22 8.16197 22 10.4964 22H13.4958C15.8304 22 16.9978 22 17.8814 21.5277C18.5791 21.1548 19.1506 20.5833 19.5235 19.8856C19.9958 19.0019 19.9958 17.8346 19.9958 15.5C19.9958 13.1654 19.9958 11.9981 19.5235 11.1144C19.1506 10.4167 18.5791 9.84525 17.8814 9.47231C16.9978 9 15.8304 9 13.4958 9Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <circle cx="11.9964" cy="15.5" r="2" stroke="currentColor" strokeWidth={strokeWidth} />
    </>
  ),
  "lock-open": ({ strokeWidth }) => (
    <>
      <circle cx="11.9961" cy="15.5" r="2" stroke="currentColor" strokeWidth={strokeWidth} />
      <path d="M7.49609 9V6.5C7.49609 4.01472 9.51081 2 11.9961 2C13.9554 2 15.3783 3.25221 15.9961 5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.4955 9H10.4961C8.16128 9 6.99386 9 6.11018 9.47237C5.41244 9.84535 4.84098 10.4169 4.46807 11.1146C3.99578 11.9984 3.99589 13.1658 3.9961 15.5006C3.99632 17.835 3.99643 19.0023 4.46877 19.8858C4.84172 20.5835 5.41317 21.1548 6.11085 21.5277C6.99445 22 8.16166 22 10.4961 22H13.4955C15.8301 22 16.9974 22 17.8811 21.5277C18.5788 21.1548 19.1503 20.5833 19.5232 19.8856C19.9955 19.0019 19.9955 17.8346 19.9955 15.5C19.9955 13.1654 19.9955 11.9981 19.5232 11.1144C19.1503 10.4167 18.5788 9.84525 17.8811 9.47231C16.9974 9 15.8301 9 13.4955 9Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </>
  ),
  "lock-reset": ({ strokeWidth }) => (
    <>
      <path d="M16 10V6.5C16 4.01472 13.9853 2 11.5 2C9.01472 2 7 4.01472 7 6.5V10" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <rect x="3.5" y="10" width="16" height="11" rx="3" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <circle cx="11.5" cy="15.5" r="1.5" stroke="currentColor" strokeWidth={strokeWidth} />
    </>
  ),
  "mail": ({ strokeWidth }) => (
    <>
      <rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 7L10.7386 12.417C11.5034 12.9524 12.4966 12.9524 13.2614 12.417L21 7" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "mail-01": ({ strokeWidth }) => (
    <>
      <rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 7L10.7386 12.417C11.5034 12.9524 12.4966 12.9524 13.2614 12.417L21 7" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "mail-02": ({ strokeWidth }) => (
    <>
      <rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 7L10.7386 12.417C11.5034 12.9524 12.4966 12.9524 13.2614 12.417L21 7" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "mark-email-read": ({ strokeWidth }) => (
    <>
      <path d="M4 19H12M4 5H20C20.5523 5 21 5.44772 21 6V11" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 6.5L10.7386 11.917C11.5034 12.4524 12.4966 12.4524 13.2614 11.917L18.5 8" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 17.5L17.5 20L22 15.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 6V18C3 18.5523 3.44772 19 4 19" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "mail-check": ({ strokeWidth }) => (
    <>
      <path d="M4 19H12M4 5H20C20.5523 5 21 5.44772 21 6V11" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 6.5L10.7386 11.917C11.5034 12.4524 12.4966 12.4524 13.2614 11.917L18.5 8" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 17.5L17.5 20L22 15.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 6V18C3 18.5523 3.44772 19 4 19" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "key": ({ strokeWidth }) => (
    <>
      <circle cx="8" cy="15" r="4.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11.18 11.82L21 2M21 2H17M21 2V6M15 8L18 11" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "key-01": ({ strokeWidth }) => (
    <>
      <circle cx="8" cy="15" r="4.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11.18 11.82L21 2M21 2H17M21 2V6M15 8L18 11" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "cloud-sync": ({ strokeWidth }) => (
    <>
      <path d="M6.5 19C4.01 19 2 16.99 2 14.5C2 12.16 3.79 10.24 6.1 10.03C6.6 6.64 9.5 4 13 4C17.08 4 20.44 7.15 20.94 11.16C21.57 11.53 22 12.22 22 13C22 14.1 21.1 15 20 15H19M6.5 19H19" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 13L12 11M12 11L14 13M12 11V16" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "cloud-check": ({ strokeWidth }) => (
    <>
      <path d="M6.5 19C4.01 19 2 16.99 2 14.5C2 12.16 3.79 10.24 6.1 10.03C6.6 6.64 9.5 4 13 4C17.08 4 20.44 7.15 20.94 11.16C21.57 11.53 22 12.22 22 13C22 14.1 21.1 15 20 15H19M6.5 19H19" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 13.5L11 15.5L15 11.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "settings-02": ({ strokeWidth }) => (
    <>
      <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19.4 15A1.65 1.65 0 0 0 19.73 16.82L20.14 17.53C20.48 18.12 20.35 18.88 19.82 19.32L18.82 20.15C18.29 20.59 17.53 20.59 17 20.15L16.29 19.6C15.7 19.14 14.88 19.26 14.44 19.85L14.03 20.4C13.69 20.99 12.93 21.36 12.25 21.36H11.75C11.07 21.36 10.31 20.99 9.97 20.4L9.56 19.85C9.12 19.26 8.3 19.14 7.71 19.6L7 20.15C6.47 20.59 5.71 20.59 5.18 20.15L4.18 19.32C3.65 18.88 3.52 18.12 3.86 17.53L4.27 16.82C4.6 16.23 4.48 15.41 3.89 14.97L3.18 14.44C2.59 14 2.22 13.24 2.22 12.56V11.44C2.22 10.76 2.59 10 3.18 9.56L3.89 9.03C4.48 8.59 4.6 7.77 4.27 7.18L3.86 6.47C3.52 5.88 3.65 5.12 4.18 4.68L5.18 3.85C5.71 3.41 6.47 3.41 7 3.85L7.71 4.4C8.3 4.86 9.12 4.74 9.56 4.15L9.97 3.6C10.31 3.01 11.07 2.64 11.75 2.64H12.25C12.93 2.64 13.69 3.01 14.03 3.6L14.44 4.15C14.88 4.74 15.7 4.86 16.29 4.4L17 3.85C17.53 3.41 18.29 3.41 18.82 3.85L19.82 4.68C20.35 5.12 20.48 5.88 20.14 6.47L19.73 7.18C19.4 7.77 19.52 8.59 20.11 9.03L20.82 9.56C21.41 10 21.78 10.76 21.78 11.44V12.56C21.78 13.24 21.41 14 20.82 14.44L20.11 14.97C19.7 15.28 19.45 15.77 19.4 16.3" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "settings": ({ strokeWidth }) => (
    <>
      <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19.4 15A1.65 1.65 0 0 0 19.73 16.82L20.14 17.53C20.48 18.12 20.35 18.88 19.82 19.32L18.82 20.15C18.29 20.59 17.53 20.59 17 20.15L16.29 19.6C15.7 19.14 14.88 19.26 14.44 19.85L14.03 20.4C13.69 20.99 12.93 21.36 12.25 21.36H11.75C11.07 21.36 10.31 20.99 9.97 20.4L9.56 19.85C9.12 19.26 8.3 19.14 7.71 19.6L7 20.15C6.47 20.59 5.71 20.59 5.18 20.15L4.18 19.32C3.65 18.88 3.52 18.12 3.86 17.53L4.27 16.82C4.6 16.23 4.48 15.41 3.89 14.97L3.18 14.44C2.59 14 2.22 13.24 2.22 12.56V11.44C2.22 10.76 2.59 10 3.18 9.56L3.89 9.03C4.48 8.59 4.6 7.77 4.27 7.18L3.86 6.47C3.52 5.88 3.65 5.12 4.18 4.68L5.18 3.85C5.71 3.41 6.47 3.41 7 3.85L7.71 4.4C8.3 4.86 9.12 4.74 9.56 4.15L9.97 3.6C10.31 3.01 11.07 2.64 11.75 2.64H12.25C12.93 2.64 13.69 3.01 14.03 3.6L14.44 4.15C14.88 4.74 15.7 4.86 16.29 4.4L17 3.85C17.53 3.41 18.29 3.41 18.82 3.85L19.82 4.68C20.35 5.12 20.48 5.88 20.14 6.47L19.73 7.18C19.4 7.77 19.52 8.59 20.11 9.03L20.82 9.56C21.41 10 21.78 10.76 21.78 11.44V12.56C21.78 13.24 21.41 14 20.82 14.44L20.11 14.97C19.7 15.28 19.45 15.77 19.4 16.3" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "logout-01": ({ strokeWidth }) => (
    <>
      <path d="M9 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H9" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 17L21 12L16 7M21 12H9" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "logout": ({ strokeWidth }) => (
    <>
      <path d="M9 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H9" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 17L21 12L16 7M21 12H9" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "compass": ({ strokeWidth }) => (
    <>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round" />
    </>
  ),
  "filter": ({ strokeWidth }) => (
    <path d="M22 3H2L10 12.46V19L14 21V12.46L22 3Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  ),
  "layout-grid": ({ strokeWidth }) => (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "dashboard": ({ strokeWidth }) => (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "sun": ({ strokeWidth }) => (
    <>
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "moon": ({ strokeWidth }) => (
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  ),
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
      <path d="M22 10L12 5L2 10L12 15L22 10Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 12.5V17C6 17 8.5 19.5 12 19.5C15.5 19.5 18 17 18 17V12.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 10V16" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "mortarboard-02": ({ strokeWidth }) => (
    <>
      <path d="M22 10L12 5L2 10L12 15L22 10Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 12.5V17C6 17 8.5 19.5 12 19.5C15.5 19.5 18 17 18 17V12.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 10V16" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "mortarboard-01": ({ strokeWidth }) => (
    <>
      <path d="M22 10L12 5L2 10L12 15L22 10Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 12.5V17C6 17 8.5 19.5 12 19.5C15.5 19.5 18 17 18 17V12.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 10V16" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
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
  "mic-off": ({ strokeWidth }) => (
    <>
      <path d="M2 2L22 22" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 5C9 3.34315 10.3431 2 12 2C13.6569 2 15 3.34315 15 5V10M15 13.5C14.5 15 13.3 16 12 16C9.79086 16 8 14.2091 8 12V8M5 10C5 13.866 8.13401 17 12 17M19 10C19 11.2386 18.6791 12.4022 18.1189 13.411M12 17V21M8 21H16" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "camera": ({ strokeWidth }) => (
    <>
      <path d="M4 8C4 6.89543 4.89543 6 6 6H7.5L9 4H15L16.5 6H18C19.1046 6 20 6.89543 20 8V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V8Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "video": ({ strokeWidth }) => (
    <>
      <rect x="3" y="6" width="13" height="12" rx="2" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 10L21 7V17L16 14" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "video-camera": ({ strokeWidth }) => (
    <>
      <rect x="3" y="6" width="13" height="12" rx="2" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 10L21 7V17L16 14" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "video-off": ({ strokeWidth }) => (
    <>
      <path d="M2 2L22 22" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 10L21 7V17L16 14" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 6H14C15.1046 6 16 6.89543 16 8V12M6 6H5C3.89543 6 3 6.89543 3 8V16C3 17.1046 3.89543 18 5 18H15" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "volume-high": ({ strokeWidth }) => (
    <>
      <path d="M11 5L6 9H2V15H6L11 19V5Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15.5 8.5C16.5 9.5 17 10.7 17 12C17 13.3 16.5 14.5 15.5 15.5M19 5C21 7 22 9.5 22 12C22 14.5 21 17 19 19" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "fullscreen": ({ strokeWidth }) => (
    <>
      <path d="M3 8V5C3 3.89543 3.89543 3 5 3H8M21 8V5C21 3.89543 20.1046 3 19 3H16M3 16V19C3 20.1046 3.89543 21 5 21H8M21 16V19C21 20.1046 20.1046 21 19 21H16" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "fullscreen-exit": ({ strokeWidth }) => (
    <>
      <path d="M8 3V6C8 7.10457 7.10457 8 6 8H3M16 3V6C16 7.10457 16.8954 8 18 8H21M8 21V18C8 16.8954 7.10457 16 6 16H3M16 21V18C16 16.8954 16.8954 16 18 16H21" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "maximize": ({ strokeWidth }) => (
    <>
      <path d="M3 8V5C3 3.89543 3.89543 3 5 3H8M21 8V5C21 3.89543 20.1046 3 19 3H16M3 16V19C3 20.1046 3.89543 21 5 21H8M21 16V19C21 20.1046 20.1046 21 19 21H16" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "minimize": ({ strokeWidth }) => (
    <>
      <path d="M8 3V6C8 7.10457 7.10457 8 6 8H3M16 3V6C16 7.10457 16.8954 8 18 8H21M8 21V18C8 16.8954 7.10457 16 6 16H3M16 21V18C16 16.8954 16.8954 16 18 16H21" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),

  // Quality & System Attributes (NFRs)
  "shield": ({ strokeWidth }) => (
    <path d="M12 2L4 5V11.09C4 16.14 7.41 20.85 12 22C16.59 20.85 20 16.14 20 11.09V5L12 2Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  ),
  "shield-lock": ({ strokeWidth }) => (
    <>
      <path d="M12 2L4 5V11.09C4 16.14 7.41 20.85 12 22C16.59 20.85 20 16.14 20 11.09V5L12 2Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="11.5" r="1.5" stroke="currentColor" strokeWidth={strokeWidth} />
      <path d="M12 13V15" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </>
  ),

  "speed": ({ strokeWidth }) => (
    <>
      <path d="M12 4C7.02944 4 3 8.02944 3 13C3 15.3585 3.90793 17.5054 5.3934 19.1171M21 13C21 8.02944 16.9706 4 12 4M18.6066 19.1171C20.0921 17.5054 21 15.3585 21 13" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 13L16 9" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="1" fill="currentColor" />
    </>
  ),
  "trending-up": ({ strokeWidth }) => (
    <>
      <path d="M22 7L13.5 15.5L8.5 10.5L2 17M22 7H16M22 7V13" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "list-ordered": ({ strokeWidth }) => (
    <>
      <path d="M10 6H20M10 12H20M10 18H20" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 5V8M4 8H5M4 8H3" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 11.5C3 11 3.5 10.5 4.5 10.5C5.5 10.5 6 11 6 12C6 13.2 3 14 3 15H6" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 17.5H5C5.5 17.5 6 18 6 18.5C6 19 5.5 19.5 5 19.5H4M5 19.5C5.5 19.5 6 20 6 20.5C6 21 5.5 21.5 5 21.5H3" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "alert-circle": ({ strokeWidth }) => (
    <>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "verified": ({ strokeWidth }) => (
    <>
      <path d="M12 2L15.09 5.09L19.45 5.55L20.45 9.8L23.45 12.8L20.45 15.8L19.45 20.05L15.09 20.51L12 23.6L8.91 20.51L4.55 20.05L3.55 15.8L0.55 12.8L3.55 9.8L4.55 5.55L8.91 5.09L12 2Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 12.5L11 14.5L15 10.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "cloud-done": ({ strokeWidth }) => (
    <>
      <path d="M6.5 19C4.01 19 2 16.99 2 14.5C2 12.16 3.79 10.24 6.1 10.03C6.6 6.64 9.5 4 13 4C17.08 4 20.44 7.15 20.94 11.16C21.57 11.53 22 12.22 22 13C22 14.1 21.1 15 20 15H19M6.5 19H19" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 13.5L11 15.5L15 11.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "accessibility": ({ strokeWidth }) => (
    <>
      <circle cx="12" cy="4" r="2" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 8H20M12 8V14M9 20L12 14L15 20" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "accessibility-new": ({ strokeWidth }) => (
    <>
      <circle cx="12" cy="4" r="2" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 8H20M12 8V14M9 20L12 14L15 20" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "touch-app": ({ strokeWidth }) => (
    <>
      <path d="M12 11V6C12 4.89543 11.1046 4 10 4C8.89543 4 8 4.89543 8 6V13" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 11.5V13C8 17.4183 11.5817 21 16 21C20.4183 21 22 17.4183 22 13V11C22 9.89543 21.1046 9 20 9C18.8954 9 18 9.89543 18 11V11.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "build": ({ strokeWidth }) => (
    <path d="M14.7 6.3C15.9 7.5 16.5 9.1 16.2 10.7L8.9 18C8.5 18.4 7.9 18.4 7.5 18L6 16.5C5.6 16.1 5.6 15.5 6 15.1L13.3 7.8C12.8 6.2 13.5 4.5 14.7 3.3C15.3 2.7 16.2 2.3 17 2.1C17.4 2 17.8 2.4 17.6 2.8C17.1 4.1 17.4 5.6 18.5 6.7C19.6 7.8 21.1 8.1 22.4 7.6C22.8 7.4 23.2 7.8 23.1 8.2C22.9 9 22.5 9.9 21.9 10.5C20.7 11.7 19 12.4 17.4 11.9" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  ),
  "tune": ({ strokeWidth }) => (
    <>
      <path d="M4 6H14M18 6H20M14 4V8M4 12H8M12 12H20M8 10V14M4 18H16M20 18H20.01M16 16V20" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),

  // Architecture & Diagrams (UML & Backlog)
  "user-circle": ({ strokeWidth }) => (
    <>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={strokeWidth} />
      <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth={strokeWidth} />
      <path d="M7 18.5C7.8 16.5 9.7 15 12 15C14.3 15 16.2 16.5 17 18.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </>
  ),
  "person-play": ({ strokeWidth }) => (
    <>
      <circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth={strokeWidth} />
      <path d="M4 18C4 14.6863 6.68629 12 10 12C11.1 12 12.1 12.3 13 12.8" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <polygon points="16,13 22,17 16,21" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round" />
    </>
  ),
  "sync-alt": ({ strokeWidth }) => (
    <>
      <path d="M4 8H18M18 8L14 4M18 8L14 12" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 16H6M6 16L10 20M6 16L10 12" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "schema": ({ strokeWidth }) => (
    <>
      <rect x="3" y="3" width="6" height="5" rx="1" stroke="currentColor" strokeWidth={strokeWidth} />
      <rect x="15" y="3" width="6" height="5" rx="1" stroke="currentColor" strokeWidth={strokeWidth} />
      <rect x="9" y="16" width="6" height="5" rx="1" stroke="currentColor" strokeWidth={strokeWidth} />
      <path d="M6 8V12H18V8M12 12V16" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "visibility": ({ strokeWidth }) => (
    <>
      <path d="M2 12C2 12 5.63636 5 12 5C18.3636 5 22 12 22 12C22 12 18.3636 19 12 19C5.63636 19 2 12 2 12Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "eye": ({ strokeWidth }) => (
    <>
      <path d="M2 12C2 12 5.63636 5 12 5C18.3636 5 22 12 22 12C22 12 18.3636 19 12 19C5.63636 19 2 12 2 12Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "view": ({ strokeWidth }) => (
    <>
      <path d="M2 12C2 12 5.63636 5 12 5C18.3636 5 22 12 22 12C22 12 18.3636 19 12 19C5.63636 19 2 12 2 12Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "visibility-off": ({ strokeWidth }) => (
    <>
      <path d="M2 2L22 22" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.71277 6.7226C3.7297 8.52848 2 12 2 12C2 12 5.63636 19 12 19C14.0759 19 15.9388 18.2587 17.4735 17.1512" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.125 10.1348C9.42998 10.8327 9.42998 11.9619 10.125 12.6598C10.82 13.3577 11.9447 13.3577 12.6398 12.6598" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.36364 5.36534C10.2078 5.12739 11.0886 5 12 5C18.3636 5 22 12 22 12C22 12 20.8906 14.1355 18.9806 16.142" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "view-off": ({ strokeWidth }) => (
    <>
      <path d="M2 2L22 22" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.71277 6.7226C3.7297 8.52848 2 12 2 12C2 12 5.63636 19 12 19C14.0759 19 15.9388 18.2587 17.4735 17.1512" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.125 10.1348C9.42998 10.8327 9.42998 11.9619 10.125 12.6598C10.82 13.3577 11.9447 13.3577 12.6398 12.6598" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.36364 5.36534C10.2078 5.12739 11.0886 5 12 5C18.3636 5 22 12 22 12C22 12 20.8906 14.1355 18.9806 16.142" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "eye-off": ({ strokeWidth }) => (
    <>
      <path d="M2 2L22 22" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.71277 6.7226C3.7297 8.52848 2 12 2 12C2 12 5.63636 19 12 19C14.0759 19 15.9388 18.2587 17.4735 17.1512" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.125 10.1348C9.42998 10.8327 9.42998 11.9619 10.125 12.6598C10.82 13.3577 11.9447 13.3577 12.6398 12.6598" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.36364 5.36534C10.2078 5.12739 11.0886 5 12 5C18.3636 5 22 12 22 12C22 12 20.8906 14.1355 18.9806 16.142" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "timeline": ({ strokeWidth }) => (
    <>
      <path d="M3 3V21H21" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 14L11 9L15 13L20 7" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="7" cy="14" r="1" fill="currentColor" />
      <circle cx="11" cy="9" r="1" fill="currentColor" />
      <circle cx="15" cy="13" r="1" fill="currentColor" />
      <circle cx="20" cy="7" r="1" fill="currentColor" />
    </>
  ),
  "drag-vertical": ({ strokeWidth }) => (
    <>
      <circle cx="9" cy="5" r="1.2" fill="currentColor" />
      <circle cx="9" cy="12" r="1.2" fill="currentColor" />
      <circle cx="9" cy="19" r="1.2" fill="currentColor" />
      <circle cx="15" cy="5" r="1.2" fill="currentColor" />
      <circle cx="15" cy="12" r="1.2" fill="currentColor" />
      <circle cx="15" cy="19" r="1.2" fill="currentColor" />
    </>
  ),
  "drag-indicator": ({ strokeWidth }) => (
    <>
      <circle cx="9" cy="5" r="1.2" fill="currentColor" />
      <circle cx="9" cy="12" r="1.2" fill="currentColor" />
      <circle cx="9" cy="19" r="1.2" fill="currentColor" />
      <circle cx="15" cy="5" r="1.2" fill="currentColor" />
      <circle cx="15" cy="12" r="1.2" fill="currentColor" />
      <circle cx="15" cy="19" r="1.2" fill="currentColor" />
    </>
  ),
  "book-open": ({ strokeWidth }) => (
    <>
      <path d="M12 6.5C10.5 5 8.5 4 6 4C3.5 4 2 5.5 2 7V19C2 17.5 3.5 16 6 16C8.5 16 10.5 17 12 18.5M12 6.5C13.5 5 15.5 4 18 4C20.5 4 22 5.5 22 7V19C22 17.5 20.5 16 18 16C15.5 16 13.5 17 12 18.5M12 6.5V18.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "menu-book": ({ strokeWidth }) => (
    <>
      <path d="M12 6.5C10.5 5 8.5 4 6 4C3.5 4 2 5.5 2 7V19C2 17.5 3.5 16 6 16C8.5 16 10.5 17 12 18.5M12 6.5C13.5 5 15.5 4 18 4C20.5 4 22 5.5 22 7V19C22 17.5 20.5 16 18 16C15.5 16 13.5 17 12 18.5M12 6.5V18.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "subdirectory-arrow-right": ({ strokeWidth }) => (
    <path d="M4 6V14C4 16.2091 5.79086 18 8 18H20M20 18L15 13M20 18L15 23" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  ),
  "stop-circle": ({ strokeWidth }) => (
    <>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" />
    </>
  ),
  "document-validation": ({ strokeWidth }) => (
    <>
      <path d="M4 4C4 2.89543 4.89543 2 6 2H14L20 8V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V4Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 2V8H20" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 13L11 15L15 11" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "document": ({ strokeWidth }) => (
    <>
      <path d="M4 4C4 2.89543 4.89543 2 6 2H14L20 8V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V4Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 2V8H20" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 13H16M8 17H13" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "radio-button-unchecked": ({ strokeWidth }) => (
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  ),
  "format-align-left": ({ strokeWidth }) => (
    <path d="M3 6H21M3 12H15M3 18H18" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  ),
  "format-align-center": ({ strokeWidth }) => (
    <path d="M3 6H21M6 12H18M4 18H20" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  ),
  "terminal": ({ strokeWidth }) => (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 9L10 12L7 15M12 15H17" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "spellcheck": ({ strokeWidth }) => (
    <>
      <path d="M4 16L9 4L14 16M6.2 11.5H11.8" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 19L17 22L22 17" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "psychology": ({ strokeWidth }) => (
    <>
      <path d="M12 4C8.68629 4 6 6.68629 6 10C6 11.8 6.8 13.4 8 14.5V17C8 17.5523 8.44772 18 9 18H15C15.5523 18 16 17.5523 16 17V14.5C17.2 13.4 18 11.8 18 10C18 6.68629 15.3137 4 12 4Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 21H14" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 10C10.5 9 11.5 8.5 12.5 9C13.5 9.5 14 10.5 13.5 11.5C13 12.5 12 12.5 12 14" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </>
  ),
  "chevron-right": ({ strokeWidth }) => (
    <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  ),
  "chevron-left": ({ strokeWidth }) => (
    <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  ),
  "chevron-down": ({ strokeWidth }) => (
    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  ),
  "chevron-up": ({ strokeWidth }) => (
    <path d="M6 15L12 9L18 15" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
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
  if (!icon) return null;

  if (typeof icon === "function") {
    const Component = icon as React.ComponentType<any>;
    return <Component size={size} strokeWidth={strokeWidth} className={className} color={color} {...props} />;
  }

  if (typeof icon === "object" && icon !== null) {
    if (Array.isArray((icon as any)[2])) {
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
          {(icon as any)[2].map(([tag, attrs]: [string, any], idx: number) => {
            const Tag = tag as any;
            return <Tag key={idx} {...attrs} strokeWidth={strokeWidth} />;
          })}
        </svg>
      );
    }
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

export const Folder01Icon = ({ size = 18, strokeWidth = 1.5, className, color, ...props }: Omit<HugeiconsIconProps, "icon">) => (
  <HugeiconsIcon icon="folder-01" size={size} strokeWidth={strokeWidth} className={className} color={color} {...props} />
);

export const Search01Icon = ({ size = 18, strokeWidth = 1.5, className, color, ...props }: Omit<HugeiconsIconProps, "icon">) => (
  <HugeiconsIcon icon="search" size={size} strokeWidth={strokeWidth} className={className} color={color} {...props} />
);

export const SidebarLeft01Icon = ({ size = 18, strokeWidth = 1.5, className, color, ...props }: Omit<HugeiconsIconProps, "icon">) => (
  <HugeiconsIcon icon="sidebar-left" size={size} strokeWidth={strokeWidth} className={className} color={color} {...props} />
);

export const Notification02Icon = ({ size = 18, strokeWidth = 1.5, className, color, ...props }: Omit<HugeiconsIconProps, "icon">) => (
  <HugeiconsIcon icon="notification-02" size={size} strokeWidth={strokeWidth} className={className} color={color} {...props} />
);

export const Time02Icon = ({ size = 18, strokeWidth = 1.5, className, color, ...props }: Omit<HugeiconsIconProps, "icon">) => (
  <HugeiconsIcon icon="time-02" size={size} strokeWidth={strokeWidth} className={className} color={color} {...props} />
);

export const AiBeautifyIcon = ({ size = 18, strokeWidth = 1.5, className, color, ...props }: Omit<HugeiconsIconProps, "icon">) => (
  <HugeiconsIcon icon="ai-beautify" size={size} strokeWidth={strokeWidth} className={className} color={color} {...props} />
);

export const AiRefineIcon = ({ size = 18, strokeWidth = 1.5, className, color, ...props }: Omit<HugeiconsIconProps, "icon">) => (
  <HugeiconsIcon icon="ai-refine" size={size} strokeWidth={strokeWidth} className={className} color={color} {...props} />
);

export const Mortarboard02Icon = ({ size = 18, strokeWidth = 1.5, className, color, ...props }: Omit<HugeiconsIconProps, "icon">) => (
  <HugeiconsIcon icon="mortarboard-02" size={size} strokeWidth={strokeWidth} className={className} color={color} {...props} />
);

export const Mortarboard01Icon = ({ size = 18, strokeWidth = 1.5, className, color, ...props }: Omit<HugeiconsIconProps, "icon">) => (
  <HugeiconsIcon icon="mortarboard-01" size={size} strokeWidth={strokeWidth} className={className} color={color} {...props} />
);

export { HugeiconsIcon };


