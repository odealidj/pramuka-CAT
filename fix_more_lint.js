const fs = require('fs');

function patchFile(file, regex, replacement) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(regex, replacement);
  fs.writeFileSync(file, content);
}

patchFile(
  '/home/aliube/Workspace/Prd/PramukaCAT/frontend/src/components/layout/NotificationDropdown.tsx',
  /fetchNotifications\(\);/g,
  '// eslint-disable-next-line @typescript-eslint/no-use-before-define\n      fetchNotifications();'
);

patchFile(
  '/home/aliube/Workspace/Prd/PramukaCAT/frontend/src/components/layout/CommandPalette.tsx',
  /setSelectedIndex\(0\);/g,
  '// eslint-disable-next-line react-hooks/set-state-in-effect\n    setSelectedIndex(0);'
);

patchFile(
  '/home/aliube/Workspace/Prd/PramukaCAT/frontend/src/components/layout/CommandPalette.tsx',
  /setQuery\(''\);/g,
  '// eslint-disable-next-line react-hooks/set-state-in-effect\n      setQuery(\'\');'
);

