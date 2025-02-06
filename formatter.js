// Fonction pour échapper les caractères HTML
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
// Fonction pour restaurer les caractères HTML échappés
function unescapeHtml(escaped) {
  return escaped
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}
function applyRules(rules = [], text) {
  let result = "";
  let cursor = 0;

  // Appliquer les règles de manière séquentielle
  while (cursor < text.length) {
    let match = null;
    let appliedRule = null;

    // Trouver la première correspondance
    for (const rule of rules) {
      const regex = new RegExp(rule.regex);
      const potentialMatch = regex.exec(text.slice(cursor));
      if (potentialMatch && (!match || potentialMatch.index < match.index)) {
        match = potentialMatch;
        appliedRule = rule;
      }
    }

    if (match) {
      // Ajouter le texte précédent échappé
      if (match.index > 0) {
        result += escapeHtml(text.slice(cursor, cursor + match.index));
      }

      // Ajouter le texte correspondant entouré de balises
      result += `<span class="${appliedRule.className}">${escapeHtml(
        match[0]
      )}</span>`;

      // Avancer le curseur après la correspondance
      cursor += match.index + match[0].length;
    } else {
      // Aucun match restant, ajouter le reste du texte échappé
      result += escapeHtml(text.slice(cursor));
      break;
    }
  }

  return result;
}

// Règles pour les commandes CLI
function cliRules(text) {
  const rules = [
    {
      regex: /^\s*(sudo|apt-get|npm|git|ssh|curl|wget|mkdir|cd|rm|php)\b/gm,
      className: "keyword",
    },
    { regex: /(-{1,2}\w+)\b/g, className: "property" },
    { regex: /(["'])(?:(?=(\\?))\2.)*?\1/g, className: "string" },
    { regex: /(\$[A-Z_]+|`[^`]+`)/g, className: "identifier" },
    { regex: /(#.*$)/gm, className: "comment" },
    { regex: /\b(\d+)\b/g, className: "number" },
  ];

  return applyRules(rules, unescapeHtml(text));
}
// Règles .htaccess Apache
function htaccessRules(text) {
  const rules = [
    {
      regex:
        /^\s*(RewriteEngine|RewriteRule|RewriteCond|Options|DirectoryIndex|ErrorDocument)\b/gm,
      className: "keyword",
    },
    { regex: /(\[NC,L,R=301\])/g, className: "identifier" },
    { regex: /(".*?"|'.*?')/g, className: "string" },
    { regex: /(\$\d+|%{[\w_]+})/g, className: "identifier" },
    { regex: /(#.*$)/gm, className: "comment" },
    { regex: /(\^|\$|\*|\.)/g, className: "symbol" },
  ];

  return applyRules(rules, unescapeHtml(text));
}

// Règles JSON
function jsonRules(text) {
  const rules = [
    { regex: /"(\w+)":/g, className: "identifier" },
    { regex: /:\s*\b\d+(\.\d+)?\b/g, className: "number" },
    { regex: /:\s*(".*?"|null|true|false|\d+)/g, className: "number" },
    { regex: /\b(true|false|null)\b/g, className: "keyword" },
    { regex: /[{}\[\]]/g, className: "keymethod" },
    { regex: /"(.*?)"|'(.*?)'/g, className: "string" },
  ];

  return applyRules(rules, unescapeHtml(text));
}

// Règles pour le surlignage syntaxique CSS
const cssRules = (text) => {
  const rules = {
    selectors: { regex: /([^{}]+)(?={)/g, className: "selector" }, // Sélecteurs CSS
    properties: { regex: /([\w-]+)(?=:)/g, className: "identifier" }, // Propriétés CSS
    values: { regex: /(?<=\s*\:)([^;]+)/g, className: "string" }, // Valeurs CSS
    comments: { regex: /(\/\*.*?\*\/)/gs, className: "comment" }, // Commentaires CSS
  };
  return applyRules(Object.values(rules), unescapeHtml(text));
};

function jsRules(text) {
  // Définition des règles de surlignage
  const rules = [
    {
      regex:
        /\b(function|if|else|return|let|const|var|async|await|new|try|catch|throw|class|extends|static|import|export|from)\b/g,
      className: "keyword",
    },
    { regex: /"(.*?)"|'(.*?)'|`([\s\S]*?)`/g, className: "string" },
    { regex: /(\/\/.*?$|\/\*[\s\S]*?\*\/)/gm, className: "comment" },
    { regex: /\b\d+(\.\d+)?\b/g, className: "number" },
    { regex: /\b([a-zA-Z_]\w*)\s*(?=\()/g, className: "method" },
    {
      regex: /(?<!\.\s*)(?<!\.)(\b[a-zA-Z_]\w*\b)(?!\()/g,
      className: "identifier",
    },
    { regex: /(?<=\s*\.\s*)[a-zA-Z_]\w*\b(?!\()/g, className: "keymethod" },
    {
      regex: /(?<=\{|\s*,\s*)\s*([a-zA-Z_]\w*)\s*(?=:|\})/g,
      className: "keymethod",
    },
  ];

  return applyRules(rules, unescapeHtml(text));
}

// Règles pour le surlignage syntaxique HTML/XML
const htmlXmlRules = (text, php = false) => {
  const rules = {
    attributes: {
      regex: /(\b[\w-]+)(?=\s*=\s*(&quot;.*?&quot;|&#039;.*?&#039;|\S+))/g,
      className: "identifier",
    }, // Noms des attributs
    strings: {
      regex: /(&quot;.*?&quot;|&#039;.*?&#039;)/g,
      className: "string",
    }, // Valeurs échappées
    comments: { regex: /(&lt;!--.*?--&gt;)/gs, className: "comment" }, // Commentaires échappés
    tags: {
      regex: /(&lt;\/?[a-zA-Z][\w-]*(?:\s+[^&gt;]*)?&gt;)/g,
      className: "tag",
    }, // Balises complètes échappées
    tagnames: { regex: /(&lt;\/?)([a-zA-Z][\w-]*)/g, className: "tag-name" }, // Noms des balises échappées
  };

  const applyHtmlRules = (input) => {
    let result = input;
    for (const rule of Object.values(rules)) {
      result = result.replace(rule.regex, (match, p1, p2) => {
        if (rule.className === "tag-name") {
          return `${p1}<span class="${rule.className}">${p2}</span>`;
        }
        // if (rule.className === "identifier") {
        //     return `<span class="${rule.className}">${p1}</span>${p2}`;
        // }
        return `<span class="${rule.className}">${match}</span>`;
      });
    }
    return result;
  };

  let escapedText = escapeHtml(text);
  // Nouvelle regex combinée pour PHP + HTML avec blocs non fermants
  const blocksRegex =
    /(&lt;(style|script)(?:\s+[^&gt;]*)?&gt;)(.*?)(&lt;\/\2&gt;)|(&lt;\?(php|=)(.*?)\?&gt;)|(&lt;\?(php|=)(.*?)(?=&lt;|$))/gis;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = blocksRegex.exec(escapedText)) !== null) {
    parts.push(applyHtmlRules(escapedText.slice(lastIndex, match.index)));

    if (match[1]) {
      // Bloc style/script
      const [_, openTag, tagType, content, closeTag] = match;
      const langProcessor =
        tagType.toLowerCase() === "style" ? cssRules : jsRules;
      parts.push(
        applyHtmlRules(openTag) +
          langProcessor(content) +
          applyHtmlRules(closeTag)
      );
    } else if (match[5]) {
      // Bloc PHP avec ?&gt;
      if (php) {
        const phpType = match[6];
        const phpContent = match[7];
        const unescapedContent = unescapeHtml(phpContent);
        const processedPhp = phpInternalRules(unescapedContent);
        parts.push(
          `<span class="keymethod">&lt;?${phpType}</span>` +
            processedPhp +
            `<span class="keymethod">?&gt;</span>`
        );
      } else {
        parts.push(applyHtmlRules(match[0]));
      }
    } else if (match[8]) {
      // Bloc PHP non fermant
      if (php) {
        const phpType = match[9];
        const phpContent = match[10];
        const unescapedContent = unescapeHtml(phpContent);
        const processedPhp = phpInternalRules(unescapedContent);
        parts.push(
          `<span class="keymethod">&lt;?${phpType}</span>` + processedPhp
        );
      } else {
        parts.push(applyHtmlRules(match[0]));
      }
    }

    lastIndex = blocksRegex.lastIndex;
  }

  // Traiter le reste du document
  parts.push(applyHtmlRules(escapedText.slice(lastIndex)));

  return parts.join("");
};

// Règles PHP internes (à définir ailleurs)
function phpInternalRules(code) {
  const rules = [
    {
      regex:
        /\b(echo|function|if|else|foreach|return|class|public|private|protected|static|namespace|use|new|try|catch|throw)\b/g,
      className: "keyword",
    },
    {
      regex: /\$[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*/g,
      className: "identifier",
    },
    { regex: /"(.*?)"|'(.*?)'/g, className: "string" },
    { regex: /(\/\/.*?$|\/\*[\s\S]*?\*\/|#.*?$)/gm, className: "comment" },
    { regex: /\b\d+(\.\d+)?\b/g, className: "number" },
    { regex: /(->|::)\s*(\w+)/g, className: "keymethod" },
    { regex: /\b([a-zA-Z_]\w*)\s*(?=\()/g, className: "method" },
    { regex: /(&&|\|\||===|!==|==|!=|<=|>=|<>|<<|>>)/g, className: "symbol" },
  ];

  return applyRules(rules, unescapeHtml(code));
}
const phpRules = (code) => htmlXmlRules(code, true);

const supportedLanguages = {
  html: htmlXmlRules,
  xml: htmlXmlRules,
  css: cssRules,
  js: jsRules,
  php: phpRules,
  cli: cliRules,
  json: jsonRules,
  htaccess: htaccessRules,
};

// Fonction principale pour le surlignage syntaxique
function syntaxHighlight(code, language = "txt") {
  const languages = language.split("|");
  for (const lang of languages) {
    if (supportedLanguages[lang]) {
      return `<code>${supportedLanguages[lang](code)}</code>`;
    }
  }
  return `<code>${escapeHtml(code)}</code>`; // Par défaut, échapper le texte sans surlignage
}

const languageIdentifiers = {
  php: {
    patterns: [
      { regex: /<\?(?:php|=|xml|=)?/i, score: 10 }, // Balises PHP
      {
        regex:
          /\b(echo|function|use\s+[A-Z]|class|public|private|protected)\b/i,
        score: 10,
      }, // Mots-clés PHP
      { regex: /\$\w+/i, score: 3 }, // Variables PHP
    ],
    penalties: [
      { regex: /\b(const|var|let|=>)\b/, score: 5 }, // JS mots-clés
      // { regex: /<([\w-]+)(\s+[\w-]+=("|')[^"]*("|'))*>/i, score: 2 }, // HTML balises
      { regex: /<\/?IfModule>/i, score: 1 }, // Règles Apache (htaccess)
    ],
    minScore: 5,
  },
  cli: {
    patterns: [
      {
        regex:
          /^\s*(sudo|apt-get|npm|git|ssh|curl|wget|mkdir|cd|rm|ls|chmod|chown|tar|ps|top|df|du|ifconfig|php)\b/gm,
        score: 10,
      }, // Commandes communes
      { regex: /^[\w$]+@[\w-]+:\S+#?\s*/gm, score: 4 }, // Prompt de terminal
    ],
    penalties: [
      { regex: /<\?php/i, score: 5 }, // PHP
      { regex: /<([\w-]+)(\s+[\w-]+=("|')[^"]*("|'))*>/i, score: 3 }, // HTML balises
    ],
    minScore: 6,
  },
  json: {
    patterns: [
      { regex: /^\s*[[{]\s*("[\w$]+":)/, score: 10 }, // Structure JSON de base
      { regex: /"\w+":\s*("|null|\d+|true|false|\{.*\}|\[.*\])/, score: 10 }, // Valeurs JSON
      { regex: /^\{.*\}$/s, score: 20 },
    ],
    penalties: [
      { regex: /\b(function|const|var|let|=>)\b/, score: 5 }, // JS mots-clés
      { regex: /<\/?[\w-]+>/, score: 2 }, // Balises HTML
      { regex: /^\{.*\}$/s, score: 5 }, // Pénalité pour les objets JS dans JSON (détection si on commence et finit par des accolades)
      { regex: /"\w+":\s*("[\w$]+":)/, score: 10 },
    ],
    minScore: 6,
    validator: (code) => {
      try {
        JSON.parse(code);
        return true;
      } catch {
        return code.match(/{.*}/s);
      }
    },
  },
  htaccess: {
    patterns: [
      {
        regex:
          /^\s*(RewriteEngine|RewriteRule|ErrorDocument|RewriteCond|Redirect|AddHandler|Options|SetEnv)\b/m,
        score: 15,
      }, // Mots-clés Apache
      { regex: /\%{\s*[\w-]+\s*}/, score: 3 }, // Variables Apache
      { regex: /<\/?IfModule>/i, score: 2 }, // Bloc IfModule
    ],
    penalties: [
      { regex: /<\?php/i, score: 2 }, // PHP balises
      { regex: /<([\w-]+)(\s+[\w-]+=("|')[^"]*("|'))*>/i, score: 3 }, // HTML balises
    ],
    minScore: 5,
  },
  css: {
    patterns: [
      { regex: /([^{}]+\{[^}]*\})/gs, score: 3 }, // Blocs CSS
      { regex: /:\s*(#[0-9a-f]+|[\w-]+\(|url\()/i, score: 2 }, // Valeurs CSS
      { regex: /\b(\w+)\s*:/g, score: 2 }, // Propriétés CSS
    ],
    penalties: [
      {
        regex: /\b(function|const|var|let|=>|import|export|new|await)\b/,
        score: 10,
      }, // JS mots-clés
      { regex: /<\/?[\w-]+>/, score: 3 }, // HTML balises
      { regex: /([{\[])\s*("[\w$]+":)/, score: 5 },
      { regex: /^\{.*\}$/s, score: 15 },
      {
        regex:
          /^\s*(RewriteEngine|RewriteRule|ErrorDocument|RewriteCond|Redirect|AddHandler|Options|SetEnv)\b/m,
        score: 15,
      }, // Mots-clés Apache
    ],
    minScore: 5,
  },
  js: {
    patterns: [
      {
        regex:
          /\b(function|const|var|let|=>|console\.log|import|export|async|await)\b/,
        score: 15,
      }, // JS mots-clés
      { regex: /(\/\/.*|\/\*[\s\S]*?\*\/)/, score: 3 }, // Commentaires JS
      { regex: /\b(\d+|\w+\s*\([\w\s,]*\))/, score: 2 }, // Fonctions/expressions JS
      { regex: /^\{.*\}$/s, score: 15 },
      { regex: /\b\w+\s*=\s*\(?[\w\s,]*\)?\s*=>/, score: 10 }, // Détection des arrow functions
      { regex: /\bnew\s+Promise\s*\(\s*\(\s*\w+\s*\)\s*=>/, score: 10 }, // Détection de new Promise avec arrow function
      { regex: /\bnew\s+Promise\s*\(\s*function\s*\(\s*\w+\s*\)/, score: 10 }, // Détection de new Promise avec function classique
    ],
    penalties: [
      { regex: /^\s*[[{]\s*("[\w$]+":)/, score: 15 }, // JSON
      { regex: /<\/?[\w-]+>/, score: 5 }, // HTML balises
      { regex: /<\?(?:php|=|xml|=)?/i, score: 3 }, // Balises PHP
      { regex: /([^{}]+\{[^}]*\})/gs, score: 4 }, // Pénalité pour les blocs CSS
    ],
    minScore: 6,
  },
  html: {
    patterns: [
      { regex: /<([\w-]+)(\s+[\w-]+=("|')[^"]*("|'))*>/i, score: 5 }, // HTML balises
      { regex: /&[a-z]+;/, score: 3 }, // Entités HTML
      { regex: /<\s*([\w-]+)(\s*\/?)>/g, score: 2 }, // Balises auto-fermantes
      { regex: /<!--[\s\S]*?-->/, score: 2 }, // Commentaires HTML
    ],
    penalties: [
      { regex: /<\/?IfModule>/i, score: 5 }, // Apache
      { regex: /\$\w+/i, score: 5 }, // Variables PHP
      { regex: /<\?(?:php|=|xml|=)?/i, score: 10 }, // Balises PHP
      { regex: /\b(const|var|let|=>)\b/, score: 10 }, // JS mots-clés
    ],
    minScore: 6,
  },
};

function detectLanguage(code) {
  const cleanCode = code.trim();
  const contextFreeCode = removeContext(cleanCode);

  const scores = {};

  for (const [lang, config] of Object.entries(languageIdentifiers)) {
    let score = 0;
    for (const pattern of config.patterns) {
      const matches = contextFreeCode.match(pattern.regex) || [];
      score += matches.length * pattern.score;
    }

    if (config.penalties) {
      for (const penalty of config.penalties) {
        const penaltyMatches = contextFreeCode.match(penalty.regex) || [];
        score -= penaltyMatches.length * penalty.score;
      }
    }

    scores[lang] = score >= config.minScore ? score : 0;
  }

  const detectedLanguage = Object.entries(scores)
    .filter(([_, score]) => score > 0)
    .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
    .map(([lang]) => lang)[0];

  return detectedLanguage || "txt";
}

function removeContext(code) {
  // Enlever les chaînes entre guillemets (" ou ') et les accents graves (`) ainsi que les commentaires (// ou /* */)
  let cleanedCode = code;

  // Enlever les chaînes de caractères entre guillemets (simples et doubles) et les accents graves, tout en supprimant les espaces et les retours à la ligne
  cleanedCode = cleanedCode.replace(/(["'`])(\\\1|[^\1])*?\1/g, "");

  // Enlever les commentaires JavaScript et autres commentaires
  cleanedCode = cleanedCode.replace(/(\/\/.*|\/\*[\s\S]*?\*\/)/g, "");

  return cleanedCode;
}

function highlightSyntax(carret = true) {
  const editor = document.getElementById("editor");
  sessionStorage.setItem("editorContent", editor.innerText);
  // Gestion de la touche Tab dans l'éditeur
  editor.addEventListener("keydown", (e)=> {
    if (e.key.toLowerCase() === "tab") {
      e.preventDefault();
    }
  });

  const filenameInput = document.getElementById("filenameInput"); // Assuming filename input element is present

  //   filenameInput.addEventListener("input", ()=>highlightSyntax(false));

  const code = editor.innerText || "";
  const filename = filenameInput.value;
  const fileExtension = filename.split(".").pop().toLowerCase();
  editor.addEventListener("input", highlightSyntax);
  editor.addEventListener("focus", highlightSyntax);
  if (carret) {
    const caretPos = saveCaretPosition(editor) || 0;

    /// Detect language based on the filename extension first
    const detectedLanguage =
      Object.keys(languageIdentifiers).find((lang) => lang === fileExtension) ??
      detectLanguage(code);
    const highlightedCode = syntaxHighlight(code, detectedLanguage);
    
    editor.innerHTML = highlightedCode;
    restoreCaretPosition(editor, caretPos);
  }
}
highlightSyntax();
// Sauvegarde la position du curseur en insérant directement le caractère zéro‑width
function saveCaretPosition(editableDiv) {
  const selection = window.getSelection();
  
  if (!selection.rangeCount) return null;
  const range = selection.getRangeAt(0);

  // Insertion d'un nœud texte contenant le caractère zéro‑width
  const markerNode = document.createTextNode("\u200B");
  range.insertNode(markerNode);

  // Calcul de l'offset : on récupère le texte complet et on cherche
  // la position du premier \u200B. (On part du principe que l'utilisateur n'a pas saisi ce caractère.)
  const fullText = editableDiv.innerText;
  
  const offset = fullText.indexOf("\u200B");

  return offset;
}

// Restaure la position du curseur en ignorant les caractères zéro‑width
function restoreCaretPosition(editableDiv, targetOffset) {
  const selection = window.getSelection();
  const range = document.createRange();
  let charCount = 0;
  let found = false;

  // Parcours de tous les nœuds textuels de l'éditeur
  const walker = document.createTreeWalker(
    editableDiv,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  let currentNode;
  while ((currentNode = walker.nextNode()) && !found) {
    const text = currentNode.textContent;
    // Parcours caractère par caractère
    for (let i = 0; i < text.length; i++) {
      // Ignore les caractères zéro‑width
      if (text[i] === "\u200B") continue;
      if (charCount === targetOffset) {
        // On a trouvé la position correspondant à l'offset sauvegardé
        range.setStart(currentNode, i);
        range.collapse(true);
        found = true;
        break;
      }
      charCount++;
    }
  }

  // Si on n'a pas trouvé (cas particulier), on place le curseur à la fin
  if (!found) {
    range.selectNodeContents(editableDiv);
    range.collapse(false);
  }

  // Met à jour la sélection
  selection.removeAllRanges();
  selection.addRange(range);
}