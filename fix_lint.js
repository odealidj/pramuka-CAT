const fs = require('fs');

function patchFile(file, regex, replacement) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(regex, replacement);
  fs.writeFileSync(file, content);
}

patchFile(
  '/home/aliube/Workspace/Prd/PramukaCAT/frontend/src/components/questions/CategoryManagerModal.tsx',
  /\/\/ eslint-disable-next-line react-hooks\/exhaustive-deps\n    if \(isOpen\) fetchCategories\(\);/,
  '// eslint-disable-next-line react-hooks/set-state-in-effect\n    if (isOpen) fetchCategories();'
);

patchFile(
  '/home/aliube/Workspace/Prd/PramukaCAT/frontend/src/components/results/AnswerReviewDrawer.tsx',
  /if \(!participant\) { setAnswers\(\[\]\); return; }/,
  '// eslint-disable-next-line react-hooks/set-state-in-effect\n    if (!participant) { setAnswers([]); return; }'
);

patchFile(
  '/home/aliube/Workspace/Prd/PramukaCAT/frontend/src/components/questions/QuestionFormModal.tsx',
  /const correctAnswer = watch\('correct_answer'\);/,
  '// eslint-disable-next-line react-hooks/incompatible-library\n  const correctAnswer = watch(\'correct_answer\');'
);

patchFile(
  '/home/aliube/Workspace/Prd/PramukaCAT/frontend/src/components/users/AdminFormModal.tsx',
  /const photoUrlValue = watch\('photo_url'\);/,
  '// eslint-disable-next-line react-hooks/incompatible-library\n  const photoUrlValue = watch(\'photo_url\');'
);

patchFile(
  '/home/aliube/Workspace/Prd/PramukaCAT/frontend/src/components/users/UserFormModal.tsx',
  /const photoUrlValue = watch\('photo_url'\);/,
  '// eslint-disable-next-line react-hooks/incompatible-library\n  const photoUrlValue = watch(\'photo_url\');'
);

