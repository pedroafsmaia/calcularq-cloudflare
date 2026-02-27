export function createPageUrl(page: string): string {
  const pageMap: Record<string, string> = {
    Calculator: '/calculator',
    CalculatorDemo: '/calculator-demo',
    Home: '/',
    Manual: '/manual',
    Login: '/login',
    Payment: '/payment',
    BudgetsHistory: '/budgets',
  }
  
  return pageMap[page] || `/${page.toLowerCase()}`
}
