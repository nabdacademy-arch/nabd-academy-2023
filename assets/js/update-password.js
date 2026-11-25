const client = window.nabdSupabase;
const form = document.getElementById('updatePasswordForm');
const message = document.getElementById('updatePasswordMessage');
const button = form.querySelector('[type="submit"]');

let preferredLanguage;
try {
  preferredLanguage = window.localStorage.getItem('nabd_lang');
} catch {
  // Private browsing can block access to preferences.
}
const arabic = (['ar', 'en'].includes(preferredLanguage)
  ? preferredLanguage : window.navigator?.language || 'en').split('-')[0].toLowerCase() === 'ar';
document.documentElement.lang = arabic ? 'ar' : 'en';
document.documentElement.dir = arabic ? 'rtl' : 'ltr';
if (arabic) {
  for (const element of document.querySelectorAll('[data-ar]')) {
    element.textContent = element.dataset.ar;
  }
}

function showMessage(text, bad = false) {
  message.textContent = text;
  message.classList.toggle('error', bad);
}

form.onsubmit = async event => {
  event.preventDefault();
  if (button.disabled) return;

  const password = document.getElementById('newPassword').value;
  if (password.length < 8) {
    showMessage(arabic ? 'يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.' : 'Password must be at least 8 characters.', true);
    return;
  }
  if (password !== document.getElementById('confirmPassword').value) {
    showMessage(arabic ? 'كلمتا المرور غير متطابقتين.' : 'Passwords do not match.', true);
    return;
  }

  button.disabled = true;
  let updated = false;
  try {
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    if (!data?.session) {
      showMessage(arabic ? 'افتح رابط تعيين كلمة المرور المرسل إلى بريدك الإلكتروني.' : 'Open the password reset link sent to your email.', true);
      return;
    }

    showMessage(arabic ? 'جارٍ تحديث كلمة المرور…' : 'Updating password…');
    const result = await client.auth.updateUser({ password });
    if (result.error) throw result.error;

    updated = true;
    form.reset();
    showMessage(arabic ? 'تم تحديث كلمة المرور بنجاح ✓' : 'Password updated successfully ✓');
    setTimeout(() => { location.href = 'portal.html'; }, 1200);
  } catch (error) {
    showMessage(arabic ? 'تعذّر تحديث كلمة المرور. حاول مجددًا.' : error?.message || 'Could not update the password. Please try again.', true);
  } finally {
    button.disabled = updated;
  }
};

if (!client) {
  button.disabled = true;
  showMessage(arabic ? 'تعذّر الاتصال بالخدمة. أعد تحميل الصفحة عند عودة الاتصال.' : 'Backend not connected. Reload the page when your connection returns.', true);
}
