"use strict";

/* =========================================================
   NABD ACADEMY STUDENT PORTAL
   Authentication + Dashboard + Courses + Certificates
   ========================================================= */

const $ = selector => document.querySelector(selector);

const state = {
  user: null,
  profile: null,
  enrollments: [],
  courses: [],
  certificates: []
};


/* =========================================================
   HELPERS
   ========================================================= */

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[character]));
}


function setStatus(element, message = "", type = "") {
  if (!element) return;

  element.textContent = message;
  element.classList.remove("error", "success");

  if (type) {
    element.classList.add(type);
  }
}


function setButtonLoading(button, loading, loadingText, normalText) {
  if (!button) return;

  button.disabled = loading;
  button.textContent = loading ? loadingText : normalText;
}


function showLoader(show = true) {
  const loader = $("#portalLoader");

  if (!loader) return;

  loader.classList.toggle("active", show);
}


function showAuth() {
  showLoader(false);

  const authSection = $("#authSection");
  const dashboard = $("#dashboardSection");

  if (authSection) {
    authSection.hidden = false;
  }

  if (dashboard) {
    dashboard.classList.remove("active");
  }
}


function showDashboard() {
  showLoader(false);

  const authSection = $("#authSection");
  const dashboard = $("#dashboardSection");

  if (authSection) {
    authSection.hidden = true;
  }

  if (dashboard) {
    dashboard.classList.add("active");
  }
}


function normalizeProgress(value) {
  let progress = Number(value);

  if (!Number.isFinite(progress)) {
    progress = 0;
  }

  if (progress > 0 && progress <= 1) {
    progress *= 100;
  }

  progress = Math.round(progress);

  if (progress < 0) progress = 0;
  if (progress > 100) progress = 100;

  return progress;
}


function enrollmentProgress(enrollment) {
  return normalizeProgress(
    enrollment.progress_percent ??
    enrollment.progress ??
    enrollment.completion_percent ??
    enrollment.percentage ??
    0
  );
}


function enrollmentStatus(enrollment) {
  return String(
    enrollment.status ||
    enrollment.enrollment_status ||
    "active"
  ).trim();
}


function getProfileName(profile, user) {
  return (
    profile?.full_name ||
    profile?.name ||
    profile?.display_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Student"
  );
}


/* =========================================================
   TABS
   ========================================================= */

function openSignIn() {
  $("#signInView")?.classList.add("active");
  $("#signUpView")?.classList.remove("active");

  $("#signInTab")?.classList.add("active");
  $("#signUpTab")?.classList.remove("active");

  $("#signInTab")?.setAttribute("aria-selected", "true");
  $("#signUpTab")?.setAttribute("aria-selected", "false");

  if ($("#authHeading")) {
    $("#authHeading").textContent = "Welcome back";
  }

  if ($("#authIntro")) {
    $("#authIntro").textContent =
      "Sign in to access your courses and certificates.";
  }

  setStatus($("#signInStatus"), "");
  setStatus($("#signUpStatus"), "");
}


function openSignUp() {
  $("#signUpView")?.classList.add("active");
  $("#signInView")?.classList.remove("active");

  $("#signUpTab")?.classList.add("active");
  $("#signInTab")?.classList.remove("active");

  $("#signUpTab")?.setAttribute("aria-selected", "true");
  $("#signInTab")?.setAttribute("aria-selected", "false");

  if ($("#authHeading")) {
    $("#authHeading").textContent = "Create account";
  }

  if ($("#authIntro")) {
    $("#authIntro").textContent =
      "Use the same email you used in course registration.";
  }

  setStatus($("#signInStatus"), "");
  setStatus($("#signUpStatus"), "");
}


/* =========================================================
   PROFILE
   ========================================================= */

async function loadProfile(user) {
  if (!window.nabdSupabase || !user) return null;

  /*
    Try the most common profile key first.
    If the project uses user_id instead of id,
    the second query handles it.
  */

  try {
    const result = await window.nabdSupabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (!result.error && result.data) {
      return result.data;
    }
  } catch (error) {
    console.warn("Profile lookup by id failed:", error);
  }


  try {
    const result = await window.nabdSupabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!result.error && result.data) {
      return result.data;
    }
  } catch (error) {
    console.warn("Profile lookup by user_id failed:", error);
  }


  return null;
}


/* =========================================================
   COURSES
   ========================================================= */

async function loadAllCourses() {
  if (!window.nabdSupabase) return [];

  try {
    const { data, error } = await window.nabdSupabase
      .from("courses")
      .select("*");

    if (error) {
      console.warn("Courses query:", error);
      return [];
    }

    return Array.isArray(data) ? data : [];

  } catch (error) {
    console.error("Courses load error:", error);
    return [];
  }
}


/* =========================================================
   ENROLLMENTS
   ========================================================= */

async function loadEnrollments(user) {
  if (!window.nabdSupabase || !user) return [];

  /*
    Primary schema:
    enrollments.student_id = auth.users.id
  */

  try {
    const { data, error } = await window.nabdSupabase
      .from("enrollments")
      .select("*")
      .eq("student_id", user.id);

    if (!error) {
      return Array.isArray(data) ? data : [];
    }

    console.warn("Enrollment student_id query:", error);

  } catch (error) {
    console.warn(error);
  }


  /*
    Fallback in case the project uses user_id.
  */

  try {
    const { data, error } = await window.nabdSupabase
      .from("enrollments")
      .select("*")
      .eq("user_id", user.id);

    if (!error) {
      return Array.isArray(data) ? data : [];
    }

  } catch (error) {
    console.warn(error);
  }


  return [];
}


/* =========================================================
   CERTIFICATES
   ========================================================= */

async function loadCertificates(user) {
  if (!window.nabdSupabase || !user) return [];

  try {
    const { data, error } = await window.nabdSupabase
      .from("certificates")
      .select("*")
      .eq("student_id", user.id)
      .order("issue_date", { ascending: false });

    if (!error) {
      return Array.isArray(data) ? data : [];
    }

    console.warn("Certificates student_id query:", error);

  } catch (error) {
    console.warn(error);
  }


  try {
    const { data, error } = await window.nabdSupabase
      .from("certificates")
      .select("*")
      .eq("user_id", user.id)
      .order("issue_date", { ascending: false });

    if (!error) {
      return Array.isArray(data) ? data : [];
    }

  } catch (error) {
    console.warn(error);
  }


  return [];
}


/* =========================================================
   COURSE MATCHING
   ========================================================= */

function findCourseForEnrollment(enrollment) {
  if (!enrollment) return null;

  const courseId =
    enrollment.course_id ??
    enrollment.course_uuid ??
    null;

  const courseSlug =
    enrollment.course_slug ??
    enrollment.slug ??
    null;


  if (courseId) {
    const matched = state.courses.find(course =>
      String(course.id) === String(courseId)
    );

    if (matched) return matched;
  }


  if (courseSlug) {
    const matched = state.courses.find(course =>
      String(course.slug || "").toLowerCase() ===
      String(courseSlug).toLowerCase()
    );

    if (matched) return matched;
  }


  return null;
}


function courseTitle(course, enrollment) {
  return (
    course?.title_en ||
    course?.title ||
    enrollment?.course_title ||
    enrollment?.title ||
    "NABD Academy Course"
  );
}


/* =========================================================
   DASHBOARD RENDERING
   ========================================================= */

function renderStudentHeader() {
  const user = state.user;
  const profile = state.profile;

  const name = getProfileName(profile, user);

  if ($("#studentName")) {
    $("#studentName").textContent = name;
  }

  if ($("#studentEmail")) {
    $("#studentEmail").textContent = user?.email || "";
  }
}


function renderMetrics() {
  const enrollments = state.enrollments;
  const certificates = state.certificates;

  const completed = enrollments.filter(enrollment => {
    const status = enrollmentStatus(enrollment).toLowerCase();
    const progress = enrollmentProgress(enrollment);

    return (
      status === "completed" ||
      status === "complete" ||
      progress >= 100
    );
  }).length;


  let averageProgress = 0;

  if (enrollments.length) {
    const total = enrollments.reduce(
      (sum, enrollment) =>
        sum + enrollmentProgress(enrollment),
      0
    );

    averageProgress = Math.round(
      total / enrollments.length
    );
  }


  if ($("#metricCourses")) {
    $("#metricCourses").textContent =
      enrollments.length;
  }

  if ($("#metricCompleted")) {
    $("#metricCompleted").textContent =
      completed;
  }

  if ($("#metricCertificates")) {
    $("#metricCertificates").textContent =
      certificates.length;
  }

  if ($("#metricProgress")) {
    $("#metricProgress").textContent =
      `${averageProgress}%`;
  }

  if ($("#courseSummary")) {
    $("#courseSummary").textContent =
      enrollments.length
        ? `${enrollments.length} enrolled course${enrollments.length === 1 ? "" : "s"}`
        : "No enrolled courses yet";
  }
}


function renderCourses() {
  const container = $("#studentCourses");

  if (!container) return;

  if (!state.enrollments.length) {
    container.innerHTML = `
      <div class="empty-state">
        <strong>No courses found yet.</strong>
        <br>
        When your course enrollment is approved,
        it will appear here automatically.
      </div>
    `;

    return;
  }


  container.innerHTML = state.enrollments.map(enrollment => {
    const course = findCourseForEnrollment(enrollment);

    const title = courseTitle(
      course,
      enrollment
    );

    const status = enrollmentStatus(enrollment);

    const progress = enrollmentProgress(enrollment);

    const courseSlug =
      course?.slug ||
      enrollment.course_slug ||
      course?.id ||
      enrollment.course_id ||
      "";


    return `
      <article class="student-course-card">

        <h3>
          ${escapeHTML(title)}
        </h3>

        <p>
          ${
            escapeHTML(
              course?.description_en ||
              course?.description ||
              enrollment.description ||
              "NABD Academy medical learning course."
            )
          }
        </p>

        <div class="portal-progress">
          <span style="width:${progress}%"></span>
        </div>

        <div class="course-row">

          <span class="course-status">
            ${escapeHTML(status)}
          </span>

          <strong>
            ${progress}%
          </strong>

        </div>

        ${
          courseSlug
            ? `
              <a
                class="certificate-link"
                href="course.html?id=${encodeURIComponent(courseSlug)}"
              >
                Open course →
              </a>
            `
            : ""
        }

      </article>
    `;
  }).join("");
}


function certificateIdentifier(certificate) {
  return (
    certificate.certificate_id ||
    certificate.code ||
    certificate.id ||
    ""
  );
}


function renderCertificates() {
  const container = $("#studentCertificates");

  if (!container) return;


  if (!state.certificates.length) {
    container.innerHTML = `
      <div class="empty-state">
        <strong>No certificates linked to this account yet.</strong>
        <br>
        Eligible certificates will appear here after they are
        linked to your student account.
      </div>
    `;

    return;
  }


  container.innerHTML = state.certificates.map(certificate => {
    const id = certificateIdentifier(certificate);

    const course =
      certificate.course_title ||
      certificate.course_name ||
      "NABD Academy Certificate";

    const issueDate =
      certificate.issue_date ||
      certificate.created_at ||
      "";

    const status =
      certificate.status ||
      "valid";


    return `
      <article class="student-certificate-card">

        <span class="course-status">
          ${escapeHTML(status)}
        </span>

        <h3>
          ${escapeHTML(course)}
        </h3>

        <p>
          Certificate ID:
          <strong>
            ${escapeHTML(id)}
          </strong>
        </p>

        ${
          issueDate
            ? `
              <p>
                Issue date:
                ${escapeHTML(
                  String(issueDate).slice(0, 10)
                )}
              </p>
            `
            : ""
        }

        ${
          id
            ? `
              <a
                class="certificate-link"
                href="index.html?certificate=${encodeURIComponent(id)}#verify"
              >
                Verify certificate →
              </a>
            `
            : ""
        }

      </article>
    `;
  }).join("");
}


/* =========================================================
   LOAD DASHBOARD
   ========================================================= */

async function loadDashboard(user) {
  state.user = user;

  showLoader(true);

  try {
    const [
      profile,
      courses,
      enrollments,
      certificates
    ] = await Promise.all([
      loadProfile(user),
      loadAllCourses(),
      loadEnrollments(user),
      loadCertificates(user)
    ]);


    state.profile = profile;
    state.courses = courses;
    state.enrollments = enrollments;
    state.certificates = certificates;


    renderStudentHeader();
    renderMetrics();
    renderCourses();
    renderCertificates();

    showDashboard();

  } catch (error) {
    console.error("Dashboard load error:", error);

    showDashboard();

    const coursesContainer = $("#studentCourses");

    if (coursesContainer) {
      coursesContainer.innerHTML = `
        <div class="empty-state">
          We could not load your dashboard data.
          Please refresh the page.
        </div>
      `;
    }
  }
}


/* =========================================================
   SIGN UP
   ========================================================= */

async function handleSignUp(event) {
  event.preventDefault();

  const name =
    $("#signUpName")?.value.trim() || "";

  const email =
    $("#signUpEmail")?.value.trim().toLowerCase() || "";

  const password =
    $("#signUpPassword")?.value || "";

  const confirmation =
    $("#signUpPasswordConfirm")?.value || "";

  const button = $("#signUpButton");
  const status = $("#signUpStatus");


  setStatus(status, "");


  if (!name) {
    setStatus(
      status,
      "Please enter your full name.",
      "error"
    );

    return;
  }


  if (!email) {
    setStatus(
      status,
      "Please enter your email.",
      "error"
    );

    return;
  }


  if (password.length < 6) {
    setStatus(
      status,
      "Password must be at least 6 characters.",
      "error"
    );

    return;
  }


  if (password !== confirmation) {
    setStatus(
      status,
      "Passwords do not match.",
      "error"
    );

    return;
  }


  if (!window.nabdSupabase) {
    setStatus(
      status,
      "The account system is not connected.",
      "error"
    );

    return;
  }


  setButtonLoading(
    button,
    true,
    "Creating account…",
    "Create account"
  );


  try {
    const { data, error } =
      await window.nabdSupabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            name: name
          }
        }
      });


    if (error) {
      throw error;
    }


    if (!data?.user) {
      throw new Error(
        "The account could not be created."
      );
    }


    /*
      If email confirmation is disabled,
      Supabase returns a session immediately.
    */

    if (data.session) {
      setStatus(
        status,
        "Account created successfully ✓",
        "success"
      );

      await loadDashboard(data.user);

      return;
    }


    /*
      If email confirmation is enabled.
    */

    setStatus(
      status,
      "Account created. Please check your email to confirm your account, then sign in.",
      "success"
    );


    $("#signUpForm")?.reset();


    setTimeout(() => {
      openSignIn();

      if ($("#signInEmail")) {
        $("#signInEmail").value = email;
      }

      setStatus(
        $("#signInStatus"),
        "Confirm your email first, then sign in.",
        "success"
      );
    }, 1200);


  } catch (error) {
    console.error("Sign up error:", error);

    let message =
      error?.message ||
      "Could not create the account.";


    if (
      /already registered|already exists|user already/i.test(message)
    ) {
      message =
        "An account with this email already exists. Please sign in.";
    }


    setStatus(
      status,
      message,
      "error"
    );

  } finally {
    setButtonLoading(
      button,
      false,
      "Creating account…",
      "Create account"
    );
  }
}


/* =========================================================
   SIGN IN
   ========================================================= */

async function handleSignIn(event) {
  event.preventDefault();

  const email =
    $("#signInEmail")?.value.trim().toLowerCase() || "";

  const password =
    $("#signInPassword")?.value || "";

  const button = $("#signInButton");
  const status = $("#signInStatus");


  setStatus(status, "");


  if (!email || !password) {
    setStatus(
      status,
      "Enter your email and password.",
      "error"
    );

    return;
  }


  if (!window.nabdSupabase) {
    setStatus(
      status,
      "The login system is not connected.",
      "error"
    );

    return;
  }


  setButtonLoading(
    button,
    true,
    "Signing in…",
    "Sign in"
  );


  try {
    const { data, error } =
      await window.nabdSupabase.auth.signInWithPassword({
        email,
        password
      });


    if (error) {
      throw error;
    }


    if (!data?.user) {
      throw new Error(
        "Login failed."
      );
    }


    setStatus(
      status,
      "Signed in successfully ✓",
      "success"
    );


    await loadDashboard(data.user);


  } catch (error) {
    console.error("Sign in error:", error);

    let message =
      error?.message ||
      "Could not sign in.";


    if (
      /invalid login credentials/i.test(message)
    ) {
      message =
        "Incorrect email or password.";
    }


    if (
      /email not confirmed/i.test(message)
    ) {
      message =
        "Please confirm your email before signing in.";
    }


    setStatus(
      status,
      message,
      "error"
    );

  } finally {
    setButtonLoading(
      button,
      false,
      "Signing in…",
      "Sign in"
    );
  }
}


/* =========================================================
   SIGN OUT
   ========================================================= */

async function handleLogout() {
  if (!window.nabdSupabase) return;

  const button = $("#logoutButton");

  if (button) {
    button.disabled = true;
    button.textContent = "Signing out…";
  }


  try {
    const { error } =
      await window.nabdSupabase.auth.signOut();

    if (error) {
      throw error;
    }


    state.user = null;
    state.profile = null;
    state.enrollments = [];
    state.courses = [];
    state.certificates = [];


    if ($("#dashboardSection")) {
      $("#dashboardSection").classList.remove("active");
    }


    openSignIn();
    showAuth();


    if ($("#signInForm")) {
      $("#signInForm").reset();
    }


  } catch (error) {
    console.error("Logout error:", error);

    alert(
      error?.message ||
      "Could not sign out."
    );

  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "Sign out";
    }
  }
}


/* =========================================================
   PASSWORD VISIBILITY
   ========================================================= */

function setupPasswordButtons() {
  document
    .querySelectorAll("[data-password-target]")
    .forEach(button => {

      button.addEventListener("click", () => {
        const input =
          document.getElementById(
            button.dataset.passwordTarget
          );

        if (!input) return;


        const showing =
          input.type === "text";


        input.type =
          showing
            ? "password"
            : "text";


        button.textContent =
          showing
            ? "Show"
            : "Hide";
      });

    });
}


/* =========================================================
   INITIAL SESSION
   ========================================================= */

async function checkSession() {
  if (!window.nabdSupabase) {
    showAuth();

    setStatus(
      $("#signInStatus"),
      "Supabase connection could not be loaded.",
      "error"
    );

    return;
  }


  try {
    const { data, error } =
      await window.nabdSupabase.auth.getSession();


    if (error) {
      throw error;
    }


    const user =
      data?.session?.user;


    if (user) {
      await loadDashboard(user);
    } else {
      showAuth();
    }

  } catch (error) {
    console.error(
      "Session check error:",
      error
    );

    showAuth();
  }
}


/* =========================================================
   AUTH CHANGE LISTENER
   ========================================================= */

function listenForAuthChanges() {
  if (!window.nabdSupabase) return;


  window.nabdSupabase.auth.onAuthStateChange(
    async (event, session) => {

      if (
        event === "SIGNED_OUT"
      ) {
        showAuth();
        return;
      }


      /*
        Initial session is already loaded manually.
        Only reload when a fresh sign-in occurs.
      */

      if (
        event === "SIGNED_IN" &&
        session?.user &&
        state.user?.id !== session.user.id
      ) {
        await loadDashboard(
          session.user
        );
      }

    }
  );
}


/* =========================================================
   START PORTAL
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    $("#signInTab")
      ?.addEventListener(
        "click",
        openSignIn
      );


    $("#signUpTab")
      ?.addEventListener(
        "click",
        openSignUp
      );


    $("#signInForm")
      ?.addEventListener(
        "submit",
        handleSignIn
      );


    $("#signUpForm")
      ?.addEventListener(
        "submit",
        handleSignUp
      );


    $("#logoutButton")
      ?.addEventListener(
        "click",
        handleLogout
      );


    setupPasswordButtons();


    listenForAuthChanges();


    await checkSession();

  }
);
