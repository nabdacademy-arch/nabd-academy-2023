const client=window.nabdSupabase;
const panel=document.getElementById('adminPanel');
const gate=document.getElementById('adminGate');
const shell=document.getElementById('adminShell');
const gateMsg=document.getElementById('adminGateMessage');

let profile=null;

function esc(v=''){
  return String(v??'').replace(/[&<>'"]/g,c=>({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    "'":'&#39;',
    '"':'&quot;'
  }[c]));
}

function notice(t,bad=false){
  const el=document.getElementById('adminNotice');
  if(!el)return;
  el.textContent=t;
  el.classList.toggle('error',bad);
}

async function requireAdmin(){
  if(!client){
    gateMsg.textContent='Backend not connected.';
    return false;
  }

  const {data:{user}}=await client.auth.getUser();

  if(!user)return false;

  const {data,error}=await client
    .from('profiles')
    .select('*')
    .eq('id',user.id)
    .maybeSingle();

  if(error||!data||data.role!=='admin'){
    gateMsg.textContent='This account does not have admin permission.';
    return false;
  }

  profile=data;
  gate.classList.add('hidden');
  shell.classList.remove('hidden');

  return true;
}

async function counts(){
  const tables=[
    'profiles',
    'courses',
    'certificates',
    'course_applications'
  ];

  const vals={};

  for(const t of tables){
    const {count}=await client
      .from(t)
      .select('*',{count:'exact',head:true});

    vals[t]=count||0;
  }

  return vals;
}

async function overview(){
  const c=await counts();

  panel.innerHTML=`
    <div class="metric-grid dash-metrics">
      <div>
        <strong>${c.profiles}</strong>
        <span>Users</span>
      </div>

      <div>
        <strong>${c.courses}</strong>
        <span>Courses</span>
      </div>

      <div>
        <strong>${c.certificates}</strong>
        <span>Certificates</span>
      </div>

      <div>
        <strong>${c.course_applications}</strong>
        <span>Applications</span>
      </div>
    </div>
  `;
}

async function students(){
  const {data,error}=await client
    .from('profiles')
    .select('*')
    .order('created_at',{ascending:false});

  if(error)return notice(error.message,true);

  panel.innerHTML=`
    <div class="admin-section-head">
      <h2>Students & Users</h2>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Created</th>
          </tr>
        </thead>

        <tbody>
          ${(data||[]).map(x=>`
            <tr>
              <td>${esc(x.full_name||'—')}</td>
              <td>${esc(x.email||'—')}</td>
              <td>${esc(x.role)}</td>
              <td>
                ${new Date(x.created_at).toLocaleDateString()}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

async function applications(){
  const {data,error}=await client
    .from('course_applications')
    .select('*')
    .order('created_at',{ascending:false});

  if(error)return notice(error.message,true);

  panel.innerHTML=`
    <div class="admin-section-head">
      <h2>Course Applications</h2>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Course</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          ${(data||[]).map(x=>`
            <tr>
              <td>${esc(x.full_name)}</td>
              <td>${esc(x.email)}</td>
              <td>${esc(x.course_slug)}</td>
              <td>${esc(x.status)}</td>
              <td>
                ${
                  x.status==='pending'
                  ? `<button
                       class="btn btn-small approve-app"
                       data-id="${x.id}">
                       Approve
                     </button>`
                  : '—'
                }
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  document.querySelectorAll('.approve-app').forEach(b=>{
    b.onclick=async()=>{
      notice('Approving…');

      const {error}=await client.rpc(
        'approve_application',
        {p_application_id:b.dataset.id}
      );

      if(error){
        return notice(error.message,true);
      }

      notice('Approved ✓');
      applications();
    };
  });
}

async function courses(){
  const {data,error}=await client
    .from('courses')
    .select('*')
    .order('created_at');

  if(error)return notice(error.message,true);

  panel.innerHTML=`
    <div class="admin-section-head">
      <h2>Courses</h2>

      <button id="newCourseBtn" class="btn">
        + New course
      </button>
    </div>

    <div id="courseEditor"></div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Code</th>
            <th>Course</th>
            <th>Hours</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          ${(data||[]).map(x=>`
            <tr>
              <td>${esc(x.code)}</td>
              <td>${esc(x.title_en)}</td>
              <td>${x.hours}</td>
              <td>${esc(x.status)}</td>
              <td>
                <button
                  class="text-btn edit-course"
                  data-id="${x.id}">
                  Edit
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  const edit=id=>{
    const x=(data||[]).find(y=>y.id===id)||{};

    document.getElementById('courseEditor').innerHTML=
      courseForm(x);
  };

  document.getElementById('newCourseBtn').onclick=()=>{
    edit(null);
  };

  document.querySelectorAll('.edit-course').forEach(b=>{
    b.onclick=()=>edit(b.dataset.id);
  });
}

function courseForm(x={}){
  setTimeout(()=>{
    const f=document.getElementById('courseForm');

    if(f){
      f.onsubmit=saveCourse;
    }
  },0);

  return `
    <form id="courseForm" class="editor-card stack-form">

      <input
        type="hidden"
        name="id"
        value="${esc(x.id||'')}">

      <div class="form-grid">

        <label>
          Slug
          <input
            name="slug"
            required
            value="${esc(x.slug||'')}">
        </label>

        <label>
          Code
          <input
            name="code"
            required
            value="${esc(x.code||'')}">
        </label>

        <label>
          Title EN
          <input
            name="title_en"
            required
            value="${esc(x.title_en||'')}">
        </label>

        <label>
          Title AR
          <input
            name="title_ar"
            required
            value="${esc(x.title_ar||'')}">
        </label>

        <label>
          Hours
          <input
            name="hours"
            type="number"
            min="0"
            required
            value="${esc(x.hours??30)}">
        </label>

        <label>
          Status
          <select name="status">
            <option ${x.status==='draft'?'selected':''}>
              draft
            </option>

            <option ${x.status==='active'?'selected':''}>
              active
            </option>

            <option ${x.status==='archived'?'selected':''}>
              archived
            </option>
          </select>
        </label>

      </div>

      <label>
        Description EN
        <textarea name="description_en">${esc(
          x.description_en||''
        )}</textarea>
      </label>

      <label>
        Description AR
        <textarea name="description_ar">${esc(
          x.description_ar||''
        )}</textarea>
      </label>

      <button class="btn" type="submit">
        Save course
      </button>

    </form>
  `;
}

async function saveCourse(e){
  e.preventDefault();

  const fd=new FormData(e.currentTarget);
  const id=fd.get('id');

  const p={
    slug:fd.get('slug').trim(),
    code:fd.get('code').trim().toUpperCase(),
    title_en:fd.get('title_en').trim(),
    title_ar:fd.get('title_ar').trim(),
    hours:Number(fd.get('hours')),
    status:fd.get('status'),
    description_en:fd.get('description_en').trim(),
    description_ar:fd.get('description_ar').trim()
  };

  let q=id
    ? client.from('courses').update(p).eq('id',id)
    : client.from('courses').insert(p);

  const {error}=await q;

  if(error){
    return notice(error.message,true);
  }

  notice('Course saved ✓');
  courses();
}

async function certificates(){
  const [
    {data:certs,error:ce},
    {data:users,error:ue},
    {data:crs,error:cse}
  ]=await Promise.all([

    client
      .from('certificates')
      .select('*')
      .order('created_at',{ascending:false}),

    client
      .from('profiles')
      .select('id,full_name,email')
      .eq('role','student'),

    client
      .from('courses')
      .select('id,title_en,code')
      .neq('status','archived')

  ]);

  if(ce||ue||cse){
    return notice((ce||ue||cse).message,true);
  }

  panel.innerHTML=`
    <div class="admin-section-head">
      <h2>Certificates</h2>
    </div>

    <form
      id="issueForm"
      class="editor-card stack-form">

      <div class="form-grid">

        <label>
          Student

          <select name="student" required>
            <option value="">Select</option>

            ${(users||[]).map(x=>`
              <option value="${x.id}">
                ${esc(x.full_name||x.email)}
              </option>
            `).join('')}

          </select>
        </label>

        <label>
          Course

          <select name="course" required>
            <option value="">Select</option>

            ${(crs||[]).map(x=>`
              <option value="${x.id}">
                ${esc(x.title_en)} (${esc(x.code)})
              </option>
            `).join('')}

          </select>
        </label>

      </div>

      <label>
        Certificate PDF (optional)

        <input
          name="pdf"
          type="file"
          accept="application/pdf">
      </label>

      <button class="btn" type="submit">
        Issue certificate
      </button>

    </form>

    <div class="table-wrap">

      <table>

        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Course</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>

          ${(certs||[]).map(x=>`
            <tr>

              <td>${esc(x.certificate_id)}</td>

              <td>${esc(x.public_name)}</td>

              <td>${esc(x.course_title)}</td>

              <td>${esc(x.status)}</td>

              <td>
                <button
                  class="text-btn toggle-cert"
                  data-id="${x.id}"
                  data-status="${x.status}">

                  ${
                    x.status==='valid'
                    ? 'Revoke'
                    : 'Restore'
                  }

                </button>
              </td>

            </tr>
          `).join('')}

        </tbody>

      </table>

    </div>
  `;

  document.getElementById('issueForm').onsubmit=
    issueCertificate;

  document.querySelectorAll('.toggle-cert').forEach(b=>{
    b.onclick=async()=>{

      const next=
        b.dataset.status==='valid'
        ? 'revoked'
        : 'valid';

      const {error}=await client
        .from('certificates')
        .update({status:next})
        .eq('id',b.dataset.id);

      if(error){
        return notice(error.message,true);
      }

      notice('Certificate updated ✓');
      certificates();
    };
  });
}

async function issueCertificate(e){
  e.preventDefault();

  notice('Issuing…');

  const fd=new FormData(e.currentTarget);

  const student=fd.get('student');
  const course=fd.get('course');
  const file=fd.get('pdf');

  const {data,error}=await client.rpc(
    'issue_certificate',
    {
      p_student_id:student,
      p_course_id:course
    }
  );

  if(error){
    return notice(error.message,true);
  }

  const row=Array.isArray(data)
    ? data[0]
    : data;

  if(file&&file.size&&row?.record_id){

    const path=
      `${student}/${row.new_certificate_id}.pdf`;

    const {error:upErr}=await client
      .storage
      .from('certificates')
      .upload(
        path,
        file,
        {
          upsert:true,
          contentType:'application/pdf'
        }
      );

    if(upErr){
      return notice(
        `Certificate issued, but PDF upload failed: ${upErr.message}`,
        true
      );
    }

    await client
      .from('certificates')
      .update({file_path:path})
      .eq('id',row.record_id);
  }

  notice(
    `Issued ${row?.new_certificate_id||''} ✓`
  );

  certificates();
}

async function research(){
  const {data,error}=await client
    .from('research_projects')
    .select('*')
    .order('project_no');

  if(error){
    return notice(error.message,true);
  }

  panel.innerHTML=`
    <div class="admin-section-head">
      <h2>Research Projects</h2>
    </div>

    <div class="table-wrap">

      <table>

        <thead>
          <tr>
            <th>No.</th>
            <th>Title</th>
            <th>Status</th>
            <th>Published</th>
          </tr>
        </thead>

        <tbody>

          ${(data||[]).map(x=>`
            <tr>
              <td>${esc(x.project_no)}</td>
              <td>${esc(x.title_en)}</td>
              <td>${esc(x.status)}</td>
              <td>${x.published?'Yes':'No'}</td>
            </tr>
          `).join('')}

        </tbody>

      </table>

    </div>
  `;
}

async function achievements(){
  const {data,error}=await client
    .from('achievements')
    .select('*')
    .order('award_date',{ascending:false});

  if(error){
    return notice(error.message,true);
  }

  panel.innerHTML=`
    <div class="admin-section-head">
      <h2>Achievements</h2>
    </div>

    <form
      id="achievementForm"
      class="editor-card stack-form">

      <div class="form-grid">

        <label>
          Title
          <input name="title_en" required>
        </label>

        <label>
          Issuer
          <input name="issuer">
        </label>

        <label>
          Date
          <input
            name="award_date"
            type="date">
        </label>

        <label>
          Evidence URL
          <input
            name="evidence_url"
            type="url"
            required>
        </label>

      </div>

      <label>
        <input
          name="published"
          type="checkbox">

        Publish immediately
      </label>

      <button class="btn" type="submit">
        Add documented achievement
      </button>

    </form>

    <div class="table-wrap">

      <table>

        <thead>
          <tr>
            <th>Title</th>
            <th>Issuer</th>
            <th>Published</th>
          </tr>
        </thead>

        <tbody>

          ${(data||[]).map(x=>`
            <tr>
              <td>${esc(x.title_en)}</td>
              <td>${esc(x.issuer||'—')}</td>
              <td>${x.published?'Yes':'No'}</td>
            </tr>
          `).join('')}

        </tbody>

      </table>

    </div>
  `;

  document.getElementById('achievementForm').onsubmit=
    async e=>{

      e.preventDefault();

      const fd=new FormData(e.currentTarget);

      const p={
        title_en:fd.get('title_en').trim(),
        issuer:fd.get('issuer').trim()||null,
        award_date:fd.get('award_date')||null,
        evidence_url:fd.get('evidence_url').trim(),
        published:fd.get('published')==='on'
      };

      const {error}=await client
        .from('achievements')
        .insert(p);

      if(error){
        return notice(error.message,true);
      }

      notice('Achievement added ✓');
      achievements();
    };
}

const handlers={
  overview,
  students,
  applications,
  courses,
  certificates,
  research,
  achievements
};

async function render(k){
  document
    .querySelectorAll('.admin-tab')
    .forEach(b=>{
      b.classList.toggle(
        'active',
        b.dataset.tab===k
      );
    });

  panel.innerHTML=
    '<div class="loading">Loading…</div>';

  await (handlers[k]||overview)();
}

document
  .getElementById('adminLoginForm')
  .onsubmit=async e=>{

    e.preventDefault();

    if(!client)return;

    gateMsg.textContent='Signing in…';

    const {error}=await client.auth
      .signInWithPassword({

        email:
          document
            .getElementById('adminEmail')
            .value
            .trim(),

        password:
          document
            .getElementById('adminPassword')
            .value
      });

    if(error){
      gateMsg.textContent=error.message;
      return;
    }

    if(await requireAdmin()){
      render('overview');
    }
  };

document
  .getElementById('adminLogout')
  .onclick=async()=>{

    await client.auth.signOut();
    location.reload();
  };

document
  .querySelectorAll('.admin-tab')
  .forEach(b=>{

    b.onclick=()=>{
      render(b.dataset.tab);
    };

  });

requireAdmin().then(ok=>{
  if(ok){
    render('overview');
  }
});
