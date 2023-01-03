const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// @desc auth
// @route POST /auth
// @access Public

exports.login = async (req, res, next) => {
    const cookies = req.cookies;
    const { username, password } = req.body;

    if (!username || !password) {
        return res
            .status(400)
            .json({ message: 'Please provide a username and password' });
    }

    const foundUser = await User.findOne({
        username: { $regex: username, $options: 'i' },
    }).exec();

    if (!foundUser) {
        return res
            .status(401)
            .json({ message: 'Username atau password salah' });
    }

    if (!foundUser.active) {
        return res.status(401).json({ message: 'Akun anda tidak aktif' });
    }

    const passwordMatch = await bcrypt.compare(password, foundUser.password);

    if (!passwordMatch) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const accessToken = jwt.sign(
        {
            UserInfo: {
                userId: foundUser._id.toString(),
                username: foundUser.username,
                roles: foundUser.roles,
            },
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '10m' }
    );
    const newRefreshToken = jwt.sign(
        { username: foundUser.username },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '1d' }
    );

    const newRefreshTokenArray = !cookies?.jwt
        ? foundUser.refreshToken
        : foundUser.refreshToken.filter((rt) => rt !== cookies.jwt); // means delete old refresh token

    if (cookies?.jwt) {
        /* 
        Scenario added here: 
            1) User logs in but never uses RT and does not logout 
            2) RT is stolen
            3) If 1 & 2, reuse detection is needed to clear all RTs when user logs in
        */
        const refreshToken = cookies.jwt;
        const foundUser = await User.findOne({
            refreshToken,
        }).exec();

        // detected refresh token reuse
        if (!foundUser) {
            console.log('attempted refresh token reuse at login!');
            // clear all previous refresh tokens
            newRefreshTokenArray = [];
        }

        res.clearCookie('jwt', {
            httpOnly: true,
            secure: true,
            sameSite: 'None',
        });
    }

    foundUser.refreshToken = [...newRefreshTokenArray, newRefreshToken];
    await foundUser.save();

    //Create secure cookie with refresh token
    res.cookie('jwt', newRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        maxAge: 24 * 60 * 60 * 1000,
    });
    // res.cookie('jwt', refreshToken, {
    //     maxAge: 1 * 24 * 60 * 60 * 1000
    // })

    res.status(200).json({
        accessToken,
        username: foundUser.username,
        roles: foundUser.roles,
        message: 'Login berhasil',
    });
};

// @desc Refresh
// @route GET /auth/refresh
// @access Public - because access token has expired
exports.refresh = (req, res) => {
    const cookies = req.cookies;

    if (!cookies?.jwt) return res.status(401).json({ message: 'Unauthorized' });

    const refreshToken = cookies.jwt;
    res.clearCookie('jwt', {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
    });

    const foundUser = User.findOne({
        refreshToken,
    }).exec();

    // detected refresh token reuse
    if (!foundUser) {
        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            async (err, decoded) => {
                if (err) return res.status(403).json({ message: 'Forbidden' });

                const hackedUser = await User.findOne({
                    username: decoded.username,
                }).exec();
                hackedUser.refreshToken = [];
                await hackedUser.save();
            }
        );
    }

    const newRefreshTokenArray = foundUser.refreshToken.filter(
        (rt) => rt !== refreshToken
    ); // means delete old refresh token

    // evaluate jwt
    jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        async (err, decoded) => {
            if (err) {
                console.log('expired refresh token');
                foundUser.refreshToken = [...newRefreshTokenArray];
                await foundUser.save();
            }

            if (err || foundUser.username !== decoded.username)
                return res.status(403).json({ message: 'Forbidden' });

            // const foundUser = await User.findOne({
            //     username: decoded.username,
            // }).exec();

            // if (!foundUser)
            //     return res.status(401).json({ message: 'Unauthorized' });

            // Refresh token was still valid
            const accessToken = jwt.sign(
                {
                    UserInfo: {
                        userId: foundUser._id.toString(),
                        username: foundUser.username,
                        roles: foundUser.roles,
                    },
                },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '10m' }
            );

            const newRefreshToken = jwt.sign(
                { username: foundUser.username },
                process.env.REFRESH_TOKEN_SECRET,
                { expiresIn: '1d' }
            );
            // saving rT with current user
            foundUser.refreshToken = [...newRefreshTokenArray, newRefreshToken];
            await foundUser.save();

            //Create secure cookie with refresh token
            res.cookie('jwt', newRefreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'None',
                maxAge: 24 * 60 * 60 * 1000,
            });

            res.json({
                username: foundUser.username,
                roles: foundUser.roles,
                accessToken,
            });
        }
    );
};

// @desc Logout
// @route POST /auth/logout
// @access Public

exports.logout = async (req, res) => {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(204); //No content

    const refreshToken = cookies?.jwt;

    const foundUser = await User.findOne({
        refreshToken,
    }).exec();

    // detected refresh token reuse

    if (!foundUser) {
        res.clearCookie('jwt', {
            httpOnly: true,
            secure: true,
            sameSite: 'None',
        });
        return res.sendStatus(204); //No content
    }

    // Delete refreshToken in db
    foundUser.refreshToken = foundUser.refreshToken.filter(
        (rt) => rt !== refreshToken
    );
    await foundUser.save();

    res.clearCookie('jwt', {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
    });
    res.json({ message: 'Cookie cleared' });
};
