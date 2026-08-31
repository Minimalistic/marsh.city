// Single renderer for the resume markup, shared by the public page
// (src/pages/resume.astro) and the PDF generator (scripts/resume-pdf.mjs),
// so the canonical data in src/data/resume.json has exactly one HTML shape.
// Styling lives in src/styles/resume.css.

/** Reorder a list of {id}-bearing items: ids in `order` come first (in that
 * order), everything else keeps its canonical relative order after them.
 * Items whose id is in `exclude` are dropped. */
function reorder(items, { order = [], exclude = [] } = {}) {
  const kept = items.filter((it) => !exclude.includes(it.id));
  const promoted = order
    .map((id) => kept.find((it) => it.id === id))
    .filter(Boolean);
  const rest = kept.filter((it) => !order.includes(it.id));
  return [...promoted, ...rest];
}

/** Apply a per-job variant config to the canonical data. Presentation only:
 * the config can override the summary, reorder sections, reorder or exclude
 * projects, roles, and bullets, and relabel skills rows — it can never add
 * or edit facts. */
export function applyVariant(data, config = {}) {
  const out = structuredClone(data);
  if (config.summary) out.summary = config.summary;
  if (config.skills?.relabel) {
    for (const row of out.skills) {
      if (config.skills.relabel[row.label]) row.label = config.skills.relabel[row.label];
    }
  }
  if (config.sectionOrder) out.sectionOrder = config.sectionOrder;
  if (config.projects) out.projects = reorder(out.projects, config.projects);
  if (config.experience) {
    out.experience = reorder(out.experience, config.experience);
    const roles = config.experience.roles || {};
    for (const role of out.experience) {
      if (roles[role.id]) role.bullets = reorder(role.bullets, roles[role.id]);
    }
  }
  return out;
}

const DEFAULT_SECTIONS = ['projects', 'experience', 'skills', 'education'];

function projectsSection(data) {
  const items = data.projects
    .map((p) => {
      const name = p.href
        ? `<a class="project-name" href="${p.href}">${p.name}<span class="open-icon" aria-hidden="true">↗</span></a>`
        : `<span class="project-name">${p.name}</span>`;
      const cls = p.featured ? ' class="featured"' : '';
      return `      <li${cls}>${name}<span class="project-desc">${p.desc}</span></li>`;
    })
    .join('\n');
  return `    <div class="resume-projects">
    <h2>Independent Projects</h2>
    <ul class="projects-compact">
${items}
    </ul>
    </div>`;
}

function experienceSection(data) {
  const entries = data.experience
    .map((role) => {
      const bullets = role.bullets
        .map((b) => `        <li>${b.text}</li>`)
        .join('\n');
      return `    <div class="resume-entry">
      <div class="resume-header">
        <strong>${role.title}</strong>
        <span class="meta">${role.dates}</span>
      </div>
      <div class="resume-org">${role.org}</div>
      <ul>
${bullets}
      </ul>
    </div>`;
    })
    .join('\n\n');
  return `    <h2>Experience</h2>\n\n${entries}`;
}

function skillsSection(data) {
  const rows = data.skills
    .map((s) => `      <div><dt>${s.label}</dt><dd>${s.items}</dd></div>`)
    .join('\n');
  return `    <h2>Technical Skills</h2>
    <dl class="resume-skills-compact">
${rows}
    </dl>`;
}

function educationSection(data) {
  const rows = data.education
    .map((e) => {
      const note = e.note ? ` ${e.note}` : '';
      return `      <tr><td><strong>${e.degree}</strong>${note}</td><td>${e.org}</td><td class="meta">${e.year}</td></tr>`;
    })
    .join('\n');
  return `    <h2>Education & Certifications</h2>
    <table class="resume-edu">
${rows}
    </table>`;
}

const SECTIONS = {
  projects: projectsSection,
  experience: experienceSection,
  skills: skillsSection,
  education: educationSection,
};

export function renderResume(data) {
  const c = data.contact;
  const sections = (data.sectionOrder || DEFAULT_SECTIONS)
    .map((key) => SECTIONS[key](data))
    .join('\n\n');
  return `  <div class="resume-print-header" aria-hidden="true">
    <div class="resume-print-id">
      <div class="resume-print-name">${data.name}</div>
      <p class="resume-print-contact">
        ${data.location.replace(/ /g, '&nbsp;')}
        <span class="sep">•</span>
        <a href="mailto:${c.email}">${c.email}</a>
        <span class="sep">•</span>
        <a href="${c.site}">${c.siteLabel}</a>
        <span class="sep">•</span>
        <a href="${c.linkedin}">${c.linkedinLabel}</a>
        <span class="sep">•</span>
        <a href="${c.github}">${c.githubLabel}</a>
      </p>
    </div>
    <img class="resume-print-qr" src="/qr.svg" alt="" width="56" height="56" />
  </div>

  <div class="prose">
    <div class="resume-top">
      <div class="resume-title">
        <span class="resume-kicker">Resume</span>
        <h1>${data.name}</h1>
      </div>
      <button class="resume-download" onclick="window.print()" aria-label="Print resume or save as PDF">Save as PDF</button>
    </div>

    <p class="resume-intro">
      ${data.summary}
    </p>

${sections}

    <h2 class="resume-contact-h">Get in touch</h2>
    <div class="resume-contact">
      <ul>
        <li>Email: <a href="mailto:${c.email}">${c.email}</a></li>
        <li>LinkedIn: <a href="${c.linkedin}">jason-marsh</a></li>
        <li>GitHub: <a href="${c.github}">Minimalistic</a></li>
      </ul>
      <a href="/" class="resume-qr" aria-label="Link to marsh.city">
        <img src="/qr.svg" alt="QR code linking to marsh.city" width="72" height="72" />
        <span>marsh.city</span>
      </a>
    </div>
  </div>`;
}
