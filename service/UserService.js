// file: service/UserService.js

function getMyProfile() {
    // Luôn gọi đến endpoint /users/profile
    return fetchAPI('/users/profile', { method: 'GET' });
}