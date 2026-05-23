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

            // Cambiamos el texto plano por bloques HTML de los iconos vectoriales
            togglePassword.innerHTML = type === 'password'
                ? `<svg xmlns="http://w3.org" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
               </svg>`
                : `<svg xmlns="http://w3.org" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
               </svg>`;
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