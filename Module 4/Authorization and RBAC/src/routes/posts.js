const express = require('express');
const { posts } = require('../data');
const requireRole = require('../middleware/requireRole'); // TODO: use for the hide route

const router = express.Router();

// List posts — any authenticated user.
router.get('/', (req, res) => {
  return res.status(200).json(posts);
});

// Create a post — the caller becomes the author.
router.post('/', (req, res) => {
  const post = {
    id: String(posts.length + 1),
    authorId: req.user.id,
    title: req.body?.title ?? 'Untitled',
    hidden: false,
  };
  posts.push(post);
  return res.status(201).json(post);
});

// Update a post.
// BUG: any authenticated user can edit ANY post — this is the IDOR.
// TODO: allow only the owner OR a moderator/admin. Return 404 if the post is missing.
router.patch('/:id', (req, res) => {
  const post = posts.find((p) => p.id === req.params.id);

  // Check whether the post exists first
  if (!post) {
    return res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Post not found',
      },
    });
  }

   // Check ownership
  const isOwner = post.authorId === req.user.id;

  // Check privileged role
  const isPrivileged = ['moderator', 'admin'].includes(req.user.role);

  // 5. Deny if neither condition is satisfied
  if (!isOwner && !isPrivileged) {
    return res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'You can only modify your own posts',
      },
    });
  }

  post.title = req.body?.title ?? post.title;
  return res.status(200).json(post);
});

// Delete a post.
// BUG: same IDOR — any authenticated user can delete ANY post.
// TODO: allow only the owner OR a moderator/admin. Return 404 if the post is missing.
router.delete('/:id', (req, res) => {
  const idx = posts.findIndex((p) => p.id === req.params.id);

  if(idx ==-1){
    return res.status(404).json({
      error:{
        code: 'Not_FOUND',
        message: 'Post not found',
      },
    });
  }

  const isOwner = posts[idx].authorId === req.user.id;

  const isPrivileged =
    ['moderator', 'admin'].includes(req.user.role);

  if (!isOwner && !isPrivileged) {
    return res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'You can only modify your own posts',
      },
    });
  }
  posts.splice(idx, 1);
  return res.status(200).json({ ok: true });
});

// Hide a post — should be moderator/admin only.
// TODO: gate with requireRole('moderator', 'admin').
router.post('/:id/hide', requireRole('moderator', 'admin'), (req, res) => {
  const post = posts.find((p) => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Post not found' } });
  post.hidden = true;
  return res.status(200).json(post);
});

module.exports = router;
