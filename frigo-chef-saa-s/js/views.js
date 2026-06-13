/* ============================================================
   views.js — Pure render functions returning HTML strings
   ============================================================ */

const Views = (() => {
  const PLAN_LABELS = {
    free: "Free",
    pro: "Pro",
    premium: "Premium",
  };

  const PLANS = [
    {
      id: "free",
      name: "Free",
      price: "$0",
      period: "/forever",
      featured: false,
      feats: [
        { t: "3 recipe generations per day", ok: true },
        { t: "Step-by-step instructions", ok: true },
        { t: "Cooking time & difficulty", ok: true },
        { t: "Unlimited recipes", ok: false },
        { t: "Save favorite recipes", ok: false },
      ],
    },
    {
      id: "pro",
      name: "Pro",
      price: "$9",
      period: "/month",
      featured: true,
      feats: [
        { t: "Unlimited recipe generations", ok: true },
        { t: "Step-by-step instructions", ok: true },
        { t: "Full generation history", ok: true },
        { t: "Priority generation speed", ok: true },
        { t: "Save favorite recipes", ok: false },
      ],
    },
    {
      id: "premium",
      name: "Premium",
      price: "$19",
      period: "/month",
      featured: false,
      feats: [
        { t: "Everything in Pro", ok: true },
        { t: "Unlimited recipe generations", ok: true },
        { t: "Save & organize favorites", ok: true },
        { t: "Priority support", ok: true },
        { t: "Early access to new features", ok: true },
      ],
    },
  ];

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* ---------- Landing ---------- */
  function landing() {
    return `
      <section class="hero">
        <span class="eyebrow reveal">AI Cooking Assistant</span>
        <h1 class="reveal">Turn your fridge into<br /><span class="grad-text">delicious recipes</span></h1>
        <p class="reveal">Type whatever ingredients you have at home and Frigo Chef instantly cooks up a complete recipe — steps, timing, and difficulty included. No more "what should I make tonight?"</p>
        <div class="hero__cta reveal">
          <button class="btn btn--primary" data-nav="signup">Start cooking free</button>
          <a href="#how" class="btn btn--ghost" data-scroll>See how it works</a>
        </div>

        <div class="glass hero__mock reveal">
          <div class="hero__mockbar"><span></span><span></span><span></span></div>
          <div class="gen__row">
            <div class="gen__input">chicken, rice, tomatoes, garlic</div>
            <button class="btn btn--primary" data-nav="signup">Generate ✨</button>
          </div>
          <div class="recipe__meta" style="margin-bottom:0">
            <div><strong>Golden Chicken Stir-Fry</strong>cooking idea</div>
            <div><strong>28 min</strong>ready in</div>
            <div><strong class="diff diff--medium">Medium</strong>difficulty</div>
          </div>
        </div>
      </section>

      <section class="section" id="features">
        <div class="center" style="margin-bottom:2.5rem">
          <span class="eyebrow reveal">Why Frigo Chef</span>
          <h2 class="reveal" style="font-size:clamp(1.8rem,5vw,2.6rem)">Less waste. More flavor.</h2>
        </div>
        <div class="grid grid--3">
          ${feature("🧊", "Cook what you have", "Stop scrolling endless blogs. Enter your real ingredients and get a recipe built around them in seconds.")}
          ${feature("⚡", "Instant results", "Our generator assembles a full recipe — ingredients, ordered steps, time and difficulty — the moment you hit generate.")}
          ${feature("💜", "Save your favorites", "Premium members keep a personal cookbook of every dish they love, synced to their account.")}
        </div>
      </section>

      <section class="section section--tight" id="how">
        <div class="center" style="margin-bottom:2.5rem">
          <span class="eyebrow reveal">How it works</span>
          <h2 class="reveal" style="font-size:clamp(1.8rem,5vw,2.6rem)">Three steps to dinner</h2>
        </div>
        <div class="grid grid--3">
          ${step("1", "List ingredients", "Type everything you've got — chicken, rice, that lonely tomato. Separate items with commas.")}
          ${step("2", "Generate", "Frigo Chef analyzes your ingredients and builds a tailored recipe with smart cooking methods.")}
          ${step("3", "Cook & enjoy", "Follow the numbered steps, track the timing, and plate up something delicious.")}
        </div>
      </section>

      <section class="section" id="pricing">
        <div class="center" style="margin-bottom:2.5rem">
          <span class="eyebrow reveal">Pricing</span>
          <h2 class="reveal" style="font-size:clamp(1.8rem,5vw,2.6rem)">Choose your plan</h2>
          <p class="reveal" style="color:var(--text-dim);max-width:520px;margin:0.6rem auto 0">Start free. Upgrade whenever you're ready for unlimited recipes and a saved cookbook.</p>
        </div>
        ${pricingGrid("free", false)}
      </section>
    `;
  }

  function feature(icon, title, body) {
    return `<article class="glass feature reveal"><div class="feature__icon">${icon}</div><h3>${title}</h3><p>${body}</p></article>`;
  }
  function step(num, title, body) {
    return `<article class="glass step reveal"><div class="step__num">${num}</div><h3>${title}</h3><p>${body}</p></article>`;
  }

  /* ---------- Pricing grid (reused on landing + dashboard) ---------- */
  function pricingGrid(currentPlan, compact) {
    const cards = PLANS.map((p) => {
      const isCurrent = p.id === currentPlan;
      const feats = p.feats
        .map((f) => `<li class="${f.ok ? "" : "no"}">${esc(f.t)}</li>`)
        .join("");
      let cta;
      if (isCurrent) {
        cta = `<button class="btn btn--ghost btn--block" disabled>Current plan</button>`;
      } else {
        cta = `<button class="btn ${p.featured ? "btn--primary" : "btn--ghost"} btn--block" data-plan="${p.id}">${p.id === "free" ? "Switch to Free" : "Upgrade to " + p.name}</button>`;
      }
      return `
        <article class="glass plan ${p.featured ? "plan--featured" : ""} reveal">
          ${p.featured ? '<span class="plan__pop">Most popular</span>' : ""}
          <div class="plan__name">${p.name}</div>
          <div class="plan__price">${p.price}<small>${p.period}</small></div>
          <ul class="plan__feats">${feats}</ul>
          ${cta}
        </article>`;
    }).join("");
    return `<div class="pricing">${cards}</div>`;
  }

  /* ---------- Auth: login ---------- */
  function login() {
    return `
      <section class="auth">
        <form class="glass auth__card reveal" id="loginForm" novalidate>
          <h2>Welcome back</h2>
          <p class="auth__sub">Log in to keep cooking with Frigo Chef.</p>
          <div class="form-err" id="loginErr"></div>
          <div class="field">
            <label for="loginEmail">Email</label>
            <input type="email" id="loginEmail" autocomplete="email" placeholder="you@example.com" />
          </div>
          <div class="field">
            <label for="loginPass">Password</label>
            <input type="password" id="loginPass" autocomplete="current-password" placeholder="••••••••" />
          </div>
          <button type="submit" class="btn btn--primary btn--block">Log in</button>
          <p class="auth__alt">No account yet? <a href="#" data-nav="signup">Create one</a></p>
        </form>
      </section>`;
  }

  /* ---------- Auth: signup ---------- */
  function signup() {
    return `
      <section class="auth">
        <form class="glass auth__card reveal" id="signupForm" novalidate>
          <h2>Create your account</h2>
          <p class="auth__sub">Join free and generate your first recipe in seconds.</p>
          <div class="form-err" id="signupErr"></div>
          <div class="field">
            <label for="suName">Name</label>
            <input type="text" id="suName" autocomplete="name" placeholder="Jamie" />
          </div>
          <div class="field">
            <label for="suEmail">Email</label>
            <input type="email" id="suEmail" autocomplete="email" placeholder="you@example.com" />
          </div>
          <div class="field">
            <label for="suPass">Password</label>
            <input type="password" id="suPass" autocomplete="new-password" placeholder="At least 6 characters" />
          </div>
          <button type="submit" class="btn btn--primary btn--block">Create account</button>
          <p class="auth__alt">Already have an account? <a href="#" data-nav="login">Log in</a></p>
        </form>
      </section>`;
  }

  /* ---------- Dashboard ---------- */
  function dashboard(user, data) {
    const plan = data.plan;
    const badgeClass = plan === "premium" ? "badge--premium" : plan === "pro" ? "badge--pro" : "badge--free";
    const badgeIcon = plan === "premium" ? "👑" : plan === "pro" ? "⚡" : "🆓";

    const isFree = plan === "free";
    const limit = 3;
    const used = data.usage.count;
    const remaining = Math.max(0, limit - used);
    const pct = isFree ? Math.min(100, (used / limit) * 100) : 100;

    const usageBlock = isFree
      ? `<div class="usage">
           <span>${remaining} of ${limit} free generations left today</span>
           <div class="usage__bar"><div class="usage__fill" style="width:${pct}%"></div></div>
         </div>`
      : `<div class="usage"><span>✨ Unlimited generations active</span></div>`;

    const upsell = isFree
      ? `<div class="glass upsell reveal">
           <div>
             <h3>Hitting the daily limit?</h3>
             <p>Upgrade to Pro for unlimited recipes, or Premium to save your favorites.</p>
           </div>
           <button class="btn btn--primary" data-plan="pro">Upgrade to Pro</button>
         </div>`
      : "";

    return `
      <section class="dash">
        <div class="dash__head">
          <div class="dash__hello">
            <h1>Welcome back, ${esc(user.name)} 👋</h1>
            <p>Ready to cook something great today?</p>
          </div>
          <span class="badge ${badgeClass}">${badgeIcon} ${PLAN_LABELS[plan]} Plan</span>
        </div>

        ${upsell}

        <div class="dash__grid">
          <!-- LEFT: generator + result -->
          <div>
            <div class="glass panel reveal">
              <h2 class="panel__title">AI Recipe Generator</h2>
              <p class="panel__hint">Enter your ingredients separated by commas.</p>
              <div class="gen__row">
                <input class="gen__input" id="ingInput" placeholder="e.g. chicken, rice, tomatoes, garlic" />
                <button class="btn btn--primary" id="genBtn">Generate Recipe</button>
              </div>
              <div class="gen__chips" id="quickChips">
                ${["chicken", "rice", "eggs", "tomatoes", "pasta", "spinach", "garlic", "mushrooms"].map((c) => `<button class="chip" data-chip="${c}">+ ${c}</button>`).join("")}
              </div>
              ${usageBlock}
            </div>

            <div id="recipeOutput" style="margin-top:1.25rem"></div>
          </div>

          <!-- RIGHT: history + favorites + plan -->
          <div style="display:flex;flex-direction:column;gap:1.25rem">
            <div class="glass panel reveal">
              <h2 class="panel__title">Recent recipes</h2>
              <p class="panel__hint">Your last generations (saved locally).</p>
              <div class="mini" id="historyList">${miniList(data.history.slice(0, 5), plan, "history")}</div>
            </div>

            <div class="glass panel reveal">
              <h2 class="panel__title">⭐ Favorite recipes</h2>
              ${
                plan === "premium"
                  ? `<p class="panel__hint">Your saved cookbook.</p><div class="mini" id="favList">${miniList(data.favorites, plan, "fav")}</div>`
                  : `<div class="locked">
                       <strong>Premium feature</strong>
                       <p>Unlock a saved cookbook of every recipe you love.</p>
                       <button class="btn btn--primary btn--sm" data-plan="premium">Upgrade to Premium</button>
                     </div>`
              }
            </div>
          </div>
        </div>

        <div class="section" style="padding-left:0;padding-right:0" id="pricing">
          <div class="center" style="margin-bottom:2rem">
            <span class="eyebrow">Subscription</span>
            <h2 style="font-size:clamp(1.6rem,4vw,2.2rem)">Manage your plan</h2>
          </div>
          ${pricingGrid(plan, true)}
        </div>
      </section>
    `;
  }

  function miniList(items, plan, kind) {
    if (!items || items.length === 0) {
      return `<p class="empty">${kind === "fav" ? "No favorites yet — generate a recipe and tap the star." : "No recipes yet. Generate your first one!"}</p>`;
    }
    return items
      .map((r) => {
        const diffClass = "diff--" + r.difficulty.toLowerCase();
        return `
        <div class="mini__item">
          <div>
            <h4>${esc(r.title)}</h4>
            <small>${r.time} min · <span class="diff ${diffClass}">${r.difficulty}</span></small>
          </div>
          <div class="mini__btns">
            <button class="icon-btn" data-open="${r.id}" data-kind="${kind}" title="View recipe">↗</button>
            ${kind === "fav" ? `<button class="icon-btn" data-unfav="${r.id}" title="Remove">✕</button>` : ""}
          </div>
        </div>`;
      })
      .join("");
  }

  /* ---------- Rendered recipe card ---------- */
  function recipeCard(r, plan, isFav) {
    const diffClass = "diff--" + r.difficulty.toLowerCase();
    const ings = r.ingredients.map((i) => `<span>${esc(i)}</span>`).join("");
    const steps = r.steps.map((s) => `<li>${esc(s)}</li>`).join("");

    let favBtn;
    if (plan === "premium") {
      favBtn = `<button class="btn btn--ghost btn--sm" data-savefav="${r.id}">${isFav ? "★ Saved" : "☆ Save to favorites"}</button>`;
    } else {
      favBtn = `<button class="btn btn--ghost btn--sm" data-plan="premium" title="Premium feature">☆ Save (Premium)</button>`;
    }

    return `
      <article class="glass recipe">
        <div class="recipe__top">
          <h3 class="recipe__title">${esc(r.title)}</h3>
          <span class="badge badge--pro" style="background:var(--purple-soft);color:var(--purple-2);border:1px solid var(--border-strong)">AI generated</span>
        </div>
        <div class="recipe__meta">
          <div><strong>${r.time} min</strong>cooking time</div>
          <div><strong class="diff ${diffClass}">${r.difficulty}</strong>difficulty</div>
          <div><strong>${r.servings}</strong>servings</div>
        </div>
        <div class="recipe__sub">Ingredients</div>
        <div class="recipe__ings">${ings}</div>
        <div class="recipe__sub">Instructions</div>
        <ol class="recipe__steps">${steps}</ol>
        <div class="recipe__actions">
          ${favBtn}
          <button class="btn btn--ghost btn--sm" id="regenBtn">↻ Regenerate</button>
        </div>
      </article>`;
  }

  return { landing, login, signup, dashboard, recipeCard, pricingGrid, miniList, PLAN_LABELS };
})();
