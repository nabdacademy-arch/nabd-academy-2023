"use strict";

/* =========================================================
   NABD ACADEMY STUDENT PORTAL v13
   Auth + Password Recovery + Dashboard
   Courses + Certificates + Certificate Claims
   ========================================================= */

const $ = selector => document.querySelector(selector);

const state = {
  user: null,
  profile: null,
  courses: [],
  enrollments: [],
  certificates: [],
  claims: [],
  recoveryMode: false
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


function normalizeCertificateId(value = "") {
  return String(value)
    .trim()
    .toUpperCase();
}


function setStatus(element, message = "", type = "") {
  if (!element) return;

  element.textContent = message;

  element.classList.remove(
    "error",
    "success"
  );

  if (type) {
    element.classList.add(type);
  }
}


function setButtonLoading(
  button,
  loading,
  loadingText,
  normalText
) {
  if (!button) return;

  button.disabled = loading;

  button.textContent = loading
    ? loadingText
    : normalText;
}


function showLoader(show = true) {
  const loader = $("#portalLoader");

  if (!loader) return;

  loader.classList.toggle(
    "active",
    show
  );
}


function hideAllAuthViews() {
  $("#signInView")?.classList.remove("active");
  $("#signUpView")?.classList.remove("active");
  $("#forgotPasswordView")?.classList.remove("active");
  $("#resetPasswordView")?.classList.remove("active");
}


function showAuth() {
  showLoader(false);

  $("#authSection")?.removeAttribute("hidden");

  $("#dashboardSection")
    ?.classList
    .remove("active");
}


function showDashboard() {
  showLoader(false);

  $("#authSection")
    ?.setAttribute("hidden", "");

  $("#dashboardSection")
    ?.classList
    .add("active");
}


function normalizeProgress(value) {
  let progress = Number(value);

  if (!Number.isFinite(progress)) {
    progress = 0;
  }

  if (
    progress > 0 &&
    progress <= 1
  ) {
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
   AUTH VIEWS
   ========================================================= */

function openSignIn() {
  state.recoveryMode = false;

  showAuth();
  hideAllAuthViews();

  $("#normalAuthArea")?.removeAttribute("hidden");

  $("#signInView")?.classList.add("active");

  $("#signInTab")?.classList.add("active");
  $("#signUpTab")?.classList.remove("active");

  if ($("#authHeading")) {
    $("#authHeading").textContent =
      "Welcome back";
  }

  if ($("#authIntro")) {
    $("#authIntro").textContent =
      "Sign in to access your courses and certificates.";
  }

  setStatus($("#signInStatus"), "");
  setStatus($("#signUpStatus"), "");
}


function openSignUp() {
  state.recoveryMode = false;

  showAuth();
  hideAllAuthViews();

  $("#normalAuthArea")?.removeAttribute("hidden");

  $("#signUpView")?.classList.add("active");

  $("#signUpTab")?.classList.add("active");
  $("#signInTab")?.classList.remove("active");

  if ($("#authHeading")) {
    $("#authHeading").textContent =
      "Create account";
  }

  if ($("#authIntro")) {
    $("#authIntro").textContent =
      "Use the same email you used in course registration.";
  }

  setStatus($("#signInStatus"), "");
  setStatus($("#signUpStatus"), "");
}


function openForgotPassword() {
  state.recoveryMode = false;

  showAuth();
  hideAllAuthViews();

  $("#normalAuthArea")
    ?.setAttribute("hidden", "");

  $("#forgotPasswordView")
    ?.classList
    .add("active");

  if ($("#authHeading")) {
    $("#authHeading").textContent =
      "Password recovery";
  }

  if ($("#authIntro")) {
    $("#authIntro").textContent =
      "Reset access to your NABD Academy student account.";
  }

  const loginEmail =
    $("#signInEmail")
      ?.value
      .trim() || "";

  if (
    loginEmail &&
    $("#forgotPasswordEmail")
  ) {
    $("#forgotPasswordEmail").value =
      loginEmail;
  }

  setStatus(
    $("#forgotPasswordStatus"),
    ""
  );
}


function openResetPassword() {
  state.recoveryMode = true;

  showAuth();
  hideAllAuthViews();

  $("#normalAuthArea")
    ?.setAttribute("hidden", "");

  $("#resetPasswordView")
    ?.classList
    .add("active");

  if ($("#authHeading")) {
    $("#authHeading").textContent =
      "Set new password";
  }

  if ($("#authIntro")) {
    $("#authIntro").textContent =
      "Choose a new password for your student account.";
  }
}


/* =========================================================
   PROFILE
   ========================================================= */

async function loadProfile(user) {
  if (
    !window.nabdSupabase ||
    !user
  ) {
    return null;
  }

  try {
    const { data, error } =
      await window.nabdSupabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

    if (
      !error &&
      data
    ) {
      return data;
    }
  } catch (error) {
    console.warn(
      "Profile lookup:",
      error
    );
  }

  return null;
}


/* =========================================================
   COURSES
   ========================================================= */

async function loadAllCourses() {
  if (!window.nabdSupabase) {
    return [];
  }

  try {
    const { data, error } =
      await window.nabdSupabase
        .from("courses")
        .select("*")
        .order("created_at");

    if (error) {
      console.warn(
        "Courses query:",
        error
      );

      return [];
    }

    return Array.isArray(data)
      ? data
      : [];

  } catch (error) {
    console.error(
      "Courses error:",
      error
    );

    return [];
  }
}


/* =========================================================
   ENROLLMENTS
   ========================================================= */

async function loadEnrollments(user) {
  if (
    !window.nabdSupabase ||
    !user
  ) {
    return [];
  }

  try {
    const { data, error } =
      await window.nabdSupabase
        .from("enrollments")
        .select("*")
        .eq(
          "student_id",
          user.id
        )
        .order(
          "enrolled_at",
          {
            ascending: false
          }
        );

    if (error) {
      console.warn(
        "Enrollments:",
        error
      );

      return [];
    }

    return Array.isArray(data)
      ? data
      : [];

  } catch (error) {
    console.error(error);

    return [];
  }
}


/* =========================================================
   CERTIFICATES
   ========================================================= */

async function loadCertificates(user) {
  if (
    !window.nabdSupabase ||
    !user
  ) {
    return [];
  }

  try {
    const { data, error } =
      await window.nabdSupabase
        .from("certificates")
        .select("*")
        .eq(
          "student_id",
          user.id
        )
        .order(
          "issue_date",
          {
            ascending: false
          }
        );

    if (error) {
      console.warn(
        "Certificates:",
        error
      );

      return [];
    }

    return Array.isArray(data)
      ? data
      : [];

  } catch (error) {
    console.error(error);

    return [];
  }
}


/* =========================================================
   CLAIMS
   ========================================================= */

async function loadClaims(user) {
  if (
    !window.nabdSupabase ||
    !user
  ) {
    return [];
  }

  try {
    const { data, error } =
      await window.nabdSupabase
        .from("certificate_claims")
        .select("*")
        .eq(
          "student_id",
          user.id
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        );

    if (error) {
      console.warn(
        "Claims:",
        error
      );

      return [];
    }

    return Array.isArray(data)
      ? data
      : [];

  } catch (error) {
    console.error(error);

    return [];
  }
}


/* =========================================================
   COURSE MATCHING
   ========================================================= */

function findCourseForEnrollment(enrollment) {
  if (!enrollment?.course_id) {
    return null;
  }

  return (
    state.courses.find(
      course =>
        String(course.id) ===
        String(enrollment.course_id)
    ) ||
    null
  );
}


/* =========================================================
   RENDER HEADER
   ========================================================= */

function renderStudentHeader() {
  const name =
    getProfileName(
      state.profile,
      state.user
    );

  if ($("#studentName")) {
    $("#studentName").textContent =
      name;
  }

  if ($("#studentEmail")) {
    $("#studentEmail").textContent =
      state.user?.email || "";
  }
}


/* =========================================================
   RENDER METRICS
   ========================================================= */

function renderMetrics() {
  const enrollments =
    state.enrollments;

  const completed =
    enrollments.filter(
      enrollment => {

        const status =
          enrollmentStatus(
            enrollment
          ).toLowerCase();

        const progress =
          enrollmentProgress(
            enrollment
          );

        return (
          status === "completed" ||
          progress >= 100
        );
      }
    ).length;


  let average = 0;

  if (enrollments.length) {

    const total =
      enrollments.reduce(
        (sum, enrollment) =>
          sum +
          enrollmentProgress(
            enrollment
          ),
        0
      );

    average =
      Math.round(
        total /
        enrollments.length
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
      state.certificates.length;
  }

  if ($("#metricProgress")) {
    $("#metricProgress").textContent =
      `${average}%`;
  }

  if ($("#courseSummary")) {
    $("#courseSummary").textContent =
      enrollments.length
        ? `${enrollments.length} enrolled course${enrollments.length === 1 ? "" : "s"}`
        : "No enrolled courses yet";
  }
}


/* =========================================================
   RENDER COURSES
   ========================================================= */

function renderCourses() {
  const container =
    $("#studentCourses");

  if (!container) return;


  if (!state.enrollments.length) {

    container.innerHTML = `
      <div class="empty-state">

        <strong>
          No courses found yet.
        </strong>

        <br>

        When your enrollment is approved,
        the course will appear here automatically.

      </div>
    `;

    return;
  }


  container.innerHTML =
    state.enrollments
      .map(enrollment => {

        const course =
          findCourseForEnrollment(
            enrollment
          );

        const title =
          course?.title_en ||
          course?.title ||
          "NABD Academy Course";

        const description =
          course?.description_en ||
          course?.description ||
          "NABD Academy medical learning course.";

        const progress =
          enrollmentProgress(
            enrollment
          );

        const status =
          enrollmentStatus(
            enrollment
          );

        const courseSlug =
          course?.slug ||
          course?.id ||
          "";


        return `
          <article class="student-course-card">

            <h3>
              ${escapeHTML(title)}
            </h3>

            <p>
              ${escapeHTML(description)}
            </p>

            <div class="portal-progress">

              <span
                style="width:${progress}%"
              ></span>

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

      })
      .join("");
}


/* =========================================================
   RENDER CERTIFICATES
   ========================================================= */

function renderCertificates() {
  const container =
    $("#studentCertificates");

  if (!container) return;


  if (!state.certificates.length) {

    container.innerHTML = `
      <div class="empty-state">

        <strong>
          No certificates linked to this account yet.
        </strong>

        <br>

        Eligible certificates will appear here
        after they are linked to your student account.

      </div>
    `;

    return;
  }


  container.innerHTML =
    state.certificates
      .map(certificate => {

        const id =
          certificate.certificate_id ||
          "";

        const title =
          certificate.course_title ||
          "NABD Academy Certificate";

        const issueDate =
          certificate.issue_date ||
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
              ${escapeHTML(title)}
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
                    ${escapeHTML(issueDate)}
                  </p>
                `
                : ""
            }

            <a
              class="certificate-link"
              href="index.html?certificate=${encodeURIComponent(id)}#verify"
            >
              Verify certificate →
            </a>

          </article>
        `;

      })
      .join("");
}


/* =========================================================
   RENDER CLAIMS
   ========================================================= */

function renderClaims() {
  const container =
    $("#studentClaims");

  if (!container) return;


  if (!state.claims.length) {
    container.innerHTML = "";
    return;
  }


  container.innerHTML =
    state.claims
      .map(claim => {

        const status =
          String(
            claim.status ||
            "pending"
          ).toLowerCase();


        return `
          <article class="student-claim-card">

            <span
              class="claim-status-pill ${escapeHTML(status)}"
            >
              ${escapeHTML(status)}
            </span>

            <h3>
              ${escapeHTML(
                claim.certificate_id
              )}
            </h3>

            <p>
              ${
                status === "pending"
                  ? "Waiting for academy review."
                  : status === "approved"
                  ? "Certificate claim approved."
                  : "Certificate claim rejected."
              }
            </p>

          </article>
        `;

      })
      .join("");
}


/* =========================================================
   CERTIFICATE CLAIM
   ========================================================= */

async function handleCertificateClaim(event) {
  event.preventDefault();


  const input =
    $("#claimCertificateId");

  const button =
    $("#claimCertificateButton");

  const statusBox =
    $("#claimCertificateStatus");


  const certificateId =
    normalizeCertificateId(
      input?.value || ""
    );


  setStatus(
    statusBox,
    ""
  );


  if (!state.user) {

    setStatus(
      statusBox,
      "You must sign in first.",
      "error"
    );

    return;
  }


  if (!certificateId) {

    setStatus(
      statusBox,
      "Enter your Certificate ID.",
      "error"
    );

    return;
  }


  if (
    !certificateId.startsWith(
      "NABD-"
    )
  ) {

    setStatus(
      statusBox,
      "Enter a valid NABD Certificate ID.",
      "error"
    );

    return;
  }


  setButtonLoading(
    button,
    true,
    "Checking certificate…",
    "Submit Claim"
  );


  try {

    const { data, error } =
      await window.nabdSupabase.rpc(
        "verify_certificate",
        {
          input_certificate_id:
            certificateId
        }
      );


    if (error) {
      throw error;
    }


    if (
      !Array.isArray(data) ||
      !data.length
    ) {

      setStatus(
        statusBox,
        "Certificate ID was not found.",
        "error"
      );

      return;
    }


    const existing =
      state.claims.find(
        claim =>
          normalizeCertificateId(
            claim.certificate_id
          ) === certificateId
      );


    if (existing) {

      setStatus(
        statusBox,
        `A claim already exists. Status: ${existing.status}.`,
        "error"
      );

      return;
    }


    setButtonLoading(
      button,
      true,
      "Submitting claim…",
      "Submit Claim"
    );


    const result =
      await window.nabdSupabase
        .from("certificate_claims")
        .insert([
          {
            student_id:
              state.user.id,

            certificate_id:
              certificateId,

            status:
              "pending"
          }
        ]);


    if (result.error) {
      throw result.error;
    }


    if (input) {
      input.value = "";
    }


    setStatus(
      statusBox,
      "Certificate claim submitted successfully ✓",
      "success"
    );


    state.claims =
      await loadClaims(
        state.user
      );


    renderClaims();


  } catch (error) {

    console.error(
      "Certificate claim:",
      error
    );


    setStatus(
      statusBox,
      error?.message ||
      "Could not submit claim.",
      "error"
    );


  } finally {

    setButtonLoading(
      button,
      false,
      "Submitting claim…",
      "Submit Claim"
    );

  }
}


/* =========================================================
   DASHBOARD
   ========================================================= */

async function loadDashboard(user) {
  state.user = user;

  showLoader(true);


  try {

    const [
      profile,
      courses,
      enrollments,
      certificates,
      claims
    ] = await Promise.all([

      loadProfile(user),
      loadAllCourses(),
      loadEnrollments(user),
      loadCertificates(user),
      loadClaims(user)

    ]);


    state.profile =
      profile;

    state.courses =
      courses;

    state.enrollments =
      enrollments;

    state.certificates =
      certificates;

    state.claims =
      claims;


    renderStudentHeader();
    renderMetrics();
    renderCourses();
    renderClaims();
    renderCertificates();

    showDashboard();


  } catch (error) {

    console.error(
      "Dashboard:",
      error
    );

    showDashboard();

  }
}


/* =========================================================
   SIGN UP
   ========================================================= */

async function handleSignUp(event) {
  event.preventDefault();


  const name =
    $("#signUpName")
      ?.value
      .trim() || "";


  const email =
    $("#signUpEmail")
      ?.value
      .trim()
      .toLowerCase() || "";


  const password =
    $("#signUpPassword")
      ?.value || "";


  const confirm =
    $("#signUpPasswordConfirm")
      ?.value || "";


  const button =
    $("#signUpButton");

  const status =
    $("#signUpStatus");


  if (!name) {

    setStatus(
      status,
      "Enter your full name.",
      "error"
    );

    return;
  }


  if (
    password.length < 6
  ) {

    setStatus(
      status,
      "Password must be at least 6 characters.",
      "error"
    );

    return;
  }


  if (
    password !== confirm
  ) {

    setStatus(
      status,
      "Passwords do not match.",
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
      await window.nabdSupabase
        .auth
        .signUp({

          email,

          password,

          options: {

            data: {
              full_name:name,
              name:name
            }

          }

        });


    if (error) {
      throw error;
    }


    if (
      data?.session &&
      data?.user
    ) {

      await loadDashboard(
        data.user
      );

    } else {

      setStatus(
        status,
        "Account created successfully.",
        "success"
      );

    }


  } catch (error) {

    setStatus(
      status,
      error?.message ||
      "Could not create account.",
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
    $("#signInEmail")
      ?.value
      .trim()
      .toLowerCase() || "";


  const password =
    $("#signInPassword")
      ?.value || "";


  const button =
    $("#signInButton");

  const status =
    $("#signInStatus");


  setButtonLoading(
    button,
    true,
    "Signing in…",
    "Sign in"
  );


  try {

    const { data, error } =
      await window.nabdSupabase
        .auth
        .signInWithPassword({
          email,
          password
        });


    if (error) {
      throw error;
    }


    await loadDashboard(
      data.user
    );


  } catch (error) {

    let message =
      error?.message ||
      "Could not sign in.";


    if (
      /invalid login credentials/i.test(
        message
      )
    ) {

      message =
        "Incorrect email or password.";

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
   PASSWORD RESET EMAIL
   ========================================================= */

async function handleForgotPassword(event) {
  event.preventDefault();


  const email =
    $("#forgotPasswordEmail")
      ?.value
      .trim()
      .toLowerCase() || "";


  const button =
    $("#sendResetButton");

  const status =
    $("#forgotPasswordStatus");


  if (!email) {

    setStatus(
      status,
      "Enter your email address.",
      "error"
    );

    return;
  }


  setButtonLoading(
    button,
    true,
    "Sending…",
    "Send reset link"
  );


  try {

    const redirectTo =
      `${window.location.origin}${window.location.pathname}`;


    const { error } =
      await window.nabdSupabase
        .auth
        .resetPasswordForEmail(
          email,
          {
            redirectTo
          }
        );


    if (error) {
      throw error;
    }


    setStatus(
      status,
      "Password reset link sent. Check your email ✓",
      "success"
    );


  } catch (error) {

    let message =
      error?.message ||
      "Could not send reset email.";


    if (
      /rate limit/i.test(
        message
      )
    ) {

      message =
        "Too many email requests. Please wait and try again later.";

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
      "Sending…",
      "Send reset link"
    );

  }
}


/* =========================================================
   SET NEW PASSWORD
   ========================================================= */

async function handleNewPassword(event) {
  event.preventDefault();


  const password =
    $("#newPassword")
      ?.value || "";


  const confirm =
    $("#confirmNewPassword")
      ?.value || "";


  const button =
    $("#updatePasswordButton");

  const status =
    $("#resetPasswordStatus");


  if (
    password.length < 6
  ) {

    setStatus(
      status,
      "Password must be at least 6 characters.",
      "error"
    );

    return;
  }


  if (
    password !== confirm
  ) {

    setStatus(
      status,
      "Passwords do not match.",
      "error"
    );

    return;
  }


  setButtonLoading(
    button,
    true,
    "Updating password…",
    "Update password"
  );


  try {

    const { data, error } =
      await window.nabdSupabase
        .auth
        .updateUser({
          password
        });


    if (error) {
      throw error;
    }


    setStatus(
      status,
      "Password updated successfully ✓",
      "success"
    );


    state.recoveryMode = false;


    setTimeout(
      async () => {

        if (data?.user) {

          await loadDashboard(
            data.user
          );

        } else {

          openSignIn();

        }

      },
      800
    );


  } catch (error) {

    setStatus(
      status,
      error?.message ||
      "Could not update password.",
      "error"
    );


  } finally {

    setButtonLoading(
      button,
      false,
      "Updating password…",
      "Update password"
    );

  }
}


/* =========================================================
   SIGN OUT
   ========================================================= */

async function handleLogout() {
  if (!window.nabdSupabase) {
    return;
  }


  try {

    await window.nabdSupabase
      .auth
      .signOut();


    state.user = null;
    state.profile = null;
    state.courses = [];
    state.enrollments = [];
    state.certificates = [];
    state.claims = [];


    openSignIn();


  } catch (error) {

    console.error(
      "Logout:",
      error
    );

  }
}


/* =========================================================
   PASSWORD SHOW / HIDE
   ========================================================= */

function setupPasswordButtons() {

  document
    .querySelectorAll(
      "[data-password-target]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

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

        }
      );

    });

}


/* =========================================================
   SESSION
   ========================================================= */

async function checkSession() {

  if (!window.nabdSupabase) {

    showAuth();

    setStatus(
      $("#signInStatus"),
      "Supabase connection failed.",
      "error"
    );

    return;
  }


  try {

    const { data, error } =
      await window.nabdSupabase
        .auth
        .getSession();


    if (error) {
      throw error;
    }


    /*
      When a password recovery link is opened,
      PASSWORD_RECOVERY event normally handles it.
      We do not automatically show dashboard if
      recovery mode has already been activated.
    */

    if (
      data?.session?.user &&
      !state.recoveryMode
    ) {

      await loadDashboard(
        data.session.user
      );

    } else if (
      !state.recoveryMode
    ) {

      openSignIn();

    }


  } catch (error) {

    console.error(
      "Session:",
      error
    );

    openSignIn();

  }
}


/* =========================================================
   AUTH LISTENER
   ========================================================= */

function listenForAuthChanges() {

  if (!window.nabdSupabase) {
    return;
  }


  window.nabdSupabase
    .auth
    .onAuthStateChange(
      async (
        event,
        session
      ) => {


        if (
          event ===
          "PASSWORD_RECOVERY"
        ) {

          state.recoveryMode = true;

          openResetPassword();

          return;
        }


        if (
          event ===
          "SIGNED_OUT"
        ) {

          state.user = null;

          openSignIn();

          return;
        }


        if (
          event ===
          "SIGNED_IN" &&
          session?.user &&
          !state.recoveryMode
        ) {

          if (
            state.user?.id !==
            session.user.id
          ) {

            await loadDashboard(
              session.user
            );

          }

        }

      }
    );

}


/* =========================================================
   URL RECOVERY CHECK
   ========================================================= */

function detectRecoveryURL() {

  const hash =
    window.location.hash || "";

  const query =
    window.location.search || "";


  if (
    hash.includes(
      "type=recovery"
    ) ||
    query.includes(
      "type=recovery"
    )
  ) {

    state.recoveryMode = true;

    openResetPassword();

    return true;
  }


  return false;
}


/* =========================================================
   START
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


    $("#forgotPasswordButton")
      ?.addEventListener(
        "click",
        openForgotPassword
      );


    $("#backToSignInButton")
      ?.addEventListener(
        "click",
        openSignIn
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


    $("#forgotPasswordForm")
      ?.addEventListener(
        "submit",
        handleForgotPassword
      );


    $("#resetPasswordForm")
      ?.addEventListener(
        "submit",
        handleNewPassword
      );


    $("#claimCertificateForm")
      ?.addEventListener(
        "submit",
        handleCertificateClaim
      );


    $("#logoutButton")
      ?.addEventListener(
        "click",
        handleLogout
      );


    $("#claimCertificateId")
      ?.addEventListener(
        "input",
        event => {

         
