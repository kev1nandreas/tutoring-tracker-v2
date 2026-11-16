import { createTheme } from "@mui/material/styles";

declare module "@mui/material/styles" {
	interface Palette {
		brand: Record<string, string>;
		gold: Record<string, string>;
	}
	interface PaletteOptions {
		brand?: Record<string, string>;
		gold?: Record<string, string>;
	}
}

// Mirrors tailwind.config.ts `primary` / `secondary` palettes (primary is brand blue) so MUI and
// Tailwind-styled parts of the app stay visually consistent.
const muiTheme = createTheme({
	palette: {
		primary: {
			50: "#EFF6FF",
			100: "#DBEAFE",
			200: "#BFDBFE",
			300: "#93C5FD",
			400: "#60A5FA",
			light: "#3B82F6",
			main: "#2563EB",
			dark: "#1D4ED8",
			600: "#2563EB",
			700: "#1D4ED8",
			800: "#1E40AF",
			900: "#1E3A8A",
			contrastText: "#ffffff",
		},
		secondary: {
			50: "#f9d6d5",
			100: "#f6bbba",
			200: "#f19a97",
			300: "#ec7874",
			400: "#e85652",
			light: "#e85652",
			main: "#e3342f",
			dark: "#bd2b27",
			600: "#bd2b27",
			700: "#97231f",
			800: "#721a18",
			900: "#4c1110",
			contrastText: "#ffffff",
		},
		brand: {
			50: "#EFF6FF",
			100: "#DBEAFE",
			200: "#BFDBFE",
			300: "#93C5FD",
			400: "#60A5FA",
			500: "#3B82F6",
			600: "#2563EB", // Primary
			700: "#1D4ED8",
			800: "#1E40AF",
			900: "#1E3A8A",
			950: "#172554",
		},
		gold: {
			50: "#FFF9EC",
			100: "#FFF1D2",
			200: "#FFE2A3",
			300: "#FFD16D",
			400: "#F6BB3F",
			500: "#D79A28", // Primary
			600: "#B57C18",
			700: "#8E6013",
			800: "#68460D",
			900: "#442D08",
		},
		error: { main: "#EF4444", light: "#FEF2F2" },
	},
	shape: { borderRadius: 8 },
	typography: {
		fontFamily: "var(--font-inter), Arial, Helvetica, sans-serif",
	},
	components: {
		MuiButton: {
			defaultProps: { disableElevation: true },
			styleOverrides: {
				root: { textTransform: "none", fontWeight: 500 },
			},
		},
		MuiTextField: { defaultProps: { size: "small", fullWidth: true } },
		MuiFormControl: { defaultProps: { size: "small", fullWidth: true } },
		MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 8 } } },
	},
});

export default muiTheme;
