(function () {
  const config = window.genderWidgetConfig || {};
  const apiKey = config.apiKey || "VOTRE_CLE_API_ICI";
  const position = config.position || "bottom-right";
  const targetSelector = config.targetSelector || "textarea";

  let totalCost = 0;

  const style = document.createElement("style");
  style.textContent = `
    .gender-widget {
      position: fixed;
      ${position.includes("bottom") ? "bottom: 20px;" : "top: 20px;"}
      ${position.includes("right") ? "right: 20px;" : "left: 20px;"}
      background: white;
      border: 1px solid #ccc;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      padding: 1rem;
      z-index: 9999;
      width: 220px;
      font-size: 0.95rem;
      font-family: sans-serif;
    }
    .gender-widget .widget-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }
    .gender-widget .logo {
      width: 24px;
      height: 24px;
    }
    .gender-widget button {
      display: block;
      width: 100%;
      margin: 0.3rem 0;
      padding: 0.5rem;
      font-size: 0.9rem;
      border-radius: 6px;
      border: none;
      background: #f3f3f3;
      cursor: pointer;
      transition: background 0.2s ease;
    }
    .gender-widget button:hover { background: #e6e6e6; }
    .gender-widget .example-text {
      margin-top: 0.5rem;
      font-style: italic;
      color: #555;
    }
    .gender-widget .widget-stats {
      margin-top: 0.75rem;
      font-size: 0.8rem;
      color: #777;
    }
    .gender-widget .widget-options {
      display: none;
    }
  `;
  document.head.appendChild(style);

  const widget = document.createElement("div");
  widget.className = "gender-widget";
  widget.innerHTML = `
    <div class="widget-header">
      <img src="https://cdn-icons-png.flaticon.com/512/545/545705.png" class="logo" alt="logo">
      <span>Préférences</span>
    </div>
    <div class="widget-controls">
      <button class="btn-choose">Choisir le style de lecture</button>
      <button class="btn-vanilla">Laisser Vanilla</button>
    </div>
    <div class="widget-options">
      <button data-genre="masculin">Lecture masculine</button>
      <button data-genre="feminin">Lecture féminine</button>
      <button data-genre="inclusif">Lecture inclusive</button>
      <div class="example-text">Exemple : Les étudiant·e·s sont motivé·e·s.</div>
    </div>
    <div class="widget-stats">
      <div id="gender-timing">Temps : —</div>
      <div id="gender-cost">Coût : —</div>
      <div id="gender-total">Total : 0.000000 $</div>
    </div>
  `;
  document.body.appendChild(widget);

  const exampleText = widget.querySelector(".example-text");
  const timingDisplay = widget.querySelector("#gender-timing");
  const costDisplay = widget.querySelector("#gender-cost");
  const totalDisplay = widget.querySelector("#gender-total");
  const widgetOptions = widget.querySelector(".widget-options");

  widget.querySelector(".btn-choose").addEventListener("click", () => {
    widgetOptions.style.display = "block";
  });

  widget.querySelector(".btn-vanilla").addEventListener("click", () => {
    widgetOptions.style.display = "none";
    exampleText.textContent = "Exemple : aucun style appliqué.";
    timingDisplay.textContent = "Temps : —";
    costDisplay.textContent = "Coût : —";
    totalDisplay.textContent = `Total : ${totalCost.toFixed(6)} $`;
  });

  widget.querySelector(".btn-vanilla").click();

  widget.querySelectorAll("[data-genre]").forEach(button => {
    button.addEventListener("click", async () => {
      const genre = button.getAttribute("data-genre");
      const inputNode = document.querySelector(targetSelector);
      const inputText = inputNode?.value || inputNode?.textContent || "";
      const output = document.getElementById("gender-output") || createOutputBox();
      showLoading(output);
      const start = performance.now();
      try {
        const newText = await callOpenAI(inputText, genre);
        const duration = Math.round(performance.now() - start);
        hideLoading(output);
        output.textContent = newText;
        exampleText.textContent = genre === 'feminin' ? "Exemple : Les étudiantes sont motivées." :
                                  genre === 'masculin' ? "Exemple : Les étudiants sont motivés." :
                                  "Exemple : Les étudiant·e·s sont motivé·e·s.";
        timingDisplay.textContent = `Temps : ${duration} ms`;
        const cost = estimateCost(inputText.length, newText.length);
        costDisplay.textContent = `Coût : ${cost} $`;
        totalCost += parseFloat(cost);
        totalDisplay.textContent = `Total : ${totalCost.toFixed(6)} $`;
      } catch (e) {
        hideLoading(output);
        output.textContent = "Erreur lors de l'appel à l'API.";
        timingDisplay.textContent = "Temps : —";
        costDisplay.textContent = "Coût : —";
      }
    });
  });

  function createOutputBox() {
    const div = document.createElement("div");
    div.id = "gender-output";
    div.style.cssText = "margin-top:1rem; padding:1rem; border:1px solid #ddd; font-size:1rem;";
    document.body.appendChild(div);
    return div;
  }

  function showLoading(node) {
    node.textContent = "\u00c9criture en cours...";
    node.style.opacity = 0.6;
  }

  function hideLoading(node) {
    node.style.opacity = 1;
  }

  function estimateCost(inputChars, outputChars) {
    const inputTokens = Math.ceil(inputChars / 4);
    const outputTokens = Math.ceil(outputChars / 4);
    const cost = (inputTokens * 0.0000005 + outputTokens * 0.0000015);
    return cost.toFixed(6);
  }

  async function callOpenAI(text, genre) {
    const prompt = `Réécris le texte suivant au genre ${genre} en français : """
${text}
"""`;
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "Tu es un assistant qui adapte les textes au genre demandé." },
          { role: "user", content: prompt }
        ]
      })
    });
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "[Erreur lors de la génération]";
  }
})();
