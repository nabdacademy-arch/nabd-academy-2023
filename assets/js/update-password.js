const client = window.nabdSupabase;
const form = document.getElementById('updatePasswordForm');
const message = document.getElementById('updatePasswordMessage');

function showMessage(text, bad = false) {
  message.textContent = text;
  message.classList.toggle('error', bad);
}

async function checkSession() {
  if (!client) {
    showMessage('Backend not connected.', true);
    return;
  }

  const { data, error } = await client.auth.getSession();

  if (error) {
    showMessage(error.message, true);
    return;
  }

  if (!data.session) {
    showMessage(
      'Open this page from the password reset link sent to your email.',
      true
    );
  }
}

form.onsubmit = async e => {
  e.preventDefault();

  if (!client) return;

  const password =
    document.getElementById('newPassword').value;

  const confirmPassword =
    document.getElementById('confirmPassword').value;

  if (password.length < 8) {
    showMessage(
      'Password must be at least 8 characters.',
      true
    );
    return;
  }

  if (password !== confirmPassword) {
    showMessage(
      'Passwords do not match.',
      true
    );
    return;
  }

  showMessage('Updating password…');

  const { error } =
    await client.auth.updateUser({
      password
    });

  if (error) {
    showMessage(error.message, true);
    return;
  }

  showMessage('Password updated successfully ✓');

  setTimeout(() => {
    location.href = 'portal.html';
  }, 1200);
};

checkSession();
