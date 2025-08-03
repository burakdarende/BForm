const adminAuth = (req, res, next) => {
  // Check if user is authenticated and has admin role
  if (!req.user) {
    return res.status(401).json({ message: 'Kimlik doğrulama gerekli.' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      message: 'Bu işlem için yönetici yetkisi gerekli.' 
    });
  }

  next();
};

module.exports = adminAuth;