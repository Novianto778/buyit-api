const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// @desc auth
// @route POST /auth
// @access Public

exports.login = async (req, res, next) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res
            .status(400)
            .json({ message: 'Please provide a username and password' });
    }

    const user = await User.findOne({
        username: { $regex: username, $options: 'i' },
    }).exec();

    if (!user) {
        return res
            .status(401)
            .json({ message: 'Username atau password salah' });
    }

    if (!user.active) {
        return res.status(401).json({ message: 'Akun anda tidak aktif' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const accessToken = jwt.sign(
        {
            id: user._id.toString(),
            username: user.username,
            roles: user.roles,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: '10s',
        }
    );

    const refreshToken = jwt.sign(
        {
            id: user._id.toString(),
            username: user.username,
            roles: user.roles,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: '1d',
        }
    );

    //Create secure cookie with refresh token
    res.cookie('jwt', refreshToken, {
        httpOnly: true, //accessible only by web server
        // secure: true, //https
        sameSite: 'None', //cross-site cookie
        maxAge: 1 * 24 * 60 * 60 * 1000, //cookie expiry: set to match rT
    });
    // res.cookie('jwt', refreshToken, {
    //     maxAge: 1 * 24 * 60 * 60 * 1000
    // })

    res.status(200).json({
        accessToken,
        roles: user.roles,
        message: 'Login berhasil',
    });
};

// @desc Refresh
// @route GET /auth/refresh
// @access Public - because access token has expired
exports.refresh = (req, res) => {
    const cookies = req.cookies;
    console.log('cookies ', cookies);

    if (!cookies?.jwt) return res.status(401).json({ message: 'Unauthorized' });

    const refreshToken = cookies.jwt;

    jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        async (err, decoded) => {
            if (err) return res.status(403).json({ message: 'Forbidden' });

            const foundUser = await User.findOne({
                username: decoded.username,
            }).exec();

            if (!foundUser)
                return res.status(401).json({ message: 'Unauthorized' });

            const accessToken = jwt.sign(
                {
                    id: foundUser._id.toString(),
                    username: foundUser.username,
                    roles: foundUser.roles,
                },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '10s' }
            );

            res.json({ accessToken });
        }
    );
};

// @desc Logout
// @route POST /auth/logout
// @access Public

exports.logout = (req, res) => {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(204); //No content
    res.clearCookie('jwt', {
        httpOnly: true,
        sameSite: 'None',
        // secure: true
    });
    res.json({ message: 'Cookie cleared' });
};
