// ==================== STATE ====================
let users = [], products = [], orders = [], categories = [];
const token = localStorage.getItem('token');
const adminId = localStorage.getItem('usuarioId') || '1';
const adminName = localStorage.getItem('nombre') || 'Administrador';
const adminEmail = localStorage.getItem('email') || 'admin@pedidos.com';

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('rol') !== 'ADMIN') {
        alert('Acceso restringido. Solo administradores.');
        window.location.href = '/dashboard.html';
        return;
    }
    document.getElementById('adminName').textContent = adminName;
    document.getElementById('adminEmail').textContent = adminEmail;
    loadCategories().then(() => {
        loadDashboardStats();
        loadUsers();
        loadProducts();
        loadOrders();
    });
});

// ==================== CATEGORÍAS ====================
async function loadCategories() {
    try {
        const res = await fetch('/api/categorias', { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) { categories = await res.json(); console.log('Categorías cargadas:', categories); }
        else { console.warn('No se pudieron cargar categorías'); categories = []; }
    } catch (e) { console.error('Error cargando categorías:', e); categories = []; }
}

function updateCategoryDropdown(selectedId = null) {
    const select = document.getElementById('productCategory');
    if (!select) return;
    select.innerHTML = '<option value="">Seleccionar categoría...</option>';
    if (categories.length === 0) { select.innerHTML += '<option value="" disabled>No hay categorías disponibles</option>'; return; }
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.categoriaId;
        option.textContent = cat.nombre;
        if (cat.categoriaId === selectedId) option.selected = true;
        select.appendChild(option);
    });
}

// ==================== NAVEGACIÓN ====================
function switchView(viewName) {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.getElementById(`btn-${viewName}`)?.classList.add('active');
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    document.getElementById(`view-${viewName}`).classList.add('active');
    if (viewName === 'users') loadUsers();
    else if (viewName === 'products') loadProducts();
    else if (viewName === 'orders') loadOrders();
    else if (viewName === 'dashboard') loadDashboardStats();
    else if (viewName === 'reportes') {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('fechaInicio').value = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        document.getElementById('fechaFin').value = today;
    }
}

function logout() {
    if (confirm('¿Cerrar sesión de administrador?')) { localStorage.clear(); window.location.href = '/index.html'; }
}

// ==================== DASHBOARD ====================
async function loadDashboardStats() {
    try {
        const [usersRes, productsRes, ordersRes] = await Promise.all([
            fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('/api/productos', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('/api/admin/orders', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        const usersData = await usersRes.ok ? await usersRes.json() : [];
        const productsData = await productsRes.ok ? await productsRes.json() : [];
        const ordersData = await ordersRes.ok ? await ordersRes.json() : [];
        document.getElementById('statUsers').textContent = usersData.length;
        document.getElementById('statProducts').textContent = productsData.filter(p => p.stock > 0).length;
        const today = new Date().toDateString();
        const todayOrders = ordersData.filter(o => new Date(o.creadoEn || o.fechaPedido).toDateString() === today);
        document.getElementById('statOrders').textContent = todayOrders.length;
        const totalSales = ordersData.filter(o => ['COMPLETADO', 'PAGADO', 'ENVIADO'].includes(o.estado)).reduce((sum, o) => sum + (o.montoTotal || 0), 0);
        document.getElementById('statSales').textContent = `S/. ${totalSales.toFixed(2)}`;
        const activityBody = document.getElementById('activityTableBody');
        const recentOrders = ordersData.slice(0, 5);
        if (recentOrders.length === 0) { activityBody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:40px">Sin actividad reciente</td></tr>'; }
        else { activityBody.innerHTML = recentOrders.map(o => `<tr><td>${new Date(o.creadoEn || o.fechaPedido).toLocaleDateString()}</td><td>Usuario #${o.usuarioId}</td><td><span class="badge badge-info">Pedido #${o.pedidoId}</span></td><td>S/. ${(o.montoTotal || 0).toFixed(2)}</td></tr>`).join(''); }
    } catch (e) { console.error('Error loading stats:', e); }
}

// ==================== USUARIOS ====================
async function loadUsers() { try { const res = await fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` } }); users = res.ok ? await res.json() : []; renderUsers(); } catch (e) { document.getElementById('usersTableBody').innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px">Error al cargar usuarios</td></tr>'; } }
function renderUsers() { const tb = document.getElementById('usersTableBody'); if (!users.length) { tb.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px">No hay usuarios registrados</td></tr>'; return; } tb.innerHTML = users.map(u => `<tr><td>#${u.usuarioId}</td><td>${u.nombre}</td><td>${u.email}</td><td><span class="badge ${u.rol === 'ADMIN' ? 'badge-warning' : 'badge-info'}">${u.rol}</span></td><td><span class="badge ${u.activo ? 'badge-success' : 'badge-danger'}">${u.activo ? 'Activo' : 'Inactivo'}</span></td><td><button class="btn-action edit" onclick="editUser(${u.usuarioId})">✏️ Editar</button><button class="btn-action delete" onclick="deleteUser(${u.usuarioId})">🗑️ Eliminar</button></td></tr>`).join(''); }
function showUserModal(userId = null) { document.getElementById('userModalTitle').textContent = userId ? '✏️ Editar Usuario' : '➕ Nuevo Usuario'; document.getElementById('userId').value = userId || ''; document.getElementById('passwordGroup').style.display = userId ? 'none' : 'block'; if (userId) { const u = users.find(x => x.usuarioId === userId); if (u) { document.getElementById('userName').value = u.nombre || ''; document.getElementById('userEmail').value = u.email || ''; document.getElementById('userRole').value = u.rol || 'CLIENTE'; } } else { document.getElementById('userForm').reset(); } document.getElementById('userModal').classList.add('active'); }
function closeUserModal() { document.getElementById('userModal').classList.remove('active'); document.getElementById('userForm').reset(); }
async function saveUser(e) { e.preventDefault(); const userId = document.getElementById('userId'), userName = document.getElementById('userName'), userEmail = document.getElementById('userEmail'), userRole = document.getElementById('userRole'), userPassword = document.getElementById('userPassword'); if (!userName || !userEmail || !userRole) { console.error('❌ ERROR: Elementos del formulario no existen'); alert('Error interno: Formulario incompleto'); return; } const id = userId.value, data = { nombre: userName.value, email: userEmail.value, rol: userRole.value, password: userPassword.value }; if (!token) { console.error('❌ ERROR: No hay token'); alert('Error: Sesión expirada. Inicia sesión nuevamente.'); return; } try { const url = id ? `/api/admin/users/${id}` : '/api/admin/users', method = id ? 'PUT' : 'POST', res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(data) }); if (res.ok) { closeUserModal(); await loadUsers(); showToast(id ? 'Usuario actualizado' : 'Usuario creado', 'success'); } else { const responseText = await res.text(); let errorMsg = `Error ${res.status}`; try { const errorJson = JSON.parse(responseText); errorMsg = errorJson.error || errorJson.message || errorMsg; } catch (e) { errorMsg = responseText.substring(0, 100) || errorMsg; } showToast(errorMsg, 'error'); } } catch (err) { console.error('❌ ERROR de red:', err); showToast(`Error de conexión: ${err.message}`, 'error'); } }
async function deleteUser(id) { if (!confirm('¿Eliminar este usuario permanentemente?')) return; try { const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }); if (res.ok) { await loadUsers(); showToast('Usuario eliminado', 'success'); } else { showToast('Error al eliminar', 'error'); } } catch (err) { showToast('Error de conexión', 'error'); } }
function editUser(id) { showUserModal(id); }

// ==================== PRODUCTOS ====================
async function loadProducts() { try { const res = await fetch('/api/productos', { headers: { 'Authorization': `Bearer ${token}` } }); products = res.ok ? await res.json() : []; renderProducts(); } catch (e) { document.getElementById('productsTableBody').innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px">Error al cargar productos</td></tr>'; } }
function renderProducts() { const tb = document.getElementById('productsTableBody'); if (!products.length) { tb.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px">No hay productos</td></tr>'; return; } tb.innerHTML = products.map(p => { const catName = p.categoria?.nombre || p.Categoria?.nombre || 'General'; const imagenHTML = p.imagenUrl ? `<img src="${p.imagenUrl}" style="width:40px;height:40px;border-radius:6px;object-fit:cover;" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2280%22>📦</text></svg>'">` : '<span style="font-size:1.5rem">📦</span>'; return `<tr><td>#${p.productoId}</td><td><div style="display:flex;align-items:center;gap:12px">${imagenHTML}<div><strong>${p.nombre}</strong><br><small style="color:var(--text-muted)">SKU: ${p.sku}</small></div></div></td><td><span class="badge badge-primary">${catName}</span></td><td style="font-weight:600;color:var(--primary)">S/. ${(p.precio || 0).toFixed(2)}</td><td><span class="badge ${p.stock < 10 ? 'badge-warning' : 'badge-success'}">${p.stock}</span></td><td><button class="btn-action edit" onclick="editProduct(${p.productoId})">✏️ Editar</button><button class="btn-action delete" onclick="deleteProduct(${p.productoId})">🗑️ Eliminar</button></td></tr>`; }).join(''); }
function showProductModal(productId = null) {
    document.getElementById('productModalTitle').textContent = productId ? '✏️ Editar Producto' : '➕ Nuevo Producto';
    document.getElementById('productId').value = productId || '';

    if (productId) {
        const p = products.find(x => x.productoId === productId);
        if (p) {
            document.getElementById('productName').value = p.nombre || '';
            document.getElementById('productSku').value = p.sku || '';
            document.getElementById('productPrice').value = p.precio || '';
            document.getElementById('productStock').value = p.stock || '';

            // Actualizar categorías
            const catId = p.categoria?.categoriaId || p.categoriaId || null;
            updateCategoryDropdown(catId);

            // ✅ CARGAR IMAGEN EXISTENTE
            const imageUrl = p.imagenUrl || '';
            document.getElementById('productImageUrl').value = imageUrl;

            const preview = document.getElementById('imagePreview');
            if (imageUrl) {
                preview.innerHTML = `<img src="${imageUrl}" style="width:100%;height:100%;object-fit:cover;">`;
                console.log('✅ Imagen cargada:', imageUrl);
            } else {
                preview.innerHTML = '<span class="image-preview-placeholder">📷</span>';
            }
        }
    } else {
        document.getElementById('productForm').reset();
        updateCategoryDropdown(null);
        document.getElementById('imagePreview').innerHTML = '<span class="image-preview-placeholder">📷</span>';
        document.getElementById('productImageUrl').value = '';
    }
    document.getElementById('productModal').classList.add('active');
}
function closeProductModal() { document.getElementById('productModal').classList.remove('active'); document.getElementById('productForm').reset(); document.getElementById('imagePreview').innerHTML = '<span class="image-preview-placeholder">📷</span>'; document.getElementById('productImageUrl').value = ''; }

function previewImage(input) {
    const preview = document.getElementById('imagePreview');
    if (input.files && input.files[0]) {
        const file = input.files[0];
        if (file.size > 5 * 1024 * 1024) { showToast('La imagen no debe superar 5MB', 'error'); input.value = ''; return; }
        const reader = new FileReader();
        reader.onload = function (e) { preview.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;">`; };
        reader.readAsDataURL(file);
    }
}

async function uploadImage(file) {
    const formData = new FormData();
    formData.append('archivo', file);
    try {
        const res = await fetch('/api/imagenes/producto', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
        if (res.ok) { const data = await res.json(); return data.url; }
        else { const error = await res.json(); showToast(error.error || 'Error al subir imagen', 'error'); return null; }
    } catch (err) { showToast('Error de conexión al subir imagen', 'error'); return null; }
}

async function saveProduct(e) {
    e.preventDefault();
    const id = document.getElementById('productId').value;
    const categoriaId = document.getElementById('productCategory').value;
    const imageInput = document.getElementById('productImageInput');

    if (!categoriaId) {
        showToast('Selecciona una categoría', 'warning');
        return;
    }

    const data = {
        nombre: document.getElementById('productName').value,
        sku: document.getElementById('productSku').value,
        precio: parseFloat(document.getElementById('productPrice').value),
        stock: parseInt(document.getElementById('productStock').value),
        categoriaId: parseInt(categoriaId),
        imagenUrl: document.getElementById('productImageUrl').value || null  // ← ENVIAR IMAGEN
    };

    console.log('📦 Datos enviados al backend:', data);

    try {
        // 1. Subir imagen si hay nueva
        if (imageInput.files && imageInput.files[0]) {
            console.log('📤 Subiendo imagen...');
            const uploadedUrl = await uploadImage(imageInput.files[0]);
            if (uploadedUrl) {
                data.imagenUrl = uploadedUrl;
                console.log('✅ Imagen subida:', uploadedUrl);
            }
        }

        // 2. Guardar producto
        const url = id ? `/api/admin/products/${id}` : '/api/admin/products';
        const method = id ? 'PUT' : 'POST';

        console.log('📡 Enviando petición:', method, url);
        console.log('📦 Datos finales:', data);

        const res = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        console.log('📥 Response status:', res.status);

        if (res.ok) {
            const result = await res.json();
            console.log('✅ Producto guardado:', result);
            closeProductModal();
            await loadProducts();
            showToast(id ? 'Producto actualizado' : 'Producto creado', 'success');
        } else {
            const errorText = await res.text();
            console.error('❌ Error del servidor:', errorText);
            showToast('Error al guardar: ' + errorText, 'error');
        }
    } catch (err) {
        console.error('❌ Error de red:', err);
        showToast('Error de conexión', 'error');
    }
}


async function deleteProduct(id) { if (!confirm('¿Eliminar este producto permanentemente?')) return; try { const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }); if (res.ok) { await loadProducts(); showToast('Producto eliminado', 'success'); } else { showToast('Error al eliminar', 'error'); } } catch (err) { showToast('Error de conexión', 'error'); } }
function editProduct(id) { showProductModal(id); }

// ==================== PEDIDOS ====================
async function loadOrders() { try { const res = await fetch('/api/admin/orders', { headers: { 'Authorization': `Bearer ${token}` } }); orders = res.ok ? await res.json() : []; renderOrders(); } catch (e) { document.getElementById('ordersTableBody').innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px">Error al cargar pedidos</td></tr>'; } }
function renderOrders() { const tb = document.getElementById('ordersTableBody'); if (!orders.length) { tb.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px">No hay pedidos</td></tr>'; return; } tb.innerHTML = orders.map(o => { const statusClass = { 'PENDIENTE': 'badge-warning', 'PROCESANDO': 'badge-info', 'ENVIADO': 'badge-info', 'COMPLETADO': 'badge-success', 'CANCELADO': 'badge-danger' }[o.estado] || 'badge-warning'; return `<tr><td><strong>#${o.pedidoId}</strong></td><td>Usuario #${o.usuarioId}</td><td>${new Date(o.creadoEn || o.fechaPedido).toLocaleDateString()}</td><td><span class="badge ${statusClass}">${o.estado}</span></td><td style="font-weight:600;color:var(--primary)">S/. ${(o.montoTotal || 0).toFixed(2)}</td><td><button class="btn-action edit" onclick="showOrderStatusModal(${o.pedidoId}, '${o.estado}')">🔄 Actualizar Estado</button></td></tr>`; }).join(''); }
function showOrderStatusModal(orderId, currentStatus) { document.getElementById('orderStatusId').value = orderId; document.getElementById('orderStatus').value = currentStatus; document.getElementById('orderStatusModal').classList.add('active'); }
function closeOrderStatusModal() { document.getElementById('orderStatusModal').classList.remove('active'); }
async function updateOrderStatus() { const orderId = document.getElementById('orderStatusId').value, newStatus = document.getElementById('orderStatus').value.toUpperCase(); if (!orderId || !newStatus) { showToast('Completa todos los campos', 'warning'); return; } try { const res = await fetch(`/api/admin/orders/${orderId}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ estado: newStatus }) }); if (res.ok) { closeOrderStatusModal(); await loadOrders(); await loadDashboardStats(); showToast(`Pedido #${orderId} actualizado a "${newStatus}"`, 'success'); } else { const errorData = await res.json().catch(() => ({})); showToast(errorData.error || 'Error al actualizar estado', 'error'); } } catch (err) { showToast('Error de conexión', 'error'); } }

// ==================== REPORTES ====================
async function cargarReporte() {
    const fechaInicio = document.getElementById('fechaInicio').value;
    const fechaFin = document.getElementById('fechaFin').value;
    if (!fechaInicio || !fechaFin) { showToast('Selecciona ambas fechas', 'warning'); return; }
    try {
        const res = await fetch(`/api/reportes/ventas?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error('Error al cargar reporte');
        const data = await res.json();
        renderReporte(data);
    } catch (err) { console.error(err); showToast('Error al cargar reporte', 'error'); }
}

function renderReporte(data) {
    document.getElementById('reportTotalVentas').textContent = `S/. ${(data.totalVentas || 0).toFixed(2)}`;
    document.getElementById('reportTotalPedidos').textContent = data.totalPedidos || 0;
    document.getElementById('reportTicketPromedio').textContent = `S/. ${(data.ticketPromedio || 0).toFixed(2)}`;
    document.getElementById('reportTotalClientes').textContent = data.totalClientes || 0;

    const tbodyDia = document.getElementById('reporteVentasPorDia');
    if (data.ventasPorDia && data.ventasPorDia.length > 0) {
        tbodyDia.innerHTML = data.ventasPorDia.map(v => `<tr><td>${new Date(v.fecha).toLocaleDateString('es-PE')}</td><td>${v.cantidadPedidos}</td><td style="font-weight:600;color:var(--primary)">S/. ${(v.montoTotal || 0).toFixed(2)}</td></tr>`).join('');
    } else { tbodyDia.innerHTML = '<tr><td colspan="3" style="text-align:center;padding:40px">Sin ventas en este período</td></tr>'; }

    const tbodyEstado = document.getElementById('reporteVentasPorEstado');
    if (data.ventasPorEstado && data.ventasPorEstado.length > 0) {
        tbodyEstado.innerHTML = data.ventasPorEstado.map(v => `<tr><td><span class="badge ${v.estado === 'COMPLETADO' ? 'badge-success' : v.estado === 'PENDIENTE' ? 'badge-warning' : 'badge-info'}">${v.estado}</span></td><td>${v.cantidad}</td><td style="font-weight:600;color:var(--primary)">S/. ${(v.montoTotal || 0).toFixed(2)}</td></tr>`).join('');
    } else { tbodyEstado.innerHTML = '<tr><td colspan="3" style="text-align:center;padding:40px">Sin datos</td></tr>'; }
}

// ==================== UTILS ====================
function showToast(msg, type = 'info') {
    const c = document.getElementById('toastContainer'), t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<div class="toast-title">${type === 'success' ? '✅ Éxito' : type === 'error' ? '❌ Error' : '⚠️ Advertencia'}</div><div class="toast-message">${msg}</div>`;
    c.appendChild(t);
    setTimeout(() => { t.style.animation = 'slideIn 0.3s ease reverse'; setTimeout(() => t.remove(), 300); }, 3500);
}