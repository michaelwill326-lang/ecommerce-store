import fs from "fs";
import path from "path";

const FRONTEND_URL = (
  process.env.VITE_FRONTEND_URL ||
  "https://techmart-frontend.onrender.com"
).replace(/\/$/, "");

const BACKEND_URL = (
  process.env.VITE_API_URL ||
  "https://techmart-backend-ecbi.onrender.com"
).replace(/\/$/, "");

const DIST_DIR = path.resolve("dist");
const API_URL = `${BACKEND_URL}/api/products`;

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeJson(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

function cleanDescription(description, fallback) {
  const text = String(description || fallback || "")
    .replace(/\s+/g, " ")
    .trim();

  return text.length > 155 ? `${text.slice(0, 152)}...` : text;
}

function productUrl(id) {
  return `${FRONTEND_URL}/product/${id}`;
}

async function main() {
  if (!fs.existsSync(DIST_DIR)) {
    throw new Error("dist/ does not exist. Run Vite build first.");
  }

  const templatePath = path.join(DIST_DIR, "index.html");

  if (!fs.existsSync(templatePath)) {
    throw new Error("dist/index.html does not exist.");
  }

  const template = fs.readFileSync(templatePath, "utf8");

  console.log("🔎 Fetching products from:");
  console.log(API_URL);

  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error(
      `Product API returned ${response.status} ${response.statusText}`
    );
  }

  const products = await response.json();

  if (!Array.isArray(products)) {
    throw new Error("Product API did not return an array.");
  }

  console.log(`📦 Products found: ${products.length}`);

  let generated = 0;

  for (const product of products) {
    if (!product?._id || !product?.name) {
      console.warn("⚠️ Skipping product without _id/name");
      continue;
    }

    const id = String(product._id);
    const name = String(product.name).trim();

    const description = cleanDescription(
      product.description,
      `Buy ${name} on TechMart, Nigeria's trusted tech marketplace.`
    );

    const image =
      Array.isArray(product.images) && product.images.length
        ? product.images[0]
        : `${FRONTEND_URL}/techmart.png`;

    const url = productUrl(id);

    const price =
      typeof product.price === "number"
        ? product.price
        : Number(product.price) || 0;

    const availability =
      Number(product.stock) > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock";

    const category = product.category
      ? String(product.category)
      : "Technology";

    const condition = product.condition || "New";

    const title = `${name} | TechMart Nigeria`;

    const productSchema = {
      "@context": "https://schema.org",
      "@type": "Product",
      name,
      description,
      image: [image],
      category,
      brand: {
        "@type": "Brand",
        name: "TechMart"
      },
      offers: {
        "@type": "Offer",
        url,
        priceCurrency: "NGN",
        price: price.toString(),
        availability,
        itemCondition:
          condition.toLowerCase() === "used"
            ? "https://schema.org/UsedCondition"
            : "https://schema.org/NewCondition"
      }
    };

    let html = template;

    /*
     * Remove the generic homepage SEO elements from the generated
     * product document.
     */
    html = html
      .replace(/<title>[\s\S]*?<\/title>/i, "")
      .replace(/<meta\s+name=["']description["'][^>]*>/gi, "")
      .replace(/<meta\s+name=["']robots["'][^>]*>/gi, "")
      .replace(/<link\s+rel=["']canonical["'][^>]*>/gi, "")
      .replace(/<meta\s+property=["']og:[^"']+["'][^>]*>/gi, "")
      .replace(/<meta\s+name=["']twitter:[^"']+["'][^>]*>/gi, "")
      .replace(
        /<script\s+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi,
        ""
      );

    const seoHead = `
<title>${escapeHtml(title)}</title>

<meta name="description" content="${escapeHtml(description)}" />
<meta name="robots" content="index, follow" />

<link rel="canonical" href="${escapeHtml(url)}" />

<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:type" content="product" />
<meta property="og:site_name" content="TechMart" />
<meta property="og:url" content="${escapeHtml(url)}" />
<meta property="og:image" content="${escapeHtml(image)}" />
<meta property="og:image:alt" content="${escapeHtml(name)}" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
<meta name="twitter:image" content="${escapeHtml(image)}" />

<script type="application/ld+json">
${escapeJson(productSchema)}
</script>
`;

    /*
     * Insert SEO metadata immediately before </head>.
     * If the existing index.html has no </head>, fail loudly rather
     * than generating broken HTML.
     */
    if (!/<\/head>/i.test(html)) {
      throw new Error(
        "dist/index.html does not contain </head>. Refusing to generate SEO pages."
      );
    }

    html = html.replace(/<\/head>/i, `${seoHead}\n</head>`);

    const productDir = path.join(DIST_DIR, "product", id);

    fs.mkdirSync(productDir, { recursive: true });

    const outputPath = path.join(productDir, "index.html");

    fs.writeFileSync(outputPath, html, "utf8");

    generated++;

    console.log(`✅ ${name}`);
    console.log(`   ${outputPath}`);
  }

  console.log("");
  console.log("======================================");
  console.log("🎯 TECHMART SEO GENERATION COMPLETE");
  console.log("======================================");
  console.log(`Products generated: ${generated}`);
  console.log(`Frontend: ${FRONTEND_URL}`);
  console.log(`Backend:  ${BACKEND_URL}`);
}

main().catch((error) => {
  console.error("");
  console.error("❌ SEO generation failed:");
  console.error(error);
  process.exit(1);
});
