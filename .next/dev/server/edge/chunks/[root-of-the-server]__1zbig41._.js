(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push(["chunks/[root-of-the-server]__1zbig41._.js",
"[externals]/node:buffer [external] (node:buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:buffer", () => require("node:buffer"));

module.exports = mod;
}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[project]/middleware.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "config",
    ()=>config,
    "middleware",
    ()=>middleware
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$api$2f$server$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/api/server.js [middleware-edge] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/server/web/spec-extension/response.js [middleware-edge] (ecmascript)");
;
const TRIAL_DAYS = 7;
function middleware(req) {
    const res = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
    const trialStart = req.cookies.get('mindcash_trial_start')?.value;
    const isPaid = req.cookies.get('mindcash_paid')?.value === 'true';
    const isRegistered = req.cookies.get('mindcash_registered')?.value === 'true';
    // Se não existe trial, cria no primeiro acesso
    if (!trialStart) {
        const now = Date.now().toString();
        res.cookies.set('mindcash_trial_start', now, {
            maxAge: 60 * 60 * 24 * 30,
            path: '/'
        });
        return res;
    }
    const trialStartDate = Number(trialStart);
    const now = Date.now();
    const diffDays = Math.floor((now - trialStartDate) / (1000 * 60 * 60 * 24));
    const trialExpired = diffDays >= TRIAL_DAYS;
    // Se o trial expirou e o usuário NÃO está registrado + pago
    if (trialExpired && (!isPaid || !isRegistered)) {
        const blockedRoutes = [
            '/add-expense',
            '/add-income'
        ];
        const isBlockedRoute = blockedRoutes.some((route)=>req.nextUrl.pathname.startsWith(route));
        if (isBlockedRoute) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL('/upgrade', req.url));
        }
    }
    return res;
}
const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
    ]
};
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__1zbig41._.js.map