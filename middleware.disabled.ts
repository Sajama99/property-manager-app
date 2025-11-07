cd ~/Downloads/property - manager - app -with-properties

cat > middleware.ts << 'EOF'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(_req: NextRequest) {
  // allow everything — no auth in middleware to avoid loops/incompatibilities
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!.*\\.).*)'], // run on all routes except static asset files
}
EOF
