import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  resolvedTheme: "dark" | "light"
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  resolvedTheme: "light",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

function getSystemTheme(): "dark" | "light" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

function resolveTheme(theme: Theme): "dark" | "light" {
  return theme === "system" ? getSystemTheme() : theme
}

function applyTheme(resolved: "dark" | "light") {
  const root = window.document.documentElement
  root.classList.remove("light", "dark")
  root.classList.add(resolved)
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme,
  )
  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">(() =>
    resolveTheme(
      (localStorage.getItem(storageKey) as Theme) || defaultTheme,
    ),
  )

  useEffect(() => {
    const resolved = resolveTheme(theme)
    applyTheme(resolved)
    setResolvedTheme(resolved)
  }, [theme])

  useEffect(() => {
    if (theme !== "system") return

    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => {
      const resolved = getSystemTheme()
      applyTheme(resolved)
      setResolvedTheme(resolved)
    }

    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [theme])

  const value = {
    theme,
    resolvedTheme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
