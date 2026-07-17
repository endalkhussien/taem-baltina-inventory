import { toLocalDateKey } from './dates'
import { formatWeekRange, calendarWeekStart } from './dates'
import { isInSalesPeriod } from './periods'
import { formatCreditProductLines } from './credit'

export type ReportPeriod = 'week' | 'month'

function csvEscape(value: unknown) {
  const text = value == null ? '' : String(value)
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

function csvRow(values: unknown[]) {
  return values.map(csvEscape).join(',')
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function periodLabel(period: ReportPeriod) {
  if (period === 'week') return formatWeekRange(calendarWeekStart())
  const now = new Date()
  return now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

function isInCalendarMonth(dateValue: string) {
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return false
  const now = new Date()
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
}

function inReportPeriod(dateValue: string, period: ReportPeriod) {
  if (period === 'week') return isInSalesPeriod(dateValue, 'week')
  return isInCalendarMonth(dateValue)
}

type ExportInput = {
  period: ReportPeriod
  sales: any[]
  purchases: any[]
  ingredients: any[]
  creditLedgers: any[]
  customers: any[]
  expenses: any[]
  repayments: any[]
}

export function exportBusinessBackup(data: ExportInput) {
  const { period } = data
  const label = periodLabel(period)
  const lines: string[] = []

  const sales = data.sales.filter((row) => inReportPeriod(row.sale_date, period))
  const purchases = data.purchases.filter((row) => inReportPeriod(row.purchase_date, period))
  const creditRows = data.creditLedgers.filter((row) => inReportPeriod(row.credit_date, period))
  const expenses = data.expenses.filter((row) => inReportPeriod(row.expense_date ?? row.created_at, period))
  const repayments = data.repayments.filter((row) => inReportPeriod(row.payment_date, period))

  const salesRevenue = sales.reduce((sum, row) => sum + Number(row.total_amount), 0)
  const salesCash = sales.reduce((sum, row) => sum + Number(row.amount_paid), 0)
  const salesCredit = sales.reduce((sum, row) => sum + Number(row.balance), 0)
  const purchaseSpend = purchases.reduce((sum, row) => sum + Number(row.cost_total), 0)
  const creditCreated = creditRows.reduce((sum, row) => sum + Number(row.total_amount), 0)
  const creditOpen = creditRows.reduce((sum, row) => sum + Number(row.balance), 0)

  lines.push(`Taem Baltina backup report`)
  lines.push(`Period,${period === 'week' ? 'Weekly (Mon-Sun)' : 'Monthly'}`)
  lines.push(`Range,${label}`)
  lines.push(`Generated,${toLocalDateKey(new Date())}`)
  lines.push('')
  lines.push('SUMMARY')
  lines.push(csvRow(['Metric', 'Value']))
  lines.push(csvRow(['Sales count', sales.length]))
  lines.push(csvRow(['Sales revenue (ETB)', salesRevenue.toFixed(2)]))
  lines.push(csvRow(['Sales cash collected (ETB)', salesCash.toFixed(2)]))
  lines.push(csvRow(['Sales credit created (ETB)', salesCredit.toFixed(2)]))
  lines.push(csvRow(['Raw material purchases (ETB)', purchaseSpend.toFixed(2)]))
  lines.push(csvRow(['Credit ledger entries', creditRows.length]))
  lines.push(csvRow(['Credit ledger total (ETB)', creditCreated.toFixed(2)]))
  lines.push(csvRow(['Credit ledger open balance (ETB)', creditOpen.toFixed(2)]))
  lines.push(csvRow(['Expenses (ETB)', expenses.reduce((s, e) => s + Number(e.amount), 0).toFixed(2)]))
  lines.push(csvRow(['Customer repayments (ETB)', repayments.reduce((s, r) => s + Number(r.amount), 0).toFixed(2)]))
  lines.push('')

  lines.push('SALES')
  lines.push(csvRow(['Date', 'Code', 'Customer', 'Product', 'Qty kg', 'Unit price', 'Total', 'Paid', 'Balance', 'Status']))
  for (const row of sales) {
    lines.push(csvRow([
      toLocalDateKey(row.sale_date),
      row.sale_code,
      row.customer_name || 'Walk-in',
      row.product_name,
      Number(row.quantity),
      Number(row.unit_price).toFixed(2),
      Number(row.total_amount).toFixed(2),
      Number(row.amount_paid).toFixed(2),
      Number(row.balance).toFixed(2),
      row.payment_status
    ]))
  }
  lines.push('')

  lines.push('RAW MATERIAL PURCHASES')
  lines.push(csvRow(['Date', 'Ingredient', 'Quantity', 'Total cost ETB', 'Unit cost ETB', 'Supplier']))
  for (const row of purchases) {
    const qty = Number(row.quantity)
    const total = Number(row.cost_total)
    lines.push(csvRow([
      toLocalDateKey(row.purchase_date),
      row.ingredient_name,
      qty,
      total.toFixed(2),
      qty > 0 ? (total / qty).toFixed(4) : '',
      row.supplier || ''
    ]))
  }
  lines.push('')

  lines.push('RAW MATERIAL STOCK (current snapshot)')
  lines.push(csvRow(['Name', 'Category', 'On hand', 'Unit', 'Avg cost ETB', 'Alert stock']))
  for (const row of data.ingredients) {
    lines.push(csvRow([
      row.name,
      row.category,
      Number(row.quantity),
      row.unit,
      Number(row.cost_per_unit).toFixed(2),
      Number(row.alert_threshold)
    ]))
  }
  lines.push('')

  lines.push('CREDIT LEDGER')
  lines.push(csvRow(['Date', 'Customer', 'Products', 'Total ETB', 'Paid', 'Balance', 'Title']))
  for (const row of creditRows) {
    const products = formatCreditProductLines(row.items, row.product_name, row.quantity_kg)
      .map((line) => `${line.name}=${line.kg}kg`)
      .join('; ')
    lines.push(csvRow([
      toLocalDateKey(row.credit_date),
      row.customer_name,
      products,
      Number(row.total_amount).toFixed(2),
      Number(row.amount_paid).toFixed(2),
      Number(row.balance).toFixed(2),
      row.title
    ]))
  }
  lines.push('')

  lines.push('CUSTOMER CREDIT SUMMARY')
  lines.push(csvRow(['Customer', 'Ledger credit ETB', 'Sales credit ETB', 'Total owed ETB']))
  for (const row of data.customers) {
    lines.push(csvRow([
      row.name,
      Number(row.ledger_balance ?? 0).toFixed(2),
      Number(row.outstanding_balance ?? 0).toFixed(2),
      Number(row.total_credit ?? row.outstanding_balance ?? 0).toFixed(2)
    ]))
  }
  lines.push('')

  lines.push('EXPENSES')
  lines.push(csvRow(['Date', 'Title', 'Category', 'Amount ETB', 'Notes']))
  for (const row of expenses) {
    lines.push(csvRow([
      toLocalDateKey(row.expense_date ?? row.created_at),
      row.title,
      row.category,
      Number(row.amount).toFixed(2),
      row.notes || ''
    ]))
  }

  const safeLabel = label.replace(/[^\w\-]+/g, '_')
  downloadCsv(`taem-baltina-${period}-backup-${safeLabel}.csv`, lines.join('\n'))
}
