/* ============================================================
   app.js — Router, event wiring, subscription logic
   ============================================================ */

(() => {
  const appEl = document.getElementById("app");
  const navActions = document.getElementById("navActions");
  const navEl = document.getElementById("nav");
  const navBurger = document.getElementById("navBurger");
  const navLinks = document.getElementById("navLinks");
  const toastEl = document.getElementById("toast");

  let lastRecipe = null; // most recently displayed recipe (for save/regen)
  let lastInputs = []; // ingredients used for last generation

  /* ---------------- Toast ---------------- */
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2600);
  }

  /* ---------------- Routing ---------------- */
  const PUBLIC_ROUTES = ["landing", "login", "signup"];
  const PRIVATE_ROUTES = ["dashboard"];

  function go(route) {
    const loggedIn = Auth.isLoggedIn();
    // guards
    if (PRIVATE_ROUTES.includes(route) && !loggedIn) route = "login";
    if (["login", "signup"].includes(route) && loggedIn) route = "dashboard";
    if (!PUBLIC_ROUTES.includes(route) && !PRIVATE_ROUTES.includes(route)) {
      route = loggedIn ? "dashboard" : "landing";
    }

    location.hash = route;
    render(route);
    closeMenu();
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }

  function render(route) {
    renderNav();
    if (route === "landing") appEl.innerHTML = Views.landing();
    else if (route === "login") {
      appEl.innerHTML = Views.login();
      wireLogin();
    } else if (route === "signup") {
      appEl.innerHTML = Views.signup();
      wireSignup();
    } else if (route === "dashboard") {
      const user = Auth.currentUser();
      const data = FrigoStore.getData(user.email);
      appEl.innerHTML = Views.dashboard(user, data);
      wireDashboard();
    }
    observeReveals();
  }

  /* ---------------- Nav ---------------- */
  function renderNav() {
    if (Auth.isLoggedIn()) {
      navActions.innerHTML = `
        <button class="btn btn--ghost btn--sm" data-nav="dashboard">Dashboard</button>
        <button class="btn btn--primary btn--sm" id="logoutBtn">Log out</button>`;
    } else {
      navActions.innerHTML = `
        <button class="btn btn--ghost btn--sm" data-nav="login">Log in</button>
        <button class="btn btn--primary btn--sm" data-nav="signup">Get started</button>`;
    }
  }

  function closeMenu() {
    navEl.classList.remove("open");
    navBurger.setAttribute("aria-expanded", "false");
  }

  navBurger.addEventListener("click", () => {
    const open = navEl.classList.toggle("open");
    navBurger.setAttribute("aria-expanded", String(open));
  });

  /* ---------------- Global click delegation ---------------- */
  document.addEventListener("click", (e) => {
    const navBtn = e.target.closest("[data-nav]");
    if (navBtn) {
      e.preventDefault();
      go(navBtn.getAttribute("data-nav"));
      return;
    }

    if (e.target.closest("#logoutBtn")) {
      Auth.logout();
      toast("Logged out. See you soon!");
      go("landing");
      return;
    }

    // smooth-scroll anchors on landing
    const scrollLink = e.target.closest("[data-scroll]");
    if (scrollLink) {
      e.preventDefault();
      const id = scrollLink.getAttribute("href");
      const target = document.querySelector(id);
      if (target) target.scrollIntoView({ behavior: "smooth" });
      closeMenu();
      return;
    }

    // subscription plan changes
    const planBtn = e.target.closest("[data-plan]");
    if (planBtn) {
      e.preventDefault();
      changePlan(planBtn.getAttribute("data-plan"));
      return;
    }

    // open a saved/history recipe
    const openBtn = e.target.closest("[data-open]");
    if (openBtn) {
      openRecipeById(openBtn.getAttribute("data-open"), openBtn.getAttribute("data-kind"));
      return;
    }

    // save current recipe to favorites
    const saveBtn = e.target.closest("[data-savefav]");
    if (saveBtn) {
      saveFavorite(saveBtn.getAttribute("data-savefav"));
      return;
    }

    // remove favorite
    const unfavBtn = e.target.closest("[data-unfav]");
    if (unfavBtn) {
      removeFavorite(unfavBtn.getAttribute("data-unfav"));
      return;
    }
  });

  /* ---------------- Auth wiring ---------------- */
  function wireLogin() {
    const form = document.getElementById("loginForm");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const res = Auth.login({
        email: document.getElementById("loginEmail").value,
        password: document.getElementById("loginPass").value,
      });
      if (res.error) {
        document.getElementById("loginErr").textContent = res.error;
        return;
      }
      toast(`Welcome back, ${res.user.name}!`);
      go("dashboard");
    });
  }

  function wireSignup() {
    const form = document.getElementById("signupForm");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const res = Auth.signup({
        name: document.getElementById("suName").value,
        email: document.getElementById("suEmail").value,
        password: document.getElementById("suPass").value,
      });
      if (res.error) {
        document.getElementById("signupErr").textContent = res.error;
        return;
      }
      toast(`Account created. Welcome, ${res.user.name}!`);
      go("dashboard");
    });
  }

  /* ---------------- Dashboard wiring ---------------- */
  function wireDashboard() {
    const input = document.getElementById("ingInput");
    const genBtn = document.getElementById("genBtn");

    genBtn.addEventListener("click", () => generate(input.value));
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") generate(input.value);
    });

    // quick-add chips
    document.querySelectorAll("[data-chip]").forEach((chip) => {
      chip.addEventListener("click", () => {
        const val = chip.getAttribute("data-chip");
        const current = input.value.trim();
        const parts = current ? current.split(",").map((s) => s.trim()).filter(Boolean) : [];
        if (!parts.includes(val)) parts.push(val);
        input.value = parts.join(", ");
        input.focus();
      });
    });
  }

  /* ---------------- Generation + subscription gate ---------------- */
  function generate(raw) {
    const user = Auth.currentUser();
    const data = FrigoStore.getData(user.email);

    const list = (raw || "").split(",").map((s) => s.trim()).filter(Boolean);
    if (list.length === 0) {
      toast("Please enter at least one ingredient.");
      return;
    }

    // SUBSCRIPTION LOGIC: free plan limited to 3/day
    if (data.plan === "free" && data.usage.count >= 3) {
      toast("Daily free limit reached. Upgrade to Pro for unlimited recipes.");
      document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    const out = document.getElementById("recipeOutput");
    const genBtn = document.getElementById("genBtn");
    genBtn.disabled = true;
    genBtn.innerHTML = '<span class="spin"></span> Cooking…';

    // simulate "AI thinking" latency
    setTimeout(() => {
      const recipe = RecipeEngine.generate(list);
      lastRecipe = recipe;
      lastInputs = list;

      // persist: bump usage + add to history
      const fresh = FrigoStore.getData(user.email);
      fresh.usage.count += 1;
      fresh.history.unshift(recipe);
      fresh.history = fresh.history.slice(0, 20); // cap history
      FrigoStore.setData(user.email, fresh);

      const isFav = fresh.favorites.some((f) => f.id === recipe.id);
      out.innerHTML = Views.recipeCard(recipe, fresh.plan, isFav);
      wireRecipeCard();
      refreshSidebar(fresh);
      updateUsageBar(fresh);

      genBtn.disabled = false;
      genBtn.textContent = "Generate Recipe";
      out.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 700);
  }

  function wireRecipeCard() {
    const regen = document.getElementById("regenBtn");
    if (regen) {
      regen.addEventListener("click", () => {
        const user = Auth.currentUser();
        const data = FrigoStore.getData(user.email);
        if (data.plan === "free" && data.usage.count >= 3) {
          toast("Daily free limit reached. Upgrade to Pro for unlimited recipes.");
          return;
        }
        generate(lastInputs.join(", "));
      });
    }
  }

  function updateUsageBar(data) {
    const fill = document.querySelector(".usage__fill");
    const label = document.querySelector(".usage span");
    if (data.plan !== "free") return;
    const remaining = Math.max(0, 3 - data.usage.count);
    if (fill) fill.style.width = Math.min(100, (data.usage.count / 3) * 100) + "%";
    if (label) label.textContent = `${remaining} of 3 free generations left today`;
  }

  /* ---------------- Favorites (Premium) ---------------- */
  function saveFavorite(id) {
    const user = Auth.currentUser();
    const data = FrigoStore.getData(user.email);
    if (data.plan !== "premium") {
      changePlan("premium");
      return;
    }
    const recipe = findRecipe(data, id) || lastRecipe;
    if (!recipe) return;
    if (data.favorites.some((f) => f.id === recipe.id)) {
      toast("Already in your favorites.");
      return;
    }
    data.favorites.unshift(recipe);
    FrigoStore.setData(user.email, data);
    toast("⭐ Saved to favorites!");
    refreshSidebar(data);
    // update the button label
    const btn = document.querySelector(`[data-savefav="${id}"]`);
    if (btn) btn.textContent = "★ Saved";
  }

  function removeFavorite(id) {
    const user = Auth.currentUser();
    const data = FrigoStore.getData(user.email);
    data.favorites = data.favorites.filter((f) => f.id !== id);
    FrigoStore.setData(user.email, data);
    toast("Removed from favorites.");
    refreshSidebar(data);
  }

  function findRecipe(data, id) {
    return data.history.find((r) => r.id === id) || data.favorites.find((r) => r.id === id);
  }

  function openRecipeById(id, kind) {
    const user = Auth.currentUser();
    const data = FrigoStore.getData(user.email);
    const recipe = findRecipe(data, id);
    if (!recipe) return;
    lastRecipe = recipe;
    lastInputs = recipe.inputIngredients || [];
    const isFav = data.favorites.some((f) => f.id === recipe.id);
    const out = document.getElementById("recipeOutput");
    out.innerHTML = Views.recipeCard(recipe, data.plan, isFav);
    wireRecipeCard();
    out.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function refreshSidebar(data) {
    const hist = document.getElementById("historyList");
    if (hist) hist.innerHTML = Views.miniList(data.history.slice(0, 5), data.plan, "history");
    const fav = document.getElementById("favList");
    if (fav) fav.innerHTML = Views.miniList(data.favorites, data.plan, "fav");
  }

  /* ---------------- Subscription change ---------------- */
  function changePlan(planId) {
    if (!Auth.isLoggedIn()) {
      go("signup");
      return;
    }
    const user = Auth.currentUser();
    const data = FrigoStore.getData(user.email);
    if (data.plan === planId) {
      toast(`You're already on the ${Views.PLAN_LABELS[planId]} plan.`);
      return;
    }
    data.plan = planId;
    FrigoStore.setData(user.email, data);
    const labels = { free: "Free", pro: "Pro ⚡", premium: "Premium 👑" };
    toast(`Plan updated to ${labels[planId]}!`);
    render("dashboard"); // re-render to reflect new plan everywhere
  }

  /* ---------------- Scroll reveal ---------------- */
  let revealObserver;
  function observeReveals() {
    if (revealObserver) revealObserver.disconnect();
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));
  }

  /* ---------------- Boot ---------------- */
  function boot() {
    const hash = location.hash.replace("#", "");
    const start = hash || (Auth.isLoggedIn() ? "dashboard" : "landing");
    go(start);
  }

  window.addEventListener("hashchange", () => {
    const route = location.hash.replace("#", "");
    render(
      PUBLIC_ROUTES.includes(route) || PRIVATE_ROUTES.includes(route)
        ? route
        : Auth.isLoggedIn()
        ? "dashboard"
        : "landing"
    );
  });

  boot();
})();
