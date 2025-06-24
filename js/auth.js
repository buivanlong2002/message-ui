document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('login-error');
    errorDiv.textContent = '';



    try {

        const result = await fetchAPI('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });

        if (result.status?.code === '00') {
            const token = result.data;

            // Giải mã payload từ JWT để lấy userId
            const payloadBase64 = token.split('.')[1];
            const decodedPayload = JSON.parse(atob(payloadBase64));
            const userId = decodedPayload.id;

            localStorage.setItem('token', token);
            localStorage.setItem('userId', userId);

            window.location.href = 'index.html';
        } else {
            errorDiv.textContent = result.status?.displayMessage || 'Đăng nhập thất bại';
        }
    } catch (error) {
        errorDiv.textContent = error.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
    }
});
