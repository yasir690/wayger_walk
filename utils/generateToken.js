require("dotenv").config();
const jwt = require("jsonwebtoken");

const genToken = (payload) => {
  const secretKey = process.env.SECRET_KEY;
  const options = {
    expiresIn: "1d",
  };
  return jwt.sign(payload, secretKey, options);
};

// Generate a refresh token
const generateRefreshToken = (payload) => {
    const secretKey = process.env.SECRET_KEY;
    return jwt.sign({ id: payload.id, userType: payload.userType }, secretKey );
}

// Refresh the access token using the refresh token
const refreshAccessToken = (refreshToken) =>{
    try {
      const secretKey = process.env.SECRET_KEY;
      const decoded = jwt.verify(refreshToken, secretKey);

      const { id, userType } = decoded;
      return genToken({
        id: id,
        userType: userType,
      });
    } catch (error) {
      console.log("error: ", error)
      return null; // Token verification failed
    }
}
module.exports = {genToken, refreshAccessToken, generateRefreshToken};
