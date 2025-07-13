// === SWITCH FORM ===
const formContainers = document.querySelectorAll('.form-container');
function switchForm(formIdToShow) {
  formContainers.forEach(container => {
    container.classList.toggle('active', container.id === formIdToShow);
  });
}
document.addEventListener('DOMContentLoaded', () => switchForm('login-container'));

// === FETCH API CHUNG ===
async function fetchAPI(path, options) {
      const response = await fetch(`https://cms-service.up.railway.app/api${path}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Lỗi HTTP ${response.status}: ${text}`);
  }

  return await response.json();
}

// === ĐĂNG NHẬP ===
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const errorDiv = document.getElementById('login-error');
  const usernameGroup = document.getElementById('username-group');
  const passwordGroup = document.getElementById('password-group');
  const usernameError = document.getElementById('username-error');
  const passwordError = document.getElementById('password-error');

  // Reset lỗi
  usernameGroup.classList.remove('error');
  passwordGroup.classList.remove('error');
  usernameError.style.display = 'none';
  passwordError.style.display = 'none';
  errorDiv.textContent = '';

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

    const code = result.status?.code;
    const message = result.status?.displayMessage || 'Đăng nhập thất bại';

    if (code === '00') {
      const token = result.data;
      const payloadBase64 = token.split('.')[1];
      const decodedPayload = JSON.parse(atob(payloadBase64));
      const userId = decodedPayload.id;

      localStorage.setItem('token', token);
      localStorage.setItem('userId', userId);

      window.location.href = 'index.html';
    } else if (code === '01') {
      usernameGroup.classList.add('error');
      usernameError.textContent = message;
      usernameError.style.display = 'block';
    } else if (code === '02') {
      passwordGroup.classList.add('error');
      passwordError.textContent = message;
      passwordError.style.display = 'block';
    } else {
      errorDiv.textContent = message;
    }
  } catch (error) {
    errorDiv.textContent = error.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
  }
});

// === ĐĂNG KÝ ===
function handleRegister() {
  const displayName = document.getElementById('reg-username').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const phone = document.getElementById('reg-phone').value.trim();
  const avatarUrl = document.getElementById('reg-avatar').value.trim();
  const password = document.getElementById('reg-password').value;
  const messageBox = document.getElementById('register-message');

  // Reset
  messageBox.innerText = '';
  messageBox.className = '';

  const phoneRegex = /^\+?[0-9]{7,15}$/;
  if (phone && !phoneRegex.test(phone)) {
    showToastMessage('Số điện thoại không hợp lệ!', 'error');
    return;
  }

  const data = { displayName, email, phoneNumber: phone, avatarUrl, password };

  // Disable button và hiển thị loading
  const registerBtn = document.querySelector('#register-container .btn-primary');
  const originalText = registerBtn.textContent;
  registerBtn.textContent = 'Đang đăng ký...';
  registerBtn.disabled = true;

  fetch('https://cms-service.up.railway.app/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
    .then(res => res.json().then(json => ({ status: res.status, body: json })))
    .then(({ status, body }) => {
      console.log('Register response:', { status, body }); // Debug log
      
      // Kiểm tra nhiều trường hợp thành công
      if (status === 200 && (body.success || body.status?.code === '00' || body.message?.includes('success'))) {
        // Hiển thị thông báo thành công
        showToastMessage('Đăng ký thành công!', 'success');
        
        // Chuyển về trang đăng nhập ngay lập tức
        setTimeout(() => {
          switchForm('login-container');
          // Reset form đăng ký
          document.getElementById('reg-username').value = '';
          document.getElementById('reg-email').value = '';
          document.getElementById('reg-phone').value = '';
          document.getElementById('reg-avatar').value = '';
          document.getElementById('reg-password').value = '';
        }, 1000); // Giảm thời gian chờ xuống 1 giây
      } else {
        // Hiển thị lỗi từ server hoặc thông báo mặc định
        const errorMessage = body.status?.displayMessage || body.message || 'Đăng ký thất bại';
        showToastMessage(errorMessage, 'error');
      }
    })
    .catch((error) => {
      console.error('Register error:', error); // Debug log
      showToastMessage('Lỗi kết nối máy chủ!', 'error');
    })
    .finally(() => {
      // Khôi phục button
      registerBtn.textContent = originalText;
      registerBtn.disabled = false;
    });
}

// === QUÊN MẬT KHẨU ===
async function handleForgotPassword() {
  const emailInput = document.getElementById('forgot-email');
  const email = emailInput.value.trim();
  const messageDiv = document.getElementById('forgot-message');

  messageDiv.textContent = '';
  messageDiv.className = 'message';

  if (!email) {
    showToastMessage('Vui lòng nhập email.', 'error');
    return;
  }

  // Disable button và hiển thị loading
  const forgotBtn = document.querySelector('#forgot-container .btn-primary');
  const originalText = forgotBtn.textContent;
  forgotBtn.textContent = 'Đang gửi...';
  forgotBtn.disabled = true;

  try {
    const response = await fetchAPI('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    if (response.status?.code === '00') {
      showToastMessage('Nếu email tồn tại, hướng dẫn đã được gửi đến hộp thư.', 'success');
      setTimeout(() => switchForm('login-container'), 2500);
    } else {
      showToastMessage(response.status?.displayMessage || 'Có lỗi xảy ra.', 'error');
    }
  } catch (error) {
    showToastMessage('Không thể gửi yêu cầu. Vui lòng thử lại sau.', 'error');
  } finally {
    // Khôi phục button
    forgotBtn.textContent = originalText;
    forgotBtn.disabled = false;
  }
}

// === HIỆN / ẨN MẬT KHẨU ===
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

// === HÀM HIỂN THỊ TOAST MESSAGE (GLOBAL) ===
function showToastMessage(msg, type) {
  console.log('Showing toast:', { msg, type }); // Debug log
  
  // Tạo toast notification
  const toast = document.createElement('div');
  toast.className = `toast-notification ${type}`;
  
  const iconClass = type === 'success' ? 'fa-check' : 'fa-times';
  
  toast.innerHTML = `
    <div class="toast-content">
      <div class="toast-icon">
        <i class="fa-solid ${iconClass}"></i>
      </div>
      <div class="toast-message">${msg}</div>
      <button class="toast-close" onclick="this.parentElement.parentElement.remove()">
        <i class="fa-solid fa-times"></i>
      </button>
    </div>
  `;
  
  document.body.appendChild(toast);
  
  // Hiển thị toast
  setTimeout(() => {
    toast.classList.add('show');
  }, 100);
  
  // Tự động ẩn sau 5 giây
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 400);
  }, 5000);
}
