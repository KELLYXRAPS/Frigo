/* ============================================================
   auth.js — Frontend mock authentication
   ------------------------------------------------------------
   Supabase-ready structure: all auth goes through this single
   module, so swapping localStorage for supabase.auth.* later
   only means changing the bodies of these functions.
   ============================================================ */

const Auth = (() => {
  function currentEmail() {
    return FrigoStore.getSession();
  }

  function currentUser() {
    const email = currentEmail();
    if (!email) return null;
    const users = FrigoStore.getUsers();
    return users[email] || null;
  }

  function isLoggedIn() {
    return !!currentUser();
  }

  /* ---- sign up ---- */
  function signup({ name, email, password }) {
    email = (email || "").trim().toLowerCase();
    if (!name || !email || !password) {
      return { error: "Please fill in all fields." };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { error: "Please enter a valid email address." };
    }
    if (password.length < 6) {
      return { error: "Password must be at least 6 characters." };
    }
    const users = FrigoStore.getUsers();
    if (users[email]) {
      return { error: "An account with this email already exists." };
    }
    // NOTE: plaintext is fine for a frontend demo only.
    FrigoStore.saveUser({ name: name.trim(), email, password });
    FrigoStore.setData(email, FrigoStore.defaultData());
    FrigoStore.setSession(email);
    return { user: { name, email } };
  }

  /* ---- log in ---- */
  function login({ email, password }) {
    email = (email || "").trim().toLowerCase();
    if (!email || !password) {
      return { error: "Please enter your email and password." };
    }
    const users = FrigoStore.getUsers();
    const user = users[email];
    if (!user || user.password !== password) {
      return { error: "Invalid email or password." };
    }
    FrigoStore.setSession(email);
    return { user };
  }

  /* ---- log out ---- */
  function logout() {
    FrigoStore.setSession(null);
  }

  return { currentEmail, currentUser, isLoggedIn, signup, login, logout };
})();
