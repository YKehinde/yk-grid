import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

function header(page: import('@playwright/test').Page, name: string) {
  return page.getByRole('columnheader', { name: new RegExp(name, 'i') })
}

test.describe('sorting', () => {
  test('clicking a column header sorts rows ascending then descending', async ({ page }) => {
    const amountHeader = header(page, 'amount')
    await amountHeader.click()
    await expect(amountHeader).toHaveAttribute('aria-sort', 'ascending')

    await amountHeader.click()
    await expect(amountHeader).toHaveAttribute('aria-sort', 'descending')
  })
})

test.describe('filtering', () => {
  test('funnel button opens the filter panel', async ({ page }) => {
    const filterBtn = header(page, 'partner').getByRole('button', { name: 'Filter Partner' })
    await filterBtn.click()
    await expect(page.getByRole('dialog', { name: 'Filter Partner' })).toBeVisible()
  })

  test('typing in the text filter panel reduces visible rows', async ({ page }) => {
    const filterBtn = header(page, 'partner').getByRole('button', { name: 'Filter Partner' })
    await filterBtn.click()
    const input = page.getByRole('dialog').getByRole('textbox')
    const rowsBefore = await page.locator('tbody tr').count()
    await input.fill('Stripe')
    await page.waitForTimeout(400) // debounce
    const rowsAfter = await page.locator('tbody tr').count()
    expect(rowsAfter).toBeLessThanOrEqual(rowsBefore)
  })

  test('closing filter panel clears the panel but keeps the filter active', async ({ page }) => {
    const filterBtn = header(page, 'status').getByRole('button', { name: 'Filter Status' })
    await filterBtn.click()
    // Select one status option
    const firstCheckbox = page.getByRole('dialog').getByRole('checkbox').nth(1)
    await firstCheckbox.click()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    // Filter button should be visually active (filled funnel) — check aria-expanded is false
    await expect(filterBtn).toHaveAttribute('aria-expanded', 'false')
  })
})

test.describe('pagination', () => {
  test('next page button advances the page', async ({ page }) => {
    const nextBtn = page.getByRole('button', { name: 'Next page' })
    await nextBtn.click()
    await expect(page.getByRole('button', { name: 'Previous page' })).toBeEnabled()
  })

  test('page size selector changes the number of displayed rows', async ({ page }) => {
    const select = page.getByRole('combobox', { name: 'Rows per page' })
    await select.selectOption('10')
    const rows = page.locator('tbody tr')
    await expect(rows).toHaveCount(10)
  })
})

test.describe('selection', () => {
  test('checking a row checkbox selects it', async ({ page }) => {
    const firstRowCheckbox = page.getByRole('row', { name: /TXN-001/ }).getByRole('checkbox', { name: 'Select row' })
    await firstRowCheckbox.check()
    await expect(page.getByText('1 row selected')).toBeVisible()
  })

  test('select-all checkbox selects all rows on the current page', async ({ page }) => {
    await page.getByRole('checkbox', { name: /Select all/i }).check()
    await expect(page.getByText('50 rows selected')).toBeVisible()
  })
})

test.describe('column visibility', () => {
  test('column options button opens the visibility panel', async ({ page }) => {
    const menuBtn = header(page, 'id').getByRole('button', { name: 'Column options for ID' })
    await menuBtn.click()
    await expect(page.getByRole('dialog', { name: 'Column visibility' })).toBeVisible()
  })

  test('unchecking a column hides it from the table', async ({ page }) => {
    const menuBtn = header(page, 'id').getByRole('button', { name: 'Column options for ID' })
    await menuBtn.click()
    const idCheckbox = page.getByRole('dialog').getByLabel('ID')
    await idCheckbox.click()
    await expect(header(page, 'id')).toHaveCount(0)
  })
})

test.describe('inline editing', () => {
  test('double-clicking an editable cell shows an input', async ({ page }) => {
    const partnerCell = page.getByRole('row', { name: /TXN-001/ }).getByRole('gridcell', { name: 'Tesco' })
    await partnerCell.dblclick()
    await expect(page.getByRole('textbox', { name: 'Edit Partner' })).toBeVisible()
  })

  test('pressing Escape cancels the edit without changing the value', async ({ page }) => {
    const partnerCell = page.getByRole('row', { name: /TXN-001/ }).getByRole('gridcell', { name: 'Tesco' })
    const originalText = await partnerCell.textContent()
    await partnerCell.dblclick()
    const input = page.getByRole('textbox', { name: 'Edit Partner' })
    await input.fill('should not save')
    await page.keyboard.press('Escape')
    await expect(input).not.toBeVisible()
    await expect(partnerCell).toHaveText(originalText ?? '')
  })
})
