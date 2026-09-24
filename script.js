// ===== CUSTOM CURSOR =====
var dot = document.getElementById('cursorDot');
document.addEventListener('mousemove', function(e) {
  dot.style.left = e.clientX + 'px';
  dot.style.top = e.clientY + 'px';
});
document.querySelectorAll('a, .tile, .experiment-card, .section-link, .chat-toggle, .chat-send, .chat-suggestion').forEach(function(el) {
  el.addEventListener('mouseenter', function() { dot.classList.add('hover'); });
  el.addEventListener('mouseleave', function() { dot.classList.remove('hover'); });
});

// ===== YANFELLM =====
var YANFE_CONTEXT = [
  "You are YanfeLLM, a short first-person AI assistant embedded in Yanfe's design portfolio site.",
  "Answer AS Yanfe, in first person, in 2-4 friendly sentences. No markdown headers.",
  "Facts about Yanfe (use only these; if asked something not covered, say you don't have that detail on the site):",
  "- Senior Product Designer at adidas, on the post-sales team (self-service, order management, lower-funnel e-commerce).",
  "- 7+ years across e-commerce, logistics and complex service products.",
  "- Previously at Mercadona Tech, Parclick, and Syneidis.",
  "- Holds a BFA in architecture, which shapes how she thinks about information architecture in product work.",
  "- Selected projects: Rethinking adidas post-purchase support, Repeat Order: turning a hidden shortcut into a growth lever (Mercadona Online, 2021), Order Detail Page as a system (adidas design system), \"Where is my refund?\" conversational timeline (adidas customer service), a post-sales design system refactor, adiRun: Designing an AI agent for the adidas Running App, and a React/TypeScript design system built from scratch in Storybook.",
  "- Also builds small AI experiments to learn: a WCAG contrast checker (MCP app in Cursor), a token-based React button component, and browser-based interactive exercises."
].join("\n");

// After you deploy the Cloudflare Worker, paste its URL here, e.g.
// "https://yanfellm.tu-usuario.workers.dev"
var YANFELLM_URL = "https://yanfellm.yanfepedroza.workers.dev";

var chatPanel = document.getElementById('chatPanel');
var chatBody = document.getElementById('chatBody');
var chatInput = document.getElementById('chatInput');
var chatSend = document.getElementById('chatSend');
var samplePromise = null;
var chatStarted = false;

function getSample() {
  if (!samplePromise) {
    samplePromise = (window.claude && window.claude.use) ? window.claude.use('sample') : Promise.resolve(null);
  }
  return samplePromise;
}

async function askWorker(question) {
  var res = await fetch(YANFELLM_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ question: question })
  });
  var data = await res.json().catch(function() { return {}; });
  if (!res.ok) throw new Error((data && data.error) || 'request failed');
  return (data && data.text) || '';
}

function setChatOpen(open) {
  chatPanel.classList.toggle('open', open);
  document.body.classList.toggle('chat-open', open);
}

document.querySelectorAll('[data-chat-toggle]').forEach(function(btn) {
  btn.addEventListener('click', function() {
    setChatOpen(!chatPanel.classList.contains('open'));
  });
});
document.getElementById('chatClose').addEventListener('click', function() {
  setChatOpen(false);
});
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' && chatPanel.classList.contains('open')) setChatOpen(false);
});

function startChat() {
  if (chatStarted) return;
  chatStarted = true;
  chatBody.innerHTML = '';
}

function addMessage(role, text) {
  var div = document.createElement('div');
  div.className = 'chat-msg ' + role;
  div.textContent = text;
  chatBody.appendChild(div);
  chatBody.scrollTop = chatBody.scrollHeight;
  return div;
}

async function ask(question) {
  if (!question || !question.trim()) return;
  startChat();
  addMessage('user', question);
  var thinking = addMessage('thinking assistant', 'Thinking...');
  chatSend.disabled = true;
  chatInput.value = '';

  try {
    if (YANFELLM_URL) {
      var text = await askWorker(question);
      thinking.classList.remove('thinking');
      thinking.textContent = text || "Sorry, I didn't get a reply.";
      chatBody.scrollTop = chatBody.scrollHeight;
    } else {
      var sample = await getSample();
      if (!sample) {
        thinking.textContent = "YanfeLLM isn't wired up to a live model on this deployment yet.";
        thinking.classList.remove('thinking');
        chatSend.disabled = false;
        return;
      }
      await sample(YANFE_CONTEXT + "\n\nQuestion: " + question, {
        modelTier: 'quick',
        onText: function(evt) {
          thinking.classList.remove('thinking');
          thinking.textContent = evt.text;
          chatBody.scrollTop = chatBody.scrollHeight;
        }
      });
    }
  } catch (e) {
    thinking.classList.remove('thinking');
    if (e && e.text) {
      thinking.textContent = e.text;
    } else if (e && e.code === 'not_granted') {
      thinking.textContent = "You'd need to allow YanfeLLM to answer for this to work.";
    } else {
      thinking.textContent = "Sorry, something went wrong answering that.";
    }
  }
  chatSend.disabled = false;
}

document.querySelectorAll('.chat-suggestion').forEach(function(btn) {
  btn.addEventListener('click', function() { ask(btn.getAttribute('data-q')); });
});
chatSend.addEventListener('click', function() { ask(chatInput.value); });
chatInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') ask(chatInput.value);
});

// ===== PROJECT SIDEBAR =====
(function() {
  var links = Array.prototype.slice.call(document.querySelectorAll('.sidebar .section-link'));
  if (!links.length) return;
  var targets = links.map(function(a) {
    var id = (a.getAttribute('href') || '').replace('#', '');
    return document.getElementById(id);
  }).filter(Boolean);
  if (!targets.length) return;
  var scroller = document.querySelector('.page');

  function setActive() {
    var current = targets[0];
    var last = targets[targets.length - 1];
    var maxScroll = scroller.scrollHeight - scroller.clientHeight;
    var fromBottom = maxScroll - scroller.scrollTop;
    var lastTop = last.getBoundingClientRect().top;
    if (maxScroll > 0 && (fromBottom <= 160 || lastTop <= Math.max(240, scroller.clientHeight * 0.32))) {
      current = last;
    } else {
      targets.forEach(function(el) {
        if (el.getBoundingClientRect().top <= 140) current = el;
      });
    }
    links.forEach(function(a) {
      a.classList.toggle('active', a.getAttribute('href') === '#' + current.id);
    });
  }

  links.forEach(function(a) {
    a.addEventListener('click', function(e) {
      var id = (a.getAttribute('href') || '').replace('#', '');
      var el = document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      links.forEach(function(link) {
        link.classList.toggle('active', link === a);
      });
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  scroller.addEventListener('scroll', setActive, { passive: true });
  scroller.addEventListener('scrollend', setActive);
  setActive();
})();

document.querySelectorAll('.p-figure-video').forEach(function(video) {
  var rate = parseFloat(video.getAttribute('data-playback-rate') || '1');
  function applySpeed() {
    video.playbackRate = rate;
  }
  applySpeed();
  video.addEventListener('loadedmetadata', applySpeed);
  video.addEventListener('playing', applySpeed);
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    video.removeAttribute('autoplay');
    video.pause();
  }
});
