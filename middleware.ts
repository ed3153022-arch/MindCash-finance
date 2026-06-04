import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const TRIAL_DAYS = 7

export function middleware(req: NextRequest) {
  const res = NextResponse.next()

  const trialStart = req.cookies.get('mindcash_trial_start')?.value
  const isPaid = req.cookies.get('mindcash_paid')?.value === 'true'
  const isRegistered = req.cookies.get('mindcash_registered')?.value === 'true'

  // Se não existe trial, cria no primeiro acesso
  if (!trialStart) {
    const now = Date.now().toString()
    res.cookies.set('mindcash_trial_start', now, {
      maxAge: 60 * 60 * 24 * 30, // 30 dias
      path: '/',
    })
    return res
  }

  const trialStartDate = Number(trialStart)
  const now = Date.now()
  const diffDays = Math.floor((now - trialStartDate) / (1000 * 60 * 60 * 24))

  const trialExpired = diffDays >= TRIAL_DAYS

  // Se o trial expirou e o usuário NÃO está registrado + pago
  if (trialExpired && (!isPaid || !isRegistered)) {
    const blockedRoutes = ['/add-expense', '/add-income']

    const isBlockedRoute = blockedRoutes.some(route =>
      req.nextUrl.pathname.startsWith(route)
    )

    if (isBlockedRoute) {
      return NextResponse.redirect(new URL('/upgrade', req.url))
    }
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
