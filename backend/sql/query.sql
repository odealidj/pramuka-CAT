-- name: CreateUser :one
INSERT INTO users (username, password_hash, full_name, role, photo_url)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetUserByUsername :one
SELECT * FROM users
WHERE username = $1 LIMIT 1;

-- name: GetUserById :one
SELECT * FROM users
WHERE id = $1 LIMIT 1;

-- name: CreateCategory :one
INSERT INTO categories (name)
VALUES ($1)
RETURNING *;

-- name: GetCategoryById :one
SELECT * FROM categories
WHERE id = $1 LIMIT 1;

-- name: ListCategories :many
SELECT * FROM categories
ORDER BY name;

-- name: UpdateCategory :one
UPDATE categories
SET name = $2
WHERE id = $1
RETURNING *;

-- name: DeleteCategory :exec
DELETE FROM categories
WHERE id = $1;

-- name: CreateQuestion :one
INSERT INTO questions (category_id, question_text, option_a, option_b, option_c, option_d, correct_answer, weight)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;

-- name: GetQuestionById :one
SELECT * FROM questions
WHERE id = $1 LIMIT 1;

-- name: ListQuestions :many
SELECT * FROM questions
ORDER BY created_at DESC;

-- name: UpdateQuestion :one
UPDATE questions
SET category_id = $2, question_text = $3, option_a = $4, option_b = $5, option_c = $6, option_d = $7, correct_answer = $8, weight = $9
WHERE id = $1
RETURNING *;

-- name: DeleteQuestion :exec
DELETE FROM questions
WHERE id = $1;

-- name: CreateEvent :one
INSERT INTO events (name, start_time, end_time, duration_minutes, passing_grade)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetEventById :one
SELECT * FROM events
WHERE id = $1 LIMIT 1;

-- name: ListEvents :many
SELECT * FROM events
ORDER BY created_at DESC;

-- name: UpdateEvent :one
UPDATE events
SET name = $2, start_time = $3, end_time = $4, duration_minutes = $5, passing_grade = $6
WHERE id = $1
RETURNING *;

-- name: DeleteEvent :exec
DELETE FROM events
WHERE id = $1;

-- name: EnrollUserToEvent :one
INSERT INTO user_event_approvals (user_id, event_id, status)
VALUES ($1, $2, 'pending')
RETURNING *;

-- name: ApproveUserEvent :one
UPDATE user_event_approvals
SET status = 'approved'
WHERE id = $1
RETURNING *;

-- name: SaveUserAnswer :one
INSERT INTO user_answers (approval_id, question_id, selected_answer, is_correct)
VALUES ($1, $2, $3, $4)
ON CONFLICT (approval_id, question_id) 
DO UPDATE SET 
    selected_answer = EXCLUDED.selected_answer, 
    is_correct = EXCLUDED.is_correct
RETURNING *;

-- name: CreateSession :one
INSERT INTO sessions (id, user_id, refresh_token, is_blocked, expires_at)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetSession :one
SELECT * FROM sessions
WHERE id = $1 LIMIT 1;

-- name: BlockSession :exec
UPDATE sessions
SET is_blocked = true
WHERE id = $1;

-- name: CreateEventQuestion :exec
INSERT INTO event_questions (event_id, question_id)
VALUES ($1, $2);

-- name: ListEventQuestions :many
SELECT q.* FROM questions q
JOIN event_questions eq ON q.id = eq.question_id
WHERE eq.event_id = $1
ORDER BY q.created_at ASC;

-- name: DeleteEventQuestion :exec
DELETE FROM event_questions
WHERE event_id = $1 AND question_id = $2;

-- name: ListEventParticipants :many
SELECT u.id, u.username, u.full_name, uea.status, uea.is_completed, uea.score, uea.is_passed
FROM users u
JOIN user_event_approvals uea ON u.id = uea.user_id
WHERE uea.event_id = $1
ORDER BY u.full_name ASC;
