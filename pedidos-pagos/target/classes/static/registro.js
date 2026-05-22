document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');

    if (!registerForm) {
        console.error("Error: No se encontró el formulario 'registerForm' en el DOM.");
        return;
    }

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Obtener todos los campos requeridos por tu entidad Usuario de Hibernate
        const nombreInput = document.getElementById('regNombre');
        const apellidoInput = document.getElementById('regApellido');
        const emailInput = document.getElementById('regEmail');
        const passwordInput = document.getElementById('regPassword');

        // Validar que los elementos existan en tu HTML antes de leer su valor
        if (!emailInput || !passwordInput) {
            showToast('Error interno: Faltan campos esenciales en el HTML', true);
            return;
        }

        const nombre = nombreInput ? nombreInput.value.trim() : '';
        const apellido = apellidoInput ? apellidoInput.value.trim() : '';
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        // Validación rápida en Frontend
        if (password.length < 4) {
            showToast('La contraseña debe tener al menos 4 caracteres', true);
            return;
        }

        try {
            // 2. Enviar la petición estructurada a tu AuthController
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    nombre,
                    apellido,
                    email,
                    password
                })
            });

            if (response.ok) {
                showToast('¡Registro exitoso! Redirigiendo al login...', false);

                // Redirigir usando la ruta raíz para evitar fallos de carpetas
                setTimeout(() => window.location.href = '/index.html', 1500);
            } else {
                // Captura el mensaje descriptivo enviado por tu catch de Java
                const errorText = await response.text();
                showToast(errorText || 'El usuario ya existe o los datos son inválidos', true);
            }
        } catch (err) {
            console.error('Error de red en el registro:', err);
            showToast('Error de conexión con el servidor', true);
        }
    });

    // 3. Función Toast mejorada y segura contra nulos
    function showToast(msg, isError = false) {
        const t = document.getElementById('toast');
        if (!t) {
            alert(msg);
            return;
        }

        const messageSpan = t.querySelector('.toast-message');
        const iconSpan = t.querySelector('.toast-icon');

        if (messageSpan) messageSpan.textContent = msg;
        if (iconSpan) iconSpan.textContent = isError ? '❌' : '✅';

        t.style.borderLeftColor = isError ? 'var(--color-error, #ff4d4d)' : 'var(--color-success, #2ecc71)';

        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 3000);
    }
});
