import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

page.on("response", (res) => {
  if (res.status() >= 400) {
    console.log(`⚠️  ${res.status()} ${res.url()}`);
  }
});
page.on("console", (msg) => console.log("[browser]", msg.type(), msg.text()));

await page.goto("http://localhost:5173/productos", { waitUntil: "networkidle" });
await page.waitForTimeout(2000);

const row = page.locator("table tbody tr", { hasText: "Almendras" });
const count = await row.count();
console.log("Filas encontradas:", count);
if (count === 0) {
  // Maybe there's no product named Almendras
  const allText = await page.locator("table tbody").textContent();
  console.log("Contenido tabla:", allText?.substring(0, 500));
  await browser.close();
  process.exit(1);
}

await row.locator('button[title="Editar"]').click();
await page.waitForTimeout(1000);

const priceInput = page.locator("#precioVentaKg");
const inputExists = await priceInput.isVisible();
console.log("Input precio visible:", inputExists);

await priceInput.fill("");
await priceInput.fill("25000");

await page.locator('button[type="submit"]').click();
await page.waitForTimeout(3000);

// Check if we're on the detalle page
const detalleText = await page.locator("body").textContent();
if (detalleText.includes("$25.000")) {
  console.log("✅ Precio $25.000 visible en detalle");
} else if (detalleText.includes("$25,000")) {
  console.log("✅ Precio $25,000 visible en detalle");
} else {
  // Try formatearDinero format (ARS uses $ and dot for thousands)
  console.log("Contenido detalle:", detalleText?.substring(0, 1000));
}

await browser.close();
