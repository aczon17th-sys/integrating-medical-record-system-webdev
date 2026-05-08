function requireAuth(req, res, next) {
  if (!req.session.user) {
    req.flash = { type: 'error', message: 'Please log in first.' };
    return res.redirect('/login');
  }
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session.user || !roles.includes(req.session.user.role)) {
      return res.status(403).render('error', {
        title: 'Access denied',
        message: 'You do not have permission to access this page.'
      });
    }
    next();
  };
}

function currentUser(req, res, next) {
  res.locals.currentUser = req.session.user || null;
  res.locals.notice = req.session.notice || null;
  delete req.session.notice;
  next();
}

module.exports = { requireAuth, requireRole, currentUser };
