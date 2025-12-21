/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#007a33", /* BCG Green */
                "primary-dark": "#005c26",
                "background-light": "#e0e5ec", /* Neumorphic base gray */
                "background-dark": "#0f172a", // Default dark background just in case
                "card-dark": "#1e293b",
            },
            fontFamily: {
                sans: ["Nunito", "sans-serif"],
                display: ["Nunito", "sans-serif"],
            },
            borderRadius: {
                lg: "0.5rem",
                xl: "0.75rem",
                "2xl": "1rem",
            },
            boxShadow: {
                'neo': '6px 6px 12px #bec3c9, -6px -6px 12px #ffffff',
                'neo-hover': '8px 8px 16px #bec3c9, -8px -8px 16px #ffffff',
                'neo-inset': 'inset 6px 6px 12px #bec3c9, inset -6px -6px 12px #ffffff',
                'neo-btn': '4px 4px 8px #bec3c9, -4px -4px 8px #ffffff',
                'neo-btn-hover': '2px 2px 5px #bec3c9, -2px -2px 5px #ffffff',
                'neo-btn-active': 'inset 4px 4px 8px #bec3c9, inset -4px -4px 8px #ffffff',
                'neo-btn-primary': '4px 4px 10px rgba(0, 122, 51, 0.3), -4px -4px 10px rgba(255, 255, 255, 0.5)',
                'neo-btn-primary-hover': '6px 6px 15px rgba(0, 122, 51, 0.4)',
                'neo-btn-primary-active': 'inset 4px 4px 8px rgba(0, 0, 0, 0.2)',
                'neo-sidebar': '10px 0 20px -10px rgba(0, 0, 0, 0.1)',
                'neo-separator': 'inset 0 -1px 0 #bec3c9',
            }
        },
    },
    plugins: [],
}
