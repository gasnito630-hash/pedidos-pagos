// ==================== STATE ====================
let products = [],
    cart = {},
    categories = [],
    selectedCategory = 'TODOS',
    orders = [],
    addresses = [],
    currentView = 'catalogo',
    isDarkMode = true,
    editingAddressId = null;

const token = localStorage.getItem('token'),
    usuarioId = localStorage.getItem('usuarioId') || '1',
    userEmail = localStorage.getItem('email') || 'usuario@email.com',
    userName = localStorage.getItem('nombre') || 'Usuario',
    userRole = localStorage.getItem('rol') || 'CLIENTE';

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
    initUser();
    loadProducts();
    loadOrders();

    // Search con debounce
    document.getElementById('searchInput')?.addEventListener('input', debounce(filterProducts, 300));

    // Event listener para método de envío en checkout
    const shippingSelect = document.getElementById('shippingMethod');
    if (shippingSelect) {
        shippingSelect.addEventListener('change', updateCheckoutSummary);
    }

    // Cerrar modals al hacer click fuera
    document.querySelectorAll('.modal-overlay').forEach(m => {
        m.addEventListener('click', e => {
            if (e.target === m) m.classList.remove('active');
        });
    });
});

function initUser() {
    document.getElementById('userName').textContent = userName;
    document.getElementById('userEmail').textContent = userEmail;
    document.getElementById('userRole').textContent = userRole;
    document.getElementById('profileName').value = userName;
    document.getElementById('profileEmail').value = userEmail;
}

// ==================== NAVIGATION ====================
function switchView(viewName) {
    currentView = viewName;

    // Actualizar menú activo
    document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
    document.getElementById(`btn-${viewName}`)?.classList.add('active');

    // Mostrar vista seleccionada
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    document.getElementById(`view-${viewName}`).classList.add('active');

    // Cargar datos según vista
    if (viewName === 'pedidos') loadOrders();
    else if (viewName === 'direcciones') loadAddresses();

    window.scrollTo(0, 0);
}

function toggleCart(open) {
    document.getElementById('cartSidebar').classList.toggle('open', open);
}

// ==================== PRODUCTS ====================
async function loadProducts() {
    try {
        console.log('🔄 Cargando productos...');
        const response = await fetch('/api/productos', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Error al cargar productos: ' + response.status);

        const data = await response.json();
        products = Array.isArray(data) ? data : [];

        console.log('✅ Productos cargados:', products.length);

        extractCategories();
        renderCategories();
        renderProducts(products);
    } catch (error) {
        console.error('❌ Error:', error);
        showToast('Error', 'No se pudieron cargar los productos', 'error');
        document.getElementById('productsContainer').innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <div class="empty-state-icon">📦</div>
                <div class="empty-state-title">Error al cargar</div>
                <p>Por favor, recarga la página</p>
            </div>`;
    }
}

function extractCategories() {
    const s = new Set();
    products.forEach(p => {
        const c = p.categoria?.nombre || p.Categoria?.nombre;
        if (c) s.add(c);
    });
    categories = Array.from(s);
}

function renderCategories() {
    const c = document.getElementById('categoriesContainer');
    c.innerHTML = '<button class="category-chip active" onclick="filterCategory(\'TODOS\',this)">Todos</button>';

    categories.forEach(cat => {
        const b = document.createElement('button');
        b.className = 'category-chip';
        b.textContent = cat;
        b.onclick = () => filterCategory(cat, b);
        c.appendChild(b);
    });
}

function filterCategory(cat, btn) {
    selectedCategory = cat;
    document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    filterProducts();
}

function filterProducts() {
    const q = document.getElementById('searchInput').value.toLowerCase().trim();
    const f = products.filter(p =>
        (p.nombre || '').toLowerCase().includes(q) &&
        (selectedCategory === 'TODOS' || (p.categoria?.nombre || p.Categoria?.nombre || '') === selectedCategory)
    );
    renderProducts(f);
}

function renderProducts(list) {
    const c = document.getElementById('productsContainer');

    if (!list || list.length === 0) {
        c.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
            <div class="empty-state-icon">🔍</div>
            <div class="empty-state-title">Sin productos</div>
            <p>No hay productos disponibles en esta categoría</p>
        </div>`;
        return;
    }

    c.innerHTML = list.map(p => {
        const stock = p.stock || 0;
        const out = stock === 0;

        // Construir URL de imagen correctamente
        let imagenSrc = '';
        if (p.imagenUrl && p.imagenUrl.trim() !== '') {
            imagenSrc = p.imagenUrl.startsWith('/') ? p.imagenUrl : '/' + p.imagenUrl;
        }

        // HTML de imagen con fallback
        const imagenHTML = imagenSrc ?
            `<img src="${imagenSrc}" 
              style="width:100%;height:100%;object-fit:cover;" 
              onerror="this.parentElement.innerHTML='<div style=\\'font-size:3rem;color:var(--text-muted)\\'>📦</div>'">` :
            `<div style="font-size:3rem;color:var(--text-muted);display:flex;align-items:center;justify-content:center;height:100%">📦</div>`;

        return `<div class="product-card">
            <div class="product-image" style="background:var(--bg-secondary);display:flex;align-items:center;justify-content:center">
                ${imagenHTML}
            </div>
            <div class="product-info">
                <div class="product-category">${p.categoria?.nombre || p.Categoria?.nombre || 'General'}</div>
                <div class="product-name" title="${p.nombre}">${p.nombre}</div>
                <div class="product-meta">
                    <span>SKU: ${p.sku || 'N/A'}</span>
                    <span class="stock-badge ${stock < 10 && !out ? 'low' : ''}">${out ? 'Sin Stock' : `Stock: ${stock}`}</span>
                </div>
                <div class="product-price">S/. ${(p.precio || 0).toFixed(2)}</div>
                <button class="btn-add-cart" onclick="addToCart(${p.productoId},'${(p.nombre || '').replace(/'/g, "\\'")}',${p.precio || 0})" ${out ? 'disabled' : ''}>
                    ${out ? 'Sin Stock' : 'Agregar al Carrito'}
                </button>
            </div>
        </div>`;
    }).join('');
}

// ==================== CART ====================
function addToCart(id, name, price) {
    if (cart[id]) {
        cart[id].cantidad++;
    } else {
        cart[id] = { productoId: id, nombre: name, precio: price, cantidad: 1 };
    }
    updateCartUI();
    showToast('Agregado', `${name} al carrito`, 'success');
}

function removeFromCart(id) {
    delete cart[id];
    updateCartUI();
}

function updateQuantity(id, change) {
    if (cart[id]) {
        cart[id].cantidad += change;
        if (cart[id].cantidad <= 0) {
            removeFromCart(id);
        } else {
            updateCartUI();
        }
    }
}

function updateCartUI() {
    const items = Object.values(cart);
    const totalItems = items.reduce((s, i) => s + i.cantidad, 0);
    const total = items.reduce((s, i) => s + (i.precio * i.cantidad), 0);

    document.getElementById('cartBadge').textContent = totalItems;
    document.getElementById('cartSubtotal').textContent = `S/. ${total.toFixed(2)}`;
    document.getElementById('cartTotal').textContent = `S/. ${total.toFixed(2)}`;

    const list = document.getElementById('cartItems');

    if (!items.length) {
        list.innerHTML = `<div class="empty-cart"><div class="empty-cart-icon">🛒</div><p>Tu carrito está vacío</p></div>`;
        return;
    }

    list.innerHTML = items.map(i => `
        <div class="cart-item">
            <div class="cart-item-image">📦</div>
            <div class="cart-item-details">
                <div class="cart-item-name">${i.nombre}</div>
                <div class="cart-item-price">S/. ${i.precio.toFixed(2)}</div>
                <div class="quantity-controls">
                    <button class="btn-qty" onclick="updateQuantity(${i.productoId},-1)">-</button>
                    <span>${i.cantidad}</span>
                    <button class="btn-qty" onclick="updateQuantity(${i.productoId},1)">+</button>
                </div>
            </div>
            <button class="btn-remove" onclick="removeFromCart(${i.productoId})">Eliminar</button>
        </div>
    `).join('');
}

// ==================== CHECKOUT ====================
async function showCheckoutModal() {
    const items = Object.values(cart);
    if (!items.length) {
        showToast('Carrito vacío', 'Agrega productos primero', 'warning');
        return;
    }

    // Cargar métodos de envío si no están cargados
    const shippingSelect = document.getElementById('shippingMethod');
    if (shippingSelect.options.length <= 1) {
        try {
            const res = await fetch('/api/envios/metodos', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const methods = await res.json();
                shippingSelect.innerHTML = '<option value="">Seleccionar envío...</option>';
                methods.forEach(m => {
                    const opt = document.createElement('option');
                    opt.value = m.metodoId;
                    opt.textContent = `${m.nombre} (S/. ${m.costoBase?.toFixed(2) || '0.00'}) - ${m.diasEntregaMin}-${m.diasEntregaMax} días`;
                    opt.dataset.costo = m.costoBase || 0;
                    shippingSelect.appendChild(opt);
                });
            }
        } catch (e) {
            console.error('Error cargando métodos de envío:', e);
        }
    }

    updateCheckoutSummary();
    document.getElementById('checkoutModal').classList.add('active');
}

function closeCheckoutModal() {
    document.getElementById('checkoutModal').classList.remove('active');
}

function selectPaymentMethod(method, el) {
    document.getElementById('paymentMethod').value = method;
    document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
}

function updateCheckoutSummary() {
    const items = Object.values(cart);
    const subtotal = items.reduce((sum, i) => sum + (i.precio * i.cantidad), 0);

    const shippingSelect = document.getElementById('shippingMethod');
    const selectedOption = shippingSelect.options[shippingSelect.selectedIndex];
    const shippingCost = selectedOption && selectedOption.value ? parseFloat(selectedOption.dataset.costo) || 0 : 0;

    const total = subtotal + shippingCost;

    document.getElementById('checkoutSummary').innerHTML = `
        <div style="margin-bottom:12px;"><strong>${items.length} producto(s)</strong></div>
        <div style="display:flex;justify-content:space-between;margin-bottom:8px"><span>Subtotal:</span><span>S/. ${subtotal.toFixed(2)}</span></div>
        <div style="display:flex;justify-content:space-between;margin-bottom:8px"><span>Envío:</span><span style="color:var(--success)">S/. ${shippingCost.toFixed(2)}</span></div>
        <div style="display:flex;justify-content:space-between;font-size:1.2rem;font-weight:700;color:var(--primary);border-top:1px solid var(--border-color);padding-top:12px"><span>Total:</span><span>S/. ${total.toFixed(2)}</span></div>
    `;

    document.getElementById('cartShipping').textContent = `S/. ${shippingCost.toFixed(2)}`;
    document.getElementById('cartTotal').textContent = `S/. ${total.toFixed(2)}`;
}

async function processOrder(event) {
    event.preventDefault();

    const items = Object.values(cart).map(item => ({
        productoId: item.productoId,
        cantidad: item.cantidad
    }));

    const orderData = {
        items: items,
        direccionEnvio: document.getElementById('shippingAddress').value,
        telefonoContacto: document.getElementById('contactPhone').value,
        metodoPago: document.getElementById('paymentMethod').value,
        metodoEnvioId: document.getElementById('shippingMethod').value ?
            parseInt(document.getElementById('shippingMethod').value) : null
    };

    console.log('📦 Datos del pedido:', orderData);

    try {
        const res = await fetch('/api/pedidos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'X-Usuario-ID': usuarioId
            },
            body: JSON.stringify(orderData)
        });

        if (!res.ok) {
            const error = await res.text();
            throw new Error(error || 'Error al crear el pedido');
        }

        const result = await res.json();
        showToast('¡Pedido creado!', `Pedido #${result.pedidoId} registrado exitosamente`, 'success');

        cart = {};
        updateCartUI();
        closeCheckoutModal();
        toggleCart(false);
        await loadProducts();
        await loadOrders();

    } catch (error) {
        console.error('Error:', error);
        showToast('Error', error.message || 'No se pudo procesar el pedido', 'error');
    }
}

// ==================== ORDERS ====================
async function loadOrders() {
    try {
        const res = await fetch(`/api/pedidos/mis-pedidos?usuarioId=${usuarioId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Error');
        orders = await res.json();
        renderOrders();
        updateStats();
    } catch (e) {
        console.error(e);
        document.getElementById('pedidosTableBody').innerHTML = `
            <tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-muted)">
                Error al cargar pedidos
            </td></tr>`;
    }
}

function renderOrders() {
    const tb = document.getElementById('pedidosTableBody');

    if (!orders.length) {
        tb.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:40px">
            <div class="empty-state" style="padding:20px">
                <div class="empty-state-icon">📦</div>
                <div class="empty-state-title">Sin pedidos</div>
                <p>Aún no has realizado compras</p>
            </div>
        </td></tr>`;
        return;
    }

    tb.innerHTML = orders.map(o => {
        const cls = `status-${(o.estado || 'pendiente').toLowerCase()}`;
        const fecha = new Date(o.creadoEn || o.fechaPedido).toLocaleString('es-PE');
        const canDelete = (o.estado || '').toUpperCase() === 'PENDIENTE';
        const deleteButton = canDelete ?
            `<button class="btn-remove" onclick="deleteOrder(${o.pedidoId})" style="margin-left:8px;">🗑️ Eliminar</button>` : '';

        return `<tr>
            <td class="order-id">#${o.pedidoId}</td>
            <td>${fecha}</td>
            <td><span class="status-badge ${cls}">${o.estado || 'PENDIENTE'}</span></td>
            <td style="font-weight:700;color:var(--primary)">S/. ${(o.montoTotal || 0).toFixed(2)}</td>
            <td>
                <button class="btn-view" onclick="viewOrderDetail(${o.pedidoId})">Ver</button>
                ${deleteButton}
            </td>
        </tr>`;
    }).join('');
}

async function deleteOrder(pedidoId) {
    if (!confirm('¿Estás seguro de eliminar este pedido? Esta acción no se puede deshacer.')) {
        return;
    }

    try {
        const res = await fetch(`/api/pedidos/${pedidoId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-Usuario-ID': usuarioId
            }
        });

        if (res.ok) {
            showToast('Eliminado', `Pedido #${pedidoId} eliminado correctamente`, 'success');
            await loadOrders();
        } else {
            const error = await res.json();
            showToast('Error', error.error || 'No se pudo eliminar el pedido', 'error');
        }
    } catch (err) {
        console.error('Error:', err);
        showToast('Error', 'Error de conexión al eliminar el pedido', 'error');
    }
}

function updateStats() {
    const total = orders.length;
    const gastado = orders.reduce((s, o) => s + (o.montoTotal || 0), 0);
    const prom = total > 0 ? gastado / total : 0;

    document.getElementById('statTotalPedidos').textContent = total;
    document.getElementById('statTotalGastado').textContent = `S/. ${gastado.toFixed(2)}`;
    document.getElementById('statPromedio').textContent = `S/. ${prom.toFixed(2)}`;
}

async function viewOrderDetail(pedidoId) {
    try {
        const res = await fetch(`/api/pedidos/${pedidoId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Error');
        const o = await res.json();
        showOrderDetail(o);
    } catch (e) {
        showToast('Error', 'No se pudo cargar el detalle', 'error');
    }
}

function showOrderDetail(o) {
    document.getElementById('orderDetailId').textContent = o.pedidoId;
    const items = o.detalles || o.items || [];
    const fecha = new Date(o.creadoEn || o.fechaPedido).toLocaleString('es-PE');

    const itemsHTML = items.map(i => {
        const nombreProducto = i.nombreProducto || 'Producto';
        const imagenUrl = i.imagenUrl;

        const imagenHTML = imagenUrl && imagenUrl.trim() !== '' && imagenUrl !== 'null' ?
            `<img src="${imagenUrl.startsWith('/') ? imagenUrl : '/' + imagenUrl}" 
              style="width:60px;height:60px;object-fit:cover;border-radius:8px;"
              onerror="this.style.display='none'; this.parentElement.innerHTML='📦'">` :
            '<div style="font-size:1.8rem">📦</div>';

        return `<div class="order-item">
            <div class="order-item-image" style="display:flex;align-items:center;justify-content:center;background:var(--bg-card);border-radius:8px;">
                ${imagenHTML}
            </div>
            <div class="order-item-info">
                <div class="order-item-name">${nombreProducto}</div>
                <div class="order-item-meta">Cantidad: ${i.cantidad} x S/. ${(i.precioUnitario || 0).toFixed(2)}</div>
            </div>
            <div class="order-item-price">S/. ${(i.subtotal || 0).toFixed(2)}</div>
        </div>`;
    }).join('');

    const shippingInfo = o.metodoEnvioNombre || o.numeroTracking || o.estadoEnvio ? `
        <div class="shipping-info">
            <div class="shipping-info-title">🚚 Información de Envío</div>
            ${o.metodoEnvioNombre ? `<div class="shipping-info-row"><span>Método:</span><strong>${o.metodoEnvioNombre}</strong></div>` : ''}
            ${o.costoEnvio ? `<div class="shipping-info-row"><span>Costo:</span><strong>S/. ${parseFloat(o.costoEnvio).toFixed(2)}</strong></div>` : ''}
            ${o.numeroTracking ? `<div class="shipping-info-row"><span>Tracking:</span><strong class="tracking-code">${o.numeroTracking}</strong></div>` : ''}
            ${o.estadoEnvio ? `<div class="shipping-info-row"><span>Estado:</span><strong>${o.estadoEnvio}</strong></div>` : ''}
            ${o.fechaEstimadaEntrega ? `<div class="shipping-info-row"><span>Entrega estimada:</span><strong>${new Date(o.fechaEstimadaEntrega).toLocaleDateString('es-PE')}</strong></div>` : ''}
        </div>` : '';

    document.getElementById('orderDetailBody').innerHTML = `
        <div style="margin-bottom:24px">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
                <div><div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:4px">Fecha</div><div style="font-weight:600">${fecha}</div></div>
                <div><div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:4px">Estado</div><span class="status-badge status-${(o.estado || 'PENDIENTE').toLowerCase()}">${o.estado || 'PENDIENTE'}</span></div>
            </div>
            <div style="margin-bottom:20px"><div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:4px">Dirección</div><div style="font-weight:600">${o.direccionEnvio || 'No especificada'}</div></div>
            <div style="margin-bottom:20px"><div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:4px">Teléfono</div><div style="font-weight:600">${o.telefonoContacto || 'No especificado'}</div></div>
            <div style="margin-bottom:20px"><div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:4px">Método de Pago</div><div style="font-weight:600">${o.metodoPago || 'No especificado'}</div></div>
            ${shippingInfo}
        </div>
        <h4 style="margin-bottom:16px">Productos</h4>
        <div class="order-items-list">${itemsHTML}</div>
        <div style="border-top:2px solid var(--border-color);padding-top:20px;margin-top:20px">
            <div style="display:flex;justify-content:space-between;font-size:1.3rem;font-weight:700;color:var(--primary)"><span>Total:</span><span>S/. ${(o.montoTotal || 0).toFixed(2)}</span></div>
        </div>`;

    document.getElementById('orderDetailModal').classList.add('active');
}

function closeOrderDetailModal() {
    document.getElementById('orderDetailModal').classList.remove('active');
}

// ==================== ADDRESSES ====================
async function loadAddresses() {
    try {
        const res = await fetch(`/api/direcciones?usuarioId=${usuarioId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        addresses = res.ok ? await res.json() : [];
        renderAddresses();
    } catch (e) {
        console.error(e);
        addresses = [];
        renderAddresses();
    }
}

function renderAddresses() {
    const c = document.getElementById('addressesContainer');

    if (!addresses.length) {
        c.innerHTML = `<div class="empty-state">
            <div class="empty-state-icon">📍</div>
            <div class="empty-state-title">Sin direcciones</div>
            <p>Agrega tu primera dirección</p>
        </div>`;
        return;
    }

    c.innerHTML = addresses.map(a => `
        <div class="table-container" style="padding:20px;margin-bottom:16px">
            <div style="display:flex;justify-content:space-between;align-items:start">
                <div style="flex:1">
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
                        <div style="font-weight:600;font-size:1.1rem">📍 ${a.calle || 'Calle'} #${a.numero || ''}</div>
                        ${a.esPrincipal ? '<span class="status-badge status-procesando">Principal</span>' : ''}
                    </div>
                    <div style="color:var(--text-muted);margin-bottom:6px">
                        ${a.ciudad || ''}${a.ciudad && a.pais ? ', ' : ''}${a.pais || ''}
                    </div>
                    <div style="color:var(--text-muted);font-size:0.9rem">ID: #${a.direccionId}</div>
                </div>
                <div style="display:flex;gap:8px">
                    <button class="btn-view" onclick="editAddress(${a.direccionId})">Editar</button>
                    <button class="btn-remove" onclick="deleteAddress(${a.direccionId})">Eliminar</button>
                </div>
            </div>
        </div>
    `).join('');
}

function showAddressModal() {
    editingAddressId = null;
    document.getElementById('addressForm')?.reset();
    document.getElementById('addressModalTitle').textContent = 'Agregar Dirección';
    document.getElementById('addressModal')?.classList.add('active');
}

function editAddress(id) {
    const a = addresses.find(x => x.direccionId === id);
    if (!a) return;

    editingAddressId = id;
    document.getElementById('addressCalle').value = a.calle || '';
    document.getElementById('addressNumero').value = a.numero || '';
    document.getElementById('addressCiudad').value = a.ciudad || '';
    document.getElementById('addressPais').value = a.pais || '';
    document.getElementById('addressEsPrincipal').checked = a.esPrincipal || false;
    document.getElementById('addressModalTitle').textContent = 'Editar Dirección';
    document.getElementById('addressModal')?.classList.add('active');
}

async function saveAddress(e) {
    e.preventDefault();

    const data = {
        usuarioId: parseInt(usuarioId),
        calle: document.getElementById('addressCalle').value,
        numero: document.getElementById('addressNumero').value,
        ciudad: document.getElementById('addressCiudad').value,
        pais: document.getElementById('addressPais').value,
        esPrincipal: document.getElementById('addressEsPrincipal').checked
    };

    try {
        let url = '/api/direcciones', method = 'POST';
        if (editingAddressId) {
            url = `/api/direcciones/${editingAddressId}`;
            method = 'PUT';
        }

        const res = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (!res.ok) throw new Error('Error');

        await loadAddresses();
        closeAddressModal();
        showToast(editingAddressId ? 'Actualizada' : 'Agregada', 'Dirección guardada', 'success');

    } catch (err) {
        console.error(err);
        showToast('Error', 'No se pudo guardar', 'error');
    }
}

async function deleteAddress(id) {
    if (!confirm('¿Eliminar esta dirección?')) return;

    try {
        const res = await fetch(`/api/direcciones/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Error');
        await loadAddresses();
        showToast('Eliminada', 'Dirección eliminada', 'success');
    } catch (err) {
        console.error(err);
        showToast('Error', 'No se pudo eliminar', 'error');
    }
}

function closeAddressModal() {
    document.getElementById('addressModal')?.classList.remove('active');
    editingAddressId = null;
}

// ==================== SETTINGS ====================
async function updateProfile(e) {
    e.preventDefault();

    const data = {
        nombre: document.getElementById('profileName').value,
        email: document.getElementById('profileEmail').value,
        telefono: document.getElementById('profilePhone').value
    };

    try {
        const res = await fetch(`/api/usuarios/${usuarioId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (!res.ok) throw new Error('Error');

        localStorage.setItem('nombre', data.nombre);
        localStorage.setItem('email', data.email);
        document.getElementById('userName').textContent = data.nombre;
        document.getElementById('userEmail').textContent = data.email;

        showToast('Actualizado', 'Perfil guardado', 'success');

    } catch (err) {
        showToast('Error', 'No se pudo actualizar', 'error');
    }
}

async function changePassword(e) {
    e.preventDefault();

    const np = document.getElementById('newPassword').value;
    const cp = document.getElementById('confirmPassword').value;

    if (np !== cp) {
        showToast('Error', 'Las contraseñas no coinciden', 'error');
        return;
    }
    if (np.length < 6) {
        showToast('Error', 'Mínimo 6 caracteres', 'error');
        return;
    }

    try {
        const res = await fetch('/api/auth/update-password', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                usuarioId: parseInt(usuarioId),
                newPassword: np
            })
        });

        if (!res.ok) throw new Error('Error');

        document.getElementById('passwordForm').reset();
        showToast('Actualizada', 'Contraseña cambiada', 'success');

    } catch (err) {
        showToast('Error', 'No se pudo actualizar', 'error');
    }
}

function toggleTheme() {
    const r = document.documentElement;

    if (isDarkMode) {
        // Cambiar a modo claro
        r.style.setProperty('--bg-body', '#f1f5f9');
        r.style.setProperty('--bg-sidebar', '#ffffff');
        r.style.setProperty('--bg-card', '#ffffff');
        r.style.setProperty('--border-color', '#cbd5e1');
        r.style.setProperty('--text-main', '#0f172a');
        r.style.setProperty('--text-muted', '#64748b');
        showToast('Modo claro', 'Interfaz actualizada', 'success');
    } else {
        // Cambiar a modo oscuro
        r.style.setProperty('--bg-body', '#0b0f19');
        r.style.setProperty('--bg-sidebar', '#111827');
        r.style.setProperty('--bg-card', '#1f2937');
        r.style.setProperty('--border-color', '#374151');
        r.style.setProperty('--text-main', '#f3f4f6');
        r.style.setProperty('--text-muted', '#9ca3af');
        showToast('Modo oscuro', 'Interfaz actualizada', 'success');
    }
    isDarkMode = !isDarkMode;
}

// ==================== MODAL DE CONFIRMACIÓN ====================
let confirmCallback = null;

function showConfirmModal(title, message, onAccept) {
    const modal = document.getElementById('confirmModal');
    if (!modal) return;
    document.getElementById('confirmModalTitle').textContent = title;
    document.getElementById('confirmModalMessage').textContent = message;
    confirmCallback = onAccept;
    modal.classList.add('active');
}

function closeConfirmModal() {
    const modal = document.getElementById('confirmModal');
    if (modal) modal.classList.remove('active');
    confirmCallback = null;
}

// Configurar eventos del modal (una sola vez)
document.addEventListener('DOMContentLoaded', () => {
    const acceptBtn = document.getElementById('confirmModalAcceptBtn');
    const cancelBtn = document.getElementById('confirmModalCancelBtn');
    if (acceptBtn) {
        acceptBtn.addEventListener('click', () => {
            if (confirmCallback) confirmCallback();
            closeConfirmModal();
        });
    }
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeConfirmModal);
    }
    // Cerrar al hacer clic fuera del modal
    const modal = document.getElementById('confirmModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeConfirmModal();
        });
    }
});

// ==================== LOGOUT MEJORADO ====================
function logout() {
    showConfirmModal(
        'Cerrar sesión',
        '¿Estás seguro de que deseas cerrar sesión?',
        () => {
            localStorage.clear();
            window.location.replace('/index.html');
        }
    );
}
// ==================== UTILS ====================
function showToast(title, msg, type = 'info') {
    const c = document.getElementById('toastContainer');
    const t = document.createElement('div');

    t.className = `toast ${type}`;
    t.innerHTML = `<div class="toast-title">${title}</div><div class="toast-message">${msg}</div>`;

    c.appendChild(t);

    setTimeout(() => {
        t.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => t.remove(), 300);
    }, 3500);
}

function debounce(fn, wait) {
    let t;
    return function (...args) {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), wait);
    };
}

// ==================== SIDEBAR TOGGLE ====================
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const menuToggle = document.querySelector('.menu-toggle');

    if (!sidebar || !menuToggle) {
        console.warn('Sidebar o menu-toggle no encontrado');
        return;
    }

    // Toggle de clases
    sidebar.classList.toggle('open');
    menuToggle.classList.toggle('active');

    // Crear overlay si no existe (para móvil)
    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.onclick = () => {
            sidebar.classList.remove('open');
            menuToggle.classList.remove('active');
            overlay.classList.remove('show');
            document.body.style.overflow = '';
        };
        document.body.appendChild(overlay);
    }

    // Comportamiento responsive
    const isMobile = window.innerWidth <= 1024;

    if (isMobile) {
        // Móvil: mostrar/ocultar con overlay
        overlay.classList.toggle('show');
        document.body.style.overflow = sidebar.classList.contains('open') ? 'hidden' : '';
    } else {
        // Desktop: colapsar sidebar
        sidebar.classList.toggle('collapsed');
        document.querySelector('.main-content')?.classList.toggle('expanded');
    }

    console.log('Sidebar toggle:', sidebar.classList.contains('open') ? 'abierto' : 'cerrado');
}

// Cerrar sidebar al cambiar de vista en móvil
const originalSwitchView = window.switchView;
window.switchView = function (viewName) {
    if (originalSwitchView) originalSwitchView(viewName);

    if (window.innerWidth <= 1024) {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        const menuToggle = document.querySelector('.menu-toggle');

        if (sidebar?.classList.contains('open')) {
            sidebar.classList.remove('open');
            overlay?.classList.remove('show');
            menuToggle?.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
};

// Restaurar estado al recargar (desktop)
document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    const menuToggle = document.querySelector('.menu-toggle');
    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';

    if (isCollapsed && window.innerWidth > 1024 && sidebar && mainContent && menuToggle) {
        sidebar.classList.add('collapsed');
        mainContent.classList.add('expanded');
        menuToggle.classList.add('active');
    }
});

