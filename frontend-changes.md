# Wiring index.html / admin.html to the new backend

Set your deployed Render URL once at the top of each file, e.g.
`const API_BASE = 'https://aplustech-backend.onrender.com/api';`

## index.html — contact form

Replace the Supabase block near the bottom of the file:

```js
const SUPABASE_URL = '...';
const SUPABASE_ANON_KEY = '...';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

and the submit handler's body:

```js
const { error } = await supabaseClient.from('leads').insert({ ... });
```

with:

```js
const API_BASE = 'https://YOUR-RENDER-SERVICE.onrender.com/api';

// ...inside the submit handler, replacing the supabaseClient.from('leads').insert(...) call:
let error = null;
try {
  const res = await fetch(`${API_BASE}/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, phone, service, message }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    error = { message: body.error || 'Request failed' };
  }
} catch (err) {
  error = err;
}
```

The rest of the handler (the `if(error){...} else {...}` block) stays exactly
as it is. You can also delete the `<script src="...supabase-js@2">` tag —
it's no longer needed on this page.

## admin.html — login + dashboard

Replace the Supabase client setup and calls with:

```js
const API_BASE = 'https://YOUR-RENDER-SERVICE.onrender.com/api';

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include', // sends/receives the httpOnly session cookie
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  return res;
}
```

**Session check on load** (replaces `supabaseClient.auth.getSession()`):
```js
apiFetch('/admin/me').then(async (res) => {
  if (res.ok) showDash(await res.json());
  else showLogin();
});
```

**Login** (replaces `supabaseClient.auth.signInWithPassword(...)`):
```js
const res = await apiFetch('/admin/login', {
  method: 'POST',
  body: JSON.stringify({ email, password }),
});
const data = await res.json();
if (!res.ok) {
  loginError.textContent = data.error || 'Login failed';
} else {
  showDash(data);
}
```

**Logout** (replaces `supabaseClient.auth.signOut()`):
```js
await apiFetch('/admin/logout', { method: 'POST' });
showLogin();
```

**Loading leads** (replaces the `supabaseClient.from('leads').select(...)` call):
```js
const res = await apiFetch('/admin/leads');
const { leads } = await res.json();
// render `leads` the same way the dashboard already renders Supabase's rows —
// the field names (id, name, email, phone, service_interest, message, status,
// created_at) are unchanged.
```

**Updating a lead's status** (replaces `supabaseClient.from('leads').update(...)`):
```js
await apiFetch(`/admin/leads/${id}`, {
  method: 'PATCH',
  body: JSON.stringify({ status: newStatus }),
});
```

Once this is wired up, remove the `<script src="...supabase-js@2">` tag and
the `SUPABASE_URL` / `SUPABASE_ANON_KEY` constants from `admin.html` too.

## One more thing: CORS

Whatever domain you host `index.html`/`admin.html` on (GitHub Pages, Netlify,
your own domain, etc.) needs to match the `FRONTEND_ORIGIN` env var you set
on the Render web service, or the browser will block the requests.
