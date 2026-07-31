/**
 * Layout for the (auth) route group — /login and /signup.
 * This group wrapper exists so auth pages share layout without
 * affecting the root layout or dashboard layout.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
