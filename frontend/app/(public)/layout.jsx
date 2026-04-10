import { PublicNavbar } from "@/components/public-navbar"
import { PublicFooter } from "@/components/public-footer"

export default function PublicLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNavbar />
      <main className="flex-1 pt-16">{children}</main>
      <PublicFooter />
    </div>
  )
}
