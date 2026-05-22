const fs = require('fs');
const file = '/home/aliube/Workspace/Prd/PramukaCAT/backend/internal/core/services/user_service.go';
let content = fs.readFileSync(file, 'utf8');

const replacement = `
	res, err := s.repo.UpdateUser(ctx, id, u)
	if err != nil {
		if strings.Contains(err.Error(), "idx_users_email") || strings.Contains(err.Error(), "users_email_key") {
			return domain.User{}, fmt.Errorf("email sudah digunakan oleh pengguna lain")
		}
		if strings.Contains(err.Error(), "users_username_key") {
			return domain.User{}, fmt.Errorf("username sudah digunakan oleh pengguna lain")
		}
		return domain.User{}, err
	}
	return res, nil
`;

content = content.replace("	return s.repo.UpdateUser(ctx, id, u)", replacement);

if (!content.includes('"strings"')) {
    content = content.replace('"fmt"', '"fmt"\n\t"strings"');
}

fs.writeFileSync(file, content);
