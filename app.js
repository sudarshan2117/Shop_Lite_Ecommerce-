(function () {
  // Utilities for localStorage persistence
  const STORAGE_KEYS = {
    users: 'shoplite_users',
    session: 'shoplite_session',
    products: 'shoplite_products',
    cart: 'shoplite_cart',
    wishlist: 'shoplite_wishlist'
  };

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      console.error('Failed to parse storage for', key, e);
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  // Basic ID generator
  function generateId(prefix) {
    const random = Math.random().toString(36).slice(2, 8);
    const time = Date.now().toString(36).slice(-5);
    return `${prefix}_${time}${random}`;
  }

  // Seed default products on first load
  function ensureSeedData() {
    const products = readJson(STORAGE_KEYS.products, null);
    if (products && products.length) return;
    const seed = [
      { id: generateId('p'), name: 'Smartphone X1', price: 14999, category: 'Mobiles', img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800&auto=format&fit=crop', desc: 'Powerful performance with stunning display.', sellerEmail: 'seed@shoplite' },
      { id: generateId('p'), name: 'Ultrabook Pro 14"', price: 58999, category: 'Electronics', img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=800&auto=format&fit=crop', desc: 'Lightweight productivity laptop.', sellerEmail: 'seed@shoplite' },
      { id: generateId('p'), name: 'Noise Cancelling Headphones', price: 4999, category: 'Electronics', img: 'https://images.unsplash.com/photo-1518444028785-8f7f84f1edcb?q=80&w=800&auto=format&fit=crop', desc: 'Immersive sound with deep bass.', sellerEmail: 'seed@shoplite' },
      { id: generateId('p'), name: 'Cotton T-Shirt', price: 399, category: 'Fashion', img: 'https://images.unsplash.com/photo-1520975916090-3105956dac38?q=80&w=800&auto=format&fit=crop', desc: 'Soft, breathable, everyday wear.', sellerEmail: 'seed@shoplite' },
      { id: generateId('p'), name: 'Air Fryer 4L', price: 6999, category: 'Appliances', img: 'https://images.unsplash.com/photo-1611254016835-4dab8a499f6c?q=80&w=800&auto=format&fit=crop', desc: 'Healthy frying with less oil.', sellerEmail: 'seed@shoplite' },
      { id: generateId('p'), name: 'Cushion Cover Set', price: 799, category: 'Home', img: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?q=80&w=800&auto=format&fit=crop', desc: 'Elegant decor for your living room.', sellerEmail: 'seed@shoplite' }
    ];
    writeJson(STORAGE_KEYS.products, seed);
  }

  // Session helpers
  function getCurrentUser() {
    return readJson(STORAGE_KEYS.session, null);
  }
  function setCurrentUser(user) {
    if (user) writeJson(STORAGE_KEYS.session, { email: user.email, name: user.name });
    else localStorage.removeItem(STORAGE_KEYS.session);
    syncAuthUI();
    refreshMyProducts();
  }

  // DOM elements
  const el = {
    year: document.getElementById('year'),
    tabButtons: Array.from(document.querySelectorAll('.tab-btn')),
    tabs: {
      home: document.getElementById('tab-home'),
      products: document.getElementById('tab-products'),
      add: document.getElementById('tab-add'),
      login: document.getElementById('tab-login'),
      cart: document.getElementById('tab-cart'),
      wishlist: document.getElementById('tab-wishlist'),
      checkout: document.getElementById('tab-checkout'),
      contact: document.getElementById('tab-contact'),
      productDetail: document.getElementById('tab-product-detail')
    },
    logoutBtn: document.getElementById('logoutBtn'),
    loginTab: document.getElementById('loginTab'),
    filterCategory: document.getElementById('filterCategory'),
    sortBy: document.getElementById('sortBy'),
    productsGrid: document.getElementById('productsGrid'),
    homeProducts: document.getElementById('homeProducts'),
    // Product form
    productForm: document.getElementById('productForm'),
    productId: document.getElementById('productId'),
    productName: document.getElementById('productName'),
    productPrice: document.getElementById('productPrice'),
    productCategory: document.getElementById('productCategory'),
    productImage: document.getElementById('productImage'),
    productDesc: document.getElementById('productDesc'),
    addEditTitle: document.getElementById('addEditTitle'),
    categoryDatalist: document.getElementById('categoryDatalist'),
    myProducts: document.getElementById('myProducts'),
    // Auth
    loginForm: document.getElementById('loginForm'),
    signupForm: document.getElementById('signupForm'),
    loginEmail: document.getElementById('loginEmail'),
    loginPassword: document.getElementById('loginPassword'),
    signupName: document.getElementById('signupName'),
    signupEmail: document.getElementById('signupEmail'),
    signupPassword: document.getElementById('signupPassword'),
    globalSearchInput: document.getElementById('globalSearchInput'),
    globalSearchBtn: document.getElementById('globalSearchBtn'),
    // Cart & Wishlist
    cartBadge: document.getElementById('cartBadge'),
    wishlistBadge: document.getElementById('wishlistBadge'),
    cartItems: document.getElementById('cartItems'),
    wishlistItems: document.getElementById('wishlistItems'),
    cartEmpty: document.getElementById('cartEmpty'),
    wishlistEmpty: document.getElementById('wishlistEmpty'),
    checkoutBtn: document.getElementById('checkoutBtn'),
    // Checkout
    checkoutForm: document.getElementById('checkoutForm'),
    checkoutOrderItems: document.getElementById('checkoutOrderItems'),
    placeOrderBtn: document.getElementById('placeOrderBtn'),
    // Contact
    contactForm: document.getElementById('contactForm'),
    // Product Detail
    productDetailContent: document.getElementById('productDetailContent')
  };

  // Navigation / Tabs
  function gotoTab(name) {
    Object.values(el.tabs).forEach(section => section.classList.remove('active'));
    el.tabButtons.forEach(b => b.classList.remove('active'));
    const section = el.tabs[name];
    if (section) section.classList.add('active');
    const btn = el.tabButtons.find(b => b.dataset.tab === name);
    if (btn) btn.classList.add('active');
    if (name === 'products') renderProducts();
    if (name === 'home') renderHomeProducts();
    if (name === 'add') refreshMyProducts();
    if (name === 'cart') renderCart();
    if (name === 'wishlist') renderWishlist();
    if (name === 'checkout') renderCheckout();
  }

  function wireNavigation() {
    el.tabButtons.forEach(btn => btn.addEventListener('click', () => gotoTab(btn.dataset.tab)));
    document.querySelectorAll('[data-goto]')
      .forEach(a => a.addEventListener('click', (e) => { e.preventDefault(); gotoTab(a.getAttribute('data-goto')); }));
    document.querySelectorAll('.category-card')
      .forEach(card => card.addEventListener('click', () => {
        const cat = card.getAttribute('data-category');
        el.filterCategory.value = cat;
        gotoTab('products');
        renderProducts();
      }));
  }

  // Auth
  function syncAuthUI() {
    const user = getCurrentUser();
    if (user) {
      el.loginTab.textContent = user.name.split(' ')[0];
      el.logoutBtn.classList.remove('hidden');
      el.productForm.querySelector('#saveProductBtn').disabled = false;
    } else {
      el.loginTab.textContent = 'Login';
      el.logoutBtn.classList.add('hidden');
      // Allow form usage only for logged-in users
      el.productForm.querySelector('#saveProductBtn').disabled = false; // allow but will gate on submit
    }
  }

  function handleSignup(e) {
    e.preventDefault();
    const users = readJson(STORAGE_KEYS.users, []);
    const email = el.signupEmail.value.trim().toLowerCase();
    const name = el.signupName.value.trim();
    const password = el.signupPassword.value; // Demo only
    if (users.some(u => u.email === email)) {
      alert('Account already exists. Please login.');
      return;
    }
    const newUser = { id: generateId('u'), name, email, password };
    users.push(newUser);
    writeJson(STORAGE_KEYS.users, users);
    setCurrentUser(newUser);
    el.signupForm.reset();
    gotoTab('home');
  }

  function handleLogin(e) {
    e.preventDefault();
    const users = readJson(STORAGE_KEYS.users, []);
    const email = el.loginEmail.value.trim().toLowerCase();
    const password = el.loginPassword.value;
    const found = users.find(u => u.email === email && u.password === password);
    if (!found) {
      alert('Invalid credentials.');
      return;
    }
    setCurrentUser(found);
    el.loginForm.reset();
    gotoTab('home');
  }

  function handleLogout() {
    setCurrentUser(null);
    gotoTab('home');
  }

  // Products
  function getAllProducts() {
    return readJson(STORAGE_KEYS.products, []);
  }
  function setAllProducts(list) {
    writeJson(STORAGE_KEYS.products, list);
  }

  function collectCategories() {
    const products = getAllProducts();
    const categories = Array.from(new Set(products.map(p => p.category))).sort();
    // Fill filter select
    el.filterCategory.innerHTML = '<option value="">All Categories</option>' +
      categories.map(c => `<option value="${c}">${c}</option>`).join('');
    // Fill datalist for form
    el.categoryDatalist.innerHTML = categories.map(c => `<option value="${c}"></option>`).join('');
  }

  function renderCard(p, isOwner) {
    const img = p.img || 'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?q=80&w=800&auto=format&fit=crop';
    const ownerActions = isOwner ? `
      <div class="product-actions">
        <button data-edit="${p.id}" class="ghost">Edit</button>
        <button data-delete="${p.id}" class="danger">Delete</button>
      </div>
    ` : `
      <div class="product-actions">
        <button data-buy="${p.id}" class="primary">Buy Now</button>
        <button data-cart="${p.id}" class="ghost">Add to Cart</button>
        <button data-wishlist="${p.id}" class="ghost">❤️</button>
      </div>
    `;
    return `
      <div class="product-card" data-product-id="${p.id}">
        <img class="product-thumb" src="${img}" alt="${p.name}" data-product-id="${p.id}">
        <div class="product-body">
          <div class="product-title" data-product-id="${p.id}">${p.name}</div>
          <div class="product-price">₹${Number(p.price).toLocaleString('en-IN')}</div>
          <div class="product-meta">${p.category}</div>
          ${ownerActions}
        </div>
      </div>
    `;
  }

  function renderHomeProducts() {
    const list = getAllProducts().slice(0, 10);
    el.homeProducts.innerHTML = list.map(p => renderCard(p, false)).join('');
    wireProductActions();
  }

  function renderProducts() {
    collectCategories();
    const q = (el.globalSearchInput.value || '').toLowerCase();
    const cat = el.filterCategory.value;
    const sortBy = el.sortBy.value;
    let list = getAllProducts();
    if (q) list = list.filter(p => `${p.name} ${p.desc || ''} ${p.category}`.toLowerCase().includes(q));
    if (cat) list = list.filter(p => p.category === cat);
    if (sortBy === 'priceAsc') list.sort((a, b) => Number(a.price) - Number(b.price));
    else if (sortBy === 'priceDesc') list.sort((a, b) => Number(b.price) - Number(a.price));
    else if (sortBy === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    el.productsGrid.innerHTML = list.map(p => renderCard(p, false)).join('');
    wireProductActions();
  }

  function refreshMyProducts() {
    const user = getCurrentUser();
    const all = getAllProducts();
    const mine = user ? all.filter(p => p.sellerEmail === user.email) : [];
    el.myProducts.innerHTML = mine.map(p => renderCard(p, true)).join('');
    // Wire edit/delete buttons
    el.myProducts.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => startEdit(btn.getAttribute('data-edit'))));
    el.myProducts.querySelectorAll('[data-delete]').forEach(btn => btn.addEventListener('click', () => deleteProduct(btn.getAttribute('data-delete'))));
  }

  function startEdit(id) {
    const found = getAllProducts().find(p => p.id === id);
    if (!found) return;
    el.productId.value = found.id;
    el.productName.value = found.name;
    el.productPrice.value = found.price;
    el.productCategory.value = found.category;
    el.productImage.value = found.img || '';
    el.productDesc.value = found.desc || '';
    el.addEditTitle.textContent = 'Edit Product';
    gotoTab('add');
  }

  function deleteProduct(id) {
    if (!confirm('Delete this product?')) return;
    const list = getAllProducts();
    const next = list.filter(p => p.id !== id);
    setAllProducts(next);
    renderProducts();
    refreshMyProducts();
  }

  function handleProductSubmit(e) {
    e.preventDefault();
    const user = getCurrentUser();
    if (!user) {
      alert('Please login to add or edit products.');
      gotoTab('login');
      return;
    }
    const id = el.productId.value || generateId('p');
    const product = {
      id,
      name: el.productName.value.trim(),
      price: Number(el.productPrice.value),
      category: el.productCategory.value.trim(),
      img: el.productImage.value.trim(),
      desc: el.productDesc.value.trim(),
      sellerEmail: user.email
    };
    const list = getAllProducts();
    const existingIndex = list.findIndex(p => p.id === id);
    if (existingIndex >= 0) list[existingIndex] = product; else list.unshift(product);
    setAllProducts(list);
    el.productForm.reset();
    el.productId.value = '';
    el.addEditTitle.textContent = 'Add Product';
    collectCategories();
    renderProducts();
    refreshMyProducts();
    gotoTab('products');
  }

  function handleProductReset() {
    el.productId.value = '';
    el.addEditTitle.textContent = 'Add Product';
  }

  // Global search
  function handleGlobalSearch(e) {
    if (e) e.preventDefault();
    gotoTab('products');
    renderProducts();
  }

  // Cart functions
  function getCart() {
    return readJson(STORAGE_KEYS.cart, []);
  }
  function setCart(cart) {
    writeJson(STORAGE_KEYS.cart, cart);
    updateCartBadge();
  }
  function addToCart(productId) {
    const cart = getCart();
    const product = getAllProducts().find(p => p.id === productId);
    if (!product) return;
    const existing = cart.find(item => item.productId === productId);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ productId, quantity: 1, product });
    }
    setCart(cart);
    renderCart();
  }
  function removeFromCart(productId) {
    const cart = getCart().filter(item => item.productId !== productId);
    setCart(cart);
    renderCart();
  }
  function updateCartQuantity(productId, quantity) {
    const cart = getCart();
    const item = cart.find(item => item.productId === productId);
    if (item) {
      if (quantity <= 0) {
        removeFromCart(productId);
      } else {
        item.quantity = quantity;
        setCart(cart);
        renderCart();
      }
    }
  }
  function updateCartBadge() {
    const cart = getCart();
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (el.cartBadge) el.cartBadge.textContent = count;
  }
  function renderCart() {
    const cart = getCart();
    if (cart.length === 0) {
      el.cartEmpty.style.display = 'block';
      el.cartItems.innerHTML = '';
      document.getElementById('cartContent').style.display = 'none';
      return;
    }
    el.cartEmpty.style.display = 'none';
    document.getElementById('cartContent').style.display = 'grid';
    el.cartItems.innerHTML = cart.map(item => {
      const total = item.product.price * item.quantity;
      return `
        <div class="cart-item">
          <img src="${item.product.img || 'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?q=80&w=800&auto=format&fit=crop'}" alt="${item.product.name}">
          <div class="cart-item-info">
            <h4>${item.product.name}</h4>
            <p class="cart-item-category">${item.product.category}</p>
            <p class="cart-item-price">₹${Number(item.product.price).toLocaleString('en-IN')}</p>
          </div>
          <div class="cart-item-quantity">
            <button class="qty-btn" data-cart-minus="${item.productId}">-</button>
            <input type="number" value="${item.quantity}" min="1" data-cart-qty="${item.productId}">
            <button class="qty-btn" data-cart-plus="${item.productId}">+</button>
          </div>
          <div class="cart-item-total">
            <span>₹${Number(total).toLocaleString('en-IN')}</span>
          </div>
          <button class="cart-item-remove" data-cart-remove="${item.productId}">×</button>
        </div>
      `;
    }).join('');
    const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const shipping = 50;
    const total = subtotal + shipping;
    document.getElementById('cartSubtotal').textContent = `₹${subtotal.toLocaleString('en-IN')}`;
    document.getElementById('cartTotal').textContent = `₹${total.toLocaleString('en-IN')}`;
    wireCartActions();
  }

  // Wishlist functions
  function getWishlist() {
    return readJson(STORAGE_KEYS.wishlist, []);
  }
  function setWishlist(wishlist) {
    writeJson(STORAGE_KEYS.wishlist, wishlist);
    updateWishlistBadge();
  }
  function addToWishlist(productId) {
    const wishlist = getWishlist();
    if (wishlist.includes(productId)) return;
    wishlist.push(productId);
    setWishlist(wishlist);
    renderWishlist();
  }
  function removeFromWishlist(productId) {
    const wishlist = getWishlist().filter(id => id !== productId);
    setWishlist(wishlist);
    renderWishlist();
  }
  function updateWishlistBadge() {
    const wishlist = getWishlist();
    if (el.wishlistBadge) el.wishlistBadge.textContent = wishlist.length;
  }
  function renderWishlist() {
    const wishlist = getWishlist();
    if (wishlist.length === 0) {
      el.wishlistEmpty.style.display = 'block';
      el.wishlistItems.innerHTML = '';
      return;
    }
    el.wishlistEmpty.style.display = 'none';
    const products = getAllProducts().filter(p => wishlist.includes(p.id));
    el.wishlistItems.innerHTML = products.map(p => {
      const img = p.img || 'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?q=80&w=800&auto=format&fit=crop';
      return `
        <div class="product-card">
          <img class="product-thumb" src="${img}" alt="${p.name}">
          <div class="product-body">
            <div class="product-title">${p.name}</div>
            <div class="product-price">₹${Number(p.price).toLocaleString('en-IN')}</div>
            <div class="product-meta">${p.category}</div>
            <div class="product-actions">
              <button data-buy="${p.id}" class="primary">Buy Now</button>
              <button data-cart="${p.id}" class="ghost">Add to Cart</button>
              <button data-wishlist-remove="${p.id}" class="danger">Remove</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
    wireProductActions();
    document.querySelectorAll('[data-wishlist-remove]').forEach(btn => {
      btn.addEventListener('click', () => removeFromWishlist(btn.getAttribute('data-wishlist-remove')));
    });
  }

  // Product Detail
  function showProductDetail(productId) {
    const product = getAllProducts().find(p => p.id === productId);
    if (!product) return;
    const img = product.img || 'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?q=80&w=800&auto=format&fit=crop';
    el.productDetailContent.innerHTML = `
      <div class="product-detail">
        <div class="product-detail-image">
          <img src="${img}" alt="${product.name}">
        </div>
        <div class="product-detail-info">
          <h1>${product.name}</h1>
          <div class="product-detail-price">₹${Number(product.price).toLocaleString('en-IN')}</div>
          <div class="product-detail-category">Category: ${product.category}</div>
          <div class="product-detail-desc">
            <p>${product.desc || 'No description available.'}</p>
          </div>
          <div class="product-detail-actions">
            <button data-buy="${product.id}" class="primary btn-buy">Buy Now</button>
            <button data-cart="${product.id}" class="ghost">Add to Cart</button>
            <button data-wishlist="${product.id}" class="ghost">Add to Wishlist</button>
          </div>
        </div>
      </div>
    `;
    wireProductActions();
    gotoTab('product-detail');
  }

  // Checkout
  function renderCheckout() {
    const cart = getCart();
    if (cart.length === 0) {
      alert('Your cart is empty!');
      gotoTab('cart');
      return;
    }
    el.checkoutOrderItems.innerHTML = cart.map(item => {
      const total = item.product.price * item.quantity;
      return `
        <div class="checkout-item">
          <div class="checkout-item-info">
            <span class="checkout-item-name">${item.product.name}</span>
            <span class="checkout-item-qty">× ${item.quantity}</span>
          </div>
          <span class="checkout-item-price">₹${Number(total).toLocaleString('en-IN')}</span>
        </div>
      `;
    }).join('');
    const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const shipping = 50;
    const total = subtotal + shipping;
    document.getElementById('checkoutSubtotal').textContent = `₹${subtotal.toLocaleString('en-IN')}`;
    document.getElementById('checkoutTotal').textContent = `₹${total.toLocaleString('en-IN')}`;
  }
  function handlePlaceOrder(e) {
    e.preventDefault();
    const form = el.checkoutForm;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    if (paymentMethod === 'card') {
      const cardNumber = document.getElementById('cardNumber').value;
      const cardExpiry = document.getElementById('cardExpiry').value;
      const cardCVV = document.getElementById('cardCVV').value;
      const cardName = document.getElementById('cardName').value;
      if (!cardNumber || !cardExpiry || !cardCVV || !cardName) {
        alert('Please fill in all card details');
        return;
      }
    } else if (paymentMethod === 'upi') {
      const upiId = document.getElementById('upiId').value;
      if (!upiId) {
        alert('Please enter your UPI ID');
        return;
      }
    }
    alert('Order placed successfully! Thank you for your purchase.');
    setCart([]);
    updateCartBadge();
    gotoTab('home');
  }

  // Wire product actions
  function wireProductActions() {
    document.querySelectorAll('[data-buy]').forEach(btn => {
      btn.addEventListener('click', () => {
        const productId = btn.getAttribute('data-buy');
        addToCart(productId);
        gotoTab('checkout');
      });
    });
    document.querySelectorAll('[data-cart]').forEach(btn => {
      btn.addEventListener('click', () => {
        addToCart(btn.getAttribute('data-cart'));
        alert('Product added to cart!');
      });
    });
    document.querySelectorAll('[data-wishlist]').forEach(btn => {
      btn.addEventListener('click', () => {
        addToWishlist(btn.getAttribute('data-wishlist'));
        alert('Product added to wishlist!');
      });
    });
    document.querySelectorAll('[data-product-id]').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.product-actions')) return;
        const productId = el.getAttribute('data-product-id');
        showProductDetail(productId);
      });
    });
  }
  function wireCartActions() {
    document.querySelectorAll('[data-cart-plus]').forEach(btn => {
      btn.addEventListener('click', () => {
        const productId = btn.getAttribute('data-cart-plus');
        const cart = getCart();
        const item = cart.find(i => i.productId === productId);
        if (item) updateCartQuantity(productId, item.quantity + 1);
      });
    });
    document.querySelectorAll('[data-cart-minus]').forEach(btn => {
      btn.addEventListener('click', () => {
        const productId = btn.getAttribute('data-cart-minus');
        const cart = getCart();
        const item = cart.find(i => i.productId === productId);
        if (item) updateCartQuantity(productId, item.quantity - 1);
      });
    });
    document.querySelectorAll('[data-cart-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        removeFromCart(btn.getAttribute('data-cart-remove'));
      });
    });
    document.querySelectorAll('[data-cart-qty]').forEach(input => {
      input.addEventListener('change', () => {
        const productId = input.getAttribute('data-cart-qty');
        const quantity = parseInt(input.value) || 1;
        updateCartQuantity(productId, quantity);
      });
    });
  }

  // Init
  function init() {
    ensureSeedData();
    el.year.textContent = new Date().getFullYear();
    wireNavigation();
    collectCategories();
    renderHomeProducts();
    syncAuthUI();
    updateCartBadge();
    updateWishlistBadge();

    // Listeners
    el.logoutBtn.addEventListener('click', handleLogout);
    el.signupForm.addEventListener('submit', handleSignup);
    el.loginForm.addEventListener('submit', handleLogin);
    el.productForm.addEventListener('submit', handleProductSubmit);
    el.productForm.addEventListener('reset', handleProductReset);
    el.filterCategory.addEventListener('change', renderProducts);
    el.sortBy.addEventListener('change', renderProducts);
    el.globalSearchBtn.addEventListener('click', handleGlobalSearch);
    el.globalSearchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleGlobalSearch(e); });
    if (el.checkoutBtn) el.checkoutBtn.addEventListener('click', () => gotoTab('checkout'));
    if (el.placeOrderBtn) el.placeOrderBtn.addEventListener('click', handlePlaceOrder);
    if (el.contactForm) el.contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      alert('Thank you for your message! We will get back to you soon.');
      el.contactForm.reset();
    });
    document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
      radio.addEventListener('change', () => {
        const method = radio.value;
        document.getElementById('cardPaymentForm').classList.toggle('hidden', method !== 'card');
        document.getElementById('upiPaymentForm').classList.toggle('hidden', method !== 'upi');
      });
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();


