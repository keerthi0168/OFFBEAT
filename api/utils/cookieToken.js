const cookieToken = (user, res) => {
    const token = user.getJwtToken();
    const isProduction = process.env.NODE_ENV === 'production';

    const options = {
        expires: new Date(
            Date.now() + process.env.COOKIE_TIME * 24 * 60 * 60 * 1000
        ),
        httpOnly: true, // makes the token available only to backend
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax'
    };


    user.password = undefined;
    res.status(200).cookie("token", token, options).json({
        success: true,
        token,
        user
    });
};

module.exports = cookieToken;