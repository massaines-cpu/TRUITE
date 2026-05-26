# TRUITE merge report

## What was merged

- Integrated the colleague frontend files:
  - `back/templates/posts/feed.html`
  - `back/templates/accounts/profile.html`
  - `back/static/js/feed.js`
  - `back/static/js/profile.js`
  - `back/static/css/profile.css`

## What was not copied directly

- `accounts/views.py` and `accounts/urls.py` from the uploaded colleague files were not copied directly because they target the older `accounts.Content` post system.
- The project already uses the newer apps: `posts`, `reactions`, `follows`, `blockchain`.
- Direct overwrite would break `/api/posts/`, comments, reactions, and speed improvements.

## Backend changes added safely

### Profile AI avatar

- Kept existing support for `profile_pic` and `banner_image` uploads.
- Added support for the colleague field `ai_avatar` as base64 image in `accounts/views.py`.

### Blockchain integration

- New posts are automatically copied to blockchain.
- New comments are automatically copied to blockchain.
- New replies are automatically copied to blockchain.
- Blockchain write errors do not block user actions.

### Speed protection

- `/api/posts/` now returns a limited feed by default: 50 posts.
- Supports optional query params:
  - `/api/posts/?limit=50&offset=0`
- Max limit is capped at 100.
- Post queryset was centralized with `select_related` and `prefetch_related`.
- Removed import-time DB query from `posts/serializers.py`.
- `comments_count` avoids an extra query when comments are already prefetched.

### Blockchain sync fix

- Removed unique constraint from `Block.index` because external groups can have the same block index.
- Added migration: `back/blockchain/migrations/0002_alter_block_index.py`.

## Important commands after replacing files

```bash
cd back
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py runserver
```

## Notes

- I could not run `python manage.py check` in the sandbox because Django is not installed in this environment.
- Python syntax compilation passed for the changed backend files.
