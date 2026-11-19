const client = window.nabdSupabase;
const form = document.getElementById('updatePasswordForm');
const message = document.getElementById('updatePasswordMessage');
const button = form.querySelector('[type="submit"]');

function showMessage(text, bad = false) {
  message.textContent = text;
  message.classList.toggle('error', bad);
}

form.onsubmit = async event => {
  event.preventDefault();
  if (button.disabled) return;

  const password = document.getElementById('newPassword').value;
  if (password.length < 8) {
    showMessage('Password must be at least 8 characters.', true);
    return;
  }
  if (password !== document.getElementById('confirmPassword').value) {
    showMessage('Passwords do not match.', true);
    return;
  }

  button.disabled = true;
  let updated = false;
  try {
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    if (!data?.session) {
      showMessage('Open the password reset link sent to your email.', true);
      return;
    }

    showMessage('Updating password…');
    const result = await client.auth.updateUser({ password });
    if (result.error) throw result.error;

    updated = true;
    form.reset();
    showMessage('Password updated successfully ✓');
    setTimeout(() => { location.href = 'portal.html'; }, 1200);
  } catch (error) {
    showMessage(error?.message || 'Could not update the password. Please try again.', true);
  } finally {
    button.disabled = updated;
  }
};

if (!client) {
  button.disabled = true;
  showMessage('Backend not connected. Reload the page when your connection returns.', true);
}
