/* ============================================================
   store.js — Central state + localStorage persistence
   ============================================================ */

const FrigoStore = (() => {
  const KEYS = {
    USERS: "fc_users", // registered accounts {email -> {name,email,password}}
    SESSION: "fc_session", // current logged-in email
    DATA: "fc_data", // per-user data keyed by email
  };

  /* ---- low level helpers ---- */
  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }
  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  /* ---- users ---- */
  function getUsers() {
    return read(KEYS.USERS, {});
  }
  function saveUser(user) {
    const users = getUsers();
    users[user.email] = user;
    write(KEYS.USERS, users);
  }

  /* ---- session ---- */
  function getSession() {
    return read(KEYS.SESSION, null);
  }
  function setSession(email) {
    if (email) write(KEYS.SESSION, email);
    else localStorage.removeItem(KEYS.SESSION);
  }

  /* ---- per-user data (plan, recipes, favorites, usage) ---- */
  function defaultData() {
    return {
      plan: "free", // free | pro | premium
      history: [], // generated recipes (newest first)
      favorites: [], // saved recipes (premium only)
      usage: { date: today(), count: 0 }, // daily generation counter
    };
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function getData(email) {
    const all = read(KEYS.DATA, {});
    const data = all[email] || defaultData();
    // reset daily usage if the day rolled over
    if (data.usage.date !== today()) {
      data.usage = { date: today(), count: 0 };
    }
    return data;
  }

  function setData(email, data) {
    const all = read(KEYS.DATA, {});
    all[email] = data;
    write(KEYS.DATA, all);
  }

  return {
    KEYS,
    getUsers,
    saveUser,
    getSession,
    setSession,
    getData,
    setData,
    today,
    defaultData,
  };
})();
