// YAHAN APNA WHATSAPP NUMBER DAALO (country code ke saath, bina + ke)
// Example: 91 + 9876543210 --> "919876543210"
const OWNER_WHATSAPP_NUMBER = "919977414177"; // <-- yahan apna number

let PRODUCTS = [];
let currentPriceType = "priceWholesale"; // default

const itemSearch = document.getElementById("itemSearch");
const searchResults = document.getElementById("searchResults");
const selectedItemCode = document.getElementById("selectedItemCode");
const qtyInput = document.getElementById("qtyInput");
const salePriceInput = document.getElementById("salePriceInput");
const itemPriceSpan = document.getElementById("itemPrice");
const salePriceSpan = document.getElementById("salePrice");
const marginPercentSpan = document.getElementById("marginPercent");
const orderTextArea = document.getElementById("orderText");
const addItemBtn = document.getElementById("addItemBtn");
const sendWhatsAppBtn = document.getElementById("sendWhatsAppBtn");
const sendCustomerBtn = document.getElementById("sendCustomerBtn");
const createOrderBtn = document.getElementById("createOrderBtn");
const clearBtn = document.getElementById("clearBtn");
const customerNameInput = document.getElementById("customerName");
const priceTypeSelect = document.getElementById("priceType");
const passwordInput = document.getElementById("passwordInput");
const passwordSubmit = document.getElementById("passwordSubmit");
const passwordError = document.getElementById("passwordError");
const passwordScreen = document.getElementById("passwordScreen");
const appContainer = document.getElementById("appContainer");

const round2 = (num) => Math.round(num * 100) / 100;
const toNumber = (val) => {
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
};
let appUnlocked = false;

// items.json se data load karo
async function loadProducts() {
  try {
    console.log("Loading items.json...");
    const res = await fetch("items.json");
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const rawItems = await res.json();

    // JSON ko normalize karo taaki naye column DB to Retail (10%) ka use ho
    PRODUCTS = rawItems.map((item) => {
      const purchasePrice = toNumber(item.Purc_price) ?? 0;
      const priceWholesale =
        toNumber(item.db_to_ws_pcs_price) ??
        toNumber(item.priceWholesale) ??
        round2(purchasePrice * 1.07);
      const priceRetail =
        toNumber(item.db_to_retail_pcs_price) ??
        toNumber(item.priceRetail) ??
        round2(purchasePrice * 1.1);
      const priceBulk =
        toNumber(item.priceBulk) ?? round2(purchasePrice * 1.05);

      return {
        code: item.code,
        name: item.item_name || item.name || item.code,
        category: item.category || "",
        mrp: toNumber(item.mrp) ?? 0,
        itemSize: item.pcs_ctn ? `${item.pcs_ctn} pcs/ctn` : "",
        pp: purchasePrice,
        priceBulk,
        priceWholesale,
        priceRetail,
      };
    });
    console.log(`Loaded ${PRODUCTS.length} products`);
    itemSearch.placeholder = `${PRODUCTS.length} items available - Type to search...`;
  } catch (err) {
    console.error("items.json load nahi hua:", err);
    alert("Items load nahi ho rahe. Browser console check karo.");
    itemSearch.placeholder = "Error loading items";
  }
}

// password gate
function attemptUnlock() {
  if (appUnlocked) return;
  const val = (passwordInput.value || "").trim();
  if (val === "9977") {
    appUnlocked = true;
    passwordError.textContent = "";
    passwordScreen.style.display = "none";
    appContainer.style.display = "block";
    loadProducts();
  } else {
    passwordError.textContent = "Galat password. Dobara try karo.";
    passwordInput.focus();
    passwordInput.select();
  }
}

// Search products based on query (Advanced search with category)
function searchProducts(query) {
  if (!query || query.trim() === "") {
    return [];
  }

  const searchTerm = query.toLowerCase().trim();
  const filtered = PRODUCTS.filter((p) => {
    const name = (p.name || "").toLowerCase();
    const code = (p.code || "").toLowerCase();
    const category = (p.category || "").toLowerCase();
    return name.includes(searchTerm) || code.includes(searchTerm) || category.includes(searchTerm);
  });

  // Limit to 10 results
  return filtered.slice(0, 10);
}

// Display search results
function displaySearchResults(results) {
  if (results.length === 0) {
    searchResults.innerHTML = '<div class="search-item no-results">Koi item nahi mila</div>';
    searchResults.style.display = "block";
    return;
  }

  searchResults.innerHTML = "";
  results.forEach((p) => {
    const div = document.createElement("div");
    div.className = "search-item";
    div.dataset.code = p.code;

    const price = p[currentPriceType];
    const priceLabel =
      typeof price === "number" && !Number.isNaN(price)
        ? price.toFixed(2)
        : "N/A";

    div.innerHTML = `
      <div class="item-name">${p.name}</div>
      <div class="item-details">Category: ${p.category} | Code: ${p.code} | Rs.${priceLabel}</div>
    `;

    div.addEventListener("click", () => selectItem(p));
    searchResults.appendChild(div);
  });

  searchResults.style.display = "block";
}

// Select an item
function selectItem(product) {
  selectedItemCode.value = product.code;
  const price = product[currentPriceType];
  const priceLabel =
    typeof price === "number" && !Number.isNaN(price)
      ? price.toFixed(2)
      : "N/A";
  itemSearch.value = `${product.name} (Rs.${priceLabel})`;
  searchResults.style.display = "none";
  updateLineTotal();
  qtyInput.focus();
}

// selected product nikaalo
function getSelectedProduct() {
  const code = selectedItemCode.value;
  return PRODUCTS.find((p) => p.code === code);
}

// qty ya item change par price and margin update karo
function updateLineTotal() {
  const product = getSelectedProduct();
  const salePrice = parseFloat(salePriceInput.value) || 0;

  if (!product) {
    itemPriceSpan.textContent = "0";
    salePriceSpan.textContent = "0";
    marginPercentSpan.textContent = "0";
    return;
  }

  const dealerPrice = product[currentPriceType];
  const purchasePrice = product.pp;

  if (
    typeof dealerPrice !== "number" ||
    Number.isNaN(dealerPrice) ||
    typeof purchasePrice !== "number" ||
    Number.isNaN(purchasePrice)
  ) {
    itemPriceSpan.textContent = "0";
    salePriceSpan.textContent = "0";
    marginPercentSpan.textContent = "0";
    return;
  }

  itemPriceSpan.textContent = dealerPrice.toFixed(2);

  // If sale price entered, show it; else show dealer price
  const displayPrice = salePrice > 0 ? salePrice : dealerPrice;
  salePriceSpan.textContent = displayPrice.toFixed(2);

  // Calculate margin percentage from Purchase Price
  if (displayPrice > 0 && purchasePrice > 0) {
    const margin = ((displayPrice - purchasePrice) / purchasePrice) * 100;
    marginPercentSpan.textContent = margin.toFixed(2);
  } else {
    marginPercentSpan.textContent = "0";
  }
}

// item ko order list me add karo
function addItem() {
  const product = getSelectedProduct();
  const qty = qtyInput.value.trim();
  const customSalePrice = parseFloat(salePriceInput.value) || 0;

  if (!product) {
    alert("Pehele item select karo.");
    return;
  }
  if (!qty) {
    alert("Qty enter karo.");
    return;
  }

  const dealerPrice = product[currentPriceType];
  const purchasePrice = product.pp;

  if (
    typeof dealerPrice !== "number" ||
    Number.isNaN(dealerPrice) ||
    typeof purchasePrice !== "number" ||
    Number.isNaN(purchasePrice)
  ) {
    alert("Price data available nahi hai.");
    return;
  }

  // Use custom sale price if entered, else use dealer price
  const finalSalePrice = customSalePrice > 0 ? customSalePrice : dealerPrice;

  // Calculate margin from Purchase Price
  const margin = ((finalSalePrice - purchasePrice) / purchasePrice) * 100;

  // Multi-line format for each item
  const itemBlock = `${product.name}
Category: ${product.category}
MRP: Rs.${product.mrp} | Size: ${product.itemSize}
Order Qty: ${qty} | Margin: ${margin.toFixed(2)}%
Quote Price: Rs.${finalSalePrice.toFixed(2)}`;

  if (orderTextArea.value.trim() !== "") {
    orderTextArea.value += "\n------------------------\n";
  }
  orderTextArea.value += itemBlock;

  // Reset inputs
  itemSearch.value = "";
  selectedItemCode.value = "";
  qtyInput.value = "1";
  salePriceInput.value = "";
  searchResults.style.display = "none";
  updateLineTotal();
  itemSearch.focus();
}

// WhatsApp pe bhejna (Send to Dealer - Full details) - Fixed dealer number only
function sendToWhatsApp() {
  const customerName = customerNameInput.value.trim();
  if (!customerName) {
    alert("Customer Name zaruri hai.");
    customerNameInput.focus();
    return;
  }

  const text = orderTextArea.value.trim();
  if (!text) {
    alert("Koi item add nahi hai.");
    return;
  }

  let finalText = "Bluechip Order\n";
  finalText += `Customer: ${customerName}\n`;

  // Price type display
  const priceTypeText =
    priceTypeSelect.options[priceTypeSelect.selectedIndex].text;
  finalText += `Price Type: ${priceTypeText}\n`;
  finalText += "========================\n\n";
  finalText += text;

  const encoded = encodeURIComponent(finalText);
  const url = `https://wa.me/${OWNER_WHATSAPP_NUMBER}?text=${encoded}`;
  window.open(url, "_blank");
}

// Send to Customer - Limited info (Item name, Quote price, Order qty)
function sendToCustomer() {
  const customerName = customerNameInput.value.trim();
  if (!customerName) {
    alert("Customer Name zaruri hai.");
    customerNameInput.focus();
    return;
  }

  const text = orderTextArea.value.trim();
  if (!text) {
    alert("Koi item add nahi hai.");
    return;
  }

  // Ask user for WhatsApp number
  const phoneNumber = prompt("WhatsApp number enter karo (country code ke saath, bina + ke):\nExample: 919876543210");
  if (!phoneNumber || phoneNumber.trim() === "") {
    alert("Phone number zaruri hai.");
    return;
  }

  // Parse order details and extract only item name, quote price, and order qty
  const lines = text.split("\n");
  let customerText = "Order Details\n";
  customerText += `Customer: ${customerName}\n`;
  customerText += "========================\n\n";

  let currentItem = "";
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip separator lines
    if (line.startsWith("---")) {
      if (currentItem) {
        customerText += currentItem + "\n------------------------\n";
        currentItem = "";
      }
      continue;
    }

    // Item name (first line of each block, not starting with known prefixes)
    if (line && !line.startsWith("Category:") && !line.startsWith("MRP:") &&
        !line.startsWith("Order Qty:") && !line.startsWith("Quote Price:")) {
      if (currentItem) {
        customerText += currentItem + "\n------------------------\n";
      }
      currentItem = line + "\n";
    }

    // Extract Order Qty
    if (line.startsWith("Order Qty:")) {
      const qtyMatch = line.match(/Order Qty:\s*([^|]+)/);
      if (qtyMatch) {
        currentItem += `Order Qty: ${qtyMatch[1].trim()}\n`;
      }
    }

    // Extract Quote Price
    if (line.startsWith("Quote Price:")) {
      currentItem += line + "\n";
    }
  }

  // Add last item
  if (currentItem) {
    customerText += currentItem;
  }

  const encoded = encodeURIComponent(customerText);
  const url = `https://wa.me/${phoneNumber.trim()}?text=${encoded}`;
  window.open(url, "_blank");
}

// Create Order - Minimal info (Order name/item name, Order qty only)
function createOrder() {
  const customerName = customerNameInput.value.trim();
  if (!customerName) {
    alert("Customer Name zaruri hai.");
    customerNameInput.focus();
    return;
  }

  const text = orderTextArea.value.trim();
  if (!text) {
    alert("Koi item add nahi hai.");
    return;
  }

  // Ask user for WhatsApp number
  const phoneNumber = prompt("WhatsApp number enter karo (country code ke saath, bina + ke):\nExample: 919876543210");
  if (!phoneNumber || phoneNumber.trim() === "") {
    alert("Phone number zaruri hai.");
    return;
  }

  // Parse order details and extract only item name and order qty
  const lines = text.split("\n");
  let orderText = "Create Order\n";
  orderText += `Customer: ${customerName}\n`;
  orderText += "========================\n\n";

  let currentItem = "";
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip separator lines
    if (line.startsWith("---")) {
      if (currentItem) {
        orderText += currentItem + "\n------------------------\n";
        currentItem = "";
      }
      continue;
    }

    // Item name (first line of each block, not starting with known prefixes)
    if (line && !line.startsWith("Category:") && !line.startsWith("MRP:") &&
        !line.startsWith("Order Qty:") && !line.startsWith("Quote Price:")) {
      if (currentItem) {
        orderText += currentItem + "\n------------------------\n";
      }
      currentItem = line + "\n";
    }

    // Extract Order Qty only
    if (line.startsWith("Order Qty:")) {
      const qtyMatch = line.match(/Order Qty:\s*([^|]+)/);
      if (qtyMatch) {
        currentItem += `Order Qty: ${qtyMatch[1].trim()}\n`;
      }
    }
  }

  // Add last item
  if (currentItem) {
    orderText += currentItem;
  }

  const encoded = encodeURIComponent(orderText);
  const url = `https://wa.me/${phoneNumber.trim()}?text=${encoded}`;
  window.open(url, "_blank");
}

// order clear karna
function clearOrder() {
  if (!confirm("Saara order clear karna hai?")) return;
  orderTextArea.value = "";
}

// price type change handler
function changePriceType() {
  currentPriceType = priceTypeSelect.value;
  // Clear selected item when price type changes
  selectedItemCode.value = "";
  itemSearch.value = "";
  searchResults.style.display = "none";
  updateLineTotal();
}

// event listeners
itemSearch.addEventListener("input", (e) => {
  const query = e.target.value;
  if (query.trim() === "") {
    searchResults.style.display = "none";
    selectedItemCode.value = "";
    updateLineTotal();
    return;
  }

  const results = searchProducts(query);
  displaySearchResults(results);
});

// Close search results when clicking outside
document.addEventListener("click", (e) => {
  if (
    !searchResults.contains(e.target) &&
    e.target !== itemSearch
  ) {
    searchResults.style.display = "none";
  }
});

// Handle keyboard navigation in search
itemSearch.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    searchResults.style.display = "none";
  }
});

salePriceInput.addEventListener("input", updateLineTotal);
addItemBtn.addEventListener("click", addItem);
sendWhatsAppBtn.addEventListener("click", sendToWhatsApp);
sendCustomerBtn.addEventListener("click", sendToCustomer);
createOrderBtn.addEventListener("click", createOrder);
clearBtn.addEventListener("click", clearOrder);
priceTypeSelect.addEventListener("change", changePriceType);
passwordSubmit.addEventListener("click", attemptUnlock);
passwordInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    attemptUnlock();
  }
});

// shuru me products load
if (passwordInput) {
  passwordInput.focus();
} else {
  // fallback agar password screen nahi mila to direct load
  loadProducts();
}
