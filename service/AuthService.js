const AuthService = {
    // 1. Đăng nhập người dùng
    login: async (email, password) => {
        return await fetchAPI(`/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        });
    },

    // 2. Đăng ký người dùng
    register: async (registerRequest) => {
        return await fetchAPI(`/auth/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(registerRequest),
        });
    },

    // 3. Lấy thông tin người dùng theo ID
    getUserById: async (userId, token) => {
        return await fetchAPI(`/auth/${userId}`, {
            method: "GET",
            headers: {
                Authorization: "Bearer " + token,
            },
        });
    },

    // 4. Đăng xuất người dùng
    logout: async (token) => {
        return await fetchAPI(`/auth/logout`, {
            method: "POST",
            headers: {
                Authorization: "Bearer " + token,
            },
        });
    }
};
