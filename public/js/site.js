// AgroVista Monthly — shared front-end logic for auth state + purchases.
// Loaded on index.html, archive.html and issue.html.

var Agrovista = (function () {
  var PENDING_ACTION_KEY = 'agrovista_pending_action';

  async function getSession() {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    return res.json(); // { authenticated: bool, email?: string }
  }

  async function fetchIssues() {
    const res = await fetch('/api/issues', { credentials: 'include' });
    if (!res.ok) return [];
    return res.json();
  }

  async function fetchIssue(id) {
    const res = await fetch('/api/issues/' + encodeURIComponent(id), { credentials: 'include' });
    if (!res.ok) return null;
    return res.json();
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    window.location.href = 'index.html';
  }

  function formatPrice(issue) {
    return '₹' + issue.price;
  }

  /** Returns the HTML for the "Unlock & Read" / "Continue Reading" call to action. */
  function purchaseCtaHTML(issue, opts) {
    opts = opts || {};
    var sizeClass = opts.small ? ' custom-btn-sm' : '';
    if (issue.purchased) {
      return '<a href="viewer.html?id=' + encodeURIComponent(issue.id) + '" class="btn custom-btn' + sizeClass + '">' +
        '<i class="bi bi-eye me-1"></i> Continue Reading</a>';
    }
    return '<button type="button" class="btn custom-btn' + sizeClass + ' js-buy-btn" ' +
      'data-issue-id="' + issue.id + '" data-issue-title="' + escapeHtml(issue.title) + '">' +
      '<i class="bi bi-unlock me-1"></i> Unlock &amp; Read — ' + formatPrice(issue) + '</button>';
  }

  function badgeHTML(issue) {
    return issue.purchased
      ? '<span class="badge-owned"><i class="bi bi-check-circle-fill"></i> You own this issue</span>'
      : '<span class="badge-locked"><i class="bi bi-lock-fill"></i> ' + formatPrice(issue) + ' to unlock</span>';
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /** Wire up every button with class js-buy-btn (event delegation, works for dynamically-injected cards). */
  function attachBuyHandlers() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.js-buy-btn');
      if (!btn) return;
      e.preventDefault();
      startPurchase(btn.dataset.issueId, btn.dataset.issueTitle, btn);
    });
  }

  async function startPurchase(issueId, issueTitle, triggerBtn) {
    var session = await getSession();

    if (!session.authenticated) {
      sessionStorage.setItem(PENDING_ACTION_KEY, JSON.stringify({ issueId: issueId, issueTitle: issueTitle }));
      window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
      return;
    }

    if (triggerBtn) {
      triggerBtn.disabled = true;
      triggerBtn.dataset.originalText = triggerBtn.innerHTML;
      triggerBtn.innerHTML = 'Starting checkout…';
    }

    try {
      var orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueId: issueId })
      });
      var order = await orderRes.json();

      if (!orderRes.ok) {
        if (order.error === 'already_purchased') {
          window.location.href = 'viewer.html?id=' + encodeURIComponent(issueId);
          return;
        }
        alert(order.message || 'Could not start payment. Please try again.');
        return;
      }

      if (typeof Razorpay === 'undefined') {
        alert('Payment library failed to load. Check your internet connection and try again.');
        return;
      }

      var rzp = new Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'AgroVista Monthly',
        description: issueTitle,
        order_id: order.orderId,
        prefill: { email: session.email },
        theme: { color: '#4C7A3F' },
        handler: async function (response) {
          try {
            var verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            var verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.ok) {
              window.location.href = 'viewer.html?id=' + encodeURIComponent(issueId);
            } else {
              alert('We could not confirm your payment automatically. If money was deducted, contact support — your webhook confirmation will still unlock the issue shortly.');
            }
          } catch (err) {
            alert('Payment succeeded but confirmation failed. Please refresh in a minute or contact support.');
          }
        },
        modal: {
          ondismiss: function () {
            if (triggerBtn) {
              triggerBtn.disabled = false;
              triggerBtn.innerHTML = triggerBtn.dataset.originalText;
            }
          }
        }
      });
      rzp.open();
    } catch (err) {
      console.error(err);
      alert('Something went wrong starting checkout. Please try again.');
      if (triggerBtn) {
        triggerBtn.disabled = false;
        triggerBtn.innerHTML = triggerBtn.dataset.originalText;
      }
    }
  }

  /** Call on page load: if the user just logged back in to finish a purchase they started, resume it automatically. */
  async function resumePendingActionIfAny() {
    var raw = sessionStorage.getItem(PENDING_ACTION_KEY);
    if (!raw) return;
    sessionStorage.removeItem(PENDING_ACTION_KEY);
    try {
      var pending = JSON.parse(raw);
      var session = await getSession();
      if (session.authenticated && pending.issueId) {
        startPurchase(pending.issueId, pending.issueTitle);
      }
    } catch (e) { /* ignore malformed pending action */ }
  }

  return {
    getSession: getSession,
    fetchIssues: fetchIssues,
    fetchIssue: fetchIssue,
    logout: logout,
    purchaseCtaHTML: purchaseCtaHTML,
    badgeHTML: badgeHTML,
    attachBuyHandlers: attachBuyHandlers,
    startPurchase: startPurchase,
    resumePendingActionIfAny: resumePendingActionIfAny,
    escapeHtml: escapeHtml
  };
})();

document.addEventListener('DOMContentLoaded', function () {
  Agrovista.attachBuyHandlers();
  Agrovista.resumePendingActionIfAny();

  // Reflect logged-in state in the navbar, if the page has the placeholder elements.
  Agrovista.getSession().then(function (session) {
    var loginBtn = document.getElementById('nav-auth-slot');
    if (!loginBtn) return;
    if (session.authenticated) {
      loginBtn.innerHTML =
        '<span class="me-2 small text-muted d-none d-lg-inline">' + Agrovista.escapeHtml(session.email) + '</span>' +
        '<button type="button" id="nav-logout-btn" class="btn custom-btn custom-btn-secondary custom-btn-sm">Sign out</button>';
      document.getElementById('nav-logout-btn').addEventListener('click', Agrovista.logout);
    } else {
      loginBtn.innerHTML = '<a href="login.html" class="btn custom-btn custom-btn-secondary custom-btn-sm">Sign in</a>';
    }
  });
});
