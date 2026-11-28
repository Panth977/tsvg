// Copy to capture.config.mjs and edit. Credentials come from env, never from this file.
export default {
  baseUrl: 'http://localhost:5173',
  colorScheme: 'dark',

  // Optional: runs once before all shots. Use a test account on a local dev server only.
  async login(page, baseUrl) {
    await page.goto(baseUrl + '/login');
    await page.getByRole('textbox', { name: /email/i }).fill(process.env.E2E_EMAIL);
    await page.getByRole('textbox', { name: /password/i }).fill(process.env.E2E_PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 60000 });
  },

  shots: [
    {
      file: 'orders-list',
      path: '/orders',
      boxes: {
        'btn:New Order': (p) => p.getByRole('button', { name: 'New Order' }),
        row1: (p) => p.locator('table tbody tr').nth(0),
      },
    },
    {
      file: 'orders-new-open',
      path: '/orders/new',
      // Open pickers / tabs to show state. Never submit.
      prepare: async (p) => { await p.getByRole('combobox', { name: 'Customer' }).click(); },
      boxes: {
        'field:Customer': (p) => p.getByText('Customer').locator('..'),
        'picker-list': (p) => p.getByRole('listbox'),
        'btn:Create': (p) => p.getByRole('button', { name: 'Create' }),
      },
    },
  ],
};
