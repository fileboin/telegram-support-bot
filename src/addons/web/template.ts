const renderMiniAppHtml = (appName: string = 'Marketplace Bot'): string => `<!DOCTYPE html>
<html lang="sr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <title>${appName}</title>
  <script src="https://telegram.org/js/telegram-web-app.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen">
  <div class="max-w-7xl mx-auto p-4 pb-24">
    <header class="mb-6">
      <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <p class="text-sky-400 text-sm font-semibold uppercase tracking-[0.2em]">Balkan Marketplace</p>
          <h1 class="text-3xl font-bold">${appName}</h1>
          <p class="text-slate-400 mt-2 text-sm">Hitni zahtevi, voucher top-up, wallet refundovi i potpuno besplatni oglasi u jednoj Telegram Mini App aplikaciji.</p>
        </div>
        <div class="grid grid-cols-2 gap-3 min-w-[300px]">
          <div class="rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3">
            <div class="text-xs uppercase tracking-widest text-slate-500">Lead fee</div>
            <div id="leadFeeValue" class="text-2xl font-bold mt-1">€0.50</div>
            <div class="text-xs text-slate-400 mt-2">Otkup kontakta</div>
          </div>
          <div class="rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3">
            <div class="text-xs uppercase tracking-widest text-slate-500">Wallet balance</div>
            <div id="walletBalanceValue" class="text-2xl font-bold mt-1">€0.00</div>
            <div id="userRoleBadge" class="text-xs text-slate-400 mt-2">Korisnik</div>
          </div>
        </div>
      </div>
    </header>

    <div id="notice" class="hidden mb-4 rounded-2xl px-4 py-3 text-sm"></div>

    <nav class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <button data-tab="matching" class="tab-button rounded-2xl px-4 py-4 bg-sky-500 text-slate-950 font-semibold shadow-lg shadow-sky-500/20">Hitni Zahtevi</button>
      <button data-tab="ads" class="tab-button rounded-2xl px-4 py-4 bg-slate-900 border border-slate-800 font-semibold">Besplatni Oglasi</button>
      <button data-tab="provider" class="tab-button rounded-2xl px-4 py-4 bg-slate-900 border border-slate-800 font-semibold">Provajder Centar</button>
      <button data-tab="admin" id="adminTabButton" class="tab-button hidden rounded-2xl px-4 py-4 bg-slate-900 border border-slate-800 font-semibold">Admin</button>
    </nav>

    <main class="space-y-6">
      <section id="tab-matching" class="tab-panel space-y-6">
        <div class="grid xl:grid-cols-3 gap-6">
          <div class="rounded-3xl bg-slate-900 border border-slate-800 p-5 xl:col-span-1">
            <h2 class="text-xl font-bold mb-1">Pošalji hitan zahtev</h2>
            <p class="text-slate-400 text-sm mb-4">Klijent upisuje naslov, grad i napomenu. Sistem prosleđuje zahtev relevantnim provajderima.</p>
            <div class="rounded-2xl bg-slate-950 border border-slate-800 p-4 mb-4 space-y-3">
              <div>
                <div class="text-xs uppercase tracking-widest text-slate-500">Posting policy</div>
                <div id="phoneVerificationStatus" class="text-sm text-slate-200 mt-2">Telefon nije verifikovan</div>
                <div id="requestPolicyHint" class="text-xs text-slate-400 mt-2"></div>
              </div>
              <button type="button" id="verifyPhoneButton" class="w-full rounded-2xl border border-slate-700 px-4 py-3 text-sm font-semibold">Verifikuj telefon u Telegramu</button>
            </div>
            <form id="requestForm" class="space-y-4">
              <div>
                <label class="block text-sm text-slate-300 mb-2">Naslov zahteva</label>
                <input name="title" required class="w-full rounded-2xl bg-slate-950 border border-slate-700 px-4 py-3 outline-none focus:border-sky-400" placeholder="npr. Potreban stan na dan večeras" />
              </div>
              <div class="grid sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm text-slate-300 mb-2">Kategorija</label>
                  <select name="category" id="requestCategory" class="w-full rounded-2xl bg-slate-950 border border-slate-700 px-4 py-3"></select>
                </div>
                <div>
                  <label class="block text-sm text-slate-300 mb-2">Grad</label>
                  <select name="city" id="requestCity" class="w-full rounded-2xl bg-slate-950 border border-slate-700 px-4 py-3"></select>
                </div>
              </div>
              <div>
                <label class="block text-sm text-slate-300 mb-2">Napomena</label>
                <textarea name="notes" rows="4" class="w-full rounded-2xl bg-slate-950 border border-slate-700 px-4 py-3" placeholder="Dodajte detalje, hitnost, lokaciju, sprat, budžet..."></textarea>
              </div>
              <button type="submit" class="w-full rounded-2xl bg-sky-500 text-slate-950 font-semibold px-4 py-3">Objavi zahtev</button>
            </form>
          </div>

          <div class="rounded-3xl bg-slate-900 border border-slate-800 p-5 xl:col-span-1">
            <h2 class="text-xl font-bold mb-1">Wallet i voucher top-up</h2>
            <p class="text-slate-400 text-sm mb-4">Unesi X-bon, Aircash ili drugi voucher kod. Kredit se dodaje u interni wallet i koristi za lead unlock.</p>
            <div class="rounded-2xl bg-slate-950 border border-slate-800 p-4 mb-4">
              <div class="text-xs uppercase tracking-widest text-slate-500">Trenutni balance</div>
              <div id="walletBalanceInline" class="text-3xl font-bold mt-2">€0.00</div>
              <div class="text-sm text-slate-400 mt-2">Vraćeni disputed leadovi se mogu odmah ponovo iskoristiti bez mrežnih fee-jeva.</div>
            </div>
            <form id="voucherForm" class="space-y-4">
              <div>
                <label class="block text-sm text-slate-300 mb-2">Voucher PIN / code</label>
                <input name="code" required class="w-full rounded-2xl bg-slate-950 border border-slate-700 px-4 py-3" placeholder="npr. XBON-1234-5678" />
              </div>
              <button type="submit" class="w-full rounded-2xl bg-emerald-500 text-slate-950 font-semibold px-4 py-3">Redeem voucher</button>
            </form>
            <div class="mt-4 space-y-3">
              <div class="text-sm text-slate-400">Alternativni top-up metod:</div>
              <button type="button" id="mtPelerinButton" class="hidden w-full rounded-2xl border border-slate-700 px-4 py-3 font-semibold">Top up with Mt Pelerin</button>
            </div>
          </div>

          <div class="rounded-3xl bg-slate-900 border border-slate-800 p-5 xl:col-span-1">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h2 class="text-xl font-bold">Balance logs</h2>
                <p class="text-slate-400 text-sm">Voucher redeem, wallet spend i refund audit trag.</p>
              </div>
              <button type="button" data-refresh class="rounded-xl border border-slate-700 px-3 py-2 text-sm">Osveži</button>
            </div>
            <div id="balanceLogs" class="space-y-3"></div>
          </div>
        </div>

        <div class="rounded-3xl bg-slate-900 border border-slate-800 p-5">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-xl font-bold">Moji zahtevi</h2>
              <p class="text-slate-400 text-sm">Pregled aktivnih i uparenih hitnih zahteva.</p>
            </div>
            <button type="button" data-refresh class="rounded-xl border border-slate-700 px-3 py-2 text-sm">Osveži</button>
          </div>
          <div id="myRequests" class="space-y-3"></div>
        </div>
      </section>

      <section id="tab-ads" class="tab-panel hidden space-y-6">
        <div class="grid lg:grid-cols-2 gap-6">
          <div class="rounded-3xl bg-slate-900 border border-slate-800 p-5">
            <h2 class="text-xl font-bold mb-1">Postavi besplatan oglas</h2>
            <p class="text-slate-400 text-sm mb-4">Sekcija je potpuno besplatna za objavu i pregled: Auto, Nekretnine, Razno.</p>
            <form id="listingForm" class="space-y-4">
              <div>
                <label class="block text-sm text-slate-300 mb-2">Naslov oglasa</label>
                <input name="title" required class="w-full rounded-2xl bg-slate-950 border border-slate-700 px-4 py-3" placeholder="npr. Prodajem Golf 7 1.6 TDI" />
              </div>
              <div class="grid sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm text-slate-300 mb-2">Kategorija</label>
                  <select name="category" id="listingCategory" class="w-full rounded-2xl bg-slate-950 border border-slate-700 px-4 py-3"></select>
                </div>
                <div>
                  <label class="block text-sm text-slate-300 mb-2">Grad</label>
                  <select name="city" id="listingCity" class="w-full rounded-2xl bg-slate-950 border border-slate-700 px-4 py-3"></select>
                </div>
              </div>
              <div>
                <label class="block text-sm text-slate-300 mb-2">Cena</label>
                <input name="price" class="w-full rounded-2xl bg-slate-950 border border-slate-700 px-4 py-3" placeholder="npr. 4.500€ ili po dogovoru" />
              </div>
              <div>
                <label class="block text-sm text-slate-300 mb-2">Opis</label>
                <textarea name="description" rows="5" required class="w-full rounded-2xl bg-slate-950 border border-slate-700 px-4 py-3" placeholder="Navedite stanje, lokaciju, dodatne informacije..."></textarea>
              </div>
              <button type="submit" class="w-full rounded-2xl bg-emerald-500 text-slate-950 font-semibold px-4 py-3">Objavi oglas</button>
            </form>
          </div>

          <div class="rounded-3xl bg-slate-900 border border-slate-800 p-5">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h2 class="text-xl font-bold">Aktivni oglasi</h2>
                <p class="text-slate-400 text-sm">Svi mogu besplatno da pregledaju objavljene oglase.</p>
              </div>
              <button type="button" data-refresh class="rounded-xl border border-slate-700 px-3 py-2 text-sm">Osveži</button>
            </div>
            <div id="allListings" class="space-y-3"></div>
          </div>
        </div>
      </section>

      <section id="tab-provider" class="tab-panel hidden space-y-6">
        <div class="grid lg:grid-cols-2 gap-6">
          <div class="rounded-3xl bg-slate-900 border border-slate-800 p-5">
            <h2 class="text-xl font-bold mb-1">Provajder profil</h2>
            <p class="text-slate-400 text-sm mb-4">Izaberite gradove i usluge za koje želite da dobijate matching zahteve.</p>
            <form id="providerForm" class="space-y-4">
              <div>
                <label class="block text-sm text-slate-300 mb-2">Gradovi</label>
                <div id="providerCities" class="grid grid-cols-2 gap-2"></div>
              </div>
              <div>
                <label class="block text-sm text-slate-300 mb-2">Kategorije</label>
                <div id="providerCategories" class="grid grid-cols-2 gap-2"></div>
              </div>
              <div>
                <label class="block text-sm text-slate-300 mb-2">Napomena o profilu</label>
                <textarea name="notes" rows="3" class="w-full rounded-2xl bg-slate-950 border border-slate-700 px-4 py-3" placeholder="npr. Dostupan 24/7, stižem za 30 minuta"></textarea>
              </div>
              <button type="submit" class="w-full rounded-2xl bg-violet-500 text-white font-semibold px-4 py-3">Sačuvaj profil</button>
            </form>
          </div>

          <div class="rounded-3xl bg-slate-900 border border-slate-800 p-5">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h2 class="text-xl font-bold">Aktivni i otključani leadovi</h2>
                <p class="text-slate-400 text-sm">Wallet se koristi prvi; ako nema dovoljno kredita, ide payment flow. Za dispute možete tražiti refund.</p>
              </div>
              <button type="button" data-refresh class="rounded-xl border border-slate-700 px-3 py-2 text-sm">Osveži</button>
            </div>
            <div id="providerRequests" class="space-y-3"></div>
          </div>
        </div>
      </section>

      <section id="tab-admin" class="tab-panel hidden space-y-6">
        <div class="grid xl:grid-cols-3 gap-6">
          <div class="rounded-3xl bg-slate-900 border border-slate-800 p-5 xl:col-span-1 space-y-5">
            <div>
              <h2 class="text-xl font-bold mb-1">Admin podešavanja</h2>
              <p class="text-slate-400 text-sm mb-4">Promeni lead fee, upravljaj voucherima i odobravaj refundove.</p>
              <form id="settingsForm" class="space-y-4">
                <div>
                  <label class="block text-sm text-slate-300 mb-2">Lead fee</label>
                  <input name="leadFee" type="number" min="0" step="0.01" class="w-full rounded-2xl bg-slate-950 border border-slate-700 px-4 py-3" />
                </div>
                <button type="submit" class="w-full rounded-2xl bg-amber-400 text-slate-950 font-semibold px-4 py-3">Sačuvaj proviziju</button>
              </form>
            </div>

            <div>
              <h3 class="text-lg font-semibold mb-3">Dodaj voucher</h3>
              <form id="adminVoucherForm" class="space-y-3">
                <div>
                  <label class="block text-sm text-slate-300 mb-2">Provider</label>
                  <select name="provider" id="voucherProviderSelect" class="w-full rounded-2xl bg-slate-950 border border-slate-700 px-4 py-3"></select>
                </div>
                <div>
                  <label class="block text-sm text-slate-300 mb-2">Code</label>
                  <input name="code" required class="w-full rounded-2xl bg-slate-950 border border-slate-700 px-4 py-3" placeholder="npr. AIR-1234-5678" />
                </div>
                <div>
                  <label class="block text-sm text-slate-300 mb-2">Amount</label>
                  <input name="amount" type="number" min="0.01" step="0.01" required class="w-full rounded-2xl bg-slate-950 border border-slate-700 px-4 py-3" placeholder="npr. 1.00" />
                </div>
                <button type="submit" class="w-full rounded-2xl bg-emerald-500 text-slate-950 font-semibold px-4 py-3">Kreiraj voucher</button>
              </form>
            </div>

            <div id="dashboardStats" class="grid grid-cols-2 gap-3"></div>
          </div>

          <div class="rounded-3xl bg-slate-900 border border-slate-800 p-5 xl:col-span-2">
            <h2 class="text-xl font-bold mb-4">Global request management & refund approvals</h2>
            <div id="adminRequests" class="space-y-3"></div>
          </div>
        </div>

        <div class="grid xl:grid-cols-2 gap-6">
          <div class="rounded-3xl bg-slate-900 border border-slate-800 p-5">
            <h2 class="text-xl font-bold mb-4">Global ads management</h2>
            <div id="adminListings" class="space-y-3"></div>
          </div>

          <div class="space-y-6">
            <div class="rounded-3xl bg-slate-900 border border-slate-800 p-5">
              <h2 class="text-xl font-bold mb-4">Voucher inventory</h2>
              <div id="adminVouchers" class="space-y-3"></div>
            </div>
            <div class="rounded-3xl bg-slate-900 border border-slate-800 p-5">
              <h2 class="text-xl font-bold mb-4">Balance log audit</h2>
              <div id="adminBalanceLogs" class="space-y-3"></div>
            </div>
            <div class="rounded-3xl bg-slate-900 border border-slate-800 p-5">
              <h2 class="text-xl font-bold mb-4">Transaction history</h2>
              <div id="adminTransactionLogs" class="space-y-3"></div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>

  <script>
    (function () {
      var tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
      if (tg) {
        tg.ready();
        tg.expand();
      }

      var state = {
        bootstrap: null,
        activeTab: 'matching'
      };

      function notify(message, type) {
        var notice = document.getElementById('notice');
        notice.className = 'mb-4 rounded-2xl px-4 py-3 text-sm ' + (type === 'error'
          ? 'bg-red-500/15 text-red-200 border border-red-500/30'
          : 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/30');
        notice.textContent = message;
        notice.classList.remove('hidden');
        window.clearTimeout(notice._timer);
        notice._timer = window.setTimeout(function () {
          notice.classList.add('hidden');
        }, 3500);
      }

      function api(path, options) {
        var headers = { 'Content-Type': 'application/json' };
        if (tg && tg.initData) {
          headers['X-Telegram-Init-Data'] = tg.initData;
        }
        if (!tg) {
          headers['X-Dev-User'] = JSON.stringify({
            id: 'dev-user',
            first_name: 'Dev',
            username: 'dev_user'
          });
        }
        var finalOptions = options || {};
        finalOptions.headers = Object.assign({}, headers, finalOptions.headers || {});
        return fetch(path, finalOptions).then(function (response) {
          return response.json().then(function (payload) {
            if (!response.ok) {
              throw new Error(payload.error || 'API error');
            }
            return payload;
          });
        });
      }

      function money(amount, currency) {
        return (currency === 'EUR' ? '€' : (currency + ' ')) + Number(amount || 0).toFixed(2);
      }

      function formatDate(value) {
        if (!value) return '';
        try {
          return new Date(value).toLocaleString('sr-RS');
        } catch (_error) {
          return String(value);
        }
      }

      function setActiveTab(tabName) {
        state.activeTab = tabName;
        document.querySelectorAll('.tab-button').forEach(function (button) {
          if (button.getAttribute('data-tab') === tabName) {
            button.className = 'tab-button rounded-2xl px-4 py-4 bg-sky-500 text-slate-950 font-semibold shadow-lg shadow-sky-500/20';
          } else {
            button.className = 'tab-button rounded-2xl px-4 py-4 bg-slate-900 border border-slate-800 font-semibold';
          }
        });
        document.querySelectorAll('.tab-panel').forEach(function (panel) {
          panel.classList.add('hidden');
        });
        document.getElementById('tab-' + tabName).classList.remove('hidden');
      }

      function renderSelectOptions(elementId, items) {
        var element = document.getElementById(elementId);
        element.innerHTML = '';
        items.forEach(function (item) {
          var option = document.createElement('option');
          option.value = item;
          option.textContent = item;
          element.appendChild(option);
        });
      }

      function renderCheckboxGroup(elementId, name, items, selected) {
        var element = document.getElementById(elementId);
        element.innerHTML = '';
        items.forEach(function (item) {
          var isChecked = Array.isArray(selected) && selected.indexOf(item) >= 0;
          var label = document.createElement('label');
          label.className = 'flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm';
          label.innerHTML = '<input type="checkbox" name="' + name + '" value="' + item + '" ' + (isChecked ? 'checked' : '') + ' class="rounded border-slate-600 bg-slate-900 text-sky-400" />' +
            '<span>' + item + '</span>';
          element.appendChild(label);
        });
      }

      function escapeHtml(value) {
        return String(value || '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }

      function requestCard(item, mode) {
        var adminMode = mode === 'admin';
        var clientMode = mode === 'client';
        var providerMode = mode === 'provider';
        var statusColor = item.status === 'matched'
          ? 'text-emerald-300'
          : (item.status === 'expired' ? 'text-amber-300' : (item.status === 'closed' ? 'text-slate-400' : 'text-sky-300'));
        var lead = item.lead || null;
        var leadMeta = lead ? '<div class="mt-3 rounded-2xl bg-slate-950 border border-slate-800 p-3 text-sm">' +
          '<div class="font-semibold text-slate-200">Lead info</div>' +
          '<div class="text-slate-400 mt-1">Payment: ' + escapeHtml(lead.paymentMethod || '-') + ' • Fee: ' + escapeHtml(money(lead.feeAmount || 0, lead.currency || 'EUR')) + '</div>' +
          '<div class="text-slate-400 mt-1">Refund status: ' + escapeHtml(lead.refund_status || 'none') + '</div>' +
          (lead.refund_requested_wallet_address ? '<div class="text-slate-400 mt-1">Wallet: ' + escapeHtml(lead.refund_requested_wallet_address) + '</div>' : '') +
          (lead.refund_net_amount ? '<div class="text-slate-400 mt-1">Net refund: ' + escapeHtml(money(lead.refund_net_amount, lead.currency || 'EUR')) + '</div>' : '') +
          '</div>' : '';
        var contactBlock = item.contact ? '<div class="mt-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm">' +
          '<div class="font-semibold">Kontakt otključan</div>' +
          '<div>' + escapeHtml(item.contact.label) + '</div>' +
          '<a class="text-emerald-300 underline" target="_blank" href="' + escapeHtml(item.contact.telegramUrl) + '">Otvori kontakt</a>' +
          '</div>' : '';
        var acceptButton = providerMode && item.leadUnlocked !== true && item.status === 'open'
          ? '<button data-checkout="' + item._id + '" class="mt-3 w-full rounded-2xl bg-violet-500 px-4 py-3 font-semibold">Accept & Pay ' + escapeHtml(document.getElementById('leadFeeValue').textContent) + ' to unlock contact</button>'
          : '';
        var refundButtons = providerMode && lead && item.leadUnlocked
          ? '<div class="mt-3 flex flex-wrap gap-2">' +
            '<button data-request-refund-internal="' + lead._id + '" class="rounded-xl border border-slate-700 px-3 py-2 text-sm">Request internal refund</button>' +
            '<button data-request-refund-crypto="' + lead._id + '" class="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100">Request crypto refund</button>' +
            '</div>'
          : '';
        var clientCloseButton = clientMode && (item.status === 'open' || item.status === 'matched')
          ? '<button data-close-request="' + item._id + '" class="mt-3 w-full rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 font-semibold text-amber-100">Close Request / Found Option</button>'
          : '';
        var adminActions = adminMode ? '<div class="mt-3 flex flex-wrap gap-2">' +
          '<button data-edit-request="' + item._id + '" class="rounded-xl border border-slate-700 px-3 py-2 text-sm">Izmeni</button>' +
          '<button data-delete-request="' + item._id + '" class="rounded-xl bg-red-500/20 border border-red-500/30 px-3 py-2 text-sm text-red-200">Obriši</button>' +
          '</div>' : '';
        var adminRefundButtons = adminMode && lead && lead._id &&
          (lead.refund_status === 'requested_internal' || lead.refund_status === 'requested_crypto')
          ? '<div class="mt-3 flex flex-wrap gap-2">' +
            '<button data-approve-refund-internal="' + lead._id + '" class="rounded-xl bg-emerald-500/20 border border-emerald-500/30 px-3 py-2 text-sm text-emerald-100">Approve Refund: Internal</button>' +
            '<button data-approve-refund-crypto="' + lead._id + '" class="rounded-xl bg-cyan-500/20 border border-cyan-500/30 px-3 py-2 text-sm text-cyan-100">Approve Refund: Crypto</button>' +
            '</div>'
          : '';
        var lifecycleMeta = [
          item.expiresAt ? ('Ističe: ' + formatDate(item.expiresAt)) : '',
          item.closedAt ? ('Zatvoreno: ' + formatDate(item.closedAt)) : '',
          item.closeReason ? ('Razlog: ' + escapeHtml(item.closeReason)) : ''
        ].filter(Boolean).join(' • ');
        return '<div class="rounded-3xl border border-slate-800 bg-slate-900 p-4">' +
          '<div class="flex items-start justify-between gap-3">' +
          '<div><div class="font-semibold text-lg">' + escapeHtml(item.title) + '</div>' +
          '<div class="text-sm text-slate-400">' + escapeHtml(item.category) + ' • ' + escapeHtml(item.city) + '</div></div>' +
          '<div class="text-xs uppercase tracking-wider ' + statusColor + '">' + escapeHtml(item.status) + '</div></div>' +
          '<div class="text-sm text-slate-300 mt-3">' + escapeHtml(item.notes || 'Bez dodatnih napomena.') + '</div>' +
          (lifecycleMeta ? '<div class="text-xs text-slate-500 mt-3">' + lifecycleMeta + '</div>' : '') +
          leadMeta +
          contactBlock +
          acceptButton +
          refundButtons +
          clientCloseButton +
          adminActions +
          adminRefundButtons +
          '</div>';
      }

      function listingCard(item, adminMode) {
        var adminActions = adminMode ? '<div class="mt-3 flex flex-wrap gap-2">' +
          '<button data-edit-listing="' + item._id + '" class="rounded-xl border border-slate-700 px-3 py-2 text-sm">Izmeni</button>' +
          '<button data-delete-listing="' + item._id + '" class="rounded-xl bg-red-500/20 border border-red-500/30 px-3 py-2 text-sm text-red-200">Obriši</button>' +
          '</div>' : '';
        return '<div class="rounded-3xl border border-slate-800 bg-slate-900 p-4">' +
          '<div class="flex items-start justify-between gap-3">' +
          '<div><div class="font-semibold text-lg">' + escapeHtml(item.title) + '</div>' +
          '<div class="text-sm text-slate-400">' + escapeHtml(item.category) + ' • ' + escapeHtml(item.city) + '</div></div>' +
          '<div class="text-sm text-emerald-300 font-semibold">' + escapeHtml(item.price || 'Po dogovoru') + '</div></div>' +
          '<div class="text-sm text-slate-300 mt-3">' + escapeHtml(item.description) + '</div>' +
          '<div class="text-xs text-slate-500 mt-3">Kontakt: ' + escapeHtml(item.ownerUsername ? ('@' + item.ownerUsername) : item.ownerName) + '</div>' +
          adminActions +
          '</div>';
      }

      function voucherCard(item) {
        return '<div class="rounded-2xl border border-slate-800 bg-slate-950 p-3">' +
          '<div class="flex items-start justify-between gap-3">' +
          '<div><div class="font-semibold">' + escapeHtml(item.provider) + '</div>' +
          '<div class="text-sm text-slate-400">' + escapeHtml(item.code) + '</div></div>' +
          '<div class="text-sm font-semibold">' + escapeHtml(money(item.amount, item.currency || 'EUR')) + '</div></div>' +
          '<div class="text-xs text-slate-500 mt-2">Status: ' + escapeHtml(item.status) + '</div>' +
          '</div>';
      }

      function balanceLogCard(item) {
        var amountColor = item.direction === 'credit' ? 'text-emerald-300' : (item.direction === 'debit' ? 'text-amber-300' : 'text-cyan-300');
        return '<div class="rounded-2xl border border-slate-800 bg-slate-950 p-3">' +
          '<div class="flex items-start justify-between gap-3">' +
          '<div><div class="font-semibold">' + escapeHtml(item.type) + '</div>' +
          '<div class="text-sm text-slate-400">' + escapeHtml(item.note || '') + '</div></div>' +
          '<div class="text-sm font-semibold ' + amountColor + '">' + escapeHtml((item.amount > 0 ? '+' : '') + money(item.amount, item.currency || 'EUR')) + '</div></div>' +
          '<div class="text-xs text-slate-500 mt-2">Balance after: ' + escapeHtml(money(item.balanceAfter, item.currency || 'EUR')) + '</div>' +
          '</div>';
      }

      function transactionLogCard(item) {
        var directionColor = item.direction === 'credit' ? 'text-emerald-300' : 'text-amber-300';
        return '<div class="rounded-2xl border border-slate-800 bg-slate-950 p-3">' +
          '<div class="flex items-start justify-between gap-3">' +
          '<div><div class="font-semibold">' + escapeHtml(item.type) + '</div>' +
          '<div class="text-sm text-slate-400">' + escapeHtml(item.note || '') + '</div></div>' +
          '<div class="text-sm font-semibold ' + directionColor + '">' + escapeHtml(money(item.amount, item.currency || 'EUR')) + '</div></div>' +
          '<div class="text-xs text-slate-500 mt-2">Status: ' + escapeHtml(item.status || '-') + ' • ' + escapeHtml(formatDate(item.createdAt)) + '</div>' +
          '</div>';
      }

      function renderStats(stats) {
        var container = document.getElementById('dashboardStats');
        container.innerHTML = '';
        [
          ['Otvoreni zahtevi', stats.openRequests],
          ['Upareni zahtevi', stats.matchedRequests],
          ['Aktivni oglasi', stats.activeListings],
          ['Aktivni provajderi', stats.providers],
          ['Wallet ukupno', money(stats.totalWalletBalance || 0, 'EUR')],
          ['Refund zahtevi', stats.pendingRefunds],
          ['Wallet count', stats.totalWallets],
          ['Unused vouchers', stats.unusedVouchers]
        ].forEach(function (entry) {
          var card = document.createElement('div');
          card.className = 'rounded-2xl bg-slate-950 border border-slate-800 px-3 py-4';
          card.innerHTML = '<div class="text-xs uppercase tracking-wider text-slate-500">' + entry[0] + '</div>' +
            '<div class="text-2xl font-bold mt-2">' + entry[1] + '</div>';
          container.appendChild(card);
        });
      }

      function renderLists() {
        var data = state.bootstrap;
        document.getElementById('myRequests').innerHTML = data.myRequests.length
          ? data.myRequests.map(function (item) { return requestCard(item, 'client'); }).join('')
          : '<div class="rounded-3xl border border-dashed border-slate-700 p-5 text-slate-400">Još nema zahteva.</div>';

        document.getElementById('providerRequests').innerHTML = data.providerRequests.length
          ? data.providerRequests.map(function (item) { return requestCard(item, 'provider'); }).join('')
          : '<div class="rounded-3xl border border-dashed border-slate-700 p-5 text-slate-400">Nema aktivnih matching zahteva za tvoj profil.</div>';

        document.getElementById('allListings').innerHTML = data.listings.length
          ? data.listings.map(function (item) { return listingCard(item, false); }).join('')
          : '<div class="rounded-3xl border border-dashed border-slate-700 p-5 text-slate-400">Još nema oglasa u sistemu.</div>';

        document.getElementById('balanceLogs').innerHTML = data.balanceLogs.length
          ? data.balanceLogs.map(function (item) { return balanceLogCard(item); }).join('')
          : '<div class="rounded-3xl border border-dashed border-slate-700 p-5 text-slate-400">Još nema wallet transakcija.</div>';

        if (data.admin) {
          document.getElementById('adminRequests').innerHTML = data.adminRequests.length
            ? data.adminRequests.map(function (item) { return requestCard(item, 'admin'); }).join('')
            : '<div class="rounded-3xl border border-dashed border-slate-700 p-5 text-slate-400">Nema zahteva za moderaciju.</div>';

          document.getElementById('adminListings').innerHTML = data.adminListings.length
            ? data.adminListings.map(function (item) { return listingCard(item, true); }).join('')
            : '<div class="rounded-3xl border border-dashed border-slate-700 p-5 text-slate-400">Nema oglasa za moderaciju.</div>';

          document.getElementById('adminVouchers').innerHTML = data.vouchers.length
            ? data.vouchers.map(function (item) { return voucherCard(item); }).join('')
            : '<div class="rounded-3xl border border-dashed border-slate-700 p-5 text-slate-400">Nema aktivnih voucher kodova.</div>';

          document.getElementById('adminBalanceLogs').innerHTML = data.adminBalanceLogs.length
            ? data.adminBalanceLogs.map(function (item) { return balanceLogCard(item); }).join('')
            : '<div class="rounded-3xl border border-dashed border-slate-700 p-5 text-slate-400">Nema balance log zapisa.</div>';

          document.getElementById('adminTransactionLogs').innerHTML = data.transactionLogs.length
            ? data.transactionLogs.map(function (item) { return transactionLogCard(item); }).join('')
            : '<div class="rounded-3xl border border-dashed border-slate-700 p-5 text-slate-400">Nema transaction history zapisa.</div>';
        }
      }

      function populateFromBootstrap() {
        var data = state.bootstrap;
        document.getElementById('leadFeeValue').textContent = money(data.settings.leadFee, data.settings.currency);
        document.getElementById('walletBalanceValue').textContent = money(data.wallet.balance || 0, data.wallet.currency || data.settings.currency);
        document.getElementById('walletBalanceInline').textContent = money(data.wallet.balance || 0, data.wallet.currency || data.settings.currency);
        document.getElementById('userRoleBadge').textContent = data.admin ? 'Admin' : (data.providerProfile ? 'Provajder / Korisnik' : 'Korisnik');
        document.getElementById('adminTabButton').classList.toggle('hidden', !data.admin);
        document.getElementById('phoneVerificationStatus').textContent = data.phoneVerification && data.phoneVerification.verified
          ? ('Telefon verifikovan: ' + (data.phoneVerification.phoneNumberMasked || 'OK'))
          : 'Telefon nije verifikovan. Pre objave zahteva potrebno je završiti Telegram phone verification.';
        document.getElementById('requestPolicyHint').textContent =
          'Maksimalno ' + data.settings.requestDailyLimit + ' aktivnih zahteva u 24h. Svaki zahtev automatski ističe za ' +
          data.settings.requestExpiryHours + 'h ako ga ranije ne zatvorite.';

        renderSelectOptions('requestCategory', data.options.requestCategories);
        renderSelectOptions('requestCity', data.options.cities);
        renderSelectOptions('listingCategory', data.options.listingCategories);
        renderSelectOptions('listingCity', data.options.cities);
        renderSelectOptions('voucherProviderSelect', data.options.voucherProviders || []);
        renderCheckboxGroup('providerCities', 'cities', data.options.cities, data.providerProfile ? data.providerProfile.cities : []);
        renderCheckboxGroup('providerCategories', 'categories', data.options.requestCategories, data.providerProfile ? data.providerProfile.categories : []);
        document.querySelector('#providerForm textarea[name="notes"]').value = data.providerProfile ? (data.providerProfile.notes || '') : '';

        var mtPelerinButton = document.getElementById('mtPelerinButton');
        mtPelerinButton.classList.toggle('hidden', !data.settings.mtPelerinUrl);
        mtPelerinButton.setAttribute('data-url', data.settings.mtPelerinUrl || '');
        var verifyPhoneButton = document.getElementById('verifyPhoneButton');
        verifyPhoneButton.classList.toggle('hidden', Boolean(data.phoneVerification && data.phoneVerification.verified));
        verifyPhoneButton.setAttribute(
          'data-url',
          data.botUsername ? ('https://t.me/' + data.botUsername + '?start=verifyphone') : ''
        );

        if (data.admin) {
          document.querySelector('#settingsForm input[name="leadFee"]').value = data.settings.leadFee;
          renderStats(data.dashboard);
        }

        renderLists();
      }

      function collectChecked(name) {
        return Array.from(document.querySelectorAll('input[name="' + name + '"]:checked')).map(function (input) {
          return input.value;
        });
      }

      function loadBootstrap() {
        return api('/api/bootstrap').then(function (payload) {
          state.bootstrap = payload;
          populateFromBootstrap();
          setActiveTab(state.activeTab);
        }).catch(function (error) {
          notify(error.message, 'error');
        });
      }

      function promptEditRequest(id) {
        var request = state.bootstrap.adminRequests.find(function (entry) { return entry._id === id; });
        if (!request) return;
        var title = window.prompt('Novi naslov zahteva', request.title);
        if (title === null) return;
        var notes = window.prompt('Nova napomena', request.notes || '');
        api('/api/requests/' + id, {
          method: 'PATCH',
          body: JSON.stringify({ title: title, notes: notes })
        }).then(function () {
          notify('Zahtev je izmenjen.');
          return loadBootstrap();
        }).catch(function (error) {
          notify(error.message, 'error');
        });
      }

      function promptEditListing(id) {
        var listing = state.bootstrap.adminListings.find(function (entry) { return entry._id === id; });
        if (!listing) return;
        var title = window.prompt('Novi naslov oglasa', listing.title);
        if (title === null) return;
        var description = window.prompt('Novi opis', listing.description || '');
        api('/api/listings/' + id, {
          method: 'PATCH',
          body: JSON.stringify({ title: title, description: description })
        }).then(function () {
          notify('Oglas je izmenjen.');
          return loadBootstrap();
        }).catch(function (error) {
          notify(error.message, 'error');
        });
      }

      document.querySelectorAll('.tab-button').forEach(function (button) {
        button.addEventListener('click', function () {
          setActiveTab(button.getAttribute('data-tab'));
        });
      });

      document.querySelectorAll('[data-refresh]').forEach(function (button) {
        button.addEventListener('click', function () {
          loadBootstrap();
        });
      });

      document.getElementById('requestForm').addEventListener('submit', function (event) {
        event.preventDefault();
        if (!state.bootstrap.phoneVerification || !state.bootstrap.phoneVerification.verified) {
          notify('Pre objave zahteva morate verifikovati Telegram telefon.', 'error');
          return;
        }
        var form = new FormData(event.target);
        api('/api/requests', {
          method: 'POST',
          body: JSON.stringify({
            title: form.get('title'),
            category: form.get('category'),
            city: form.get('city'),
            notes: form.get('notes')
          })
        }).then(function () {
          event.target.reset();
          notify('Zahtev je poslat i prosleđen odgovarajućim provajderima.');
          return loadBootstrap();
        }).catch(function (error) {
          notify(error.message, 'error');
        });
      });

      document.getElementById('voucherForm').addEventListener('submit', function (event) {
        event.preventDefault();
        var form = new FormData(event.target);
        api('/api/vouchers/redeem', {
          method: 'POST',
          body: JSON.stringify({ code: form.get('code') })
        }).then(function (payload) {
          event.target.reset();
          notify('Voucher uspešno iskorišćen. Novi wallet balance: ' + money(payload.wallet.balance, payload.wallet.currency || 'EUR'));
          return loadBootstrap();
        }).catch(function (error) {
          notify(error.message, 'error');
        });
      });

      document.getElementById('listingForm').addEventListener('submit', function (event) {
        event.preventDefault();
        var form = new FormData(event.target);
        api('/api/listings', {
          method: 'POST',
          body: JSON.stringify({
            title: form.get('title'),
            category: form.get('category'),
            city: form.get('city'),
            price: form.get('price'),
            description: form.get('description')
          })
        }).then(function () {
          event.target.reset();
          notify('Besplatan oglas je uspešno objavljen.');
          return loadBootstrap();
        }).catch(function (error) {
          notify(error.message, 'error');
        });
      });

      document.getElementById('providerForm').addEventListener('submit', function (event) {
        event.preventDefault();
        var notes = document.querySelector('#providerForm textarea[name="notes"]').value;
        api('/api/provider-profile', {
          method: 'POST',
          body: JSON.stringify({
            cities: collectChecked('cities'),
            categories: collectChecked('categories'),
            notes: notes
          })
        }).then(function () {
          notify('Provajder profil je sačuvan.');
          return loadBootstrap();
        }).catch(function (error) {
          notify(error.message, 'error');
        });
      });

      document.getElementById('settingsForm').addEventListener('submit', function (event) {
        event.preventDefault();
        var fee = document.querySelector('#settingsForm input[name="leadFee"]').value;
        api('/api/settings', {
          method: 'PUT',
          body: JSON.stringify({ leadFee: fee })
        }).then(function () {
          notify('Lead fee je ažuriran.');
          return loadBootstrap();
        }).catch(function (error) {
          notify(error.message, 'error');
        });
      });

      document.getElementById('adminVoucherForm').addEventListener('submit', function (event) {
        event.preventDefault();
        var form = new FormData(event.target);
        api('/api/vouchers', {
          method: 'POST',
          body: JSON.stringify({
            provider: form.get('provider'),
            code: form.get('code'),
            amount: form.get('amount')
          })
        }).then(function () {
          event.target.reset();
          notify('Voucher je kreiran.');
          return loadBootstrap();
        }).catch(function (error) {
          notify(error.message, 'error');
        });
      });

      document.body.addEventListener('click', function (event) {
        var target = event.target.closest('button');
        if (!target) return;

        var mtPelerinUrl = target.getAttribute('data-url');
        if (target.id === 'mtPelerinButton' && mtPelerinUrl) {
          if (tg && typeof tg.openLink === 'function') {
            tg.openLink(mtPelerinUrl);
          } else {
            window.open(mtPelerinUrl, '_blank');
          }
          return;
        }

        if (target.id === 'verifyPhoneButton' && mtPelerinUrl) {
          if (tg && typeof tg.openTelegramLink === 'function') {
            tg.openTelegramLink(mtPelerinUrl);
          } else {
            window.open(mtPelerinUrl, '_blank');
          }
          return;
        }

        var checkoutId = target.getAttribute('data-checkout');
        if (checkoutId) {
          api('/api/requests/' + checkoutId + '/checkout', { method: 'POST' })
            .then(function (payload) {
              if (payload.mode === 'invoice' && tg && typeof tg.openInvoice === 'function') {
                tg.openInvoice(payload.invoiceLink, function (status) {
                  if (status === 'paid') {
                    notify('Uplata uspešna, kontakt je otključan.');
                    loadBootstrap();
                  } else {
                    notify('Plaćanje nije završeno: ' + status, 'error');
                  }
                });
                return;
              }
              if (payload.mode === 'wallet') {
                notify('Lead je otključan iz wallet balansa.');
              } else {
                notify('Kontakt je otključan i klijent je obavešten.');
              }
              return loadBootstrap();
            })
            .catch(function (error) {
              notify(error.message, 'error');
            });
          return;
        }

        var requestRefundInternalId = target.getAttribute('data-request-refund-internal');
        if (requestRefundInternalId) {
          api('/api/leads/' + requestRefundInternalId + '/refund-request', {
            method: 'POST',
            body: JSON.stringify({ method: 'internal' })
          }).then(function () {
            notify('Interni refund zahtev je poslat adminu.');
            return loadBootstrap();
          }).catch(function (error) {
            notify(error.message, 'error');
          });
          return;
        }

        var closeRequestId = target.getAttribute('data-close-request');
        if (closeRequestId && window.confirm('Zatvoriti zahtev jer ste našli opciju?')) {
          api('/api/requests/' + closeRequestId + '/close', {
            method: 'POST',
            body: JSON.stringify({ reason: 'found_option' })
          }).then(function () {
            notify('Zahtev je zatvoren i više se ne prikazuje drugim provajderima.');
            return loadBootstrap();
          }).catch(function (error) {
            notify(error.message, 'error');
          });
          return;
        }

        var requestRefundCryptoId = target.getAttribute('data-request-refund-crypto');
        if (requestRefundCryptoId) {
          var evmAddress = window.prompt('Unesite EVM wallet adresu za refund (0x...)');
          if (evmAddress === null) return;
          api('/api/leads/' + requestRefundCryptoId + '/refund-request', {
            method: 'POST',
            body: JSON.stringify({ method: 'crypto', evmAddress: evmAddress })
          }).then(function () {
            notify('Crypto refund zahtev je poslat adminu.');
            return loadBootstrap();
          }).catch(function (error) {
            notify(error.message, 'error');
          });
          return;
        }

        var approveRefundInternalId = target.getAttribute('data-approve-refund-internal');
        if (approveRefundInternalId) {
          api('/api/leads/' + approveRefundInternalId + '/refund-approve', {
            method: 'POST',
            body: JSON.stringify({ method: 'internal' })
          }).then(function () {
            notify('Interni refund je odobren.');
            return loadBootstrap();
          }).catch(function (error) {
            notify(error.message, 'error');
          });
          return;
        }

        var approveRefundCryptoId = target.getAttribute('data-approve-refund-crypto');
        if (approveRefundCryptoId) {
          var walletAddress = window.prompt('Wallet adresa za crypto refund (ostavi prazno za već traženu adresu)');
          api('/api/leads/' + approveRefundCryptoId + '/refund-approve', {
            method: 'POST',
            body: JSON.stringify({ method: 'crypto', walletAddress: walletAddress || '' })
          }).then(function () {
            notify('Crypto refund je odobren.');
            return loadBootstrap();
          }).catch(function (error) {
            notify(error.message, 'error');
          });
          return;
        }

        var editRequestId = target.getAttribute('data-edit-request');
        if (editRequestId) {
          promptEditRequest(editRequestId);
          return;
        }

        var deleteRequestId = target.getAttribute('data-delete-request');
        if (deleteRequestId && window.confirm('Obrisati zahtev?')) {
          api('/api/requests/' + deleteRequestId, { method: 'DELETE' })
            .then(function () {
              notify('Zahtev je obrisan.');
              return loadBootstrap();
            })
            .catch(function (error) {
              notify(error.message, 'error');
            });
          return;
        }

        var editListingId = target.getAttribute('data-edit-listing');
        if (editListingId) {
          promptEditListing(editListingId);
          return;
        }

        var deleteListingId = target.getAttribute('data-delete-listing');
        if (deleteListingId && window.confirm('Obrisati oglas?')) {
          api('/api/listings/' + deleteListingId, { method: 'DELETE' })
            .then(function () {
              notify('Oglas je obrisan.');
              return loadBootstrap();
            })
            .catch(function (error) {
              notify(error.message, 'error');
            });
        }
      });

      loadBootstrap();
    })();
  </script>
</body>
</html>`;

export { renderMiniAppHtml };
