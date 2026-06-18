import { chromium } from "playwright";

const browser = await chromium.launch({ headless: false, slowMo: 300 });
const page = await browser.newPage();

await page.goto("http://localhost:5173/productos", { waitUntil: "networkidle" });
await page.waitForTimeout(1000);

const row = page.locator("table tbody tr", { hasText: "Almendras" });
await row.locator('button[title="Editar"]').click();
await page.waitForTimeout(500);

const priceInput = page.locator("#precioVentaKg");
await priceInput.fill("");
await priceInput.fill("25000");

await page.locator('button[type="submit"]').click();
await page.waitForTimeout(1000);

console.log("✅ Precio actualizado");

await browser.close();
