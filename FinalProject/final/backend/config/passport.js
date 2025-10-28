const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// JWT Strategy for API authentication
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || "fallback_secret",
};

passport.use(
  new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      const user = await User.findById(payload.userId);
      if (user && user.isActive) {
        return done(null, user);
      }
      return done(null, false);
    } catch (error) {
      return done(error, false);
    }
  })
);

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists with this Google ID
          let user = await User.findOne({ oauthId: profile.id, provider: "google" });

          if (user) {
            return done(null, user);
          }

          // Check if user exists with same email
          user = await User.findOne({ email: profile.emails[0].value });

          if (user) {
            // Link Google account to existing user
            user.oauthId = profile.id;
            user.provider = "google";
            user.profilePicture = profile.photos[0]?.value;
            await user.save();
            return done(null, user);
          }

          // Create new user
          user = new User({
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            email: profile.emails[0].value,
            oauthId: profile.id,
            provider: "google",
            profilePicture: profile.photos[0]?.value,
            emailVerified: true,
            role: "user",
          });

          await user.save();
          return done(null, user);
        } catch (error) {
          console.error("Google OAuth error:", error);
          return done(error, null);
        }
      }
    )
  );
} else {
  console.warn("Google OAuth credentials not found. Google login will be disabled.");
}

// Facebook OAuth Strategy
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: "/api/auth/facebook/callback",
        profileFields: ["id", "emails", "name", "picture"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists with this Facebook ID
          let user = await User.findOne({ oauthId: profile.id, provider: "facebook" });

          if (user) {
            return done(null, user);
          }

          // Check if user exists with same email
          if (profile.emails && profile.emails[0]) {
            user = await User.findOne({ email: profile.emails[0].value });

            if (user) {
              // Link Facebook account to existing user
              user.oauthId = profile.id;
              user.provider = "facebook";
              user.profilePicture = profile.photos[0]?.value;
              await user.save();
              return done(null, user);
            }
          }

          // Create new user
          user = new User({
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            email: profile.emails?.[0]?.value || `${profile.id}@facebook.com`,
            oauthId: profile.id,
            provider: "facebook",
            profilePicture: profile.photos[0]?.value,
            emailVerified: true,
            role: "user",
          });

          await user.save();
          return done(null, user);
        } catch (error) {
          console.error("Facebook OAuth error:", error);
          return done(error, null);
        }
      }
    )
  );
} else {
  console.warn("Facebook OAuth credentials not found. Facebook login will be disabled.");
}

module.exports = passport;
