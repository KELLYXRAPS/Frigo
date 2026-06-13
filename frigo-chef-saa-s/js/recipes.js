/* ============================================================
   recipes.js — The "AI" recipe generator engine
   ------------------------------------------------------------
   Pure JS. Takes a list of ingredient strings and assembles a
   plausible recipe using template arrays + simple heuristics.
   No backend / no real model — fully deterministic-ish on the
   client, but randomized for variety.
   ============================================================ */

const RecipeEngine = (() => {
  /* known cooking styles chosen based on detected ingredients */
  const METHODS = [
    { name: "Stir-Fry", verb: "stir-fry", pan: "wok or large skillet", base: "high heat" },
    { name: "One-Pan Bake", verb: "roast", pan: "baking tray", base: "the oven at 200°C / 400°F" },
    { name: "Comforting Stew", verb: "simmer", pan: "heavy pot", base: "medium-low heat" },
    { name: "Skillet Sauté", verb: "sauté", pan: "non-stick skillet", base: "medium heat" },
    { name: "Fresh Bowl", verb: "toss", pan: "large mixing bowl", base: "room temperature" },
    { name: "Creamy Pasta", verb: "fold", pan: "saucepan", base: "gentle heat" },
  ];

  const FLAVOR_ADJ = ["Golden", "Garlicky", "Zesty", "Smoky", "Herbed", "Rustic", "Sizzling", "Velvety", "Spicy", "Sunlit"];

  /* pantry staples we assume the user already has */
  const STAPLES = ["olive oil", "salt", "black pepper", "garlic"];

  /* simple ingredient → role hints */
  const PROTEINS = ["chicken", "beef", "pork", "tofu", "egg", "eggs", "shrimp", "fish", "salmon", "tuna", "turkey", "beans", "chickpeas", "lentils", "bacon"];
  const CARBS = ["rice", "pasta", "noodles", "potato", "potatoes", "bread", "quinoa", "tortilla", "couscous"];
  const VEG = ["tomato", "tomatoes", "onion", "pepper", "peppers", "carrot", "carrots", "broccoli", "spinach", "mushroom", "mushrooms", "zucchini", "corn", "peas", "lettuce", "cabbage"];

  function clean(list) {
    return list
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 12);
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function has(list, group) {
    return list.find((i) => group.some((g) => i.includes(g)));
  }

  function cap(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  /* ---- main generator ---- */
  function generate(rawList) {
    const ings = clean(rawList);
    if (ings.length === 0) return null;

    const protein = has(ings, PROTEINS);
    const carb = has(ings, CARBS);
    const veg = has(ings, VEG);

    // choose a method that suits the ingredients
    let method;
    if (carb && (carb.includes("pasta") || carb.includes("noodle"))) method = METHODS[5];
    else if (protein && veg) method = pick([METHODS[0], METHODS[3]]);
    else if (carb && carb.includes("potato")) method = METHODS[1];
    else if (ings.length >= 5) method = METHODS[2];
    else method = pick(METHODS);

    // build a title
    const hero = protein || veg || ings[0];
    const title = `${pick(FLAVOR_ADJ)} ${cap(hero)} ${method.name}`;

    // difficulty + time scale with ingredient count
    const n = ings.length;
    let difficulty, time, servings;
    if (n <= 3) {
      difficulty = "Easy";
      time = 15 + n * 3;
    } else if (n <= 6) {
      difficulty = "Medium";
      time = 25 + n * 3;
    } else {
      difficulty = "Hard";
      time = 40 + n * 2;
    }
    servings = Math.max(2, Math.min(4, Math.round(n / 2)));

    // assemble used ingredients (user's + assumed staples)
    const used = [...ings];
    STAPLES.forEach((s) => {
      if (!used.some((u) => u.includes(s.split(" ")[0]))) used.push(s);
    });

    // build the steps
    const steps = buildSteps({ ings, protein, carb, veg, method });

    return {
      id: "r_" + Date.now() + "_" + Math.floor(Math.random() * 999),
      title,
      ingredients: used,
      inputIngredients: ings,
      steps,
      time, // minutes
      difficulty, // Easy | Medium | Hard
      servings,
      createdAt: new Date().toISOString(),
    };
  }

  function buildSteps({ ings, protein, carb, veg, method }) {
    const steps = [];

    steps.push(
      `Prep everything first: rinse and chop your ${ings.slice(0, 3).join(", ")}${ings.length > 3 ? " and the rest of your ingredients" : ""} into even, bite-sized pieces.`
    );

    steps.push(`Warm a glug of olive oil in a ${method.pan} over ${method.base}, then add a clove of minced garlic and let it turn fragrant for about 30 seconds.`);

    if (protein) {
      steps.push(`Add the ${protein} and ${method.verb} until it is cooked through and lightly browned, about 5–7 minutes. Season with a pinch of salt and pepper.`);
    }

    if (veg) {
      steps.push(`Toss in the ${veg}${ings.filter((i) => i !== protein && i !== veg && i !== carb).length ? " along with the remaining vegetables" : ""} and cook for another 4–5 minutes until just tender but still vibrant.`);
    }

    if (carb) {
      if (carb.includes("rice") || carb.includes("quinoa") || carb.includes("couscous")) {
        steps.push(`Stir in the cooked ${carb}, mixing so every grain soaks up the flavor. Splash in a little water if it looks dry.`);
      } else if (carb.includes("pasta") || carb.includes("noodle")) {
        steps.push(`Fold in the cooked ${carb} and a spoonful of its starchy cooking water to create a silky sauce that clings to everything.`);
      } else if (carb.includes("potato")) {
        steps.push(`Add the ${carb} and let them ${method.verb} until golden and crisp at the edges, roughly 10 minutes.`);
      } else {
        steps.push(`Incorporate the ${carb} and warm through so it carries all the flavors.`);
      }
    }

    steps.push(`Taste and adjust the seasoning — a final crack of black pepper and a squeeze of acidity (lemon or vinegar) brings it to life.`);
    steps.push(`Plate it up while hot, garnish with anything fresh you have on hand, and serve immediately. Enjoy your Frigo Chef creation!`);

    return steps;
  }

  return { generate };
})();
