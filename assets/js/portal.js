const client=window.nabdSupabase;
const msg=document.getElementById('authMessage');
const authCard=document.getElementById('authCard');
const dashboard=document.getElementById('studentDashboard');
const signupCard=document.getElementById('signupCard');

function showMessage(t,bad=false){
  msg.textContent=t;
  msg.classList.toggle('error',bad);
}

function esc(v=''){
  return String(v).replace(/[&<>'"]/g,c=>({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    "'":'&#39;',
    '"':'&quot;'
  }[c]));
}

async function signedCertLink(c){
  if(!c.file_path||!client)return '';
  const {data}=await client.storage
    .from('certificates')
    .createSignedUrl(c.file_path,60);
  return data?.signedUrl||'';
}

async function loadDashboard(user){
  authCard.classList.add('hidden');
  signupCard.classList.add('hidden');
  dashboard.classList.remove('hidden');

  const {data:profile}=await client
    .from('profiles')
    .select('*')
    .eq('id',user.id)
    .maybeSingle();

  document.getElementById('studentName').textContent=
    profile?.full_name||
    user.user_metadata?.full_name||
    user.email||
    'Student';

  const [
    {data:enrollments,error:ee},
    {data:certs,error:ce}
  ]=await Promise.all([
    client
      .from('enrollments')
      .select('*,courses(*)')
      .eq('student_id',user.id)
      .order('enrolled_at',{ascending:false}),

    client
      .from('certificates')
      .select('*')
      .eq('student_id',user.id)
      .order('issue_date',{ascending:false})
  ]);

  if(ee||ce){
    showMessage((ee||ce).message,true);
  }

  document.getElementById('myCourseCount').textContent=
    enrollments?.length||0;

  document.getElementById('myCertificateCount').textContent=
    certs?.length||0;

  document.getElementById('myHours').textContent=
    (certs||[])
      .filter(c=>c.status==='valid')
      .reduce((a,c)=>a+(c.hours||0),0);

  document.getElementById('myCourses').innerHTML=
    (enrollments||[]).map(e=>`
      <article class="course-card">
        <h3>${esc(e.courses?.title_en||'Course')}</h3>
        <span class="badge">${esc(e.status||'enrolled')}</span>

        <div class="progress">
          <span style="width:${Math.max(
            0,
            Math.min(100,Number(e.progress)||0)
          )}%"></span>
        </div>

        <small>${Number(e.progress||0)}%</small>
      </article>
    `).join('')||'<p>No courses yet.</p>';

  const rows=[];

  for(const c of (certs||[])){
    const link=await signedCertLink(c);

    rows.push(`
      <tr>
        <td>${esc(c.certificate_id)}</td>
        <td>${esc(c.course_title)}</td>
        <td>
          <span class="badge">${esc(c.status)}</span>
        </td>
        <td>
          ${
            link
            ? `<a class="text-link" target="_blank" rel="noopener" href="${link}">
                Open PDF
               </a>`
            : '—'
          }
        </td>
        <td>
          <a class="text-link"
             href="index.html?certificate=${encodeURIComponent(c.certificate_id)}#verify">
             Verify
          </a>
        </td>
      </tr>
    `);
  }

  document.getElementById('myCertificates').innerHTML=
    rows.length
      ? `
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Course</th>
              <th>Status</th>
              <th>Certificate</th>
              <th>Verify</th>
            </tr>
          </thead>
          <tbody>${rows.join('')}</tbody>
        </table>
      `
      : '<p>No certificates yet.</p>';
}

if(!client){
  showMessage(
    'Backend not connected yet. Add the Supabase Project URL and anon/publishable key in assets/js/config.js.',
    true
  );
}

document.getElementById('loginForm').onsubmit=async e=>{
  e.preventDefault();

  if(!client)return;

  showMessage('Signing in…');

  const email=
    document.getElementById('loginEmail').value.trim();

  const password=
    document.getElementById('loginPassword').value;

  const {data,error}=
    await client.auth.signInWithPassword({
      email,
      password
    });

  if(error){
    return showMessage(error.message,true);
  }

  showMessage('');
  loadDashboard(data.user);
};

document.getElementById('signupForm').onsubmit=async e=>{
  e.preventDefault();

  if(!client)return;

  const full_name=
    document.getElementById('signupName').value.trim();

  const email=
    document.getElementById('signupEmail').value.trim();

  const password=
    document.getElementById('signupPassword').value;

  if(password.length<8){
    return showMessage(
      'Use at least 8 characters for the password.',
      true
    );
  }

  const {data,error}=
    await client.auth.signUp({
      email,
      password,
      options:{
        data:{full_name}
      }
    });

  if(error){
    return showMessage(error.message,true);
  }

  if(data.session){
    loadDashboard(data.user);
  }else{
    showMessage(
      'Account created. Check your email for the confirmation link.'
    );
    showLogin();
  }
};

function showSignup(){
  authCard.classList.add('hidden');
  signupCard.classList.remove('hidden');
  dashboard.classList.add('hidden');
}

function showLogin(){
  signupCard.classList.add('hidden');
  authCard.classList.remove('hidden');
  dashboard.classList.add('hidden');
}

document.getElementById('showSignup').onclick=showSignup;
document.getElementById('showLogin').onclick=showLogin;

document.getElementById('resetBtn').onclick=async()=>{
  if(!client)return;

  const email=
    document.getElementById('loginEmail').value.trim();

  if(!email){
    return showMessage('Enter your email first.',true);
  }

  const base=
    window.NABD_CONFIG?.siteBaseUrl||
    location.href.replace(/portal\.html.*$/,'');

  const {error}=
    await client.auth.resetPasswordForEmail(
      email,
      {
        redirectTo:base+'update-password.html'
      }
    );

  showMessage(
    error
      ? error.message
      : 'Password reset email sent.',
    Boolean(error)
  );
};

document.getElementById('logoutBtn').onclick=async()=>{
  if(client){
    await client.auth.signOut();
  }

  location.reload();
};

if(client){
  client.auth.getUser().then(({data})=>{
    if(data?.user){
      loadDashboard(data.user);
    }
  });
}
