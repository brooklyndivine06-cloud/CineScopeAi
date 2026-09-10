/* Generates a clean one-page PDF résumé: public/anugrah-a-resume.pdf */
const fs = require('fs');
const path = require('path');

const esc = (s) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

const ops = [];
let y = 0;
const W = 595;
const M = 52;

function text(str, x, yy, size, font) {
  ops.push(`BT /${font} ${size} Tf ${x} ${yy} Td (${esc(str)}) Tj ET`);
}
function line(x1, y1, x2, y2, width = 0.8, gray = 0.75) {
  ops.push(`${gray} G ${width} w ${x1} ${y1} m ${x2} ${y2} l S`);
}

/* header */
text('ANUGRAH A', M, 796, 24, 'F1');
text('Computer Science & Engineering Student', M, 776, 12, 'F2');
text('Kerala, India   |   github.com/brooklyndivine06-cloud   |   IDAM: brooklyndivine06-cloud.github.io/idam-prime', M, 762, 8.5, 'F3');
line(M, 750, W - M, 750);

/* education */
y = 722;
text('EDUCATION', M, y, 11, 'F1');
line(M, y - 5, W - M, y - 5, 0.5, 0.85);
y -= 20;
text('B.Tech Computer Science & Engineering  (2024 - Present)', M, y, 10, 'F2');
y -= 13;
text('Adi Shankara Institute of Engineering and Technology, Kalady, Kerala', M, y, 10, 'F2');
y -= 13;
text('Currently learning: Software Engineering, Web Development, Databases, Artificial Intelligence, Problem Solving', M, y, 8.5, 'F3');

/* skills */
y -= 30;
text('SKILLS', M, y, 11, 'F1');
line(M, y - 5, W - M, y - 5, 0.5, 0.85);
y -= 20;
[
  'Languages:      Python, JavaScript, Java, C, C++, SQL',
  'Frontend:       HTML, CSS, JavaScript, React',
  'Backend:        Node.js, Express.js, Python, Firebase',
  'Databases:      MongoDB, SQL, Firebase',
  'Tools:          Git, GitHub, Linux',
].forEach((s) => {
  text(s, M, y, 9.5, 'F2');
  y -= 14;
});

/* projects */
y -= 14;
text('PROJECTS', M, y, 11, 'F1');
line(M, y - 5, W - M, y - 5, 0.5, 0.85);
y -= 20;
text('IDAM  -  Property discovery platform (live product)', M, y, 10, 'F2');
y -= 13;
text('Search & composable filters, property details, enquiries, visit scheduling, messages, saved', M, y, 9, 'F2');
y -= 12;
text('properties and dashboards, plus Velappan, a conversational AI property guide (search, EMI, posting).', M, y, 9, 'F2');
y -= 13;
text('CineSense AI  -  AI-powered movie analysis dashboard with verdicts, ratings aggregation and content warnings', M, y, 9, 'F2');

/* certifications */
y -= 28;
text('CERTIFICATIONS', M, y, 11, 'F1');
line(M, y - 5, W - M, y - 5, 0.5, 0.85);
y -= 20;
[
  'NoSQL and MongoDB  -  Infosys Springboard',
  'Deployment Professional - Security Network Protection (XGS) V5.2  -  IBM',
  'Digital 101  -  nasscom',
  'Course Completion  -  Infosys Springboard',
].forEach((s) => {
  text(s, M, y, 9.5, 'F2');
  y -= 14;
});

/* footer */
text('Built with curiosity. Designed with intention.', M, 60, 8.5, 'F3');

const content = ops.join('\n');
const objects = [
  '<< /Type /Catalog /Pages 2 0 R >>',
  '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R /F3 6 0 R >> >> /Contents 7 0 R >>',
  '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
  '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>',
  `<< /Length ${Buffer.byteLength(content, 'latin1')} >>\nstream\n${content}\nendstream`,
];

let pdf = '%PDF-1.4\n';
const offsets = [];
objects.forEach((body, i) => {
  offsets.push(Buffer.byteLength(pdf, 'latin1'));
  pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
});
const xrefPos = Buffer.byteLength(pdf, 'latin1');
pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
offsets.forEach((o) => {
  pdf += `${String(o).padStart(10, '0')} 00000 n \n`;
});
pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`;

const out = path.join(__dirname, '..', 'public', 'anugrah-a-resume.pdf');
fs.writeFileSync(out, pdf, 'latin1');
console.log('wrote', out, pdf.length, 'bytes');
