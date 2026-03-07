import { test, expect } from '@playwright/test'

// ──────────────────────────────────────────────
// Smoke: basic layout
// ──────────────────────────────────────────────
test.describe('App shell', () => {
  test('renders the header', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('PetaKarta')).toBeVisible()
  })

  test('renders the map canvas', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.ol-viewport')).toBeVisible()
  })

  test('sidebar shows all three tabs', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('button', { name: 'Data' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Style' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Export' })).toBeVisible()
  })
})

// ──────────────────────────────────────────────
// Data tab: sample loading workflow
// ──────────────────────────────────────────────
test.describe('Data tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // The Data tab should be active by default
    await expect(page.getByText('Admin Layer')).toBeVisible()
  })

  test('admin layer selector is visible', async ({ page }) => {
    await expect(page.locator('select').first()).toBeVisible()
  })

  test('loads a sample dataset and enables Apply', async ({ page }) => {
    // Select "GDP per Capita" from the sample dropdown
    await page.locator('select').nth(1).selectOption({ label: 'GDP per Capita' })
    await page.getByRole('button', { name: 'Load' }).click()

    // After loading, column selects should be populated and Apply enabled
    await expect(page.getByRole('button', { name: 'Apply' })).not.toBeDisabled()
  })

  test('shows match result after applying a sample', async ({ page }) => {
    await page.locator('select').nth(1).selectOption({ label: 'GDP per Capita' })
    await page.getByRole('button', { name: 'Load' }).click()
    await page.getByRole('button', { name: 'Apply' }).click()

    // Should show a green/red match result panel
    await expect(page.getByText(/areas matched/i)).toBeVisible()
  })

  test('shows inline confirmation when switching layer with data loaded', async ({ page }) => {
    await page.locator('select').nth(1).selectOption({ label: 'GDP per Capita' })
    await page.getByRole('button', { name: 'Load' }).click()

    // Switch admin layer
    await page.locator('select').first().selectOption({ label: 'Yogyakarta – Cities/Regencies' })

    // Inline confirmation should appear instead of browser dialog
    await expect(page.getByText(/Changing the layer will reset/i)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible()
  })

  test('cancelling layer change keeps existing data', async ({ page }) => {
    await page.locator('select').nth(1).selectOption({ label: 'GDP per Capita' })
    await page.getByRole('button', { name: 'Load' }).click()

    await page.locator('select').first().selectOption({ label: 'Yogyakarta – Cities/Regencies' })
    await page.getByRole('button', { name: 'Cancel' }).click()

    // Layer should not have changed; confirmation should be gone
    await expect(page.getByText(/Changing the layer will reset/i)).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Apply' })).toBeVisible()
  })
})

// ──────────────────────────────────────────────
// Style tab
// ──────────────────────────────────────────────
test.describe('Style tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Style' }).click()
  })

  test('shows style mode toggle', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Graduated' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Categorized' })).toBeVisible()
  })

  test('graduated mode shows color ramp and classification controls', async ({ page }) => {
    await expect(page.getByText('Color Ramp')).toBeVisible()
    await expect(page.getByText('Classification')).toBeVisible()
  })

  test('switching to categorized mode hides graduated controls', async ({ page }) => {
    await page.getByRole('button', { name: 'Categorized' }).click()
    await expect(page.getByText('Color Ramp')).not.toBeVisible()
    await expect(page.getByText('Category Colors')).toBeVisible()
  })
})

// ──────────────────────────────────────────────
// Export tab
// ──────────────────────────────────────────────
test.describe('Export tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Export' }).click()
  })

  test('shows Download PNG button', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Download PNG' })).toBeVisible()
  })

  test('shows resolution options', async ({ page }) => {
    await expect(page.getByText('Standard (1x)')).toBeVisible()
    await expect(page.getByText('High-res (2x)')).toBeVisible()
  })
})
