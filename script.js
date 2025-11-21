// YAHAN APNA WHATSAPP NUMBER DAALO (country code ke saath, bina + ke)
// Example: 91 + 9876543210 --> "919876543210"
const OWNER_WHATSAPP_NUMBER = "919977414177"; // <-- yahan apna number

let PRODUCTS = [];
let currentPriceType = "priceWholesale"; // default

const itemSelect = document.getElementById("itemSelect");
const qtyInput = document.getElementById("qtyInput");
const salePriceInput = document.getElementById("salePriceInput");
const itemPriceSpan = document.getElementById("itemPrice");
const salePriceSpan = document.getElementById("salePrice");
const marginPercentSpan = document.getElementById("marginPercent");
const orderTextArea = document.getElementById("orderText");
const addItemBtn = document.getElementById("addItemBtn");
const sendWhatsAppBtn = document.getElementById("sendWhatsAppBtn");
const clearBtn = document.getElementById("clearBtn");
const customerNameInput = document.getElementById("customerName");
const priceTypeSelect = document.getElementById("priceType");

// items.json se data load karo
async function loadProducts() {
  try {
    console.log("Loading items.json...");
    const res = await fetch("items.json");
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    PRODUCTS = await res.json();
    console.log(`Loaded ${PRODUCTS.length} products`);
    fillDropdown();
  } catch (err) {
    console.error("items.json load nahi hua:", err);
    alert("Items load nahi ho rahe. Browser console check karo.");
    itemSelect.innerHTML = '<option value="">Error loading items</option>';
  }
}

// dropdown me options daalna
function fillDropdown() {
  console.log(`Filling dropdown with ${PRODUCTS.length} products`);
  itemSelect.innerHTML = '<option value="">-- Item select karein --</option>';
  PRODUCTS.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.code;
    const price = p[currentPriceType];
    opt.textContent = `${p.name} (₹${price})`;
    itemSelect.appendChild(opt);
  });
  console.log("Dropdown filled successfully");
}

// selected product nikaalo
function getSelectedProduct() {
  const code = itemSelect.value;
  return PRODUCTS.find(p => p.code === code);
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

  const costPrice = product[currentPriceType];
  itemPriceSpan.textContent = costPrice.toFixed(2);
  salePriceSpan.textContent = salePrice.toFixed(2);

  // Calculate margin percentage
  if (salePrice > 0 && costPrice > 0) {
    const margin = ((salePrice - costPrice) / costPrice) * 100;
    marginPercentSpan.textContent = margin.toFixed(2);
  } else {
    marginPercentSpan.textContent = "0";
  }
}

// item ko order list me add karo
function addItem() {
  const product = getSelectedProduct();
  const qty = qtyInput.value.trim();
  const salePrice = parseFloat(salePriceInput.value) || 0;

  if (!product) {
    alert("Pehele item select karo.");
    return;
  }
  if (!qty) {
    alert("Qty enter karo.");
    return;
  }
  if (salePrice <= 0) {
    alert("Sale Price enter karo.");
    salePriceInput.focus();
    return;
  }

  const costPrice = product[currentPriceType];
  const margin = ((salePrice - costPrice) / costPrice) * 100;

  // Multi-line format for each item
  const itemBlock = `Item: ${product.name}
MRP: ₹${product.mrp}
Size: ${product.itemSize}
Qty: ${qty}
Sale Price: ₹${salePrice.toFixed(2)}
Margin: ${margin.toFixed(2)}%`;

  if (orderTextArea.value.trim() !== "") {
    orderTextArea.value += "\n------------------------\n";
  }
  orderTextArea.value += itemBlock;

  // Reset inputs
  qtyInput.value = "1";
  salePriceInput.value = "";
  updateLineTotal();
}

// WhatsApp pe bhejna
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
  const priceTypeText = priceTypeSelect.options[priceTypeSelect.selectedIndex].text;
  finalText += `Price Type: ${priceTypeText}\n`;
  finalText += "========================\n\n";
  finalText += text;

  const encoded = encodeURIComponent(finalText);
  const url = `https://wa.me/${OWNER_WHATSAPP_NUMBER}?text=${encoded}`;
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
  fillDropdown();
  updateLineTotal();
}

// event listeners
itemSelect.addEventListener("change", updateLineTotal);
salePriceInput.addEventListener("input", updateLineTotal);
addItemBtn.addEventListener("click", addItem);
sendWhatsAppBtn.addEventListener("click", sendToWhatsApp);
clearBtn.addEventListener("click", clearOrder);
priceTypeSelect.addEventListener("change", changePriceType);

// shuru me products load
loadProducts();

