

// Form switching logic
const formContainers = document.querySelectorAll('.form-container');
function switchForm(formIdToShow) {
  formContainers.forEach(container => {
    container.classList.toggle('active', container.id === formIdToShow);
  });
}
document.addEventListener('DOMContentLoaded', () => switchForm('login-container'));



// Login form submission
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const errorDiv = document.getElementById('login-error');
  const usernameGroup = document.getElementById('username-group');
  const passwordGroup = document.getElementById('password-group');
  const usernameError = document.getElementById('username-error');
  const passwordError = document.getElementById('password-error');

  // Reset errors
  usernameGroup.classList.remove('error');
  passwordGroup.classList.remove('error');
  usernameError.style.display = 'none';
  passwordError.style.display = 'none';
  errorDiv.textContent = '';

  // Client-side validation
  let isValid = true;
  if (!email) {
    usernameGroup.classList.add('error');
    usernameError.textContent = 'Vui lòng nhập email hoặc tên đăng nhập.';
    usernameError.style.display = 'block';
    isValid = false;
  }
  if (!password) {
    passwordGroup.classList.add('error');
    passwordError.textContent = 'Vui lòng nhập mật khẩu.';
    passwordError.style.display = 'block';
    isValid = false;
  }
  if (!isValid) return;

  try {
    const result = await fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (result.status?.code === '00') {
      const token = result.data;
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

// Other form handlers
function handleRegister() { alert('Tính năng đăng ký đang được phát triển!'); }
function handleForgotPassword() { alert('Hướng dẫn đã được gửi tới email của bạn (nếu tồn tại)!'); }

// Password visibility toggle
function togglePasswordVisibility(inputId) {
  const passwordInput = document.getElementById(inputId);
  const icon = passwordInput.nextElementSibling;
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    icon.classList.remove('fa-eye');
    icon.classList.add('fa-eye-slash');
  } else {
    passwordInput.type = 'password';
    icon.classList.remove('fa-eye-slash');
    icon.classList.add('fa-eye');
  }
}