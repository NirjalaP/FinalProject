import { extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
  fonts: {
    heading: "Inter, sans-serif",
    body: "Inter, sans-serif",
  },
  colors: {
    brand: {
      50: "#f0f9ff",
      100: "#e0f2fe",
      200: "#bae6fd",
      300: "#7dd3fc",
      400: "#38bdf8",
      500: "#0ea5e9",
      600: "#0284c7",
      700: "#0369a1",
      800: "#075985",
      900: "#0c4a6e",
    },
    green: {
      50: "#f0fdf4",
      100: "#dcfce7",
      200: "#bbf7d0",
      300: "#86efac",
      400: "#4ade80",
      500: "#22c55e",
      600: "#16a34a",
      700: "#15803d",
      800: "#166534",
      900: "#14532d",
    },
  },
  components: {
    Button: {
      variants: {
        solid: {
          fontWeight: "500",
          borderRadius: "lg",
          _hover: {
            transform: "translateY(-1px)",
            boxShadow: "lg",
          },
        },
        outline: {
          fontWeight: "500",
          borderRadius: "lg",
          _hover: {
            transform: "translateY(-1px)",
          },
        },
      },
    },
    Card: {
      baseStyle: {
        container: {
          borderRadius: "xl",
          boxShadow: "sm",
          border: "1px solid",
          borderColor: "gray.100",
          _hover: {
            boxShadow: "md",
          },
        },
      },
    },
    Input: {
      variants: {
        filled: {
          field: {
            borderRadius: "lg",
            _focus: {
              borderColor: "brand.500",
              boxShadow: "0 0 0 1px var(--chakra-colors-brand-500)",
            },
          },
        },
      },
    },
  },
  styles: {
    global: {
      body: {
        bg: "gray.50",
      },
    },
  },
});

export default theme;





