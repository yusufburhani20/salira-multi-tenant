import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.tsx',
        './resources/js/**/*.ts',
    ],

    safelist: [
        '-translate-x-full',
        'translate-x-0',
        'opacity-0',
        'opacity-100',
        'invisible',
        'visible',
        'pointer-events-none',
    ],

    theme: {
        extend: {
spacing: {"space-md":"1rem","gutter-sm":"1rem","space-sm":"0.5rem","space-lg":"1.5rem","space-xl":"2rem","margin-sm":"1rem","space-xs":"0.25rem","margin":"2rem","gutter":"1.5rem"},
fontSize: {"headline-sm":["20px",{"lineHeight":"28px","fontWeight":"600"}],"headline-lg":["30px",{"lineHeight":"38px","letterSpacing":"-0.015em","fontWeight":"700"}],"body-md":["14px",{"lineHeight":"20px","fontWeight":"400"}],"body-lg":["16px",{"lineHeight":"24px","fontWeight":"400"}],"headline-lg-mobile":["24px",{"lineHeight":"32px","letterSpacing":"-0.01em","fontWeight":"700"}],"headline-md":["24px",{"lineHeight":"32px","letterSpacing":"-0.01em","fontWeight":"600"}],"title":["16px",{"lineHeight":"24px","fontWeight":"600"}],"label-sm":["11px",{"lineHeight":"14px","letterSpacing":"0.04em","fontWeight":"600"}],"body-sm":["12px",{"lineHeight":"16px","fontWeight":"400"}],"display":["36px",{"lineHeight":"44px","letterSpacing":"-0.02em","fontWeight":"700"}],"label-md":["13px",{"lineHeight":"18px","fontWeight":"500"}]},
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', ...defaultTheme.fontFamily.sans],
            },
            colors: {
...{"outline":"#747686","secondary-fixed-dim":"#bec6e0","tertiary-container":"#006195","on-tertiary-fixed":"#001d32","background":"#f7f9fb","tertiary-fixed":"#cde5ff","on-primary-container":"#cad3ff","inverse-primary":"#b7c4ff","secondary-container":"#dae2fd","on-secondary-fixed":"#131b2e","surface-container-lowest":"#ffffff","inverse-surface":"#2d3133","surface-dim":"#d8dadc","on-background":"#191c1e","surface-tint":"#2151da","on-error-container":"#93000a","primary-container":"#1d4ed8","error-container":"#ffdad6","on-tertiary":"#ffffff","error":"#ba1a1a","surface-bright":"#f7f9fb","on-error":"#ffffff","surface-container-high":"#e6e8ea","primary-fixed":"#dce1ff","secondary-fixed":"#dae2fd","surface-container-low":"#f2f4f6","surface-container-highest":"#e0e3e5","on-primary":"#ffffff","surface":"#f7f9fb","on-primary-fixed-variant":"#0039b5","on-primary-fixed":"#001551","on-tertiary-container":"#b3d9ff","on-secondary-fixed-variant":"#3f465c","tertiary-fixed-dim":"#94ccff","on-secondary":"#ffffff","on-surface":"#191c1e","primary-fixed-dim":"#b7c4ff","inverse-on-surface":"#eff1f3","on-surface-variant":"#434655","surface-container":"#eceef0","primary":"#0037b0","secondary":"#565e74","surface-variant":"#e0e3e5","on-tertiary-fixed-variant":"#004b74","outline-variant":"#c4c5d7","tertiary":"#004871","on-secondary-container":"#5c647a"},
                primary: '#1576a7',
                'primary-hover': '#115d84',
                // Primary (now mapping to salira colors)
                indigo: {
                    50: '#eef6ff',
                    100: '#dbeafe',
                    200: '#bfdbfe',
                    300: '#93c5fd',
                    400: '#60a5fa',
                    500: '#3b82f6',
                    600: '#2563eb', // Primary Core
                    700: '#1d4ed8',
                    800: '#1e40af',
                    900: '#172554',
                },
                salira: {
                    50: '#eef6ff',
                    100: '#dbeafe',
                    200: '#bfdbfe',
                    500: '#3b82f6',
                    600: '#2563eb',
                    700: '#1d4ed8',
                    800: '#1e40af',
                    900: '#172554',
                },
                violet: {
                    500: '#8b5cf6', // Primary Accent
                    600: '#7c3aed',
                },
                // Background Colors
                slate: {
                    50: '#f8fafc',
                    800: '#1e293b',
                    900: '#0f172a',
                },
                // Semantic Colors
                emerald: {
                    500: '#10b981', // Success
                    600: '#059669',
                },
                amber: {
                    500: '#f59e0b', // Warning
                    600: '#d97706',
                },
                red: {
                    500: '#ef4444', // Danger
                    600: '#dc2626',
                }
            },
        },
    },

    plugins: [
        forms,
        require('@tailwindcss/container-queries')
    ],
};
