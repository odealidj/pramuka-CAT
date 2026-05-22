const fs = require('fs');
const file = '/home/aliube/Workspace/Prd/PramukaCAT/frontend/src/app/(dashboard)/dashboard/events/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/function MyExamCard\({ exam }: \{ exam: MyExam \}\)/, "function MyExamCard({ exam }: { exam: UserApproval })");

fs.writeFileSync(file, content);
