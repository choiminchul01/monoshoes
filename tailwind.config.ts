import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                green: {
                    50: '#F2F7F4',
                    100: '#E1EFE8',
                    200: '#C4DFD1',
                    300: '#A6CFBA',
                    400: '#6BAF90',
                    500: '#429E75',
                    600: '#2D7A58',
                    700: '#1B4D3E', // Main Deep Forest Green
                    800: '#13382D',
                    900: '#0B241C',
                },
            },
            fontFamily: {
                sans: ["var(--font-inter)", "sans-serif"],
            },
        },
    },
    plugins: [],
};
export default config;
