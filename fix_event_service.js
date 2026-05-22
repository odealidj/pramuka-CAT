const fs = require('fs');
const file = '/home/aliube/Workspace/Prd/PramukaCAT/backend/internal/core/services/event_service.go';
let content = fs.readFileSync(file, 'utf8');

const replacement = `func (s *eventService) DeleteEvent(ctx context.Context, id uuid.UUID) error {
	event, err := s.repo.GetEventById(ctx, id)
	if err != nil {
		return fmt.Errorf("event tidak ditemukan")
	}

	participants, err := s.repo.ListAllEventParticipants(ctx, id)
	if err == nil && s.taskDistributor != nil {
		for _, p := range participants {
			if p.Email.Valid && p.Email.String != "" {
				s.taskDistributor.DistributeTaskSendEmail(context.Background(), &worker.PayloadSendEmail{
					ToAddress: p.Email.String,
					Subject:   "Pemberitahuan: Jadwal Ujian Dibatalkan",
					Body:      fmt.Sprintf("Halo %s,\\n\\nMohon maaf, Jadwal Ujian '%s' yang Anda ikuti telah dibatalkan atau dihapus oleh Admin.\\n\\nTerima kasih.\\n\\nTim Pramuka CAT", p.FullName, event.Name),
				})
			}
		}
	}

	// Delete approvals
	s.repo.DeleteApprovalsByEventID(ctx, id)

	return s.repo.DeleteEvent(ctx, id)
}`;

content = content.replace(/func \(s \*eventService\) DeleteEvent\(ctx context\.Context, id uuid\.UUID\) error \{[\s\S]*?return s\.repo\.DeleteEvent\(ctx, id\)\n\}/, replacement);

fs.writeFileSync(file, content);
