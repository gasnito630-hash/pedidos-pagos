const API = '';
const token = localStorage.getItem('token');
const adminName = localStorage.getItem('nombre') || 'Administrador';
const adminEmail = localStorage.getItem('email') || 'admin@pedidos.com';

// Estado global
let users = [], products = [], orders = [], categories = [], envios = [];
const pageState = {
    users: { p: 1, s: 10, t: 0, search: '' },
    products: { p: 1, s: 10, t: 0, search: '' },
    orders: { p: 1, s: 10, t: 0, search: '' },
    categorias: { p: 1, s: 10, t: 0, search: '' },
    envios: { p: 1, s: 10, t: 0, search: '' },
    pagos: { p: 1, s: 10, t: 0, search: '' }
};

// ==================== FETCH CON MANEJO DE ERRORES ====================
async function apiFetch(endpoint, options = {}) {
    const url = `${API}${endpoint}`;
    const currentToken = localStorage.getItem('token');

    if (!currentToken) {
        console.warn('⚠️ No hay token, redirigiendo...');
        redirectToLogin();
        throw new Error('Sin sesión');
    }

    const res = await fetch(url, {
        ...options,
        headers: {
            'Authorization': `Bearer ${currentToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...options.headers
        }
    });

    if (res.status === 204) {
        return null;
    }

    if (res.status === 401 || res.status === 403) {
        console.warn('🔒 Token inválido o expirado');
        redirectToLogin();
        throw new Error('Sesión expirada');
    }

    const ct = res.headers.get('content-type');
    if (!ct || !ct.includes('application/json')) {
        const txt = await res.text();
        console.error('❌ Respuesta no JSON:', txt.substring(0, 200));
        if (txt.includes('<!DOCTYPE') || txt.includes('<html')) {
            console.error('🔒 Sesión expirada - redirigiendo a login');
            redirectToLogin();
            throw new Error('Sesión expirada - por favor inicie sesión nuevamente');
        }
        throw new Error(`Error ${res.status}: Respuesta inválida del servidor`);
    }

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error || data.message || `Error ${res.status}`);
    }
    return data;
}

function redirectToLogin() {
    const theme = localStorage.getItem('admin-theme');
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    localStorage.removeItem('usuarioId');
    localStorage.removeItem('email');
    localStorage.removeItem('nombre');
    if (theme) localStorage.setItem('admin-theme', theme);
    window.location.href = '/index.html';
}

// ==================== PROCESAR PAGE DE SPRING (CORREGIDO PARA OBJETO 'PAGE') ====================
function pageData(d) {
    console.log("🔍 Datos crudos recibidos desde la API del Servidor:", d);
    if (!d) return { c: [], t: 0, tp: 1 };

    // Si viene la estructura de Spring Boot con 'content'
    if (d.content !== undefined) {
        // 1. Intentar extraer totalElements (desde d.page o de la raíz)
        let totalElements = d.content.length || 0;
        if (d.page && d.page.totalElements !== undefined) {
            totalElements = d.page.totalElements; // Formato Spring moderno detectado en tus logs
        } else if (d.totalElements !== undefined) {
            totalElements = d.totalElements; // Formato Spring clásico en raíz
        }

        // 2. Intentar extraer totalPages (desde d.page o de la raíz)
        let totalPages = 1;
        if (d.page && d.page.totalPages !== undefined) {
            totalPages = d.page.totalPages;
        } else if (d.totalPages !== undefined) {
            totalPages = d.totalPages;
        } else {
            totalPages = Math.ceil(totalElements / 10) || 1;
        }

        return {
            c: d.content,
            t: totalElements,
            tp: totalPages
        };
    }

    // Si viene directamente como un Array plano de objetos
    if (Array.isArray(d)) {
        return { c: d, t: d.length, tp: Math.ceil(d.length / 10) };
    }

    // Si viene envuelto en otra estructura genérica alternativa (ej: d.data)
    if (d.data && Array.isArray(d.data)) {
        return { c: d.data, t: d.total || d.data.length, tp: d.totalPages || 1 };
    }

    return { c: [], t: 0, tp: 1 };
}

// ==================== UTILS ====================
function toast(m, t = 'info') {
    const c = document.getElementById('toastContainer');
    if (!c) { alert(`${t}: ${m}`); return; }
    const el = document.createElement('div');
    el.className = `toast ${t}`;
    const titles = { success: '✓ Éxito', error: '✕ Error', warning: '⚠ Advertencia', info: 'ℹ Info' };
    el.innerHTML = `<div class="toast-title">${titles[t] || titles.info}</div><div class="toast-message">${m}</div>`;
    c.appendChild(el);
    setTimeout(() => {
        el.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => el.remove(), 300);
    }, 4000);
}

let searchTimers = {};
function debounceSearch(key, value) {
    clearTimeout(searchTimers[key]);
    searchTimers[key] = setTimeout(() => {
        pageState[key].p = 1;
        pageState[key].search = value;
        if (key === 'users') loadUsers();
        else if (key === 'products') loadProducts();
        else if (key === 'orders') loadOrders();
        else if (key === 'categorias') loadCategorias();
        else if (key === 'envios') loadEnvios();
        else if (key === 'pagos') loadPagos();
    }, 400);
}

// ==================== PAGINACIÓN ESTILO GOOGLE ====================
function renderPag(containerId, key) {
    const s = pageState[key];
    const el = document.getElementById(containerId);

    if (!el) {
        console.error(`❌ ERROR: No existe el contenedor HTML con id="${containerId}"`);
        return;
    }

    if (!s || s.t === 0) {
        el.innerHTML = `
            <div class="pagination-wrapper" style="justify-content: center; padding: 15px; border-top: 1px dashed var(--border-color);">
                <span style="color: var(--text-muted); font-size: 13px;">ℹ️ No se encontraron registros para '${key}'.</span>
            </div>`;
        return;
    }

    const totalPages = Math.ceil(s.t / s.s) || 1;
    const currentPage = s.p;

    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);

    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }

    let html = `
        <div class="pagination-wrapper">
            <div class="pagination-controls">
                <button class="pagination-btn pagination-nav" ${currentPage === 1 ? 'disabled' : ''} 
                    onclick="goPage('${key}',1)" title="Primera página">«</button>
                <button class="pagination-btn pagination-nav" ${currentPage === 1 ? 'disabled' : ''} 
                    onclick="goPage('${key}',${currentPage - 1})" title="Anterior">‹</button>
    `;

    for (let i = startPage; i <= endPage; i++) {
        const activeClass = i === currentPage ? 'pagination-active' : '';
        html += `<button class="pagination-btn pagination-num ${activeClass}" 
            onclick="goPage('${key}',${i})">${i}</button>`;
    }

    html += `
                <button class="pagination-btn pagination-nav" ${currentPage === totalPages ? 'disabled' : ''} 
                    onclick="goPage('${key}',${currentPage + 1})" title="Siguiente">›</button>
                <button class="pagination-btn pagination-nav" ${currentPage === totalPages ? 'disabled' : ''} 
                    onclick="goPage('${key}',${totalPages})" title="Última página">»</button>
            </div>
            <div class="pagination-info">
                <span>Página <strong>${currentPage}</strong> de <strong>${totalPages}</strong></span>
                <span class="pagination-total">${s.t} registros totales</span>
            </div>
            <div class="pagination-perpage">
                <select onchange="goPerPage('${key}',this.value)">
                    <option value="10" ${s.s === 10 ? 'selected' : ''}>10</option>
                    <option value="25" ${s.s === 25 ? 'selected' : ''}>25</option>
                    <option value="50" ${s.s === 50 ? 'selected' : ''}>50</option>
                    <option value="100" ${s.s === 100 ? 'selected' : ''}>100</option>
                </select>
            </div>
        </div>
    `;

    el.innerHTML = html;
}

function goPage(k, pg) {
    const total = Math.ceil(pageState[k].t / pageState[k].s) || 1;
    if (pg < 1 || pg > total) return;
    pageState[k].p = pg;

    if (k === 'users') loadUsers();
    else if (k === 'products') loadProducts();
    else if (k === 'orders') loadOrders();
    else if (k === 'categorias') loadCategorias();
    else if (k === 'envios') loadEnvios();
    else if (k === 'pagos') loadPagos();
}

function goPerPage(k, pp) {
    pageState[k].s = parseInt(pp);
    pageState[k].p = 1;
    if (k === 'users') loadUsers();
    else if (k === 'products') loadProducts();
    else if (k === 'orders') loadOrders();
    else if (k === 'categorias') loadCategorias();
    else if (k === 'envios') loadEnvios();
    else if (k === 'pagos') loadPagos();
}

document.addEventListener('DOMContentLoaded', async () => {
    if (!token) {
        console.warn('No hay token');
        redirectToLogin();
        return;
    }

    const nameEl = document.getElementById('adminName');
    const emailEl = document.getElementById('adminEmail');
    if (nameEl) nameEl.textContent = adminName;
    if (emailEl) emailEl.textContent = adminEmail;

    // Inicialización del sistema cargando la sección activa por defecto (Dashboard)
    try { await loadCategories(); } catch (e) { console.warn('Categorías:', e.message); }
    try { await loadDashboard(); } catch (e) { console.error('Dashboard:', e.message); }
});

// ==================== CATEGORÍAS (Para dropdowns de productos) ====================
async function loadCategories() {
    try {
        const res = await fetch(`${API}/api/categorias?page=0&size=1000`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Accept': 'application/json'
            }
        });
        if (res.ok) {
            const d = await res.json();
            const p = pageData(d);
            categories = p.c || [];
            console.log(`✅ Categorías cargadas: ${categories.length}`);
            updateCategoryDropdown();
        } else if (res.status === 401 || res.status === 403) {
            redirectToLogin();
        }
    } catch (e) {
        console.warn('Categorías:', e.message);
    }
}

function updateCategoryDropdown(sel = null) {
    const s = document.getElementById('productCategory');
    if (!s) return;
    s.innerHTML = '<option value="">Seleccionar categoría...</option>';
    categories.forEach(c => {
        const o = document.createElement('option');
        o.value = c.categoriaId;
        o.textContent = c.nombre;
        if (c.categoriaId === sel) o.selected = true;
        s.appendChild(o);
    });
}

// ==================== DASHBOARD ====================
async function loadDashboard() {
    try {
        const [u, p, o] = await Promise.all([
            apiFetch('/api/admin/users?page=0&size=1').catch(() => ({ content: [], totalElements: 0 })),
            apiFetch('/api/productos?page=0&size=1000').catch(() => ({ content: [], totalElements: 0 })),
            apiFetch('/api/pedidos/admin/todos?page=0&size=50').catch(() => ({ content: [], totalElements: 0 }))
        ]);

        const uu = pageData(u), pp = pageData(p), oo = pageData(o);

        const statUsers = document.getElementById('statUsers');
        const statProducts = document.getElementById('statProducts');
        const statOrders = document.getElementById('statOrders');
        const statSales = document.getElementById('statSales');

        if (statUsers) statUsers.textContent = uu.t;
        if (statProducts) statProducts.textContent = pp.c.filter(x => (x.stock || 0) > 0).length;

        const hoy = new Date().toDateString();
        const hoyO = oo.c.filter(x => {
            const f = x.creadoEn || x.fechaPedido;
            return f && new Date(f).toDateString() === hoy;
        });
        if (statOrders) statOrders.textContent = hoyO.length;

        const total = oo.c.filter(x => {
            const st = (x.estado || '').toUpperCase();
            return ['COMPLETADO', 'PAGADO', 'ENVIADO'].includes(st);
        }).reduce((s, x) => s + (x.montoTotal || 0), 0);
        if (statSales) statSales.textContent = `S/. ${total.toFixed(2)}`;

        const tb = document.getElementById('activityTableBody');
        if (tb) {
            const rec = oo.c.slice(0, 5);
            if (rec.length === 0) {
                tb.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:40px">Sin actividad reciente</td></tr>';
            } else {
                tb.innerHTML = rec.map(x => {
                    const fecha = x.creadoEn || x.fechaPedido;
                    const uid = x.usuarioId || '?';
                    const pid = x.pedidoId || '?';
                    const monto = x.montoTotal || 0;
                    return `<tr>
                        <td>${fecha ? new Date(fecha).toLocaleDateString('es-PE') : 'N/A'}</td>
                        <td>Usuario #${uid}</td>
                        <td><span class="badge badge-info">Pedido #${pid}</span></td>
                        <td>S/. ${monto.toFixed(2)}</td>
                    </tr>`;
                }).join('');
            }
        }
    } catch (e) {
        console.error('Dashboard:', e.message);
    }
}

// ==================== USUARIOS ====================
async function loadUsers() {
    try {
        const s = pageState.users;
        const searchParam = s.search ? `&buscar=${encodeURIComponent(s.search)}` : '';
        const d = await apiFetch(`/api/admin/users?page=${s.p - 1}&size=${s.s}${searchParam}`);
        const p = pageData(d);

        users = p.c;
        pageState.users.t = p.t;

        const total = p.tp || 1;
        if (s.p > total) s.p = total;

        renderUsers();
        renderPag('usersPagination', 'users');
    } catch (e) {
        console.error('Usuarios:', e.message);
        const tb = document.getElementById('usersTableBody');
        if (tb) tb.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--danger)">${e.message}</td></tr>`;
    }
}

function renderUsers() {
    const tb = document.getElementById('usersTableBody');
    if (!tb) return;
    if (!users.length) {
        tb.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:80px">No hay usuarios</td></tr>';
        return;
    }
    tb.innerHTML = users.map(u => {
        let displayName = 'Sin nombre';
        if (u.nombre && u.apellido && u.apellido !== 'Usuario') {
            displayName = `${u.nombre} ${u.apellido}`;
        } else if (u.nombre) {
            displayName = u.nombre;
        } else if (u.email) {
            displayName = u.email;
        }

        return `
        <tr>
            <td>#${u.usuarioId}</td>
            <td>${displayName}</td>
            <td>${u.email || '-'}</td>
            <td><span class="badge ${u.rol === 'ADMIN' ? 'badge-warning' : 'badge-info'}">${u.rol || 'CLIENTE'}</span></td>
            <td><span class="badge ${u.activo ? 'badge-success' : 'badge-danger'}">${u.activo ? 'Activo' : 'Inactivo'}</span></td>
            <td>
                <button class="btn-action edit" onclick="showUserModal(${u.usuarioId})">✏️</button>
                <button class="btn-action delete" onclick="deleteUser(${u.usuarioId})">🗑️</button>
            </td>
        </tr>
    `}).join('');
}

function showUserModal(id = null) {
    const title = document.getElementById('userModalTitle');
    const idField = document.getElementById('userId');
    const pwdGroup = document.getElementById('passwordGroup');

    if (!title || !idField) return;

    title.textContent = id ? 'Editar Usuario' : 'Nuevo Usuario';
    idField.value = id || '';
    if (pwdGroup) pwdGroup.style.display = id ? 'none' : 'block';

    if (id) {
        const u = users.find(x => x.usuarioId === id);
        if (u) {
            const nameInput = document.getElementById('userName');
            const emailInput = document.getElementById('userEmail');
            const roleInput = document.getElementById('userRole');

            let fullName = '';
            if (u.nombre) {
                fullName = u.nombre;
                if (u.apellido && u.apellido !== 'Usuario') {
                    fullName += ' ' + u.apellido;
                }
            }

            if (nameInput) nameInput.value = fullName;
            if (emailInput) emailInput.value = u.email || '';
            if (roleInput) roleInput.value = u.rol || 'CLIENTE';
        }
    } else {
        const form = document.getElementById('userForm');
        if (form) form.reset();
    }
    const modal = document.getElementById('userModal');
    if (modal) modal.classList.add('active');
}

function closeUserModal() {
    const modal = document.getElementById('userModal');
    const form = document.getElementById('userForm');
    if (modal) modal.classList.remove('active');
    if (form) form.reset();
}

async function saveUser(e) {
    e.preventDefault();
    const id = document.getElementById('userId')?.value;
    const nameVal = (document.getElementById('userName')?.value || '').trim();

    let nombre = nameVal;
    let apellido = null;

    const parts = nameVal.split(/\s+/).filter(p => p.length > 0);
    if (parts.length >= 2) {
        nombre = parts[0];
        apellido = parts.slice(1).join(' ');
    }

    const data = {
        nombre: nombre,
        apellido: apellido,
        email: document.getElementById('userEmail')?.value,
        rol: document.getElementById('userRole')?.value,
        activo: true
    };

    const pwd = document.getElementById('userPassword')?.value;
    if (pwd) data.password = pwd;

    try {
        const url = id ? `/api/admin/users/${id}` : '/api/admin/users';
        const method = id ? 'PUT' : 'POST';
        await apiFetch(url, { method, body: JSON.stringify(data) });
        closeUserModal();
        await loadUsers();
        toast(id ? 'Usuario actualizado' : 'Usuario creado', 'success');
    } catch (e) {
        toast(e.message, 'error');
    }
}

async function deleteUser(id) {
    showConfirm('Eliminar Pago', '¿Estás seguro de eliminar este registro? No se puede deshacer.', async () => {
        try {
            await apiFetch(`/api/admin/users/${id}`, { method: 'DELETE' });
            await loadUsers();
            toast('Usuario eliminado', 'success');
        } catch (e) {
            console.error('Error eliminando usuario:', e);
            toast(e.message, 'error');
        }
    });

}

// ==================== PRODUCTOS ====================
async function loadProducts() {
    try {
        const s = pageState.products;
        const searchParam = s.search ? `&buscar=${encodeURIComponent(s.search)}` : '';
        const d = await apiFetch(`/api/productos?page=${s.p - 1}&size=${s.s}${searchParam}`);
        const p = pageData(d);

        products = p.c;
        pageState.products.t = p.t;

        const total = p.tp || 1;
        if (s.p > total) s.p = total;

        renderProducts();
        renderPag('productsPagination', 'products');
    } catch (e) {
        console.error('Productos:', e.message);
        const tb = document.getElementById('productsTableBody');
        if (tb) tb.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--danger)">${e.message}</td></tr>`;
    }
}

function renderProducts() {
    const tb = document.getElementById('productsTableBody');
    if (!tb) return;
    if (!products.length) {
        tb.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:80px">No hay productos</td></tr>';
        return;
    }
    tb.innerHTML = products.map(p => {
        const cat = p.categoria?.nombre || 'Sin categoría';
        const stock = p.stock <= 0 ? `<span class="badge badge-danger">Sin Stock</span>` :
            p.stock < 10 ? `<span class="badge badge-warning">${p.stock}</span>` :
                `<span class="badge badge-success">${p.stock}</span>`;
        return `
            <tr>
                <td>#${p.productoId}</td>
                <td>
                    <div style="display:flex;align-items:center;gap:12px">
                        ${p.imagenUrl ? `<img src="${p.imagenUrl}" style="width:40px;height:40px;border-radius:6px;object-fit:cover">` : '📦'}
                        <div><div style="font-weight:600">${p.nombre}</div><small style="color:var(--text-muted)">SKU: ${p.sku || 'N/A'}</small></div>
                    </div>
                </td>
                <td><span class="badge badge-primary">${cat}</span></td>
                <td style="font-weight:700;color:var(--primary)">S/. ${(p.precio || 0).toFixed(2)}</td>
                <td>${stock}</td>
                <td>
                    <button class="btn-action edit" onclick="showProductModal(${p.productoId})">✏️</button>
                    <button class="btn-action delete" onclick="deleteProduct(${p.productoId})">🗑️</button>
                </td>
            </tr>
        `;
    }).join('');
}

function showProductModal(id = null) {
    const title = document.getElementById('productModalTitle');
    const idField = document.getElementById('productId');

    if (!title || !idField) { console.error('Modal elements not found'); return; }

    title.textContent = id ? 'Editar Producto' : 'Nuevo Producto';
    idField.value = id || '';

    if (id) {
        const p = products.find(x => x.productoId === id);
        if (p) {
            const nameEl = document.getElementById('productName');
            const skuEl = document.getElementById('productSku');
            const priceEl = document.getElementById('productPrice');
            const stockEl = document.getElementById('productStock');
            const imageUrlEl = document.getElementById('productImageUrl');

            if (nameEl) nameEl.value = p.nombre || '';
            if (skuEl) skuEl.value = p.sku || '';
            if (priceEl) priceEl.value = p.precio || '';
            if (stockEl) stockEl.value = p.stock || '';
            if (imageUrlEl) imageUrlEl.value = p.imagenUrl || '';

            updateCategoryDropdown(p.categoria?.categoriaId);

            const prev = document.getElementById('imagePreview');
            if (prev) {
                prev.innerHTML = p.imagenUrl
                    ? `<img src="${p.imagenUrl}" style="width:100%;height:100%;object-fit:cover">`
                    : '<span class="image-preview-placeholder">📷</span>';
            }
        }
    } else {
        const form = document.getElementById('productForm');
        if (form) form.reset();
        updateCategoryDropdown();
        const prev = document.getElementById('imagePreview');
        if (prev) prev.innerHTML = '<span class="image-preview-placeholder">📷</span>';
        const imgInput = document.getElementById('productImageUrl');
        if (imgInput) imgInput.value = '';
    }
    const modal = document.getElementById('productModal');
    if (modal) modal.classList.add('active');
}

function closeProductModal() {
    const modal = document.getElementById('productModal');
    const form = document.getElementById('productForm');
    if (modal) modal.classList.remove('active');
    if (form) form.reset();
    const prev = document.getElementById('imagePreview');
    if (prev) prev.innerHTML = '<span class="image-preview-placeholder">📷</span>';
    const imgInput = document.getElementById('productImageUrl');
    if (imgInput) imgInput.value = '';
}

function previewImage(input) {
    const prev = document.getElementById('imagePreview');
    if (!prev || !input.files?.[0]) return;
    const f = input.files[0];
    if (f.size > 5 * 1024 * 1024) { toast('Máximo 5MB', 'error'); input.value = ''; return; }
    const r = new FileReader();
    r.onload = e => prev.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover">`;
    r.readAsDataURL(f);
}

async function uploadImage(file) {
    const fd = new FormData();
    fd.append('archivo', file);
    try {
        const res = await fetch(`${API}/api/imagenes/producto`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: fd
        });
        if (res.ok) { const d = await res.json(); return d.url; }
        throw new Error('Error al subir');
    } catch { toast('Error subiendo imagen', 'error'); return null; }
}

async function saveProduct(e) {
    e.preventDefault();
    const id = document.getElementById('productId')?.value;
    const catId = document.getElementById('productCategory')?.value;

    if (!catId) {
        toast('Selecciona categoría', 'warning');
        return;
    }

    const catObj = categories.find(c => c.categoriaId == catId);

    const data = {
        nombre: document.getElementById('productName')?.value,
        sku: document.getElementById('productSku')?.value,
        precio: parseFloat(document.getElementById('productPrice')?.value) || 0,
        stock: parseInt(document.getElementById('productStock')?.value) || 0,
        categoria: catObj || { categoriaId: parseInt(catId) },
        imagenUrl: document.getElementById('productImageUrl')?.value || null
    };

    try {
        const img = document.getElementById('productImageInput');
        if (img?.files?.[0]) {
            const url = await uploadImage(img.files[0]);
            if (url) data.imagenUrl = url;
        }

        const endpoint = id ? `/api/productos/${id}` : '/api/productos';
        const method = id ? 'PUT' : 'POST';

        console.log('📤 Enviando producto:', endpoint, method, data);

        await apiFetch(endpoint, { method, body: JSON.stringify(data) });
        closeProductModal();
        await loadProducts();
        toast(id ? 'Producto actualizado' : 'Producto creado', 'success');
    } catch (e) {
        console.error('❌ Error guardando producto:', e);
        toast(e.message, 'error');
    }
}

async function deleteProduct(id) {
    showConfirm('Eliminar Pago', '¿Estás seguro de eliminar este registro? No se puede deshacer.', async () => {
        try {
            await apiFetch(`/api/productos/${id}`, { method: 'DELETE' });
            await loadProducts();
            toast('Producto eliminado', 'success');
        } catch (e) { toast(e.message, 'error'); }
    });

}

// ==================== PEDIDOS ====================
async function loadOrders() {
    try {
        const s = pageState.orders;
        const searchParam = s.search ? `&buscar=${encodeURIComponent(s.search)}` : '';
        const d = await apiFetch(`/api/pedidos/admin/todos?page=${s.p - 1}&size=${s.s}${searchParam}`);
        const p = pageData(d);

        orders = p.c;
        pageState.orders.t = p.t;

        const total = p.tp || 1;
        if (s.p > total) s.p = total;

        renderOrders();
        renderPag('ordersPagination', 'orders');
    } catch (e) {
        console.error('Pedidos:', e.message);
        const tb = document.getElementById('ordersTableBody');
        if (tb) tb.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--danger)">${e.message}</td></tr>`;
    }
}

function renderOrders() {
    const tb = document.getElementById('ordersTableBody');
    if (!tb) return;
    if (!orders.length) {
        tb.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:80px">No hay pedidos</td></tr>';
        return;
    }
    const status = {
        'PENDIENTE': { c: 'badge-warning', i: '⏳' },
        'PROCESANDO': { c: 'badge-info', i: '🔄' },
        'ENVIADO': { c: 'badge-info', i: '🚚' },
        'PAGADO': { c: 'badge-success', i: '✅' },
        'COMPLETADO': { c: 'badge-success', i: '🎉' },
        'CANCELADO': { c: 'badge-danger', i: '❌' }
    };
    tb.innerHTML = orders.map(o => {
        const st = (o.estado || 'PENDIENTE').toUpperCase();
        const cfg = status[st] || status['PENDIENTE'];
        return `
            <tr>
                <td><strong>#${o.pedidoId}</strong></td>
                <td>Usuario #${o.usuarioId}</td>
                <td>${new Date(o.creadoEn || o.fechaPedido).toLocaleDateString('es-PE')}</td>
                <td><span class="badge ${cfg.c}">${cfg.i} ${o.estado}</span></td>
                <td style="font-weight:700;color:var(--primary)">S/. ${(o.montoTotal || 0).toFixed(2)}</td>
                <td><button class="btn-action edit" onclick="showOrderStatusModal(${o.pedidoId},'${o.estado}')">✏️</button></td>
            </tr>
        `;
    }).join('');
}

function showOrderStatusModal(id, st) {
    const modal = document.getElementById('orderStatusModal');
    const idField = document.getElementById('orderStatusId');
    const statusField = document.getElementById('orderStatus');

    if (!modal || !idField || !statusField) return;

    idField.value = id;
    statusField.value = st;
    modal.classList.add('active');
}

function closeOrderStatusModal() {
    const modal = document.getElementById('orderStatusModal');
    if (modal) modal.classList.remove('active');
}

async function updateOrderStatus() {
    const id = document.getElementById('orderStatusId')?.value;
    const st = document.getElementById('orderStatus')?.value?.toUpperCase();
    if (!id || !st) { toast('Completa los campos', 'warning'); return; }
    try {
        await apiFetch(`/api/pedidos/${id}/estado`, {
            method: 'PUT',
            body: JSON.stringify({ estado: st })
        });
        closeOrderStatusModal();
        await loadOrders();
        await loadDashboard();
        toast(`Pedido #${id} actualizado a "${st}"`, 'success');
    } catch (e) { toast(e.message, 'error'); }
}

// ==================== CATEGORÍAS (ADMIN) ====================
async function loadCategorias() {
    try {
        const s = pageState.categorias;
        const searchParam = s.search ? `&buscar=${encodeURIComponent(s.search)}` : '';
        const d = await apiFetch(`/api/categorias?page=${s.p - 1}&size=${s.s}${searchParam}`);
        const p = pageData(d);

        categories = p.c;
        pageState.categorias.t = p.t;

        const total = p.tp || 1;
        if (s.p > total) s.p = total;

        renderCategorias();
        renderPag('categoriasPagination', 'categorias');
    } catch (e) {
        console.error('Categorías:', e.message);
        const tb = document.getElementById('categoriasTableBody');
        if (tb) tb.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:40px">${e.message}</td></tr>`;
    }
}

function renderCategorias() {
    const tb = document.getElementById('categoriasTableBody');
    if (!tb) return;
    if (!categories.length) {
        tb.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:80px">No hay categorías</td></tr>';
        return;
    }
    tb.innerHTML = categories.map(c => `
        <tr>
            <td>#${c.categoriaId}</td>
            <td>${c.nombre}</td>
            <td>${c.descripcion || '-'}</td>
            <td><span class="badge ${c.activo !== false ? 'badge-success' : 'badge-danger'}">${c.activo !== false ? 'Activa' : 'Inactiva'}</span></td>
            <td>
                <button class="btn-action edit" onclick="showCategoriaModal(${c.categoriaId})">✏️</button>
                <button class="btn-action delete" onclick="deleteCategoria(${c.categoriaId})">🗑️</button>
            </td>
        </tr>
    `).join('');
}

function showCategoriaModal(id = null) {
    const title = document.getElementById('categoriaModalTitle');
    const idField = document.getElementById('categoriaId');
    if (!title || !idField) return;

    title.textContent = id ? 'Editar Categoría' : 'Nueva Categoría';
    idField.value = id || '';

    if (id) {
        const c = categories.find(x => x.categoriaId === id);
        if (c) {
            const nombre = document.getElementById('categoriaNombre');
            const desc = document.getElementById('categoriaDescripcion');
            const activo = document.getElementById('categoriaActivo');
            if (nombre) nombre.value = c.nombre || '';
            if (desc) desc.value = c.descripcion || '';
            if (activo) activo.value = c.activo !== false ? 'true' : 'false';
        }
    } else {
        const form = document.getElementById('categoriaForm');
        if (form) form.reset();
    }
    const modal = document.getElementById('categoriaModal');
    if (modal) modal.classList.add('active');
}

function closeCategoriaModal() {
    const modal = document.getElementById('categoriaModal');
    const form = document.getElementById('categoriaForm');
    if (modal) modal.classList.remove('active');
    if (form) form.reset();
}

async function saveCategoria(e) {
    e.preventDefault();
    const id = document.getElementById('categoriaId')?.value;
    const data = {
        nombre: document.getElementById('categoriaNombre')?.value,
        descripcion: document.getElementById('categoriaDescripcion')?.value,
        activo: document.getElementById('categoriaActivo')?.value === 'true'
    };

    try {
        const url = id ? `/api/categorias/${id}` : '/api/categorias';
        const method = id ? 'PUT' : 'POST';
        await apiFetch(url, { method, body: JSON.stringify(data) });
        closeCategoriaModal();
        await loadCategorias();
        await loadCategories();
        toast(id ? 'Categoría actualizada' : 'Categoría creada', 'success');
    } catch (e) { toast(e.message, 'error'); }
}

async function deleteCategoria(id) {
    showConfirm('Eliminar Categoría', '¿Estás seguro de eliminar este registro? No se puede deshacer.', async () => {
        try {
            await apiFetch(`/api/categorias/${id}`, { method: 'DELETE' });
            await loadCategorias();
            await loadCategories();
            toast('Categoría eliminada', 'success');
        } catch (e) {
            console.error('Error eliminando categoría:', e);
            toast(e.message, 'error');
        }
    });

}

// ==================== MÉTODOS DE ENVÍO ====================
async function loadEnvios() {
    try {
        const s = pageState.envios;
        const searchParam = s.search ? `&buscar=${encodeURIComponent(s.search)}` : '';
        const d = await apiFetch(`/api/admin/metodos-envio?page=${s.p - 1}&size=${s.s}${searchParam}`);
        const p = pageData(d);

        envios = p.c;
        pageState.envios.t = p.t;

        const total = p.tp || 1;
        if (s.p > total) s.p = total;

        renderEnvios();
        renderPag('enviosPagination', 'envios');
    } catch (e) {
        console.error('Envíos:', e.message);
        const tb = document.getElementById('enviosTableBody');
        if (tb) tb.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px">${e.message}</td></tr>`;
    }
}

function renderEnvios() {
    const tb = document.getElementById('enviosTableBody');
    if (!tb) return;
    if (!envios.length) {
        tb.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:80px">No hay métodos de envío</td></tr>';
        return;
    }
    tb.innerHTML = envios.map(e => `
        <tr>
            <td>#${e.metodoId}</td>
            <td>${e.nombre}</td>
            <td>S/. ${(e.costoBase || 0).toFixed(2)}</td>
            <td>${e.diasEntregaMin || 1}-${e.diasEntregaMax || 5} días</td>
            <td><span class="badge ${e.activo !== false ? 'badge-success' : 'badge-danger'}">${e.activo !== false ? 'Activo' : 'Inactivo'}</span></td>
            <td>
                <button class="btn-action edit" onclick="showEnvioModal(${e.metodoId})">✏️</button>
                <button class="btn-action delete" onclick="deleteEnvio(${e.metodoId})">🗑️</button>
            </td>
        </tr>
    `).join('');
}

function showEnvioModal(id = null) {
    const title = document.getElementById('envioModalTitle');
    const idField = document.getElementById('envioId');
    if (!title || !idField) return;

    title.textContent = id ? 'Editar Método de Envío' : 'Nuevo Método de Envío';
    idField.value = id || '';

    if (id) {
        const e = envios.find(x => x.metodoId === id);
        if (e) {
            const nombre = document.getElementById('envioNombre');
            const desc = document.getElementById('envioDescripcion');
            const costo = document.getElementById('envioCosto');
            const activo = document.getElementById('envioActivo');
            const diasMin = document.getElementById('envioDiasMin');
            const diasMax = document.getElementById('envioDiasMax');
            if (nombre) nombre.value = e.nombre || '';
            if (desc) desc.value = e.descripcion || '';
            if (costo) costo.value = e.costoBase || '';
            if (activo) activo.value = e.activo !== false ? 'true' : 'false';
            if (diasMin) diasMin.value = e.diasEntregaMin || 1;
            if (diasMax) diasMax.value = e.diasEntregaMax || 5;
        }
    } else {
        const form = document.getElementById('envioForm');
        if (form) form.reset();
    }
    const modal = document.getElementById('envioModal');
    if (modal) modal.classList.add('active');
}

function closeEnvioModal() {
    const modal = document.getElementById('envioModal');
    const form = document.getElementById('envioForm');
    if (modal) modal.classList.remove('active');
    if (form) form.reset();
}

async function saveEnvio(e) {
    e.preventDefault();
    const id = document.getElementById('envioId')?.value;
    const data = {
        nombre: document.getElementById('envioNombre')?.value,
        descripcion: document.getElementById('envioDescripcion')?.value,
        costoBase: parseFloat(document.getElementById('envioCosto')?.value) || 0,
        diasEntregaMin: parseInt(document.getElementById('envioDiasMin')?.value) || 1,
        diasEntregaMax: parseInt(document.getElementById('envioDiasMax')?.value) || 5,
        activo: document.getElementById('envioActivo')?.value === 'true'
    };

    try {
        const url = id ? `/api/admin/metodos-envio/${id}` : '/api/admin/metodos-envio';
        const method = id ? 'PUT' : 'POST';
        await apiFetch(url, { method, body: JSON.stringify(data) });
        closeEnvioModal();
        await loadEnvios();
        toast(id ? 'Método actualizado' : 'Método creado', 'success');
    } catch (e) { toast(e.message, 'error'); }
}

async function deleteEnvio(id) {
    showConfirm('Eliminar Envio', '¿Estás seguro de eliminar este registro? No se puede deshacer.', async () => {
        try {
            await apiFetch(`/api/admin/metodos-envio/${id}`, { method: 'DELETE' });
            await loadEnvios();
            toast('Método eliminado', 'success');
        } catch (e) {
            console.error('Error deleting envio:', e);
            toast(e.message, 'error');
        }
    });

}
// ==================== SECCIÓN DE PAGOS (ARREGLADO) ====================

// Poblar dinámicamente el selector de pedidos en el modal de pagos
async function populatePedidosDropdown(selectedId = null) {
    const select = document.getElementById('pagoPedidoId');
    if (!select) return;
    try {
        const d = await apiFetch('/api/pedidos/admin/todos?page=0&size=500');
        const p = pageData(d);
        select.innerHTML = '<option value="">Seleccione un pedido...</option>';
        p.c.forEach(o => {
            const opt = document.createElement('option');
            opt.value = o.pedidoId;
            opt.textContent = `Pedido #${o.pedidoId} - Total: S/. ${o.montoTotal.toFixed(2)}`;
            if (o.pedidoId == selectedId) opt.selected = true;
            select.appendChild(opt);
        });
    } catch (e) {
        console.error('Error cargando los pedidos en el dropdown:', e);
        select.innerHTML = '<option value="">Error al cargar pedidos</option>';
    }
}

async function loadPagos() {
    try {
        const s = pageState.pagos;
        const searchParam = s.search ? `&buscar=${encodeURIComponent(s.search)}` : '';
        // ✅ Uso estricto de apiFetch() seguro
        const d = await apiFetch(`/api/pagos/admin/todos?page=${s.p - 1}&size=${s.s}${searchParam}`);
        const p = pageData(d);

        pagos = p.c;
        pageState.pagos.t = p.t;

        renderPagos();
        renderPag('pagosPagination', 'pagos');
    } catch (e) {
        console.error('Pagos:', e.message);
        const tb = document.getElementById('pagosTableBody');
        if (tb) tb.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--danger)">${e.message}</td></tr>`;
    }
}

function renderPagos() {
    const tb = document.getElementById('pagosTableBody');
    if (!tb) return;
    if (!pagos.length) {
        tb.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:80px">No hay pagos registrados</td></tr>';
        return;
    }

    const statusConfig = {
        'PENDIENTE': { class: 'badge-warning', icon: '⏳' },
        'PROCESADO': { class: 'badge-info', icon: '🔄' },
        'APROBADO': { class: 'badge-success', icon: '✅' },
        'COMPLETADO': { class: 'badge-success', icon: '🎉' },
        'RECHAZADO': { class: 'badge-danger', icon: '❌' },
        'REEMBOLSADO': { class: 'badge-info', icon: '💰' }
    };

    tb.innerHTML = pagos.map(p => {
        const cfg = statusConfig[p.estadoPago] || statusConfig['PENDIENTE'];
        return `
            <tr>
                <td><strong>#${p.pagoId}</strong></td>
                <td>Pedido #${p.pedidoId}</td>
                <td><span class="badge badge-primary">${p.metodoPago}</span></td>
                <td style="font-weight:700;color:var(--primary)">S/. ${(p.monto || 0).toFixed(2)}</td>
                <td><span class="badge ${cfg.class}">${cfg.icon} ${p.estadoPago}</span></td>
                <td>
                    <button class="btn-action edit" onclick="showPagoModal(${p.pagoId})">✏️</button>
                    <button class="btn-action delete" onclick="deletePago(${p.pagoId})">🗑️</button>
                </td>
            </tr>
        `;
    }).join('');
}

async function showPagoModal(pagoId = null) {
    const title = document.getElementById('pagoModalTitle');
    const idField = document.getElementById('pagoId');

    if (!title || !idField) return;

    title.textContent = pagoId ? 'Editar Pago' : 'Nuevo Pago';
    idField.value = pagoId || '';

    if (pagoId) {
        try {
            // ✅ Cambio crítico: Fetch adaptado a la apiFetch() segura con token integrado
            const p = await apiFetch(`/api/pagos/${pagoId}`);

            await populatePedidosDropdown(p.pedidoId);

            // ✅ Alineados con los IDs reales del HTML
            document.getElementById('pagoMetodo').value = p.metodoPago || 'TARJETA';
            document.getElementById('pagoMonto').value = p.monto || '';
            document.getElementById('pagoEstado').value = p.estadoPago || 'COMPLETADO';
            document.getElementById('pagoReferencia').value = p.transaccionExterna || '';
            document.getElementById('pagoFecha').value = p.fechaPago ? new Date(p.fechaPago).toISOString().slice(0, 16) : '';
            document.getElementById('pagoNotas').value = p.notas || '';
        } catch (e) {
            console.error('Error cargando el pago individual:', e);
            toast('No se pudieron obtener los datos del pago', 'error');
            return;
        }
    } else {
        document.getElementById('pagoForm')?.reset();
        await populatePedidosDropdown();
        document.getElementById('pagoFecha').value = new Date().toISOString().slice(0, 16);
    }

    document.getElementById('pagoModal')?.classList.add('active');
}

function closePagoModal() {
    document.getElementById('pagoModal')?.classList.remove('active');
    document.getElementById('pagoForm')?.reset();
}

async function savePago(e) {
    e.preventDefault();
    const id = document.getElementById('pagoId')?.value;

    // ✅ IDs perfectamente mapeados y convertidos a tipos nativos correctos
    const data = {
        pedidoId: parseInt(document.getElementById('pagoPedidoId')?.value),
        metodoPago: document.getElementById('pagoMetodo')?.value,
        monto: parseFloat(document.getElementById('pagoMonto')?.value) || 0,
        estadoPago: document.getElementById('pagoEstado')?.value,
        transaccionExterna: document.getElementById('pagoReferencia')?.value || null,
        fechaPago: document.getElementById('pagoFecha')?.value || null,
        notas: document.getElementById('pagoNotas')?.value || null
    };

    if (!data.pedidoId) {
        toast('Por favor, selecciona un pedido válido', 'warning');
        return;
    }

    try {
        const url = id ? `/api/pagos/${id}` : '/api/pagos';
        const method = id ? 'PUT' : 'POST';
        await apiFetch(url, { method, body: JSON.stringify(data) });
        closePagoModal();
        await loadPagos();
        toast(id ? 'Registro de pago actualizado' : 'Registro de pago creado', 'success');
    } catch (e) {
        toast(e.message, 'error');
    }
}

async function deletePago(id) {
    showConfirm('Eliminar Pago', '¿Estás seguro de eliminar este registro? No se puede deshacer.', async () => {

        try {
            await apiFetch(`/api/pagos/${id}`, { method: 'DELETE' });
            toast('Pago eliminado correctamente', 'success');
            loadPagos(); // Recargar la tabla
        } catch (e) {
            console.error('Error al eliminar pago:', e.message);
            toast('No se pudo eliminar el pago: ' + e.message, 'error');
        }
    });
}
// ==================== METRICAS E INTELIGENCIA DE NEGOCIO (BI) ====================
let instanceChartDia = null;
let instanceChartEstado = null;
let cacheUltimosDatosReporte = null;

// Inicializador automático de fechas al cargar la interfaz
document.addEventListener("DOMContentLoaded", () => {
    const btn7d = document.querySelector('.btn-quick-date:nth-child(2)');
    if (btn7d) btn7d.click();
});

function setRangoRapido(dias, boton) {
    document.querySelectorAll('.btn-quick-date').forEach(b => b.classList.remove('active'));
    boton.classList.add('active');

    const hoy = new Date();
    const inicio = new Date();

    if (dias > 0) {
        inicio.setDate(hoy.getDate() - dias);
    } else {
        inicio.setDate(hoy.getDate());
    }

    const fmt = (d) => d.toISOString().split('T')[0];
    const inputInicio = document.getElementById('fechaInicio');
    const inputFin = document.getElementById('fechaFin');

    if (inputInicio && inputFin) {
        inputInicio.value = fmt(inicio);
        inputFin.value = fmt(hoy);
        cargarReporte();
    }
}

async function cargarReporte() {
    const fechaInicio = document.getElementById('fechaInicio')?.value;
    const fechaFin = document.getElementById('fechaFin')?.value;

    if (!fechaInicio || !fechaFin) {
        toast('Define los límites del rango cronológico', 'warning');
        return;
    }

    const btn = document.querySelector('.btn-bi-execute');
    const containerExport = document.getElementById('containerExportaciones');
    const originalContent = btn ? btn.innerHTML : 'Ejecutar Algoritmo Analítico';

    if (btn) btn.innerHTML = '<span class="spinner" style="width:14px;height:14px;margin-right:8px"></span>Procesando Big Data...';

    try {
        const res = await apiFetch(`/api/reportes/ventas?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
        cacheUltimosDatosReporte = res;

        renderReporteAvanzado(res);

        if (containerExport) containerExport.style.display = 'flex'; // Mostrar la suite de exportación triple
        toast('Algoritmo de auditoría renderizado con éxito', 'success');
    } catch (err) {
        toast(err.message, 'error');
        if (containerExport) containerExport.style.display = 'none';
    } finally {
        if (btn) btn.innerHTML = originalContent;
    }
}

function renderReporteAvanzado(data) {
    if (!data) return;

    document.getElementById('reportTotalVentas') && (document.getElementById('reportTotalVentas').textContent = `S/. ${(data.totalVentas || 0).toFixed(2)}`);
    document.getElementById('reportTotalPedidos') && (document.getElementById('reportTotalPedidos').textContent = data.totalPedidos || 0);
    document.getElementById('reportTicketPromedio') && (document.getElementById('reportTicketPromedio').textContent = `S/. ${(data.ticketPromedio || 0).toFixed(2)}`);
    document.getElementById('reportTotalClientes') && (document.getElementById('reportTotalClientes').textContent = data.totalClientes || 0);

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#94a3b8' : '#475569';
    const gridColor = isDark ? 'rgba(148, 163, 184, 0.05)' : 'rgba(71, 85, 105, 0.05)';
    const tooltipBg = isDark ? '#1e293b' : '#ffffff';
    const tooltipBorder = isDark ? '#334155' : '#cbd5e1';

    // GRÁFICO 1: COMBINADO DE INGRESOS Y ÓRDENES
    if (instanceChartDia) instanceChartDia.destroy();
    const canvasDia = document.getElementById('chartVentasDia');
    if (canvasDia) {
        const ctxDia = canvasDia.getContext('2d');
        const ventasDia = data.ventasPorDia || [];
        const labels = ventasDia.map(d => d.fecha ? new Date(d.fecha + 'T00:00:00').toLocaleDateString('es-PE', { day: 'numeric', month: 'short' }) : 'N/A');
        const datasetIngresos = ventasDia.map(d => d.montoTotal || 0);
        const datasetVolumen = ventasDia.map(d => d.cantidadPedidos || 0);

        const gradientVentas = ctxDia.createLinearGradient(0, 0, 0, 320);
        gradientVentas.addColorStop(0, 'rgba(99, 102, 241, 0.45)');
        gradientVentas.addColorStop(1, 'rgba(99, 102, 241, 0.0)');

        instanceChartDia = new Chart(ctxDia, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        type: 'line',
                        label: 'Flujo Monetario (S/.)',
                        data: datasetIngresos,
                        yAxisID: 'yFinancial',
                        borderColor: '#6366f1',
                        borderWidth: 4,
                        pointBackgroundColor: '#8b5cf6',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        tension: 0.38,
                        fill: true,
                        backgroundColor: gradientVentas
                    },
                    {
                        type: 'bar',
                        label: 'Pedidos Semanales',
                        data: datasetVolumen,
                        yAxisID: 'yVolume',
                        backgroundColor: isDark ? 'rgba(6, 182, 212, 0.25)' : 'rgba(6, 182, 212, 0.45)',
                        borderColor: '#06b6d4',
                        borderWidth: 1.5,
                        borderRadius: 6,
                        barPercentage: 0.45
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: textColor, font: { family: 'Inter', size: 12, weight: '600' } } }
                },
                scales: {
                    x: { ticks: { color: textColor } },
                    yFinancial: { position: 'left', ticks: { color: textColor } },
                    yVolume: { position: 'right', grid: { display: false }, ticks: { color: textColor, stepSize: 1 } }
                }
            }
        });
    }

    // GRÁFICO 2: DONA DE ESTADOS LOGÍSTICOS
    if (instanceChartEstado) instanceChartEstado.destroy();
    const canvasEstado = document.getElementById('chartVentasEstado');
    if (canvasEstado) {
        const ctxEstado = canvasEstado.getContext('2d');
        const ventasEstado = data.ventasPorEstado || [];
        const colorMap = { 'COMPLETADO': '#10b981', 'PAGADO': '#34d399', 'PENDIENTE': '#f59e0b', 'PROCESANDO': '#3b82f6', 'ENVIADO': '#8b5cf6', 'CANCELADO': '#ef4444' };

        const labelsEstados = ventasEstado.map(e => e.estado || 'Indefinido');
        const montosEstados = ventasEstado.map(e => e.montoTotal || 0);
        const backgroundColors = ventasEstado.map(e => colorMap[e.estado?.toUpperCase()] || '#6b7280');
        const totalDineroSuma = data.totalVentas || montosEstados.reduce((a, b) => a + b, 0);

        instanceChartEstado = new Chart(ctxEstado, {
            type: 'doughnut',
            data: { labels: labelsEstados, datasets: [{ data: montosEstados, backgroundColor: backgroundColors, cutout: '76%', hoverOffset: 16 }] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: textColor } } }
            },
            plugins: [{
                id: 'biCenterMetricsText',
                beforeDraw: function (chart) {
                    const { width, height, ctx } = chart; ctx.restore();
                    ctx.font = "500 11px Inter, sans-serif"; ctx.fillStyle = isDark ? "#64748b" : "#94a3b8"; ctx.textBaseline = "middle";
                    const t1 = "RECAUDACIÓN"; const t1X = Math.round((width - ctx.measureText(t1).width) / 2);
                    const t1Y = (chart.chartArea.top + chart.chartArea.bottom) / 2 - 12; ctx.fillText(t1, t1X, t1Y);
                    ctx.font = "700 18px Inter, sans-serif"; ctx.fillStyle = isDark ? "#38bdf8" : "#0f172a";
                    const t2 = `S/. ${totalDineroSuma.toFixed(2)}`; const t2X = Math.round((width - ctx.measureText(t2).width) / 2);
                    const t2Y = (chart.chartArea.top + chart.chartArea.bottom) / 2 + 10; ctx.fillText(t2, t2X, t2Y); ctx.save();
                }
            }]
        });
    }

    // Inyección segura en tablas
    const tbDia = document.getElementById('reporteVentasPorDia');
    if (tbDia) {
        tbDia.innerHTML = (data.ventasPorDia || []).map(d => `<tr><td><strong>${d.fecha ? new Date(d.fecha + 'T00:00:00').toLocaleDateString('es-PE') : 'N/A'}</strong></td><td>${d.cantidadPedidos} transacciones</td><td style="font-weight:600;color:var(--success)">S/. ${(d.montoTotal || 0).toFixed(2)}</td></tr>`).join('');
    }
    const tbEst = document.getElementById('reporteVentasPorEstado');
    if (tbEst) {
        tbEst.innerHTML = (data.ventasPorEstado || []).map(e => `<tr><td><span class="badge" style="background:rgba(255,255,255,0.03); color:var(--text-main)">${e.estado}</span></td><td>${e.cantidad} unds</td><td style="font-weight:600;color:var(--primary)">S/. ${(e.montoTotal || 0).toFixed(2)}</td></tr>`).join('');
    }
}

// ==================== CONFIGURACIÓN DE EXPORTACIONES PREMIUM ====================

// 1. SOLUCIÓN CRÍTICA: EXPORTACIÓN CSV (CORREGIDA)
function exportarReporteCSV() {
    if (!cacheUltimosDatosReporte || !cacheUltimosDatosReporte.ventasPorDia) {
        toast('No existen datos analíticos para exportar', 'warning');
        return;
    }

    let csvContent = "\uFEFF"; // Forzar codificación UTF-8 para Excel
    csvContent += "REPORTES DE BUSINESS INTELLIGENCE - CENTRO DE PAGOS\n";
    csvContent += `Rango Analizado;${document.getElementById('fechaInicio')?.value} al ${document.getElementById('fechaFin')?.value}\n\n`;
    csvContent += "INDICADOR METRICO;VALOR ACUMULADO\n";
    csvContent += `Facturacion Bruta;S/. ${cacheUltimosDatosReporte.totalVentas.toFixed(2)}\n`;
    csvContent += `Volumen de Pedidos;${cacheUltimosDatosReporte.totalPedidos}\n`;
    csvContent += `Ticket Promedio;S/. ${cacheUltimosDatosReporte.ticketPromedio.toFixed(2)}\n`;
    csvContent += `Clientes Unicos;${cacheUltimosDatosReporte.totalClientes}\n\n`;

    csvContent += "DESGLOSE CRONOLOGICO DIARIO\n";
    csvContent += "Fecha;Cantidad Pedidos;Monto Liquidado\n";
    cacheUltimosDatosReporte.ventasPorDia.forEach(d => {
        csvContent += `${d.fecha};${d.cantidadPedidos};${(d.montoTotal || 0).toFixed(2)}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Auditoria_BI_Reporte_${document.getElementById('fechaInicio').value}.csv`;
    link.click();
    toast('Libro Ledger (.CSV) exportado', 'success');
}

// 2. NUEVA FUNCIÓN: EXPORTAR A DOCUMENTO PDF CORPORATIVO
async function exportarReportePDF() {
    const section = document.getElementById('view-reportes');
    if (!cacheUltimosDatosReporte) return;

    toast('Procesando Documento PDF...', 'info');

    // Ocultar la barra de filtros y botones para que el PDF salga limpio
    const panelFiltros = document.querySelector('.report-filters-panel');
    const panelBotones = document.getElementById('containerExportaciones');
    if (panelFiltros) panelFiltros.style.display = 'none';
    if (panelBotones) panelBotones.style.display = 'none';

    try {
        const canvas = await html2canvas(section, {
            scale: 2, // Eleva la nitidez del render de los gráficos
            useCORS: true,
            backgroundColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#0f172a' : '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const widthA4 = 210;
        const heightA4 = 297;
        const imgHeight = (canvas.height * widthA4) / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 0, widthA4, imgHeight);
        pdf.save(`Reporte_BI_Finanzas_${document.getElementById('fechaInicio').value}.pdf`);
        toast('PDF descargado con éxito', 'success');
    } catch (err) {
        console.error(err);
        toast('Error al compilar el PDF', 'error');
    } finally {
        if (panelFiltros) panelFiltros.style.display = 'block';
        if (panelBotones) panelBotones.style.display = 'flex';
    }
}

// 3. NUEVA FUNCIÓN: EXPORTAR COMO IMAGEN PNG DE ALTA RESOLUCIÓN
async function exportarReporteImagen() {
    const section = document.getElementById('view-reportes');
    if (!cacheUltimosDatosReporte) return;

    toast('Capturando instantánea HD...', 'info');

    const panelFiltros = document.querySelector('.report-filters-panel');
    const panelBotones = document.getElementById('containerExportaciones');
    if (panelFiltros) panelFiltros.style.display = 'none';
    if (panelBotones) panelBotones.style.display = 'none';

    try {
        const canvas = await html2canvas(section, {
            scale: 2,
            useCORS: true,
            backgroundColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#0f172a' : '#ffffff'
        });

        const link = document.createElement('a');
        link.download = `Snapshot_Analitica_BI_${document.getElementById('fechaInicio').value}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        toast('Imagen PNG guardada', 'success');
    } catch (err) {
        console.error(err);
        toast('Error al capturar imagen', 'error');
    } finally {
        if (panelFiltros) panelFiltros.style.display = 'block';
        if (panelBotones) panelBotones.style.display = 'flex';
    }
}

// Sincronización con el toggle de temas
function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('admin-theme', next);

    if (cacheUltimosDatosReporte) {
        renderReporteAvanzado(cacheUltimosDatosReporte);
    }
    toast(next === 'dark' ? 'Modo oscuro activado' : 'Modo claro activado', 'success');
}

// ==================== NAVEGACIÓN ====================
function switchView(viewId) {
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.remove('active');
    });
    document.querySelectorAll('.nav-list .nav-item').forEach(item => {
        item.classList.remove('active');
    });

    const activeSection = document.getElementById(`view-${viewId}`);
    const activeBtn = document.getElementById(`btn-${viewId}`);

    if (activeSection) activeSection.classList.add('active');
    if (activeBtn) activeBtn.classList.add('active');

    // Carga de datos bajo demanda al cambiar de vista
    if (viewId === 'dashboard') loadDashboard();
    else if (viewId === 'users') loadUsers();
    else if (viewId === 'products') loadProducts();
    else if (viewId === 'orders') loadOrders();
    else if (viewId === 'categorias') loadCategorias();
    else if (viewId === 'envios') loadEnvios();
    else if (viewId === 'pagos') loadPagos();
}

function logout() {
    showConfirm('Cerrar Sesión', '¿Deseas cerrar tu sesión actual?', () => {
        redirectToLogin();
    });
}

function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('admin-theme', next);
    toast(next === 'dark' ? 'Modo oscuro activado' : 'Modo claro activado', 'success');
}

(function initTheme() {
    const saved = localStorage.getItem('admin-theme');
    const pref = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', pref);
})();

function showConfirm(title, message, onConfirm) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    const btn = document.getElementById('btnConfirmAction');

    // Asignar nueva acción y cerrar al hacer clic
    btn.onclick = () => {
        onConfirm();
        closeConfirmModal();
    };

    document.getElementById('modalConfirm').classList.add('active');
}

function closeConfirmModal() {
    document.getElementById('modalConfirm').classList.remove('active');
}