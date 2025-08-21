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
 *       backgroundColor: `hsl(var(--primary))`,
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
    primary: 'hsl(var(--primary))',
    primaryLight: 'hsl(var(--primary))',
    primaryDark: 'hsl(var(--primary))',
    primaryRgb: '59, 130, 246' // Default blue RGB value
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
