async function loadUserProfile() {
    try {
        const response = await fetchAPI('/users/profile', {
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
            avatarImgEl.src = user.avatarUrl
                ? `http://localhost:8885${user.avatarUrl}`
                : "images/default_avatar.jpg";
        }

        // Gán thông tin vào form chỉnh sửa
        const editUsernameEl = document.getElementById("edit-username");
        const editAvatarEl = document.getElementById("edit-avatar");

        if (editUsernameEl) {
            editUsernameEl.value = user.displayName || '';
        }

        if (editAvatarEl) {
            editAvatarEl.value = user.avatarUrl || '';
        }

    } catch (error) {
        console.error("Lỗi tải profile:", error.message);
    }
}
