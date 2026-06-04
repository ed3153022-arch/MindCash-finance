(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/lib/utils.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "calculateFinancialSummary",
    ()=>calculateFinancialSummary,
    "cn",
    ()=>cn,
    "filterTransactionsByPeriod",
    ()=>filterTransactionsByPeriod,
    "formatCurrency",
    ()=>formatCurrency,
    "formatDate",
    ()=>formatDate,
    "generateId",
    ()=>generateId,
    "getCategoryData",
    ()=>getCategoryData,
    "shouldShowAlert",
    ()=>shouldShowAlert
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-client] (ecmascript)");
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
function formatCurrency(amount) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(amount);
}
function formatDate(date) {
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(new Date(date));
}
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}
function filterTransactionsByPeriod(transactions, period) {
    const now = new Date();
    const startDate = new Date();
    switch(period){
        case 'day':
            startDate.setHours(0, 0, 0, 0);
            break;
        case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
        case 'month':
            startDate.setMonth(now.getMonth());
            startDate.setDate(1);
            startDate.setHours(0, 0, 0, 0);
            break;
    }
    return transactions.filter((transaction)=>new Date(transaction.date) >= startDate);
}
function calculateFinancialSummary(transactions, monthlyGoal) {
    const income = transactions.filter((t)=>t.type === 'income').reduce((sum, t)=>sum + t.amount, 0);
    const expenses = transactions.filter((t)=>t.type === 'expense').reduce((sum, t)=>sum + t.amount, 0);
    const balance = income - expenses;
    const monthlyGoalProgress = monthlyGoal ? Math.min(balance / monthlyGoal * 100, 100) : 0;
    return {
        totalIncome: income,
        totalExpenses: expenses,
        balance,
        monthlyGoalProgress
    };
}
function getCategoryData(transactions) {
    const expenses = transactions.filter((t)=>t.type === 'expense');
    const totalExpenses = expenses.reduce((sum, t)=>sum + t.amount, 0);
    const categoryMap = new Map();
    expenses.forEach((transaction)=>{
        const current = categoryMap.get(transaction.category) || 0;
        categoryMap.set(transaction.category, current + transaction.amount);
    });
    const colors = [
        '#D4AF37',
        '#B8860B',
        '#DAA520',
        '#FFD700',
        '#F4A460',
        '#CD853F',
        '#DEB887',
        '#F5DEB3',
        '#FFEBCD',
        '#FFF8DC'
    ];
    return Array.from(categoryMap.entries()).map(([name, amount], index)=>({
            name,
            amount,
            percentage: totalExpenses > 0 ? amount / totalExpenses * 100 : 0,
            color: colors[index % colors.length]
        }));
}
function shouldShowAlert(transactions, alertLimit) {
    if (!alertLimit) return false;
    const monthlyExpenses = filterTransactionsByPeriod(transactions, 'month').filter((t)=>t.type === 'expense').reduce((sum, t)=>sum + t.amount, 0);
    return monthlyExpenses > alertLimit;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/ui/button.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Button",
    ()=>Button,
    "buttonVariants",
    ()=>buttonVariants
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-slot/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/class-variance-authority/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-client] (ecmascript)");
;
;
;
;
;
const buttonVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cva"])("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", {
    variants: {
        variant: {
            default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
            destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
            outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
            secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
            ghost: "hover:bg-accent hover:text-accent-foreground",
            link: "text-primary underline-offset-4 hover:underline"
        },
        size: {
            default: "h-9 px-4 py-2",
            sm: "h-8 rounded-md px-3 text-xs",
            lg: "h-10 rounded-md px-8",
            icon: "h-9 w-9"
        }
    },
    defaultVariants: {
        variant: "default",
        size: "default"
    }
});
const Button = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"](_c = ({ className, variant, size, asChild = false, ...props }, ref)=>{
    const Comp = asChild ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Slot"] : "button";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Comp, {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])(buttonVariants({
            variant,
            size,
            className
        })),
        ref: ref,
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/button.tsx",
        lineNumber: 46,
        columnNumber: 7
    }, ("TURBOPACK compile-time value", void 0));
});
_c1 = Button;
Button.displayName = "Button";
;
var _c, _c1;
__turbopack_context__.k.register(_c, "Button$React.forwardRef");
__turbopack_context__.k.register(_c1, "Button");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/ui/card.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Card",
    ()=>Card,
    "CardAction",
    ()=>CardAction,
    "CardContent",
    ()=>CardContent,
    "CardDescription",
    ()=>CardDescription,
    "CardFooter",
    ()=>CardFooter,
    "CardHeader",
    ()=>CardHeader,
    "CardTitle",
    ()=>CardTitle
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-client] (ecmascript)");
;
;
function Card({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-slot": "card",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/card.tsx",
        lineNumber: 7,
        columnNumber: 5
    }, this);
}
_c = Card;
function CardHeader({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-slot": "card-header",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/card.tsx",
        lineNumber: 20,
        columnNumber: 5
    }, this);
}
_c1 = CardHeader;
function CardTitle({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-slot": "card-title",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("leading-none font-semibold", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/card.tsx",
        lineNumber: 33,
        columnNumber: 5
    }, this);
}
_c2 = CardTitle;
function CardDescription({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-slot": "card-description",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("text-muted-foreground text-sm", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/card.tsx",
        lineNumber: 43,
        columnNumber: 5
    }, this);
}
_c3 = CardDescription;
function CardAction({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-slot": "card-action",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/card.tsx",
        lineNumber: 53,
        columnNumber: 5
    }, this);
}
_c4 = CardAction;
function CardContent({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-slot": "card-content",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("px-6", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/card.tsx",
        lineNumber: 66,
        columnNumber: 5
    }, this);
}
_c5 = CardContent;
function CardFooter({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-slot": "card-footer",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("flex items-center px-6 [.border-t]:pt-6", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/card.tsx",
        lineNumber: 76,
        columnNumber: 5
    }, this);
}
_c6 = CardFooter;
;
var _c, _c1, _c2, _c3, _c4, _c5, _c6;
__turbopack_context__.k.register(_c, "Card");
__turbopack_context__.k.register(_c1, "CardHeader");
__turbopack_context__.k.register(_c2, "CardTitle");
__turbopack_context__.k.register(_c3, "CardDescription");
__turbopack_context__.k.register(_c4, "CardAction");
__turbopack_context__.k.register(_c5, "CardContent");
__turbopack_context__.k.register(_c6, "CardFooter");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/ui/alert.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Alert",
    ()=>Alert,
    "AlertDescription",
    ()=>AlertDescription,
    "AlertTitle",
    ()=>AlertTitle
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/class-variance-authority/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-client] (ecmascript)");
;
;
;
const alertVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cva"])("relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current", {
    variants: {
        variant: {
            default: "bg-card text-card-foreground",
            destructive: "text-destructive bg-card [&>svg]:text-current *:data-[slot=alert-description]:text-destructive/90"
        }
    },
    defaultVariants: {
        variant: "default"
    }
});
function Alert({ className, variant, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-slot": "alert",
        role: "alert",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])(alertVariants({
            variant
        }), className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/alert.tsx",
        lineNumber: 28,
        columnNumber: 5
    }, this);
}
_c = Alert;
function AlertTitle({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-slot": "alert-title",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/alert.tsx",
        lineNumber: 39,
        columnNumber: 5
    }, this);
}
_c1 = AlertTitle;
function AlertDescription({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-slot": "alert-description",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/alert.tsx",
        lineNumber: 55,
        columnNumber: 5
    }, this);
}
_c2 = AlertDescription;
;
var _c, _c1, _c2;
__turbopack_context__.k.register(_c, "Alert");
__turbopack_context__.k.register(_c1, "AlertTitle");
__turbopack_context__.k.register(_c2, "AlertDescription");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/PageTransition.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AnimatedContainer",
    ()=>AnimatedContainer,
    "FadeIn",
    ()=>FadeIn,
    "PageTransition",
    ()=>PageTransition,
    "StaggerContainer",
    ()=>StaggerContainer,
    "StaggerItem",
    ()=>StaggerItem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
'use client';
;
function PageTransition({ children, className = '' }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: className,
        children: children
    }, void 0, false, {
        fileName: "[project]/src/components/PageTransition.tsx",
        lineNumber: 12,
        columnNumber: 5
    }, this);
}
_c = PageTransition;
function AnimatedContainer({ children, delay = 0, className = '' }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: className,
        children: children
    }, void 0, false, {
        fileName: "[project]/src/components/PageTransition.tsx",
        lineNumber: 30,
        columnNumber: 5
    }, this);
}
_c1 = AnimatedContainer;
function FadeIn({ children, direction = 'up', delay = 0, className = '' }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: className,
        children: children
    }, void 0, false, {
        fileName: "[project]/src/components/PageTransition.tsx",
        lineNumber: 50,
        columnNumber: 5
    }, this);
}
_c2 = FadeIn;
function StaggerContainer({ children, staggerDelay = 0.1, className = '' }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: className,
        children: children
    }, void 0, false, {
        fileName: "[project]/src/components/PageTransition.tsx",
        lineNumber: 68,
        columnNumber: 5
    }, this);
}
_c3 = StaggerContainer;
function StaggerItem({ children, className = '' }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: className,
        children: children
    }, void 0, false, {
        fileName: "[project]/src/components/PageTransition.tsx",
        lineNumber: 81,
        columnNumber: 5
    }, this);
}
_c4 = StaggerItem;
var _c, _c1, _c2, _c3, _c4;
__turbopack_context__.k.register(_c, "PageTransition");
__turbopack_context__.k.register(_c1, "AnimatedContainer");
__turbopack_context__.k.register(_c2, "FadeIn");
__turbopack_context__.k.register(_c3, "StaggerContainer");
__turbopack_context__.k.register(_c4, "StaggerItem");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/supabase.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "supabase",
    ()=>supabase,
    "testSupabaseConnection",
    ()=>testSupabaseConnection
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/supabase-js/dist/index.mjs [app-client] (ecmascript) <locals>");
;
// 🔐 Variáveis de ambiente (sem quebrar build)
const supabaseUrl = ("TURBOPACK compile-time value", "https://mkvgaxqhxuqjtfaiqxsi.supabase.co") || '';
const supabaseAnonKey = ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rdmdheHFoeHVxanRmYWlxeHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MTU2NDcsImV4cCI6MjA4NjM5MTY0N30.fJf2aeCtnVoE1vOFG8mn4Aav1tsMEj6fFu0Mnwe26QM") || '';
// ⚠️ Log apenas (não quebra build)
if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storage: ("TURBOPACK compile-time truthy", 1) ? window.localStorage : "TURBOPACK unreachable",
        storageKey: 'mindcash_user_session'
    },
    global: {
        headers: {
            'X-Client-Info': 'mindcash-web-app'
        }
    }
});
const testSupabaseConnection = async ()=>{
    try {
        const { error } = await supabase.from('profiles').select('id').limit(1);
        if (error) {
            console.error('❌ Supabase connection failed:', error.message);
            return false;
        }
        console.log('✅ Supabase connection successful');
        return true;
    } catch (error) {
        console.error('❌ Supabase connection error:', error);
        return false;
    }
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/local-auth.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Sistema de autenticação local para desenvolvimento
__turbopack_context__.s([
    "LocalAuthService",
    ()=>LocalAuthService
]);
const STORAGE_KEYS = {
    USERS: 'mindcash_users',
    SESSION: 'mindcash_user_session'
};
class LocalAuthService {
    // Gerar ID único
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    // Gerar token de sessão
    static generateToken() {
        return btoa(Date.now().toString() + Math.random().toString());
    }
    // Hash simples para senha (apenas para desenvolvimento)
    static hashPassword(password) {
        return btoa(password + 'mindcash_salt');
    }
    // Verificar senha
    static verifyPassword(password, hash) {
        return this.hashPassword(password) === hash;
    }
    // Obter usuários do localStorage
    static getUsers() {
        try {
            const users = localStorage.getItem(STORAGE_KEYS.USERS);
            return users ? JSON.parse(users) : [];
        } catch  {
            return [];
        }
    }
    // Salvar usuários no localStorage
    static saveUsers(users) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
    // Obter sessão atual
    static getCurrentSession() {
        try {
            const session = localStorage.getItem(STORAGE_KEYS.SESSION);
            if (!session) return null;
            const sessionData = JSON.parse(session);
            // Verificar se a sessão não expirou
            if (Date.now() > sessionData.expiresAt) {
                localStorage.removeItem(STORAGE_KEYS.SESSION);
                return null;
            }
            return sessionData;
        } catch  {
            return null;
        }
    }
    // Salvar sessão
    static saveSession(user) {
        const token = this.generateToken();
        const sessionData = {
            user,
            token,
            expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 dias
        };
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(sessionData));
        return token;
    }
    // Cadastrar usuário
    static async signUp(email, password, fullName) {
        try {
            // Validações
            if (!email || !password) {
                return {
                    success: false,
                    error: 'E-mail e senha são obrigatórios'
                };
            }
            if (!email.includes('@')) {
                return {
                    success: false,
                    error: 'Por favor, digite um e-mail válido'
                };
            }
            if (password.length < 6) {
                return {
                    success: false,
                    error: 'A senha deve ter pelo menos 6 caracteres'
                };
            }
            const users = this.getUsers();
            // Verificar se o usuário já existe
            const existingUser = users.find((u)=>u.email.toLowerCase() === email.toLowerCase());
            if (existingUser) {
                return {
                    success: false,
                    error: 'Já existe uma conta com este e-mail. Faça login.'
                };
            }
            // Criar novo usuário
            const newUser = {
                id: this.generateId(),
                email: email.toLowerCase(),
                password: this.hashPassword(password),
                fullName,
                createdAt: new Date().toISOString()
            };
            users.push(newUser);
            this.saveUsers(users);
            // Criar sessão automaticamente
            this.saveSession(newUser);
            return {
                success: true,
                data: {
                    id: newUser.id,
                    email: newUser.email,
                    user_metadata: {
                        full_name: newUser.fullName
                    }
                },
                message: 'Conta criada com sucesso!'
            };
        } catch (error) {
            return {
                success: false,
                error: 'Erro inesperado ao criar conta. Tente novamente.'
            };
        }
    }
    // Fazer login
    static async signIn(email, password) {
        try {
            // Validações
            if (!email || !password) {
                return {
                    success: false,
                    error: 'E-mail e senha são obrigatórios'
                };
            }
            const users = this.getUsers();
            // Encontrar usuário
            const user = users.find((u)=>u.email.toLowerCase() === email.toLowerCase());
            if (!user) {
                return {
                    success: false,
                    error: 'E-mail ou senha incorretos'
                };
            }
            // Verificar senha
            if (!this.verifyPassword(password, user.password)) {
                return {
                    success: false,
                    error: 'E-mail ou senha incorretos'
                };
            }
            // Criar nova sessão
            this.saveSession(user);
            return {
                success: true,
                data: {
                    id: user.id,
                    email: user.email,
                    user_metadata: {
                        full_name: user.fullName
                    }
                },
                message: 'Login realizado com sucesso!'
            };
        } catch (error) {
            return {
                success: false,
                error: 'Erro inesperado ao fazer login. Tente novamente.'
            };
        }
    }
    // Fazer logout
    static async signOut() {
        try {
            localStorage.removeItem(STORAGE_KEYS.SESSION);
            return {
                success: true,
                message: 'Logout realizado com sucesso!'
            };
        } catch (error) {
            return {
                success: false,
                error: 'Erro ao fazer logout'
            };
        }
    }
    // Obter usuário atual
    static getCurrentUser() {
        const session = this.getCurrentSession();
        if (!session) return null;
        return {
            id: session.user.id,
            email: session.user.email,
            user_metadata: {
                full_name: session.user.fullName
            }
        };
    }
    // Verificar se está autenticado
    static isAuthenticated() {
        return this.getCurrentSession() !== null;
    }
    // Simular listener de mudanças de estado
    static onAuthStateChange(callback) {
        // Verificar estado inicial
        const currentUser = this.getCurrentUser();
        callback(currentUser);
        // Simular subscription (para compatibilidade)
        return {
            data: {
                subscription: {
                    unsubscribe: ()=>{
                    // Cleanup se necessário
                    }
                }
            }
        };
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/auth.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AuthService",
    ()=>AuthService
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$local$2d$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/local-auth.ts [app-client] (ecmascript)");
;
;
class AuthService {
    static isSupabaseAvailable() {
        return !!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"]?.auth;
    }
    // =========================
    // SIGN UP
    // =========================
    static async signUp({ email, password, fullName }) {
        try {
            if (!this.isSupabaseAvailable()) {
                return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$local$2d$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LocalAuthService"].signUp(email, password, fullName);
            }
            const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.signUp({
                email: email.trim().toLowerCase(),
                password,
                options: {
                    data: {
                        full_name: fullName || ''
                    }
                }
            });
            if (error || !data.user) {
                return {
                    success: false,
                    error: error?.message || 'Erro ao criar conta.'
                };
            }
            return {
                success: true,
                data: data.user,
                message: 'Conta criada com sucesso!'
            };
        } catch  {
            return {
                success: false,
                error: 'Erro inesperado ao criar conta.'
            };
        }
    }
    // =========================
    // SIGN IN
    // =========================
    static async signIn({ email, password }) {
        try {
            if (!this.isSupabaseAvailable()) {
                return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$local$2d$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LocalAuthService"].signIn(email, password);
            }
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.signOut();
            const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.signInWithPassword({
                email: email.trim().toLowerCase(),
                password
            });
            if (error || !data.user || !data.session) {
                return {
                    success: false,
                    error: error?.message || 'Falha no login.'
                };
            }
            return {
                success: true,
                data: data.user,
                message: 'Login realizado com sucesso!'
            };
        } catch  {
            return {
                success: false,
                error: 'Erro inesperado ao fazer login.'
            };
        }
    }
    // =========================
    // SIGN IN WITH GOOGLE
    // =========================
    static async signInWithGoogle() {
        try {
            if (!this.isSupabaseAvailable()) {
                return {
                    success: false,
                    error: 'Login social não disponível.'
                };
            }
            const { error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/dashboard`
                }
            });
            if (error) {
                return {
                    success: false,
                    error: error.message
                };
            }
            return {
                success: true
            };
        } catch  {
            return {
                success: false,
                error: 'Erro inesperado ao fazer login com Google.'
            };
        }
    }
    // =========================
    // SIGN OUT
    // =========================
    static async signOut() {
        try {
            if (!this.isSupabaseAvailable()) {
                return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$local$2d$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LocalAuthService"].signOut();
            }
            const { error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.signOut();
            if (error) {
                return {
                    success: false,
                    error: error.message
                };
            }
            return {
                success: true
            };
        } catch  {
            return {
                success: false,
                error: 'Erro ao fazer logout.'
            };
        }
    }
    // =========================
    // RESET PASSWORD
    // =========================
    static async resetPassword({ email }) {
        try {
            if (!this.isSupabaseAvailable()) {
                return {
                    success: false,
                    error: 'Recuperação não disponível.'
                };
            }
            const { error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.resetPasswordForEmail(email);
            if (error) {
                return {
                    success: false,
                    error: error.message
                };
            }
            return {
                success: true,
                message: 'E-mail de recuperação enviado.'
            };
        } catch  {
            return {
                success: false,
                error: 'Erro ao enviar recuperação.'
            };
        }
    }
    // =========================
    // UPDATE PASSWORD
    // =========================
    static async updatePassword({ password }) {
        try {
            if (!this.isSupabaseAvailable()) {
                return {
                    success: false,
                    error: 'Atualização não disponível.'
                };
            }
            const { error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.updateUser({
                password
            });
            if (error) {
                return {
                    success: false,
                    error: error.message
                };
            }
            return {
                success: true,
                message: 'Senha atualizada com sucesso!'
            };
        } catch  {
            return {
                success: false,
                error: 'Erro ao atualizar senha.'
            };
        }
    }
    // =========================
    // CURRENT USER
    // =========================
    static async getCurrentUser() {
        try {
            if (!this.isSupabaseAvailable()) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$local$2d$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LocalAuthService"].getCurrentUser();
            }
            const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.getUser();
            return data.user;
        } catch  {
            return null;
        }
    }
    // =========================
    // CURRENT SESSION
    // =========================
    static async getCurrentSession() {
        try {
            if (!this.isSupabaseAvailable()) {
                return null;
            }
            const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.getSession();
            return data.session;
        } catch  {
            return null;
        }
    }
    // =========================
    // AUTH STATE CHANGE
    // =========================
    static onAuthStateChange(callback) {
        if (!this.isSupabaseAvailable()) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$local$2d$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LocalAuthService"].onAuthStateChange(callback);
        }
        const { data } = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.onAuthStateChange((_event, session)=>{
            callback(session?.user);
        });
        return {
            data
        };
    }
    // =========================
    // IS AUTHENTICATED
    // =========================
    static async isAuthenticated() {
        const session = await this.getCurrentSession();
        return !!session?.user;
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/hooks/useAuth.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useAuth",
    ()=>useAuth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/auth.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
'use client';
;
;
function useAuth() {
    _s();
    const [state, setState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        user: null,
        loading: true,
        error: null
    });
    // Refresh auth state
    const refreshAuth = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useAuth.useCallback[refreshAuth]": async ()=>{
            try {
                setState({
                    "useAuth.useCallback[refreshAuth]": (prev)=>({
                            ...prev,
                            loading: true,
                            error: null
                        })
                }["useAuth.useCallback[refreshAuth]"]);
                const user = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AuthService"].getCurrentUser();
                setState({
                    user,
                    loading: false,
                    error: null
                });
            } catch (error) {
                console.error('❌ Error refreshing auth state:', error);
                setState({
                    user: null,
                    loading: false,
                    error: error.message || 'Falha ao obter sessão do usuário'
                });
            }
        }
    }["useAuth.useCallback[refreshAuth]"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useAuth.useEffect": ()=>{
            let mounted = true;
            let subscription = null;
            const getInitialSession = {
                "useAuth.useEffect.getInitialSession": async ()=>{
                    try {
                        console.log('🔄 Getting initial auth session...');
                        const user = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AuthService"].getCurrentUser();
                        if (mounted) {
                            setState({
                                user,
                                loading: false,
                                error: null
                            });
                        }
                        console.log(user ? '✅ User authenticated on load' : '❌ No authenticated user on load');
                    } catch (error) {
                        console.error('❌ Error getting initial session:', error);
                        if (mounted) {
                            setState({
                                user: null,
                                loading: false,
                                error: error.message || 'Falha ao obter sessão do usuário'
                            });
                        }
                    }
                }
            }["useAuth.useEffect.getInitialSession"];
            getInitialSession();
            console.log('🔄 Setting up auth state listener...');
            const { data: { subscription: authSubscription } } = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AuthService"].onAuthStateChange({
                "useAuth.useEffect": (user)=>{
                    console.log('🔄 Auth state change detected:', user?.email || 'No user');
                    if (mounted) {
                        setState({
                            "useAuth.useEffect": (prev)=>({
                                    ...prev,
                                    user,
                                    loading: false,
                                    error: null
                                })
                        }["useAuth.useEffect"]);
                    }
                }
            }["useAuth.useEffect"]);
            subscription = authSubscription;
            return ({
                "useAuth.useEffect": ()=>{
                    mounted = false;
                    if (subscription && subscription.unsubscribe) {
                        console.log('🔄 Cleaning up auth state listener...');
                        subscription.unsubscribe();
                    }
                }
            })["useAuth.useEffect"];
        }
    }["useAuth.useEffect"], []);
    // EMAIL LOGIN
    const signIn = async (email, password)=>{
        try {
            setState((prev)=>({
                    ...prev,
                    loading: true,
                    error: null
                }));
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AuthService"].signIn({
                email,
                password
            });
            if (result.success) {
                setState((prev)=>({
                        ...prev,
                        user: result.data || null,
                        loading: false,
                        error: null
                    }));
                return {
                    success: true
                };
            } else {
                setState((prev)=>({
                        ...prev,
                        loading: false,
                        error: result.error || 'Falha no login'
                    }));
                return {
                    success: false,
                    error: result.error
                };
            }
        } catch (error) {
            const errorMessage = error.message || 'Erro inesperado';
            setState((prev)=>({
                    ...prev,
                    loading: false,
                    error: errorMessage
                }));
            return {
                success: false,
                error: errorMessage
            };
        }
    };
    // GOOGLE LOGIN 🔥
    const signInWithGoogle = async ()=>{
        try {
            setState((prev)=>({
                    ...prev,
                    loading: true,
                    error: null
                }));
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AuthService"].signInWithGoogle();
            if (result?.error) {
                setState((prev)=>({
                        ...prev,
                        loading: false,
                        error: result.error
                    }));
                return {
                    error: result.error
                };
            }
            return {};
        } catch (error) {
            const errorMessage = error.message || 'Erro ao entrar com Google';
            setState((prev)=>({
                    ...prev,
                    loading: false,
                    error: errorMessage
                }));
            return {
                error: errorMessage
            };
        }
    };
    const signUp = async (email, password, fullName)=>{
        try {
            setState((prev)=>({
                    ...prev,
                    loading: true,
                    error: null
                }));
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AuthService"].signUp({
                email,
                password,
                fullName
            });
            if (result.success) {
                setState((prev)=>({
                        ...prev,
                        user: result.data || null,
                        loading: false,
                        error: null
                    }));
                return {
                    success: true
                };
            } else {
                setState((prev)=>({
                        ...prev,
                        loading: false,
                        error: result.error || 'Falha no cadastro'
                    }));
                return {
                    success: false,
                    error: result.error
                };
            }
        } catch (error) {
            const errorMessage = error.message || 'Erro inesperado';
            setState((prev)=>({
                    ...prev,
                    loading: false,
                    error: errorMessage
                }));
            return {
                success: false,
                error: errorMessage
            };
        }
    };
    const signOut = async ()=>{
        try {
            setState((prev)=>({
                    ...prev,
                    loading: true
                }));
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AuthService"].signOut();
            setState({
                user: null,
                loading: false,
                error: null
            });
        } catch (error) {
            setState({
                user: null,
                loading: false,
                error: error.message || 'Falha no logout'
            });
        }
    };
    const resetPassword = async (email)=>{
        try {
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AuthService"].resetPassword({
                email
            });
            if (!result.success) {
                setState((prev)=>({
                        ...prev,
                        error: result.error || 'Falha na recuperação de senha'
                    }));
                return false;
            }
            setState((prev)=>({
                    ...prev,
                    error: null
                }));
            return true;
        } catch (error) {
            setState((prev)=>({
                    ...prev,
                    error: error.message || 'Falha na recuperação de senha'
                }));
            return false;
        }
    };
    return {
        ...state,
        signIn,
        signUp,
        signOut,
        resetPassword,
        refreshAuth,
        signInWithGoogle
    };
}
_s(useAuth, "zXDx+narRAyZIuR0lTClaVGC1NU=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/app/auth/login/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>LoginPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/button.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/card.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$alert$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/alert.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$PageTransition$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/PageTransition.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useAuth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useAuth.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/loader-circle.js [app-client] (ecmascript) <export default as Loader2>");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
;
;
function LoginPage() {
    _s();
    const { signInWithGoogle, loading } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useAuth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const handleGoogleLogin = async ()=>{
        setError('');
        const { error } = await signInWithGoogle();
        if (error) {
            setError(error);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$PageTransition$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PageTransition"], {
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "min-h-screen flex items-center justify-center bg-black px-4",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-full max-w-md",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
                    className: "bg-neutral-900 border-neutral-800 shadow-xl",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardContent"], {
                        className: "py-10 px-8 space-y-8 text-center",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-col items-center space-y-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "h-14 w-14 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-400 flex items-center justify-center shadow-lg",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-black font-bold text-xl",
                                            children: "M"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/auth/login/page.tsx",
                                            lineNumber: 34,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/auth/login/page.tsx",
                                        lineNumber: 33,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "text-2xl font-bold text-white",
                                        children: "bem-vindo ao MindCash Finance"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/auth/login/page.tsx",
                                        lineNumber: 37,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-sm text-gray-400",
                                        children: "Continue com sua conta Google para acessar o MindCash."
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/auth/login/page.tsx",
                                        lineNumber: 41,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/auth/login/page.tsx",
                                lineNumber: 32,
                                columnNumber: 15
                            }, this),
                            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$alert$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Alert"], {
                                className: "bg-red-500/10 border-red-500/30 text-red-400",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$alert$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlertDescription"], {
                                    children: error
                                }, void 0, false, {
                                    fileName: "[project]/src/app/auth/login/page.tsx",
                                    lineNumber: 49,
                                    columnNumber: 19
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/auth/login/page.tsx",
                                lineNumber: 48,
                                columnNumber: 17
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                type: "button",
                                onClick: handleGoogleLogin,
                                disabled: loading,
                                className: "w-full h-11 flex items-center justify-center gap-3 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold transition-all",
                                children: loading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                                            className: "h-4 w-4 animate-spin"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/auth/login/page.tsx",
                                            lineNumber: 62,
                                            columnNumber: 21
                                        }, this),
                                        "Conectando..."
                                    ]
                                }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                            width: "18",
                                            height: "18",
                                            viewBox: "0 0 24 24",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                fill: "#000000",
                                                d: "M21.35 11.1h-9.18v2.92h5.27c-.23 1.3-1.6 3.81-5.27 3.81-3.17 0-5.75-2.62-5.75-5.85s2.58-5.85 5.75-5.85c1.8 0 3 .77 3.69 1.44l2.52-2.44C16.8 3.98 14.68 3 12 3 7 3 3 7.03 3 12s4 9 9 9c5.2 0 8.64-3.64 8.64-8.76 0-.59-.07-1.04-.29-1.14z"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/auth/login/page.tsx",
                                                lineNumber: 68,
                                                columnNumber: 23
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/auth/login/page.tsx",
                                            lineNumber: 67,
                                            columnNumber: 21
                                        }, this),
                                        "Continuar com Google"
                                    ]
                                }, void 0, true)
                            }, void 0, false, {
                                fileName: "[project]/src/app/auth/login/page.tsx",
                                lineNumber: 54,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/auth/login/page.tsx",
                        lineNumber: 29,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/app/auth/login/page.tsx",
                    lineNumber: 28,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/app/auth/login/page.tsx",
                lineNumber: 26,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/app/auth/login/page.tsx",
            lineNumber: 25,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/app/auth/login/page.tsx",
        lineNumber: 24,
        columnNumber: 5
    }, this);
}
_s(LoginPage, "4EwlVapIV+TvUacVBdlu1zZO/+I=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useAuth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"]
    ];
});
_c = LoginPage;
var _c;
__turbopack_context__.k.register(_c, "LoginPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_0vx-pl9._.js.map