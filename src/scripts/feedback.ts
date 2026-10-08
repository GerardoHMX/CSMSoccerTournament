const FEEDBACK_DELAY_MS = 10 * 1000;

function getScriptUrl(): string {
    return document.getElementById('feedback-widget-root')?.dataset.feedbackUrl || '';
}

function createWidget() {
    const root = document.getElementById('feedback-widget-root');
    if (!root) return null;

    const panel = document.getElementById('feedback-widget-panel');
    const btnClose = document.getElementById('feedback-widget-close');
    const starsContainer = document.getElementById('feedback-stars');
    const commentInput = document.getElementById('feedback-comment');
    const submitBtn = document.getElementById('feedback-submit');
    const messageEl = document.getElementById('feedback-message');

    let selectedRating = 0;

    const STAR_EMPTY = '☆';
    const STAR_FILLED = '★';

    function setRating(value) {
        selectedRating = value;
        if (starsContainer) {
            const stars = starsContainer.querySelectorAll('[data-value]');
            stars.forEach((s, i) => {
                const filled = i < value;
                s.innerHTML = filled ? STAR_FILLED : STAR_EMPTY;
                s.classList.toggle('text-brand-gold', filled);
                s.classList.toggle('text-gray-300', !filled);
            });
        }
    }

    function closeDialog() {
        if (root) root.classList.add('hidden');
    }

    function showMessage(text, translateKey = '', isError = false) {
        if (!messageEl) return;
        messageEl.textContent = text;
        messageEl.className = 'text-sm mt-2 ' + (isError ? 'text-red-600' : 'text-green-600');
        messageEl.classList.remove('hidden');
        messageEl.setAttribute('data-translate', translateKey);
    }

    function hideMessage() {
        if (messageEl) messageEl.classList.add('hidden');
    }

    function submit() {
        if (selectedRating === 0) {
            showMessage('Elige una valoración.', 'feedback_message_rating', true);
            return;
        }
        const comment = commentInput ? (commentInput.value || '').trim() : '';
        const url = getScriptUrl();
        if (!url) {
            showMessage('La valoración no está conectada al servidor. Gracias por tu intención.', 'feedback_message_error_server', true);
            return;
        }
        hideMessage();
        // Envío por formulario a iframe para evitar CORS con Google Apps Script
        const form = document.getElementById('feedback-form');
        if (form) {
            (form as any).fecha_hora.value = new Date().toISOString();
            (form as any).valoracion.value = String(selectedRating);
            (form as any).tipo.value = 'estrellas';
            (form as any).comentario.value = comment;
            form.action = url;
            form.submit();
        }
        showMessage('¡Gracias por tu valoración!', 'feedback_message_success');
        setRating(0);
        if (commentInput) commentInput.value = '';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Enviado';
            submitBtn.setAttribute('data-translate', 'feedback_submit_sent');
        }
        setTimeout(() => {
            closeDialog();
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Enviar';
                submitBtn.setAttribute('data-translate', 'feedback_submit');
            }
        }, 500);
    }

    // Estrellas (5 botones): vacías (☆) hasta que el usuario seleccione
    if (starsContainer) {
        for (let i = 1; i <= 5; i++) {
            const star = document.createElement('button');
            star.type = 'button';
            star.setAttribute('data-value', i);
            star.className = 'p-1 text-2xl text-brand-gold focus:outline-none transition-colors';
            star.innerHTML = STAR_EMPTY;
            star.addEventListener('click', () => setRating(i));
            starsContainer.appendChild(star);
        }
    }

    if (btnClose) btnClose.addEventListener('click', closeDialog);
    if (submitBtn) submitBtn.addEventListener('click', submit);

    // Cerrar al hacer clic en el fondo (backdrop)
    if (root) {
        root.addEventListener('click', (e) => {
            if (e.target === root) closeDialog();
        });
    }

    return { closeDialog };
}

function initFeedbackWidget() {
    const root = document.getElementById('feedback-widget-root');
    if (!root) return;

    function showDialog() {
        root.classList.remove('hidden');
    }

    function scheduleShow() {
        setTimeout(() => {
            createWidget();
            showDialog();
        }, FEEDBACK_DELAY_MS);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', scheduleShow);
    } else {
        scheduleShow();
    }
}

export { initFeedbackWidget as iniciarFeedback };
