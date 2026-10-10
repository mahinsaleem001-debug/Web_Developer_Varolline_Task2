// Only these fields are ever sent to the browser. The password hash stays on the server.
function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

module.exports = { publicUser };
