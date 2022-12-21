const verifyRoles = ({ ...allowedRoles }) => {
    return (req, res, next) => {
        if (!req.roles) return res.status(403).json({ message: 'Forbidden' });
        const rolesArray = [...allowedRoles];
        const result = rolesArray.some((role) => req.roles.includes(role));
        if (!result) return res.status(403).json({ message: 'Forbidden' });
        next();
    };
};
