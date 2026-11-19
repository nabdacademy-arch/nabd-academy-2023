const client = window.nabdSupabase;
const form = document.getElementById('enrollForm');
const button = form.querySelector('[type="submit"]');
const message = document.getElementById('enrollMessage');
const select = document.getElementById('courseSelect');

function report(text, error = false) {
  message.textContent = text;
  message.classList.toggle('error', error);
}

form.onsubmit = async event => {
  event.preventDefault();
  if (button.disabled || !client) return;

  const fields = new FormData(form);
  const payload = {
    full_name: String(fields.get('full_name')).trim(),
    email: String(fields.get('email')).trim(),
    phone: String(fields.get('phone')).trim(),
    course_slug: String(fields.get('course')),
    notes: String(fields.get('notes') || '').trim() || null,
    status: 'pending'
  };

  button.disabled = true;
  report('Submitting…');
  try {
    const {error} = await client.from('course_applications').insert(payload);
    if (error) {
      report(error.message || 'The registration could not be confirmed.', true);
      return;
    }
    form.reset();
    report('Registration received successfully. Create a Student Portal account with the same email so enrollment can be activated after review.');
  } catch {
    report('Could not confirm registration. Your entries are still here. Check with the academy before submitting again.', true);
  } finally {
    button.disabled = false;
  }
};

async function loadCourses() {
  if (client) {
    try {
      const {data, error} = await client.from('courses')
        .select('slug,title_en,hours').eq('status','active').order('title_en');
      if (!error && data?.length) return data;
    } catch {
      // A failed catalog request can still use the bundled course list.
    }
  }
  const response = await fetch('data/courses.json');
  if (!response.ok) throw new Error('Course catalog unavailable');
  return (await response.json()).filter(course => course.status === 'active');
}

async function init() {
  try {
    const courses = await loadCourses();
    select.add(new Option('Select a course', ''));
    for (const course of courses) {
      select.add(new Option(course.title_en + ' — ' + course.hours + ' hrs', course.slug || course.id));
    }
    const requested = new URLSearchParams(location.search).get('course');
    if (requested) select.value = requested;

    if (!client) {
      report('Registration is unavailable. Reload the page when your connection returns.', true);
    } else if (!courses.length) {
      report('No courses are available for registration.', true);
    } else {
      button.disabled = false;
    }
  } catch {
    report('Could not load the course list. Check your connection and reload this page.', true);
  }
}

init();
