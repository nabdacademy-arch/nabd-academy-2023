"use strict";

/* =========================================================
   NABD ACADEMY STUDENT PORTAL v12
   Auth + Dashboard + Courses + Certificates + Claims
   ========================================================= */

const $ = selector => document.querySelector(selector);

const state = {
  user: null,
  profile: null,
  courses: [],
  enrollments: [],
  certificates: [],
  claims: []
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


function showAuth() {
  showLoader(false);

  const auth = $("#authSection");
  const dashboard = $("#dashboardSection");

  if (auth) {
    auth.hidden = false;
  }

  if (dashboard) {
    dashboard.classList.remove("active");
  }
}


function showDashboard() {
  showLoader(false);

  const auth = $("#authSection");
  const dashboard = $("#dashboardSection");

  if (auth) {
    auth.hidden = true;
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

  if (
    progress > 0 &&
    progress <= 1
  ) {
    progress *= 100;
  }

  progress = Math.round(progress);

  if (progress < 0) {
    progress = 0;
  }

  if (progress > 100) {
    progress = 100;
  }

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
   AUTH TABS
   ========================================================= */

function openSignIn() {
  $("#signInView")?.classList.add("active");
  $("#signUpView")?.classList.remove("active");

  $("#signInTab")?.classList.add("active");
  $("#signUpTab")?.classList.remove("active");

  $("#signInTab")?.setAttribute(
    "aria-selected",
    "true"
  );

  $("#signUpTab")?.setAttribute(
    "aria-selected",
    "false"
  );

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
  $("#signUpView")?.classList.add("active");
  $("#signInView")?.classList.remove("active");

  $("#signUpTab")?.classList.add("active");
  $("#signInTab")?.classList.remove("active");

  $("#signUpTab")?.setAttribute(
    "aria-selected",
    "true"
  );

  $("#signInTab")?.setAttribute(
    "aria-selected",
    "false"
  );

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
      "Profile id lookup:",
      error
    );
  }


  try {
    const { data, error } =
      await window.nabdSupabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

    if (
      !error &&
      data
    ) {
      return data;
    }

  } catch (error) {
    console.warn(
      "Profile user_id lookup:",
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
      "Courses load error:",
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

    if (!error) {
      return Array.isArray(data)
        ? data
        : [];
    }

    console.warn(
      "Enrollments query:",
      error
    );

  } catch (error) {
    console.warn(error);
  }


  return [];
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

    if (!error) {
      return Array.isArray(data)
        ? data
        : [];
    }

    console.warn(
      "Certificates query:",
      error
    );

  } catch (error) {
    console.warn(error);
  }


  return [];
}


/* =========================================================
   CERTIFICATE CLAIMS
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
        "Claims query:",
        error
      );

      return [];
    }

    return Array.isArray(data)
      ? data
      : [];

  } catch (error) {
    console.error(
      "Claims load error:",
      error
    );

    return [];
  }
}


/* =========================================================
   COURSE MATCHING
   ========================================================= */

function findCourseForEnrollment(enrollment) {
  if (!enrollment) {
    return null;
  }

  const courseId =
    enrollment.course_id ??
    null;

  if (!courseId) {
    return null;
  }

  return (
    state.courses.find(
      course =>
        String(course.id) ===
        String(courseId)
    ) ||
    null
  );
}


function courseTitle(
  course,
  enrollment
) {
  return (
    course?.title_en ||
    course?.title ||
    enrollment?.course_title ||
    enrollment?.title ||
    "NABD Academy Course"
  );
}


/* =========================================================
   STUDENT HEADER
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
   METRICS
   ========================================================= */

function renderMetrics() {
  const enrollments =
    state.enrollments;

  const certificates =
    state.certificates;


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
          status === "complete" ||
          progress >= 100
        );
      }
    ).length;


  let averageProgress = 0;

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

    averageProgress =
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


/* =========================================================
   COURSES RENDERING
   ========================================================= */

function renderCourses() {
  const container =
    $("#studentCourses");

  if (!container) {
    return;
  }


  if (!state.enrollments.length) {

    container.innerHTML = `
      <div class="empty-state">

        <strong>
          No courses found yet.
        </strong>

        <br>

        When your course enrollment is approved,
        it will appear here automatically.

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
          courseTitle(
            course,
            enrollment
          );

        const status =
          enrollmentStatus(
            enrollment
          );

        const progress =
          enrollmentProgress(
            enrollment
          );

        const courseSlug =
          course?.slug ||
          course?.id ||
          enrollment.course_id ||
          "";


        return `
          <article class="student-course-card">

            <h3>
              ${escapeHTML(title)}
            </h3>

            <p>
              ${escapeHTML(
                course?.description_en ||
                course?.description ||
                "NABD Academy medical learning course."
              )}
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
   CERTIFICATE RENDERING
   ========================================================= */

function certificateIdentifier(
  certificate
) {
  return (
    certificate.certificate_id ||
    certificate.code ||
    certificate.id ||
    ""
  );
}


function renderCertificates() {
  const container =
    $("#studentCertificates");

  if (!container) {
    return;
  }


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
          certificateIdentifier(
            certificate
          );

        const course =
          certificate.course_title ||
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
                      String(issueDate)
                        .slice(0,10)
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

      })
      .join("");
}


/* =========================================================
   CLAIM HISTORY
   ========================================================= */

function renderClaims() {
  const container =
    $("#studentClaims");

  if (!container) {
    return;
  }


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

        const created =
          claim.created_at
            ? String(
                claim.created_at
              ).slice(0,10)
            : "";


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

            ${
              created
                ? `
                  <p>
                    Submitted:
                    ${escapeHTML(created)}
                  </p>
                `
                : ""
            }

            ${
              status === "pending"
                ? `
                  <p>
                    Your claim is waiting for review.
                  </p>
                `
                : ""
            }

            ${
              status === "approved"
                ? `
                  <p>
                    This certificate claim has been approved.
                  </p>
                `
                : ""
            }

            ${
              status === "rejected"
                ? `
                  <p>
                    This claim was not approved.
                  </p>
                `
                : ""
            }

          </article>
        `;

      })
      .join("");
}


/* =========================================================
   VERIFY CERTIFICATE EXISTS
   ========================================================= */

async function verifyClaimCertificate(
  certificateId
) {
  if (!window.nabdSupabase) {
    return false;
  }

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
      console.warn(
        "Certificate verification error:",
        error
      );

      return false;
    }

    return (
      Array.isArray(data) &&
      data.length > 0
    );

  } catch (error) {
    console.error(
      "Certificate verification failed:",
      error
    );

    return false;
  }
}


/* =========================================================
   SUBMIT CERTIFICATE CLAIM
   ========================================================= */

async function handleCertificateClaim(
  event
) {
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
      "You must be signed in.",
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


  if (!certificateId.startsWith("NABD-")) {

    setStatus(
      statusBox,
      "Enter a valid NABD Certificate ID.",
      "error"
    );

    return;
  }


  if (!window.nabdSupabase) {

    setStatus(
      statusBox,
      "Certificate claim system is not connected.",
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

    /*
      First confirm that the certificate exists
      in NABD's verification database.
    */

    const exists =
      await verifyClaimCertificate(
        certificateId
      );


    if (!exists) {

      setStatus(
        statusBox,
        "Certificate ID was not found in the NABD verification system.",
        "error"
      );

      return;
    }


    /*
      Check whether this account already owns it.
    */

    const alreadyLinked =
      state.certificates.some(
        certificate =>
          normalizeCertificateId(
            certificate.certificate_id
          ) === certificateId
      );


    if (alreadyLinked) {

      setStatus(
        statusBox,
        "This certificate is already linked to your account.",
        "success"
      );

      return;
    }


    /*
      Check existing claims already loaded.
    */

    const existingClaim =
      state.claims.find(
        claim =>
          normalizeCertificateId(
            claim.certificate_id
          ) === certificateId
      );


    if (existingClaim) {

      const existingStatus =
        existingClaim.status ||
        "pending";

      setStatus(
        statusBox,
        `A claim for this certificate already exists. Status: ${existingStatus}.`,
        existingStatus === "rejected"
          ? "error"
          : "success"
      );

      return;
    }


    setButtonLoading(
      button,
      true,
      "Submitting claim…",
      "Submit Claim"
    );


    const { error } =
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


    if (error) {

      if (
        error.code === "23505" ||
        /duplicate/i.test(
          error.message || ""
        )
      ) {

        setStatus(
          statusBox,
          "A claim for this certificate already exists.",
          "error"
        );

        return;
      }

      throw error;
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
      "Certificate claim error:",
      error
    );


    setStatus(
      statusBox,
      error?.message ||
      "Could not submit the certificate claim.",
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
   DASHBOARD LOAD
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
      "Dashboard load error:",
      error
    );


    showDashboard();


    const coursesContainer =
      $("#studentCourses");


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


  const confirmation =
    $("#signUpPasswordConfirm")
      ?.value || "";


  const button =
    $("#signUpButton");

  const status =
    $("#signUpStatus");


  setStatus(
    status,
    ""
  );


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


  if (
    password !==
    confirmation
  ) {

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


    if (!data?.user) {

      throw new Error(
        "The account could not be created."
      );

    }


    if (data.session) {

      setStatus(
        status,
        "Account created successfully ✓",
        "success"
      );


      await loadDashboard(
        data.user
      );


      return;
    }


    setStatus(
      status,
      "Account created. Please confirm your email, then sign in.",
      "success"
    );


    $("#signUpForm")
      ?.reset();


    setTimeout(
      () => {

        openSignIn();


        if ($("#signInEmail")) {

          $("#signInEmail").value =
            email;

        }

      },
      1000
    );


  } catch (error) {

    console.error(
      "Sign up error:",
      error
    );


    let message =
      error?.message ||
      "Could not create the account.";


    if (
      /already registered|already exists|user already/i.test(
        message
      )
    ) {

      message =
        "An account with this email already exists. Please sign in.";

    }


    if (
      /rate limit/i.test(
        message
      )
    ) {

      message =
        "Too many email requests. Please wait and try again.";

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


  setStatus(
    status,
    ""
  );


  if (
    !email ||
    !password
  ) {

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
      await window.nabdSupabase
        .auth
        .signInWithPassword({
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


    await loadDashboard(
      data.user
    );


  } catch (error) {

    console.error(
      "Sign in error:",
      error
    );


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


    if (
      /email not confirmed/i.test(
        message
      )
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
  if (!window.nabdSupabase) {
    return;
  }


  const button =
    $("#logoutButton");


  if (button) {

    button.disabled = true;

    button.textContent =
      "Signing out…";

  }


  try {

    const { error } =
      await window.nabdSupabase
        .auth
        .signOut();


    if (error) {
      throw error;
    }


    state.user = null;
    state.profile = null;
    state.courses = [];
    state.enrollments = [];
    state.certificates = [];
    state.claims = [];


    $("#dashboardSection")
      ?.classList
      .remove("active");


    openSignIn();

    showAuth();


  } catch (error) {

    console.error(
      "Logout error:",
      error
    );


    alert(
      error?.message ||
      "Could not sign out."
    );


  } finally {

    if (button) {

      button.disabled = false;

      button.textContent =
        "Sign out";

    }

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


          if (!input) {
            return;
          }


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
      await window.nabdSupabase
        .auth
        .getSession();


    if (error) {
      throw error;
    }


    const user =
      data?.session?.user;


    if (user) {

      await loadDashboard(
        user
      );

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
          "SIGNED_OUT"
        ) {

          showAuth();

          return;
        }


        if (
          event ===
          "SIGNED_IN" &&
          session?.user &&
          state.user?.id !==
          session.user.id
        ) {

          await loadDashboard(
            session.user
          );

        }

      }
    );

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

          event.target.value =
            normalizeCertificateId(
              event.target.value
            );

        }
      );


    setupPasswordButtons();

    listenForAuthChanges();

    await checkSession();

  }
);
