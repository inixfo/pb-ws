module.exports = {
  content: [
    "./src/**/*.{html,js,ts,jsx,tsx}",
    "app/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dangermain: "var(--dangermain)",
        "gray-100": "var(--gray-100)",
        "gray-200": "var(--gray-200)",
        "gray-300": "var(--gray-300)",
        "gray-400": "var(--gray-400)",
        "gray-50": "var(--gray-50)",
        "gray-500": "var(--gray-500)",
        "gray-600": "var(--gray-600)",
        "gray-700": "var(--gray-700)",
        "gray-800": "var(--gray-800)",
        "gray-900": "var(--gray-900)",
        infomain: "var(--infomain)",
        primaryaction: "var(--primaryaction)",
        primarymain: "var(--primarymain)",
        successmain: "var(--successmain)",
        warningmain: "var(--warningmain)",
        "white-100": "var(--white-100)",
        "white-25": "var(--white-25)",
        "white-80": "var(--white-80)",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        "body-extra-small": "var(--body-extra-small-font-family)",
        "body-extrasmall": "var(--body-extrasmall-font-family)",
        "body-regular": "var(--body-regular-font-family)",
        "body-small": "var(--body-small-font-family)",
        "display-desktop-d2": "var(--display-desktop-d2-font-family)",
        "display-desktop-d4": "var(--display-desktop-d4-font-family)",
        "heading-desktop-h3": "var(--heading-desktop-h3-font-family)",
        "heading-desktop-h4": "var(--heading-desktop-h4-font-family)",
        "heading-desktop-h5": "var(--heading-desktop-h5-font-family)",
        "heading-desktop-h6": "var(--heading-desktop-h6-font-family)",
        "heading-h6": "var(--heading-h6-font-family)",
        "navigation-nav-link-extra-small":
          "var(--navigation-nav-link-extra-small-font-family)",
        "navigation-nav-link-regular":
          "var(--navigation-nav-link-regular-font-family)",
        "navigation-nav-link-small":
          "var(--navigation-nav-link-small-font-family)",
        sans: [
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"',
          '"Noto Color Emoji"',
        ],
      },
      boxShadow: {
        "shadow-light-mode-medium": "var(--shadow-light-mode-medium)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
    container: { center: true, padding: "2rem", screens: { "2xl": "1400px" } },
  },
  plugins: [],
  darkMode: ["class"],
};
