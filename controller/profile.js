

async function loadUserProfile() {
    try {
        const userId = localStorage.getItem('userId');
        if (!userId) {
            throw new Error('Chưa đăng nhập');
        }
        
        const response = await fetchAPI(`/users/${userId}`, {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        });

        const user = response.data;

        // Gán thông tin vào modal
        const displayNameEl = document.getElementById("modal-display-name");
        const avatarImgEl = document.getElementById("modal-avatar-img");

        if (displayNameEl) {
            displayNameEl.innerText = user.displayName || user.username;
        }

        if (avatarImgEl) {
            avatarImgEl.src = getAvatarUrl(user.avatarUrl);
        }

        // Gán thông tin vào form chỉnh sửa
        const editUsernameEl = document.getElementById("edit-username");
        const editAvatarEl = document.getElementById("edit-avatar");

        if (editUsernameEl) {
            editUsernameEl.value = user.displayName || '';
        }

        if (editAvatarEl) {
            // Xử lý avatar URL để chỉ lưu đường dẫn tương đối
            let avatarUrl = user.avatarUrl || '';
                    if (avatarUrl && avatarUrl.startsWith('https://cms-service.up.railway.app/')) {
            avatarUrl = avatarUrl.replace('https://cms-service.up.railway.app/', '');
        } else if (avatarUrl && avatarUrl.startsWith('https://cms-service.up.railway.app')) {
            avatarUrl = avatarUrl.replace('https://cms-service.up.railway.app', '');
            }
            editAvatarEl.value = avatarUrl;
        }

    } catch (error) {
        console.error("Lỗi tải profile:", error.message);
    }
}
