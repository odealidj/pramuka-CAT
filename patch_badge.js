const fs = require('fs');
const file = '/home/aliube/Workspace/Prd/PramukaCAT/frontend/src/app/(dashboard)/dashboard/events/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldBadge = `<span className={\`flex-shrink-0 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider \${
            exam.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
            exam.status === 'revoked' ? 'bg-red-50 text-red-600 border-red-200' :
            'bg-amber-50 text-amber-600 border-amber-200'
          }\`}>
            {exam.status}
          </span>`;

const newBadge = `<span className={\`flex-shrink-0 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider \${
            isEventFinished || exam.is_completed ? 'bg-gray-100 text-gray-500 border-gray-200' :
            exam.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
            exam.status === 'revoked' ? 'bg-red-50 text-red-600 border-red-200' :
            'bg-amber-50 text-amber-600 border-amber-200'
          }\`}>
            {isEventFinished || exam.is_completed ? 'Selesai' : exam.status}
          </span>`;

content = content.replace(oldBadge, newBadge);
fs.writeFileSync(file, content);
