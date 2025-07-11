import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth-provider"
import { ErrorTrackingProvider } from "@/components/error-tracking-provider"
import { PerformanceMonitoringProvider } from "@/components/performance-monitoring-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "IMS Certify - Certificate Verification System",
  description: "Verify the authenticity of Ethiopian makeup artistry certificates",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <ErrorTrackingProvider>
            <PerformanceMonitoringProvider>
              <AuthProvider>{children}</AuthProvider>
            </PerformanceMonitoringProvider>
          </ErrorTrackingProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
