document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    if (!loginForm) {
        console.error("Error: No se encontró el formulario 'loginForm' en el DOM.");
        return;
    }

    // Toggle ver/ocultar contraseña
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            togglePassword.textContent = type === 'password' ? '👁️' : '🙈';
        });
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');

        if (!emailInput || !passwordInput) {
            showToast('Error interno: Faltan campos en el formulario', true);
            return;
        }

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            if (response.ok) {
                const data = await response.json();

                const backendToken = data.token || data.jwt || data.accessToken;
                const backendRol = data.rol || data.role || 'CLIENTE';
                const backendUsuarioId = data.usuarioId || data.userId || data.id;
                const backendEmail = data.email || data.correo || email;
                const backendNombre = data.nombre || data.nombreCompleto || 'Usuario';

                if (!backendToken) {
                    showToast('Error: Estructura de sesión inválida', true);
                    return;
                }

                // ✅ Guardar TODOS los datos
                localStorage.setItem('token', backendToken);
                localStorage.setItem('rol', backendRol);
                localStorage.setItem('usuarioId', backendUsuarioId);
                localStorage.setItem('email', backendEmail);
                localStorage.setItem('nombre', backendNombre);

                showToast('¡Bienvenido! Redirigiendo...');

                // ✅ REDIRECCIÓN INTELIGENTE SEGÚN ROL
                setTimeout(() => {
                    if (backendRol === 'ADMIN') {
                        window.location.href = '/admin.html';  // ← Panel Admin
                    } else {
                        window.location.href = '/dashboard.html';  // ← Panel Cliente
                    }
                }, 1200);

            } else {
                if (response.status === 401) {
                    showToast('Error: Correo o contraseña incorrectos', true);
                } else if (response.status === 404) {
                    showToast('Error: El usuario no se encuentra registrado', true);
                } else {
                    showToast('Error: No se pudo iniciar sesión en este momento', true);
                }
            }
        } catch (err) {
            console.error('Error de red detectado:', err);
            showToast('Error de conexión con el servidor', true);
        }
    });

    // Función del Toast mejorada
    function showToast(msg, isError = false) {
        const t = document.getElementById('toast');
        if (!t) {
            alert(msg);
            return;
        }

        const messageSpan = t.querySelector('.toast-message');
        if (messageSpan) {
            messageSpan.textContent = msg;
        }

        if (isError) {
            t.style.borderLeftColor = 'var(--color-error, #ff4d4d)';
        } else {
            t.style.borderLeftColor = 'var(--color-success, #2ecc71)';
        }

        t.classList.add('show');

        setTimeout(() => {
            t.classList.remove('show');
        }, 3000);
    }
});