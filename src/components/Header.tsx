'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { HomeIcon } from 'lucide-react'
import { logout } from '@/lib/actions/auth'

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <HomeIcon className="h-5 w-5" />
              <span className="sr-only">ダッシュボードへ戻る</span>
            </Link>
          </Button>
          <Link href="/" className="text-lg font-bold">
            m-manager
          </Link>
        </div>
        <form action={logout}>
          <Button variant="outline">Logout</Button>
        </form>
      </div>
    </header>
  )
}
