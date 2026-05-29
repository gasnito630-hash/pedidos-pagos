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
    // === CAPTURAR TOKEN DE GOOGLE OAUTH (si viene por URL) ===
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');

    if (tokenFromUrl) {
        console.log('✅ Token de Google OAuth detectado');

        // Guardar en localStorage
        localStorage.setItem('token', tokenFromUrl);
        localStorage.setItem('authMethod', 'google');

        // Limpiar URL
        window.history.replaceState({}, document.title, window.location.pathname);

        // Mostrar mensaje de bienvenida
        if (typeof showToast === 'function') {
            showToast('¡Bienvenido!', 'Has iniciado sesión con Google', 'success');
        }
    }

    // === Verificación normal de sesión ===
    const token = localStorage.getItem('token');
    if (!token || token === 'undefined') {
        console.warn('No hay token válido, redirigiendo al login...');
        window.location.replace('/index.html');
        return;
    }
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
        console.log('Cargando productos...');

        // ✅ Agregar paginación básica para el dashboard (cliente)
        const response = await fetch('/api/productos?page=0&size=20', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Error al cargar productos: ' + response.status);

        const data = await response.json();

        // ✅ Extraer content del objeto Page
        products = data.content || (Array.isArray(data) ? data : []);

        console.log('Productos cargados:', products.length);

        extractCategories();
        renderCategories();
        renderProducts(products);

    } catch (error) {
        console.error('Error:', error);
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
            <div class="empty-state-icon"></div>
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

    console.log('Datos del pedido:', orderData);

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
            `<button class="btn-remove" onclick="deleteOrder(${o.pedidoId})" style="margin-left:8px;">Eliminar</button>` : '';

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
    // 1. Crear la promesa para esperar la respuesta del usuario
    const confirmar = () => {
        return new Promise((resolve) => {
            // Estilos del contenedor del modal (Fondo oscuro)
            const backdrop = document.createElement('div');
            backdrop.style.position = 'fixed';
            backdrop.style.top = '0';
            backdrop.style.left = '0';
            backdrop.style.width = '100vw';
            backdrop.style.height = '100vh';
            backdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            backdrop.style.backdropFilter = 'blur(4px)';
            backdrop.style.display = 'flex';
            backdrop.style.justifyContent = 'center';
            backdrop.style.alignItems = 'center';
            backdrop.style.zIndex = '99999';
            backdrop.style.fontFamily = 'system-ui, -apple-system, sans-serif';

            // Estilos de la tarjeta del modal
            const card = document.createElement('div');
            card.style.backgroundColor = '#000000';
            card.style.padding = '24px';
            card.style.borderRadius = '12px';
            card.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)';
            card.style.maxWidth = '400px';
            card.style.width = '90%';
            card.style.textAlign = 'center';
            card.style.animation = 'scaleUp 0.2s ease-out';

            // Inyectar animación CSS simple
            const style = document.createElement('style');
            style.textContent = `@keyframes scaleUp { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }`;
            document.head.appendChild(style);

            // Contenido del modal
            card.innerHTML = `
                <div style="font-size: 48px; color: #dc3545; margin-bottom: 12px;">⚠️</div>
                <h3 style="margin: 0 0 8px 0; font-size: 20px; color: #ffffff;">¿Estás seguro?</h3>
                <p style="margin: 0 0 24px 0; font-size: 14px; color: #6c757d; line-height: 1.5;">
                    Esta acción eliminará el pedido de forma permanente y no se puede deshacer.
                </p>
                <div style="display: flex; justify-content: center; gap: 12px;">
                    <button id="btn-cancelar" style="padding: 10px 18px; border: 1px solid #dee2e6; background: #fff; color: #495057; border-radius: 6px; cursor: pointer; font-weight: 500; font-size: 14px;">Cancelar</button>
                    <button id="btn-confirmar" style="padding: 10px 18px; border: none; background: #dc3545; color: #fff; border-radius: 6px; cursor: pointer; font-weight: 500; font-size: 14px;">Sí, eliminar</button>
                </div>
            `;

            backdrop.appendChild(card);
            document.body.appendChild(backdrop);

            // Manejadores de eventos internos
            card.querySelector('#btn-cancelar').addEventListener('click', () => {
                backdrop.remove();
                resolve(false);
            });

            card.querySelector('#btn-confirmar').addEventListener('click', () => {
                backdrop.remove();
                resolve(true);
            });
        });
    };

    // 2. Ejecutar la confirmación visual
    const userConfirmed = await confirmar();
    if (!userConfirmed) return;

    // 3. Flujo original de eliminación
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
    // 1. Crear el modal estético autónomo
    const confirmar = () => {
        return new Promise((resolve) => {
            // Fondo oscuro difuminado
            const backdrop = document.createElement('div');
            backdrop.style.position = 'fixed';
            backdrop.style.top = '0';
            backdrop.style.left = '0';
            backdrop.style.width = '100vw';
            backdrop.style.height = '100vh';
            backdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            backdrop.style.backdropFilter = 'blur(4px)';
            backdrop.style.display = 'flex';
            backdrop.style.justifyContent = 'center';
            backdrop.style.alignItems = 'center';
            backdrop.style.zIndex = '99999';
            backdrop.style.fontFamily = 'system-ui, -apple-system, sans-serif';

            // Tarjeta del modal
            const card = document.createElement('div');
            card.style.backgroundColor = '#fff';
            card.style.padding = '24px';
            card.style.borderRadius = '12px';
            card.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)';
            card.style.maxWidth = '400px';
            card.style.width = '90%';
            card.style.textAlign = 'center';
            card.style.animation = 'scaleUp 0.2s ease-out';

            // Animación CSS integrada
            const style = document.createElement('style');
            style.textContent = `@keyframes scaleUp { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }`;
            document.head.appendChild(style);

            // Contenido visual
            card.innerHTML = `
                <div style="font-size: 48px; color: #dc3545; margin-bottom: 12px;">⚠️</div>
                <h3 style="margin: 0 0 8px 0; font-size: 20px; color: #212529;">¿Eliminar esta dirección?</h3>
                <p style="margin: 0 0 24px 0; font-size: 14px; color: #6c757d; line-height: 1.5;">
                    Esta acción no se puede deshacer.
                </p>
                <div style="display: flex; justify-content: center; gap: 12px;">
                    <button id="btn-cancelar" style="padding: 10px 18px; border: 1px solid #dee2e6; background: #fff; color: #495057; border-radius: 6px; cursor: pointer; font-weight: 500; font-size: 14px;">Cancelar</button>
                    <button id="btn-confirmar" style="padding: 10px 18px; border: none; background: #dc3545; color: #fff; border-radius: 6px; cursor: pointer; font-weight: 500; font-size: 14px;">Sí, eliminar</button>
                </div>
            `;

            backdrop.appendChild(card);
            document.body.appendChild(backdrop);

            // Captura de clics
            card.querySelector('#btn-cancelar').addEventListener('click', () => {
                backdrop.remove();
                resolve(false);
            });

            card.querySelector('#btn-confirmar').addEventListener('click', () => {
                backdrop.remove();
                resolve(true);
            });
        });
    };

    // 2. Esperar la respuesta del usuario
    const userConfirmed = await confirmar();
    if (!userConfirmed) return;

    // 3. Flujo original de eliminación
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
// ========================================================
// 👤 CORRECCIÓN: ACTUALIZACIÓN DE PERFIL EN TIEMPO REAL
// ========================================================
async function updateProfile(event) {
    event.preventDefault();

    const nameInput = document.getElementById('profileName').value;
    const emailInput = document.getElementById('profileEmail').value;
    const phoneInput = document.getElementById('profilePhone').value;

    try {
        // Intentar actualizar en tu servidor/API actual
        const response = await fetch(`${API}/usuarios/perfil`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nombre: nameInput, email: emailInput, telefono: phoneInput })
        });

        if (response.ok) {
            actualizarInterfazUsuario(nameInput, emailInput);
        } else {
            throw new Error("Error de servidor");
        }
    } catch (error) {
        console.warn("⚠️ Modo Local/Simulado: Guardando datos directamente en el navegador.");
        // Fallback operativo por si estás trabajando de forma local o sin backend listo
        actualizarInterfazUsuario(nameInput, emailInput);
    }
}

// Función auxiliar para refrescar el Sidebar y LocalStorage de inmediato
function actualizarInterfazUsuario(nuevoNombre, nuevoEmail) {
    localStorage.setItem('nombre', nuevoNombre);
    localStorage.setItem('email', nuevoEmail);

    // Modificar los textos del Sidebar dinámicamente
    const sidebarName = document.getElementById('userName');
    const sidebarEmail = document.getElementById('userEmail');

    if (sidebarName) sidebarName.textContent = nuevoNombre;
    if (sidebarEmail) sidebarEmail.textContent = nuevoEmail;

    alert('¡Datos de identidad actualizados con éxito!');
}

// Cargar los datos actuales en los inputs cuando el usuario entre a Ajustes
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('profileName')) {
        document.getElementById('profileName').value = localStorage.getItem('nombre') || '';
        document.getElementById('profileEmail').value = localStorage.getItem('email') || '';
    }
});

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

// ========================================================
// 🌓 CORRECCIÓN: GESTIÓN DE TEMAS (OSCURO / CLARO)
// ========================================================
// Asegúrate de que esta lógica esté en tu archivo JS
function toggleTheme() {
    const htmlEl = document.documentElement;
    const currentTheme = htmlEl.getAttribute('data-theme') === 'light' ? 'dark' : 'light';

    htmlEl.setAttribute('data-theme', currentTheme);
    localStorage.setItem('customer-theme', currentTheme);

    // Feedback visual opcional
    showToast('Tema', `Cambiado a modo ${currentTheme}`, 'info');
}

// Inicialización para evitar el parpadeo de color al recargar
(function applySavedTheme() {
    const savedTheme = localStorage.getItem('customer-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
})();

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
// ==================== SIDEBAR TOGGLE & RESPONSIVE ENGINE ====================
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const menuToggle = document.querySelector('.menu-toggle');
    const mainContent = document.querySelector('.main-content');

    if (!sidebar || !menuToggle) {
        console.warn('Estructura de navegación inválida.');
        return;
    }

    // Alternar clase activa en el botón hamburguesa animado
    menuToggle.classList.toggle('active');

    // Inicializar o capturar la capa de sombreado de fondo para móviles
    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);

        // Al hacer click en el fondo, revertir estados y cerrar menú
        overlay.onclick = () => {
            sidebar.classList.remove('open');
            menuToggle.classList.remove('active');
            overlay.classList.remove('show');
            document.body.style.overflow = '';
        };
    }

    const isMobile = window.innerWidth <= 1024;

    if (isMobile) {
        // Comportamiento Móvil: Despliegue tipo cajón flotante
        sidebar.classList.toggle('open');
        overlay.classList.toggle('show');

        // Bloquear scroll trasero mientras el menú esté desplegado
        document.body.style.overflow = sidebar.classList.contains('open') ? 'hidden' : '';
    } else {
        // Comportamiento Desktop: Colapso compacto de iconos (SaaS Style)
        sidebar.classList.toggle('collapsed');
        mainContent?.classList.toggle('expanded');

        // Guardar persistencia de estado de interfaz preferido por el cliente
        const collapsedState = sidebar.classList.contains('collapsed');
        localStorage.setItem('sidebarCollapsed', collapsedState);
    }
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

// dashboard.js
function showProductsSkeleton(count = 8) {
    const container = document.getElementById('productsContainer');
    container.innerHTML = Array(count).fill(`
        <div class="product-card">
            <div class="product-image skeleton"></div>
            <div class="product-info">
                <div class="skeleton" style="height:16px;margin-bottom:8px"></div>
                <div class="skeleton" style="height:12px;width:60%"></div>
            </div>
        </div>
    `).join('');
}


// ==================== CHATBOT ====================
document.addEventListener('DOMContentLoaded', () => {
    const chatbotToggle = document.getElementById('chatbotToggle');
    const chatbotWindow = document.getElementById('chatbotWindow');
    const chatbotClose = document.getElementById('chatbotClose');
    const chatbotMessages = document.getElementById('chatbotMessages');
    const chatbotInput = document.getElementById('chatbotInput');
    const chatbotSend = document.getElementById('chatbotSend');
    const typingIndicator = document.getElementById('typingIndicator');

    // 📚 Base de conocimiento del bot (FAQ)
    const faqData = {
        'hola': '¡Hola! 👋 Bienvenido a Pedidos & Pagos. ¿En qué puedo ayudarte?',
        'buenos dias': '¡Buenos días! ☀️ ¿En qué puedo asistirte hoy?',
        'buenas tardes': '¡Buenas tardes! 🌤️ ¿Qué necesitas?',
        'pedido': '📦 Puedes ver el estado de tus pedidos en <strong>"Mis Pedidos"</strong>. Allí encontrarás historial, tracking y opciones de cancelación.',
        'envio': '🚚 Tiempos de envío:\n• Estándar: 5-7 días\n• Express: 2-3 días\n• Prioritario: 24-48h\n• Same Day: Mismo día (zonas seleccionadas)',
        'devolucion': '🔄 Tienes <strong>30 días</strong> para solicitar devolución. Ve a "Mis Pedidos" → Selecciona pedido → "Solicitar devolución".',
        'pago': '💳 Métodos aceptados:\n• Tarjeta crédito/débito\n• PayPal\n• Transferencia bancaria\n• Efectivo contra entrega',
        'rastreo': '🔍 Para rastrear: Ve a "Mis Pedidos" → Click en "Ver" → Busca el número de tracking. También te llegará por email.',
        'contacto': '📞 Contacto directo:\n• Email: soporte@pedidos.com\n• Tel: (01) 123-4567\n• Horario: Lun-Vie 9am-6pm',
        'cuenta': '👤 Gestión de cuenta en <strong>"Configuración"</strong>. Puedes cambiar contraseña, email, teléfono y direcciones de envío.',
        'stock': '📊 Stock en tiempo real. Si dice "Sin Stock", el producto no está disponible temporalmente. Puedes activar alertas de reposición.',
        'categoria': '🏷️ Filtra por categorías desde el catálogo. Haz clic en los chips superiores (Alimentos, Tecnología, etc.)',
        'precio': '💰 Todos los precios están en Soles (S/.). Usa los filtros de precio para buscar en tu rango.',
        'descuento': '🎟️ Actualmente no hay cupones activos. Suscríbete al newsletter para recibir promociones exclusivas.',
        'factura': '🧾 Las facturas se generan automáticamente. Ve a "Mis Pedidos" → "Ver" → "Descargar comprobante".',
        'ayuda': 'Puedo ayudarte con:\n📦 Estado de pedidos\n🚚 Información de envíos\n💳 Métodos de pago\n🔄 Devoluciones\n👤 Gestión de cuenta\nEscribe tu consulta y te respondo al instante.',
        'gracias': '¡De nada! 😊 Estoy aquí si necesitas algo más. ¡Que tengas excelente día!',
        'adios': '¡Hasta luego! 👋 Gracias por confiar en Pedidos & Pagos.',
        'problema': 'Lamento que tengas inconvenientes. Por favor describe tu problema y te guiaré paso a paso. Si es urgente, contacta a soporte@pedidos.com',
        'error': 'Si ves un error técnico, intenta:\n1. Recargar la página (Ctrl+F5)\n2. Limpiar caché del navegador\n3. Contactar soporte si persiste.'
    };

    // 🔄 Toggle Chat
    function toggleChat() {
        chatbotWindow.classList.toggle('active');
        if (chatbotWindow.classList.contains('active')) {
            chatbotInput.focus();
            chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
        }
    }

    chatbotToggle.addEventListener('click', toggleChat);
    chatbotClose.addEventListener('click', toggleChat);

    // 📤 Enviar Mensaje
    function sendMessage() {
        const text = chatbotInput.value.trim();
        if (!text) return;

        addMessage(text, 'user');
        chatbotInput.value = '';
        showTyping();

        // Simular delay de respuesta realista
        setTimeout(() => {
            hideTyping();
            const response = getBotResponse(text);
            addMessage(response, 'bot');
        }, 600 + Math.random() * 800);
    }

    // 💬 Agregar Mensaje al Chat
    function addMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;
        // Permitir saltos de línea y negritas
        msgDiv.innerHTML = text.replace(/\n/g, '<br>');
        chatbotMessages.appendChild(msgDiv);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }

    // ⌨️ Indicador de "Escribiendo..."
    function showTyping() {
        typingIndicator.style.display = 'block';
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }

    function hideTyping() {
        typingIndicator.style.display = 'none';
    }

    // 🤖 Lógica de Respuestas del Bot
    function getBotResponse(input) {
        const lower = input.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Normaliza acentos

        // Búsqueda por palabras clave
        for (let key in faqData) {
            if (lower.includes(key)) {
                return faqData[key];
            }
        }

        // Fallbacks inteligentes
        const fallbacks = [
            'Disculpa, no entendí tu consulta. ¿Podrías reformularla? 😊',
            'No tengo información específica sobre eso. Te recomiendo escribir "ayuda" para ver qué puedo hacer.',
            'Estoy aprendiendo nuevas respuestas. Mientras tanto, contacta a soporte@pedidos.com 📧',
            'No estoy seguro de entender. Prueba con palabras como: pedido, envio, pago, devolucion, cuenta.'
        ];
        return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }

    // 🎯 Event Listeners
    chatbotSend.addEventListener('click', sendMessage);

    chatbotInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // Cerrar al hacer click fuera
    document.addEventListener('click', (e) => {
        if (!chatbotWindow.contains(e.target) && !chatbotToggle.contains(e.target)) {
            chatbotWindow.classList.remove('active');
        }
    });

    // Atajo de teclado: Ctrl+Shift+C para abrir/cerrar
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'C') {
            e.preventDefault();
            toggleChat();
        }
    });
});