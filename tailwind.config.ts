/**
 * Tailwind configuration is now handled primarily in index.css using v4 syntax,
 * but this file remains for standard plugin configuration if needed.
 */
import typography from '@tailwindcss/typography';
import animate from 'tw-animate-css';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  plugins: [typography, animate],
};