const client=window.nabdSupabase;

async function init(){
  let courses=[];

  if(client){
    const {data}=await client
      .from('courses')
      .select('slug,title_en,hours')
      .eq('status','active')
      .order('title_en');

    courses=data||[];
  }

  if(!courses.length){
    courses=await fetch('data/courses.json')
      .then(r=>r.json())
      .then(x=>x.filter(c=>c.status==='active'));
  }

  const select=document.getElementById('courseSelect');

  select.innerHTML=
    '<option value="">Select a course</option>'+
    courses.map(c=>`
      <option value="${c.slug||c.id}">
        ${c.title_en} — ${c.hours} hrs
      </option>
    `).join('');

  const p=new URLSearchParams(location.search).get('course');

  if(p){
    select.value=p;
  }

  document.getElementById('enrollForm').onsubmit=async e=>{
    e.preventDefault();

    const out=document.getElementById('enrollMessage');

    if(!client){
      out.textContent=
        'Backend not connected yet. The form is ready but cannot store submissions.';
      return;
    }

    const fd=new FormData(e.currentTarget);

    const payload={
      full_name:String(fd.get('full_name')).trim(),
      email:String(fd.get('email')).trim(),
      phone:String(fd.get('phone')).trim(),
      course_slug:String(fd.get('course')),
      notes:String(fd.get('notes')||'').trim()||null,
      status:'pending'
    };

    out.textContent='Submitting…';

    const {error}=await client
      .from('course_applications')
      .insert(payload);

    if(error){
      out.textContent=error.message;
      out.classList.add('error');
      return;
    }

    out.classList.remove('error');

    out.textContent=
      'Registration received successfully. Create a Student Portal account with the same email so enrollment can be activated after review.';

    e.currentTarget.reset();
  };
}

init();
