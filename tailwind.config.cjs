/** @type {import('tailwindcss').Config} */
module.exports = {
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
                sans: ["Plus Jakarta Sans", "sans-serif"],
                display: ["Plus Jakarta Sans", "sans-serif"],
            },
            borderRadius: {
                lg: "0.5rem",
                xl: "0.75rem",
                "2xl": "1rem",
            },
            boxShadow: {
                'skeuo': '6px 6px 12px #b8b9be, -6px -6px 12px #ffffff',
                'skeuo-inset': 'inset 4px 4px 8px #b8b9be, inset -4px -4px 8px #ffffff',
            }
        },
    },
    plugins: [],
}
