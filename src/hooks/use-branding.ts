import { useBranding as useBrandingContext } from '@/contexts/branding-context'

/**
 * Custom hook for accessing branding data throughout the app
 * 
 * @returns Branding data including logos, primary color, agency name, gym name, and loading states
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { whiteLogo, blackLogo, primaryColor, agencyName, gymName, isLoading, error } = useBranding()
 *   
 *   if (isLoading) return <div>Loading...</div>
 *   if (error) return <div>Error: {error}</div>
 *   
 *   return (
 *     <div style={{ backgroundColor: primaryColor }}>
 *       <img src={whiteLogo || blackLogo} alt={agencyName} />
 *       <h1>Welcome to {gymName}</h1>
 *     </div>
 *   )
 * }
 * ```
 */
export function useBranding() {
  return useBrandingContext()
}

/**
 * Hook for getting CSS custom properties for brand colors
 * 
 * @returns Object with CSS custom properties for brand colors
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const brandColors = useBrandColors()
 *   
 *   return (
 *     <div style={{
 *       backgroundColor: `var(--brand-primary)`,
 *       color: `var(--brand-primary-light)`
 *     }}>
 *       Branded content
 *     </div>
 *   )
 * }
 * ```
 */
export function useBrandColors() {
  const { primaryColor } = useBranding()
  
  return {
    primary: primaryColor ? 'var(--brand-primary)' : '#3b82f6',
    primaryLight: primaryColor ? 'var(--brand-primary-light)' : '#60a5fa',
    primaryDark: primaryColor ? 'var(--brand-primary-dark)' : '#2563eb',
    primaryRgb: primaryColor ? 'var(--brand-primary-rgb)' : '59, 130, 246'
  }
}

/**
 * Hook for checking if branding is loaded
 * 
 * @returns Boolean indicating if branding data is loaded
 */
export function useBrandingLoaded() {
  const { isLoading, error, whiteLogo, blackLogo, primaryColor } = useBranding()
  return !isLoading && !error && ((whiteLogo || blackLogo) || primaryColor)
}
