// Deliberately plain vanilla JS - no build step, no framework runtime to
// containerize or bundle. Requests use relative paths (/api/..., /health)
// because in every real deployment (docker-compose, Kubernetes) Nginx sits in
// front of this static site AND reverse-proxies /api and /health to the
// backend service, so the browser never needs to know the backend's address.

const userForm = document.getElementById('user-form');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const formError = document.getElementById('form-error');
const userList = document.getElementById('user-list');
const apiStatus = document.getElementById('api-status');

function renderUsers(users) {
  userList.innerHTML = '';
  if (users.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'No users yet - add one above.';
    userList.appendChild(li);
    return;
  }
  users.forEach((user) => {
    const li = document.createElement('li');
    li.innerHTML = `${escapeHtml(user.name)} <span class="email">${escapeHtml(user.email)}</span>`;
    userList.appendChild(li);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

async function loadUsers() {
  try {
    const res = await fetch('/api/users');
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    const data = await res.json();
    renderUsers(data.users);
  } catch (err) {
    userList.innerHTML = '';
    const li = document.createElement('li');
    li.textContent = 'Could not load users - is the API running?';
    userList.appendChild(li);
  }
}

async function checkHealth() {
  try {
    const res = await fetch('/health');
    const data = await res.json();
    apiStatus.textContent =
      data.status === 'healthy'
        ? `API healthy - database ${data.dependencies.mongodb}`
        : 'API unhealthy';
  } catch (err) {
    apiStatus.textContent = 'API unreachable';
  }
}

userForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  formError.hidden = true;

  const payload = { name: nameInput.value.trim(), email: emailInput.value.trim() };

  try {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      formError.textContent = data.error || 'Failed to create user';
      formError.hidden = false;
      return;
    }

    userForm.reset();
    await loadUsers();
  } catch (err) {
    formError.textContent = 'Network error - could not reach API';
    formError.hidden = false;
  }
});

checkHealth();
loadUsers();
