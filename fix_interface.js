const fs = require('fs');
const file = '/home/aliube/Workspace/Prd/PramukaCAT/backend/internal/core/ports/event.go';
let content = fs.readFileSync(file, 'utf8');

const importReplacement = `import (
	"context"

	"github.com/google/uuid"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/domain"
	"github.com/odealidj/pramuka-CAT/backend/internal/adapters/repository/sqlcgen"
)`;

content = content.replace(/import \([\s\S]*?\)/, importReplacement);

const funcReplacement = `DeleteEvent(ctx context.Context, id uuid.UUID) error
	DeleteApprovalsByEventID(ctx context.Context, eventID uuid.UUID) error
	ListAllEventParticipants(ctx context.Context, eventID uuid.UUID) ([]sqlcgen.ListAllEventParticipantsRow, error)`;

content = content.replace("DeleteEvent(ctx context.Context, id uuid.UUID) error", funcReplacement);

fs.writeFileSync(file, content);
